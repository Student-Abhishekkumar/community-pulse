require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Firestore init ────────────────────────────────────────
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
    projectId: process.env.FIRESTORE_PROJECT_ID,
  });
} else {
  const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIRESTORE_PROJECT_ID,
  });
}

const db = admin.firestore();
const auth = admin.auth();
const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'https://community-pulse-lac.vercel.app',   // your actual Vercel URL
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

// ── Helper: fetch user profile from Firestore ─────────────────
async function getUserProfile(uid) {
  const volDoc = await db.collection('volunteers').doc(uid).get();
  if (volDoc.exists) {
    return { uid, ...volDoc.data(), collection: 'volunteers' };
  }
  const orgDoc = await db.collection('organizations').doc(uid).get();
  if (orgDoc.exists) {
    return { uid, ...orgDoc.data(), collection: 'organizations' };
  }
  return null;
}

// ── Middleware: verify Firebase ID token & attach user profile ──
async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const profile = await getUserProfile(decodedToken.uid);
    if (!profile) {
      return res.status(401).json({ error: 'User profile not found' });
    }
    req.user = { uid: decodedToken.uid, email: decodedToken.email, ...profile };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Lightweight middleware: only verify token, no profile needed ──
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.uid = decodedToken.uid;
    req.email = decodedToken.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Middleware: require specific role(s) and approval status ──
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    if (req.user.status !== 'approved' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Your account is pending approval' });
    }
    next();
  };
}

// ── AUTH ROUTES ────────────────────────────────────────────────
app.post('/api/auth/register', verifyToken, async (req, res) => {
  const { name, phone, ward, skills, orgName, role } = req.body;
  if (!role || !name || !phone || !ward) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (role === 'volunteer' && !skills) {
    return res.status(400).json({ error: 'Skills required for volunteer' });
  }
  if (role === 'organization' && !orgName) {
    return res.status(400).json({ error: 'Organization name required' });
  }

  const uid = req.uid;
  const email = req.email;

  const profileData = {
    name, email, phone, ward, role,
    status: 'pending',   // default, overridden for volunteers
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (role === 'volunteer') {
    profileData.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    profileData.status = 'approved';   // ✔ volunteers approved immediately
    await db.collection('volunteers').doc(uid).set(profileData);
  } else if (role === 'organization') {
    profileData.orgName = orgName;
    // status remains 'pending' – admin approval needed
    await db.collection('organizations').doc(uid).set(profileData);
  } else {
    return res.status(400).json({ error: 'Invalid role' });
  }

  res.status(201).json({ message: 'Profile created' });
});

// ── USER PROFILE (get own) ──────────────────────────────────────
app.get('/api/users/me', verifyAuth, async (req, res) => {
  res.json(req.user);
});

// ── LIST USERS (admin & org can see volunteers; admin can see all) ──
app.get('/api/users', verifyAuth, async (req, res) => {
  const { role: currentRole, uid } = req.user;
  const users = [];

  if (currentRole === 'admin') {
    const vols = await db.collection('volunteers').get();
    vols.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
    const orgs = await db.collection('organizations').get();
    orgs.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
    return res.json(users);
  }

  if (currentRole === 'organization' && req.user.status === 'approved') {
    const vols = await db.collection('volunteers').get();
    vols.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
    return res.json(users);
  }

  res.status(403).json({ error: 'Forbidden' });
});

// ── APPROVE / REJECT ──────────────────────────────────────────
async function updateApprovalStatus(req, res) {
  const targetUid = req.params.uid;
  const action = req.path.includes('approve') ? 'approved' : 'rejected';
  const { reason } = req.body;

  const target = await getUserProfile(targetUid);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const currentUser = req.user;

  if (currentUser.role === 'admin') {
    // Admins can approve/reject anyone
  } else if (currentUser.role === 'organization' && currentUser.status === 'approved') {
    if (target.role !== 'volunteer') {
      return res.status(403).json({ error: 'Organizations can only manage volunteers' });
    }
  } else {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const collection = target.collection;
  const updateData = {
    status: action,
    ...(action === 'approved' ? {
      approvedBy: currentUser.uid,
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    } : {
      rejectedBy: currentUser.uid,
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      reason: reason || ''
    })
  };

  await db.collection(collection).doc(targetUid).update(updateData);
  res.json({ message: `User ${action}` });
}

app.patch('/api/users/:uid/approve', verifyAuth, requireRole('admin', 'organization'), updateApprovalStatus);
app.patch('/api/users/:uid/reject', verifyAuth, requireRole('admin', 'organization'), updateApprovalStatus);

// ─── EVENTS ──────────────────────────────────────────────
app.post('/api/events', verifyAuth, requireRole('admin', 'organization'), async (req, res) => {
  const { title, description, date, time, location, ward, category, maxVolunteers } = req.body;
  if (!title || !date || !time || !location || !ward || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const event = {
    title, description, date, time, location, ward, category,
    maxVolunteers: maxVolunteers || 0,
    createdBy: req.user.uid,
    createdByRole: req.user.role,
    status: 'open',
    registeredVolunteers: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('events').add(event);
  res.status(201).json({ id: docRef.id });
});

app.get('/api/events', verifyAuth, async (req, res) => {
  if (req.user.status !== 'approved' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Pending approval' });
  }
  const snapshot = await db.collection('events').orderBy('createdAt', 'desc').get();
  const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(events);
});

app.get('/api/events/:id', verifyAuth, async (req, res) => {
  const doc = await db.collection('events').doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: 'Event not found' });
  res.json({ id: doc.id, ...doc.data() });
});

app.patch('/api/events/:id', verifyAuth, requireRole('admin', 'organization'), async (req, res) => {
  const docRef = db.collection('events').doc(req.params.id);
  const eventDoc = await docRef.get();
  if (!eventDoc.exists) return res.status(404).json({ error: 'Event not found' });

  const event = eventDoc.data();
  if (req.user.role !== 'admin' && event.createdBy !== req.user.uid) {
    return res.status(403).json({ error: 'Only the creator or admin can edit' });
  }

  const { status, ...rest } = req.body;
  const updateData = { ...rest, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  if (status) updateData.status = status;

  await docRef.update(updateData);
  res.json({ message: 'Event updated' });
});

// Delete event – admin only
app.delete('/api/events/:id', verifyAuth, requireRole('admin'), async (req, res) => {
  const docRef = db.collection('events').doc(req.params.id);
  const eventDoc = await docRef.get();
  if (!eventDoc.exists) return res.status(404).json({ error: 'Event not found' });

  await docRef.delete();
  res.json({ message: 'Event deleted' });
});

app.post('/api/events/:id/register', verifyAuth, requireRole('volunteer'), async (req, res) => {
  const eventRef = db.collection('events').doc(req.params.id);
  const eventDoc = await eventRef.get();
  if (!eventDoc.exists) return res.status(404).json({ error: 'Event not found' });

  const event = eventDoc.data();
  if (event.status !== 'open') return res.status(400).json({ error: 'Event not open' });

  const alreadyRegistered = event.registeredVolunteers.some(v => v.uid === req.user.uid);
  if (alreadyRegistered) return res.status(400).json({ error: 'Already registered' });

  if (event.maxVolunteers && event.registeredVolunteers.length >= event.maxVolunteers) {
    return res.status(400).json({ error: 'Event is full' });
  }

  await eventRef.update({
    registeredVolunteers: admin.firestore.FieldValue.arrayUnion({
      uid: req.user.uid,
      name: req.user.name,
      registeredAt: new Date().toISOString()
    })
  });

  res.json({ message: 'Registered successfully' });
});

// ─── NEEDS ROUTES ─────────────────────────────────────
app.get('/api/needs', verifyAuth, async (req, res) => {
  if (req.user.status !== 'approved' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Pending approval' });
  }
  try {
    const snapshot = await db.collection('needs')
      .orderBy('createdAt', 'desc')
      .get();
    const needs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || doc.data().createdAt,
    }));
    res.json(needs);
  } catch (error) {
    console.error('Error fetching needs:', error);
    res.status(500).json({ error: 'Failed to fetch needs' });
  }
});

app.post('/api/needs', verifyAuth, requireRole('admin', 'organization'), async (req, res) => {
  try {
    const { title, category, area, affectedCount, description } = req.body;
    if (!title || !category || !area || !affectedCount || !description) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const docRef = await db.collection('needs').add({
      title, category, area, affectedCount: Number(affectedCount), description,
      createdBy: req.user.uid,
      createdByRole: req.user.role,
      status: 'open',   // default
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error('Error adding need:', error);
    res.status(500).json({ error: 'Failed to add need' });
  }
});

// Update need status – admin only
app.patch('/api/needs/:id', verifyAuth, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  if (!status || !['open', 'closed', 'fulfilled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const docRef = db.collection('needs').doc(req.params.id);
  const needDoc = await docRef.get();
  if (!needDoc.exists) return res.status(404).json({ error: 'Need not found' });

  await docRef.update({ status, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  res.json({ message: 'Need status updated' });
});

app.post('/api/volunteers', verifyAuth, async (req, res) => {
  const { name, phone, ward, skills, availability } = req.body;
  if (!name || !phone || !ward || !skills) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const skillsArray = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
  await db.collection('volunteers').doc(req.user.uid).set({
    name, phone, ward, skills: skillsArray, availability: availability || '',
    role: 'volunteer', status: 'approved', email: req.user.email,   // already approved
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  res.json({ message: 'Profile updated' });
});

// ─── GEMINI MATCHING ──────────────────────────────────
app.get('/api/needs/:id/matches', verifyAuth, async (req, res) => {
  if (req.user.status !== 'approved' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Your account must be approved to access matches.' });
  }

  try {
    const needDoc = await db.collection('needs').doc(req.params.id).get();
    if (!needDoc.exists) return res.status(404).json({ error: 'Need not found' });
    const need = { id: needDoc.id, ...needDoc.data() };

    const volunteersSnap = await db.collection('volunteers').get();
    const volunteers = volunteersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (volunteers.length === 0) return res.json([]);

    const prompt = `You are a volunteer coordinator. Rank each volunteer with a matchScore (0–100) and a one‑sentence matchReason. Return a JSON array sorted by matchScore descending: [{ volunteerId, matchScore, matchReason }]. Respond only with JSON.

Need details:
Title: ${need.title}
Category: ${need.category}
Area: ${need.area}
Affected: ${need.affectedCount}
Description: ${need.description}

Volunteers:
${volunteers.map(v =>
      `ID:${v.id} | Name:${v.name} | Ward:${v.ward} | Skills:${v.skills.join(', ')} | Availability:${v.availability || 'Not specified'}`
    ).join('\n')}`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']');
    if (jsonStart === -1 || jsonEnd === -1) throw new Error('Invalid JSON array from Gemini');
    const jsonString = text.substring(jsonStart, jsonEnd + 1);
    const matches = JSON.parse(jsonString);

    const enriched = matches.map(match => {
      const volunteer = volunteers.find(v => v.id === match.volunteerId);
      return {
        volunteerId: match.volunteerId,
        volunteerName: volunteer?.name || 'Unknown',
        volunteerPhone: volunteer?.phone || '',
        volunteerWard: volunteer?.ward || '',
        volunteerSkills: volunteer?.skills || [],
        matchScore: match.matchScore,
        matchReason: match.matchReason,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Matching error:', error);
    res.status(500).json({ error: 'Failed to generate matches' });
  }
});

// ═══════════════════════════════════════════════════════════
// PUBLIC / DASHBOARD STATS
// ═══════════════════════════════════════════════════════════
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const needsSnap = await db.collection('needs').get();
    const volunteersSnap = await db.collection('volunteers').get();
    const eventsSnap = await db.collection('events').get();

    const totalNeeds = needsSnap.size;
    const totalVolunteers = volunteersSnap.docs.filter(doc => doc.data().role === 'volunteer').length;
    const wards = new Set();
    needsSnap.forEach(doc => wards.add(doc.data().area || doc.data().ward));
    volunteersSnap.forEach(doc => wards.add(doc.data().ward));
    eventsSnap.forEach(doc => wards.add(doc.data().ward));
    const wardsCovered = wards.size;

    res.json({
      totalNeeds,
      totalVolunteers,
      wardsCovered,
      totalEvents: eventsSnap.size,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ═══════════════════════════════════════════════════════════
// PUBLIC EVENTS
// ═══════════════════════════════════════════════════════════
app.get('/api/events/public', async (req, res) => {
  try {
    const snapshot = await db.collection('events')
      .where('status', '==', 'open')
      .orderBy('createdAt', 'desc')
      .get();
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ═══════════════════════════════════════════════════════════
// EVENT VOLUNTEER LIST
// ═══════════════════════════════════════════════════════════
app.get('/api/events/:id/volunteers', verifyAuth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'organization') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const eventDoc = await db.collection('events').doc(req.params.id).get();
  if (!eventDoc.exists) return res.status(404).json({ error: 'Event not found' });
  const event = eventDoc.data();

  if (req.user.role !== 'admin' && event.createdBy !== req.user.uid) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const registered = event.registeredVolunteers || [];
  const enriched = [];
  for (const reg of registered) {
    const volDoc = await db.collection('volunteers').doc(reg.uid).get();
    if (volDoc.exists) {
      const vData = volDoc.data();
      enriched.push({
        uid: reg.uid,
        name: vData.name,
        phone: vData.phone,
        email: vData.email,
        registeredAt: reg.registeredAt,
      });
    }
  }
  res.json(enriched);
});

// ═══════════════════════════════════════════════════════════
// UPDATE EVENT STATUS
// ═══════════════════════════════════════════════════════════
app.patch('/api/events/:id/status', verifyAuth, requireRole('admin', 'organization'), async (req, res) => {
  const { status } = req.body;
  if (!['open', 'closed', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const docRef = db.collection('events').doc(req.params.id);
  const eventDoc = await docRef.get();
  if (!eventDoc.exists) return res.status(404).json({ error: 'Event not found' });

  const event = eventDoc.data();
  if (req.user.role !== 'admin' && event.createdBy !== req.user.uid) {
    return res.status(403).json({ error: 'Only the creator or admin can update status' });
  }

  await docRef.update({ status, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  res.json({ message: 'Event status updated' });
});

// Public needs – any visitor can see
app.get('/api/public/needs', async (req, res) => {
  try {
    const snapshot = await db.collection('needs')
      .orderBy('createdAt', 'desc')
      .get();
    const needs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || doc.data().createdAt,
    }));
    res.json(needs);
  } catch (error) {
    console.error('Error fetching public needs:', error);
    res.status(500).json({ error: 'Failed to fetch needs' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));