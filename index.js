const express = require('express');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
const rulesData = require('./rules.json');

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getAiAnswer(userQuestion) {
  const systemInstruction = `
You are the official Commissioner AI for the Woodford Fantasy Football League.
Use the following official league rules to answer questions:
${JSON.stringify(rulesData, null, 2)}

Rules for responses:
1. Keep answers concise (2-3 sentences max).
2. Use a witty, sports commissioner tone.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userQuestion,
    config: {
      systemInstruction: systemInstruction,
      maxOutputTokens: 200,
    }
  });

  return response.text;
}

app.post('/', async (req, res) => {
  const { text, sender_type, group_id } = req.body;

  if (sender_type === 'bot' || !text) return res.status(200).end();

  const cleanText = text.trim();

  if (cleanText.toLowerCase().startsWith('!ask') || cleanText.toLowerCase().startsWith('!rule')) {
    const question = cleanText.replace(/^!(ask|rule)/i, '').trim();

    if (!question) {
      await sendGroupMeMessage("Ask me anything! Example: !ask What is the keeper rule?", group_id);
      return res.status(200).end();
    }

    try {
      const aiReply = await getAiAnswer(question);
      await sendGroupMeMessage(aiReply, group_id);
    } catch (err) {
      console.error('AI Error:', err.message);
      await sendGroupMeMessage("My brain glitched. Try again in a moment!", group_id);
    }
  }

  res.status(200).end();
});

async function sendGroupMeMessage(messageText, groupId) {
  // Use group_id mapping or fall back to BOT_ID environment variable
  const botId = groupId === '42194207' ? process.env.WOODFORD_BOT_ID : process.env.BOT_ID;

  await axios.post('https://api.groupme.com/v3/bots/post', {
    bot_id: botId,
    text: messageText
  });
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
