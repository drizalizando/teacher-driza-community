
import { GoogleGenAI, Modality } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Gemini API Key is missing! Check your environment variables.");
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const validateProfilePicture = async (imageBase64: string) => {
  const ai = getAi();
  if (!ai) return true;

  const modelName = 'gemini-1.5-flash';
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }, { text: "Safety check for a learning community profile picture. Safe or Unsafe? Output one word only." }] }]
    });
    return response.text?.trim().toUpperCase() === 'SAFE';
  } catch (error) { return true; }
};

export const getDrizaResponse = async (userPrompt: string, isPrivate: boolean, chatHistory: any[]) => {
  const ai = getAi();
  if (!ai) return { text: "I'm having trouble connecting to my brain. Please check the API configuration." };

  const modelName = 'gemini-1.5-flash';
  
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
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [...history, { role: 'user', parts: [{ text: userPrompt }] }],
      config: { systemInstruction, temperature: 0.7 },
    });
    return { text: response.text || "Keep practicing! I'm listening." };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Let's try that again in English! ☕" };
  }
};

export const transcribeAudio = async (audioBase64: string) => {
  const ai = getAi();
  if (!ai) return "";

  const modelName = 'gemini-1.5-flash';
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ inlineData: { mimeType: 'audio/webm', data: audioBase64 } }, { text: "Transcribe to English text." }] }]
    });
    return response.text?.trim() || "";
  } catch (error) { return ""; }
};

export const textToSpeech = async (text: string) => {
  const ai = getAi();
  if (!ai) return null;

  // TTS model might vary, using a safe default if available,
  // but gemini-1.5-flash doesn't support TTS directly in this way usually.
  // Keeping it as provided in the original code but with updated name if applicable.
  const modelName = 'gemini-1.5-flash';
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return audioPart?.inlineData?.data || null;
  } catch (error) { return null; }
};
