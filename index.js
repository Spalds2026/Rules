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

Instructions:
- Provide short, direct, matter-of-fact answers.
- Do not use humor, banter, or conversational fluff.
- Keep responses to 1-2 concise sentences.
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
    console.error('Gemini API Error:', error.message || error);
    return 'Service unavailable. Try asking again in a moment.';
  }
}
