const express = require('express');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
const rulesData = require('./rules.json');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_ID = process.env.BOT_ID;

// Pass an empty options object so the SDK constructor doesn't read undefined properties
const ai = new GoogleGenAI({});

app.post('/', async (req, res) => {
  const { sender_type, text } = req.body;

  // Prevent bot from replying to its own messages
  if (sender_type !== 'bot' && text) {
    const cleanedText = text.trim();
    const lowerCommand = cleanedText.toLowerCase();

    // 1. Direct match with static rules
    if (rulesData[lowerCommand]) {
      await sendGroupMeMessage(rulesData[lowerCommand]);
    } 
    // 2. Fallback to Gemini AI if input starts with '!' or mentions 'bot'
    else if (cleanedText.startsWith('!') || cleanedText.toLowerCase().includes('bot')) {
      const aiReply = await getAiAnswer(cleanedText);
      await sendGroupMeMessage(aiReply);
    }
  }

  // Always acknowledge webhook immediately with 200 OK
  res.status(200).json({ status: 'ok' });
});

/**
 * Queries Gemini AI with rules.json context
 */
async function getAiAnswer(userQuestion) {
  const systemInstruction = `
You are the official Commissioner AI for the Woodford Fantasy Football League.
Use the following official league rules to answer user questions:
${JSON.stringify(rulesData, null, 2)}

Rules for responses:
1. Keep answers concise (2-3 sentences max).
2. Use a witty, helpful sports commissioner tone.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: userQuestion,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text;
  } catch (error) {
    console.error('Gemini API Error details:', error.message || error);
    return 'The Commissioner is temporarily taking a timeout. Try asking again in a moment.';
  }
}

/**
 * Posts response back to GroupMe
 */
async function sendGroupMeMessage(text) {
  if (!BOT_ID) {
    console.error('Error: BOT_ID environment variable is missing!');
    return;
  }

  try {
    await axios.post('https://api.groupme.com/v3/bots/post', {
      bot_id: BOT_ID,
      text: text,
    });
  } catch (error) {
    if (error.response) {
      console.error('GroupMe API Error:', error.response.status, error.response.data);
    } else {
      console.error('Network Error:', error.message);
    }
  }
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
