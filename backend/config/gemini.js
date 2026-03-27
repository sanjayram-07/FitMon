const { GoogleGenerativeAI } = require('@google/generative-ai');

let model = null;

function initializeGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('[Gemini] No API key configured. AI insights will be disabled.');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('[Gemini] Initialized successfully.');
    return model;
  } catch (error) {
    console.warn('[Gemini] Failed to initialize:', error.message);
    return null;
  }
}

function getModel() {
  return model;
}

module.exports = { initializeGemini, getModel };
