import { supabase } from './supabase';

export const validateProfilePicture = async (imageBase64: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('validate-profile-picture', {
      body: { imageBase64 }
    });
    if (error) return true; // Fail open for UX
    return data?.isSafe !== false;
  } catch (error) {
    return true; // Fail open
  }
};

export const getDrizaResponse = async (userPrompt: string, isPrivate: boolean, chatHistory: any[]) => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        prompt: userPrompt,
        isPrivate,
        chatHistory: chatHistory.slice(-10) // Send only last 10 messages to reduce payload
      }
    });

    if (error) throw error;
    return { text: data?.text || "Keep practicing! I'm listening." };
  } catch (error) {
    console.error("AI Response error:", error);
    return { text: "Let's try that again in English! ☕" };
  }
};

export const transcribeAudio = async (audioBase64: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: { audioBase64 }
    });
    if (error) throw error;
    return data?.text || "";
  } catch (error) {
    return "";
  }
};

export const textToSpeech = async (text: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: { text }
    });
    if (error) throw error;
    return data?.audioBase64 || null;
  } catch (error) {
    return null;
  }
};
