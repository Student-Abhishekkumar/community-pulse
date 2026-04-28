require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// ▸ Firestore init (works locally with a file, on Render with environment variable)
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
const app = express();
const PORT = process.env.PORT || 5000;

// CORS – allow your frontend (replace with your actual Vercel URL once deployed)
const allowedOrigins = [
  'http://localhost:3000',
  'https://community-pulse-lac.vercel.app',   // ← change to your real Vercel URL
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

// ─── Routes ─────────────────────────────────────────────

// Get all needs
app.get('/api/needs', async (req, res) => {
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

// Create a need (no AI on creation)
app.post('/api/needs', async (req, res) => {
  try {
    const { title, category, area, affectedCount, description } = req.body;
    if (!title || !category || !area || !affectedCount || !description) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const docRef = await db.collection('needs').add({
      title,
      category,
      area,
      affectedCount: Number(affectedCount),
      description,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error('Error adding need:', error);
    res.status(500).json({ error: 'Failed to add need' });
  }
});

// Get a single need
app.get('/api/needs/:id', async (req, res) => {
  try {
    const doc = await db.collection('needs').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Need not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching need:', error);
    res.status(500).json({ error: 'Failed to fetch need' });
  }
});

// Register a volunteer
app.post('/api/volunteers', async (req, res) => {
  try {
    const { name, phone, ward, skills, availability } = req.body;
    if (!name || !phone || !ward || !skills) {
      return res.status(400).json({ error: 'Name, phone, ward, and skills are required.' });
    }

    const skillsArray = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());

    const docRef = await db.collection('volunteers').add({
      name,
      phone,
      ward,
      skills: skillsArray,
      availability: availability || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error('Error registering volunteer:', error);
    res.status(500).json({ error: 'Failed to register volunteer' });
  }
});

// Match volunteers to a need (uses Gemini)
app.get('/api/needs/:id/matches', async (req, res) => {
  try {
    const needDoc = await db.collection('needs').doc(req.params.id).get();
    if (!needDoc.exists) return res.status(404).json({ error: 'Need not found' });
    const need = { id: needDoc.id, ...needDoc.data() };

    const volunteersSnap = await db.collection('volunteers').get();
    const volunteers = volunteersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (volunteers.length === 0) return res.json([]);

    const prompt = `You are a volunteer coordinator. Rank each volunteer with a matchScore (0–100) and a one‑sentence matchReason. Return a JSON array sorted by matchScore descending: [{ volunteerId, matchScore, matchReason }]. Respond only with JSON.

Need details:
Title: ${need.title}
Category: ${need.category}
Area: ${need.area}
Affected: ${need.affectedCount}
Description: ${need.description}

Volunteers:
${volunteers.map(v => `ID:${v.id} | Name:${v.name} | Ward:${v.ward} | Skills:${v.skills.join(', ')} | Availability:${v.availability || 'Not specified'}`).join('\n')}`;

    const { GoogleGenerativeAI } = require('@google/generative-ai');
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});