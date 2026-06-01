import { AIChallengeResponse, Challenge } from "../types";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export const generateChallenges = async (topic: string, count: number = 5, seed?: number): Promise<Challenge[]> => {
  const normalizedTopic = topic.trim().toLowerCase();

  const systemInstruction = `
    You are HOTJAVA, a fun, energetic, and slightly spicy coding tutor inspired by gamified language learning apps.
    Your goal is to create engaging coding challenges for a user based on a specific topic.

    The user will provide a topic (e.g., "Python Loops", "React Hooks", "Java Classes").
    You must generate ${count} distinct challenges.

    For each challenge, provide:
    1. A short, punchy question/instruction.
    2. A brief description or context.
    3. A code snippet with EXACTLY ONE or TWO gaps represented by the string "__GAP__".
    4. The full, correct solution code.
    5. An array of the correct strings that fill the gaps (in order).
    6. A fun, encouraging explanation of the solution.

    Keep the code snippets relatively short (under 10 lines) to fit on mobile screens.
    Ensure the "gap_answers" exactly match the missing parts in "code_with_gaps" if they were inserted back in.
    Return ONLY valid JSON with this shape:
    {
      "challenges": [
        {
          "question": string,
          "description": string,
          "code_with_gaps": string,
          "full_solution": string,
          "gap_answers": string[],
          "explanation": string
        }
      ]
    }
  `;

  if (!GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY");
  }

  try {
    const requestBody: Record<string, unknown> = {
      model: GROQ_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemInstruction },
        {
          role: "user",
          content: `Generate ${count} coding challenges about "${normalizedTopic}".`,
        },
      ],
      response_format: { type: "json_object" },
    };

    if (typeof seed === "number") {
      requestBody.seed = seed;
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + GROQ_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API request failed (${response.status}): ${errorText}`);
    }

    const completion = await response.json();
    const jsonText = completion?.choices?.[0]?.message?.content;
    if (!jsonText) throw new Error("No content generated");

    const data = JSON.parse(jsonText) as AIChallengeResponse;

    return data.challenges.map((c) => ({
      id: crypto.randomUUID(),
      topic: topic,
      question: c.question,
      description: c.description,
      codeWithGaps: c.code_with_gaps,
      fullSolution: c.full_solution,
      expectedGaps: c.gap_answers,
      explanation: c.explanation,
    }));
  } catch (error) {
    console.error("Groq API Error:", error);
    throw error;
  }
};
