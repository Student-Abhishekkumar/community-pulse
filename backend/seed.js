require('dotenv').config();
const admin = require('firebase-admin');

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIRESTORE_PROJECT_ID,
});

const db = admin.firestore();

const dummyNeeds = [
  // ... use the same dummy needs as before, but WITHOUT AI fields
  {
    title: 'Clean Water Shortage in Riverside Ward',
    category: 'water',
    area: 'Riverside Ward',
    affectedCount: 340,
    description: 'The main water pipeline burst...',
  },
  // ... (copy the other five needs from earlier, removing urgencyScore etc.)
];

const dummyVolunteers = [
  {
    name: 'Alice Johnson',
    phone: '555-0101',
    ward: 'Riverside Ward',
    skills: ['plumber', 'logistics'],
    availability: 'Weekdays 9-5',
  },
  {
    name: 'Bob Smith',
    phone: '555-0102',
    ward: 'Sunnydale Colony',
    skills: ['doctor', 'nurse'],
    availability: 'Evenings & weekends',
  },
  {
    name: 'Carol Davis',
    phone: '555-0103',
    ward: 'Maplewood Ward',
    skills: ['carpenter', 'roofer'],
    availability: 'Anytime',
  },
  {
    name: 'David Lee',
    phone: '555-0104',
    ward: 'Greenfield Block',
    skills: ['cook', 'nutritionist'],
    availability: 'Mornings',
  },
];

async function seed() {
  // Clear existing data (optional)
  const needsSnap = await db.collection('needs').get();
  const volunteersSnap = await db.collection('volunteers').get();
  const deleteOps = [
    ...needsSnap.docs.map(d => d.ref.delete()),
    ...volunteersSnap.docs.map(d => d.ref.delete()),
  ];
  await Promise.all(deleteOps);

  // Insert needs
  const batch = db.batch();
  dummyNeeds.forEach(need => batch.set(db.collection('needs').doc(), {
    ...need,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }));

  // Insert volunteers
  dummyVolunteers.forEach(vol => batch.set(db.collection('volunteers').doc(), {
    ...vol,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }));

  await batch.commit();
  console.log('✅ Dummy data seeded (needs + volunteers).');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });