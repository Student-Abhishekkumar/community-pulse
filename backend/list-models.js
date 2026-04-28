require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function list() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const res = await genAI.listModels();
  console.log('Available models:');
  res.models.forEach(m => console.log(m.name));
}

list().catch(err => {
  console.error('❌ Failed to list models:', err.message);
});