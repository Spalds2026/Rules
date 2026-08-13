const express = require('express');
const axios = require('axios');
const rulesData = require('./rules.json');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_ID = process.env.BOT_ID;

app.post('/', async (req, res) => {
  const { sender_type, text } = req.body;

  // 1. Ignore messages sent by the bot itself to prevent infinite loops
  if (sender_type !== 'bot' && text) {
    const command = text.trim().toLowerCase();

    // 2. Check if the message matches a key in rules.json
    if (rulesData[command]) {
      await sendGroupMeMessage(rulesData[command]);
    }
  }

  // Always return 200 OK immediately so GroupMe doesn't timeout
  res.status(200).json({ status: 'ok' });
});

/**
 * Posts response messages back to GroupMe.
 */
async function sendGroupMeMessage(text) {
  if (!BOT_ID) {
    console.error('Error: BOT_ID environment variable is missing in Render!');
    return;
  }

  try {
    await axios.post('https://api.groupme.com/v3/bots/post', {
      bot_id: BOT_ID,
      text: text,
    });
    console.log('Successfully sent message to GroupMe.');
  } catch (error) {
    // Safe error logging to prevent raw socket object dumps
    if (error.response) {
      console.error('GroupMe API Error:', error.response.status, error.response.data);
    } else {
      console.error('Network Error:', error.message);
    }
  }
}

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
