const express = require('express');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
const rulesData = require('./rules.json');

const app = express();
app.use(express.json());

// Automatically picks up process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({}); 

async function getAiAnswer(userQuestion) {
  const systemInstruction = `
You are the official Commissioner AI for the Woodford Fantasy Football League.
Use the following official league rules to answer questions:
${JSON.stringify(rulesData, null, 2)}

Rules for responses:
1. Keep answers concise (2-3 sentences max).
2. Use a witty, sports commissioner tone.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userQuestion,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text;
  } catch (err) {
    console.error('Gemini API Error:', err.message || err);
    return 'The Commissioner is temporarily taking a timeout. Check back in a moment.';
  }
}
