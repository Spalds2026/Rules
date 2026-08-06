const express = require('express');
const axios = require('axios');
const rules = require('./rules.json');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_ID = process.env.BOT_ID;

app.post('/', async (req, res) => {
  const { sender_type, text } = req.body;

  if (sender_type !== 'bot' && text) {
    const command = text.trim().toLowerCase();

    if (rules[command]) {
      await sendGroupMeMessage(rules[command]);
    }
  }

  res.status(200).json({ status: 'ok' });
});

async function sendGroupMeMessage(text) {
  try {
    await axios.post('https://api.groupme.com/v3/bots/post', {
      bot_id: BOT_ID,
      text: text
    });
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
  }
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
