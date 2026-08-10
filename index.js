async function sendGroupMeMessage(text) {
  // Check if BOT_ID is missing before sending
  if (!BOT_ID) {
    console.error('Error: BOT_ID environment variable is missing in Render!');
    return;
  }

  try {
    await axios.post('https://api.groupme.com/v3/bots/post', {
      bot_id: BOT_ID,
      text: text
    });
    console.log('Successfully sent response to GroupMe!');
  } catch (error) {
    // Print explicit error details instead of raw error objects
    if (error.response) {
      console.error('GroupMe API Rejected Request:', error.response.status, error.response.data);
    } else {
      console.error('Network/Socket Error:', error.message);
    }
  }
}
