import { GoogleGenAI, Type } from "@google/genai";
import { GeminiChallengeResponse, Challenge } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateChallenges = async (topic: string, count: number = 5, seed?: number): Promise<Challenge[]> => {
  const modelId = "gemini-2.5-flash";
  
  // Normalize topic for better consistency with seeds
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
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Generate ${count} coding challenges about "${normalizedTopic}".`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        seed: seed, // Use the seed for deterministic output
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            challenges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  description: { type: Type.STRING },
                  code_with_gaps: { type: Type.STRING, description: "Use __GAP__ for missing parts" },
                  full_solution: { type: Type.STRING },
                  gap_answers: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "description", "code_with_gaps", "full_solution", "gap_answers", "explanation"]
              }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No content generated");

    const data = JSON.parse(jsonText) as GeminiChallengeResponse;

    return data.challenges.map((c, index) => ({
      id: `challenge-${Date.now()}-${index}`,
      topic: topic, // Keep original display topic
      question: c.question,
      description: c.description,
      codeWithGaps: c.code_with_gaps,
      fullSolution: c.full_solution,
      expectedGaps: c.gap_answers,
      explanation: c.explanation
    }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};