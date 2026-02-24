
import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key missing.");
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenAI(apiKey);
  }
  return genAI;
};

const DEFAULT_MODEL = 'gemini-1.5-flash';

export const validateProfilePicture = async (imageBase64: string) => {
  const ai = getAI();
  if (!ai) return true;

  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });
    const result = await model.generateContent([
      { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
      { text: "Safety check for a learning community profile picture. Safe or Unsafe? Output one word only." }
    ]);
    const response = await result.response;
    return response.text().trim().toUpperCase() === 'SAFE';
  } catch (error) {
    console.error("Safety check error:", error);
    return true;
  }
};

export const getDrizaResponse = async (userPrompt: string, isPrivate: boolean, chatHistory: any[]) => {
  const ai = getAI();
  if (!ai) return { text: "AI service currently unavailable. Please check configuration." };

  const systemInstruction = `You are Teacher Driza, a human-like English mentor. 
    ENVIRONMENT: Immersion mode. Users MUST practice English. 
    TONE: Supportive, professional, and slightly casual (like a modern teacher). 
    RULES: 
    1. If a user speaks Portuguese, gently encourage them to try in English. 
    2. Correct mistakes implicitly by modeling the correct sentence. 
    3. Keep messages concise. 
    4. NO markdown asterisks for bold/italic. 
    5. Be a guardian of community well-being: promote kindness and positivity.`;

  const history = chatHistory
    .filter(msg => msg.senderId !== 'system')
    .map(msg => ({
      role: msg.isAi ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

  try {
    const model = ai.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction
    });

    const result = await model.generateContent({
      contents: [...history, { role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.7 },
    });
    const response = await result.response;
    return { text: response.text() || "Keep practicing! I'm listening." };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Let's try that again in English! ☕" };
  }
};

export const transcribeAudio = async (audioBase64: string) => {
  const ai = getAI();
  if (!ai) return "";

  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });
    const result = await model.generateContent([
      { inlineData: { mimeType: 'audio/webm', data: audioBase64 } },
      { text: "Transcribe to English text." }
    ]);
    const response = await result.response;
    return response.text().trim() || "";
  } catch (error) {
    console.error("Transcription error:", error);
    return "";
  }
};

export const textToSpeech = async (text: string) => {
  // TTS is currently handled via external providers or multimodal responses in advanced setups.
  // Returning null to prevent crashes from unsupported model names.
  return null;
};
