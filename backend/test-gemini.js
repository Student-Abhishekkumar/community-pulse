require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('Return only this JSON: {"urgencyScore":50}');
    const text = result.response.text();
    console.log('Gemini response:', text);
    JSON.parse(text); // check if parseable
    console.log('✅ Test successful.');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    console.error(err);
  }
}

test();