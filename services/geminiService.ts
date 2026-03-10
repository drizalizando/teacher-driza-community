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

export const getDrizaResponse = async (userPrompt: string, isPrivate: boolean, chatHistory: any[], level?: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        prompt: userPrompt,
        isPrivate,
        chatHistory: chatHistory.slice(-10), // Send only last 10 messages to reduce payload
        level
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
  // Deprecated: No longer using Edge Function to avoid Google Cloud billing.
  // Frontend now uses window.speechSynthesis for zero-cost TTS.
  return null;
};

/**
 * Browser-native Text-to-Speech using Web Speech API (window.speechSynthesis).
 * Zero-cost, immediate playback, no API keys or billing required.
 */
export const speakText = (text: string) => {
  if (!('speechSynthesis' in window)) {
    console.warn("Speech synthesis not supported in this browser.");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Configure voice (Teacher Driza: warm, supportive, calm English teacher)
  utterance.lang = 'en-US';
  utterance.rate = 0.85; // Slower and calmer
  utterance.pitch = 0.95; // Slightly deeper, more natural and calm female tone

  // Attempt to find a good female English voice
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(v =>
    (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural') || v.name.toLowerCase().includes('premium')) &&
    v.lang.startsWith('en') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('victoria'))
  ) || voices.find(v =>
    (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('samantha')) &&
    v.lang.startsWith('en')
  );

  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }

  window.speechSynthesis.speak(utterance);
};
