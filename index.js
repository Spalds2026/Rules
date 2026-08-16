const express = require('express');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
const rulesData = require('./rules.json');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_ID = process.env.BOT_ID;

// Automatically uses GEMINI_API_KEY environment variable
const ai = new GoogleGenAI({});

app.post('/', async (req, res) => {
  const { sender_type, text } = req.body;

  if (sender_type !== 'bot' && text) {
    const cleanedText = text.trim();

    // 1. Guard check: Ignore any message that does NOT start with @bot
    if (cleanedText.toLowerCase().startsWith('@bot')) {
      // Strip out "@bot" prefix and clean up extra spaces
      const userPrompt = cleanedText.slice(4).trim();
      const lowerCommand = userPrompt.toLowerCase();

      // 2. Direct static rule lookup (e.g., "@bot !rules" or "@bot rules")
      if (rulesData[lowerCommand]) {
        await sendGroupMeMessage(rulesData[lowerCommand]);
      } 
      // 3. Fallback to Gemini AI for all other questions asked to @bot
      else {
        const aiReply = await getAiAnswer(userPrompt || cleanedText);
        await sendGroupMeMessage(aiReply);
      }
    }
  }

  res.status(200).json({ status: 'ok' });
});

/**
 * Queries Gemini AI with rules.json context
 */
async function getAiAnswer(userQuestion) {
  const draftNightInfo = {
    date: "Saturday, August 22nd",
    location: "Dr. Steve Sweigart's house",
    time: "7:00 PM",
    food: "$30 per person",
    beverages: "BYOB (Bring Your Own Beer)",
    league_dues: "$180",
    payment_recipient: "PJ Haberstock",
    venmo_handle: "@PJ-Haberstock"
  };

  const systemInstruction = `
You are the official Commissioner AI for the Woodford Fantasy Football League.
Use the following official league rules and draft night info to answer user questions:
League Rules:
${JSON.stringify(rulesData, null, 2)}

Draft Night Details:
${JSON.stringify(draftNightInfo, null, 2)}

Rules for responses:
1. Keep answers concise (2-3 sentences max).
2. Use a witty, helpful sports commissioner tone.
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
