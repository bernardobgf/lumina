import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateTutorResponse(message: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('AI_NOT_CONFIGURED');
  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    systemInstruction: 'Você é Lumina, uma tutora educacional brasileira. Explique com clareza, incentive o raciocínio e não invente fontes. Responda em português brasileiro.',
  });
  const result = await model.generateContent(message);
  const text = result.response.text().trim();
  if (!text) throw new Error('AI_EMPTY_RESPONSE');
  return text;
}
