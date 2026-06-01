export const stringToSeed = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash &= hash;
  }
  return Math.abs(hash);
};

export const buildPrompt = (topic, count) => ({
  systemInstruction: `
You are HOTJAVA, a fun coding tutor.
Generate ${count} distinct coding challenges about "${topic}".
Return strictly valid JSON:
{
  "challenges": [{
    "question": string,
    "description": string,
    "code_with_gaps": string,
    "full_solution": string,
    "gap_answers": string[],
    "explanation": string
  }]
}`,
});

export const generateChallenges = async ({ topic, count, seed, config }) => {
  if (!config.groqApiKey) {
    throw new Error('Missing GROQ_API_KEY on server');
  }

  const prompt = buildPrompt(topic, count);
  const response = await fetch(config.groqApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `******
    },
    body: JSON.stringify({
      model: config.groqModel,
      temperature: 0.2,
      seed,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt.systemInstruction },
        { role: 'user', content: `Topic: ${topic}. Produce ${count} challenges.` },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API request failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  const raw = payload?.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error('Groq API returned empty content');
  }

  const data = JSON.parse(raw);
  if (!Array.isArray(data?.challenges)) {
    throw new Error('Groq response schema mismatch');
  }

  return data.challenges.map((challenge) => ({
    id: crypto.randomUUID(),
    topic,
    question: challenge.question,
    description: challenge.description,
    codeWithGaps: challenge.code_with_gaps,
    fullSolution: challenge.full_solution,
    expectedGaps: Array.isArray(challenge.gap_answers) ? challenge.gap_answers : [],
    explanation: challenge.explanation,
  }));
};
