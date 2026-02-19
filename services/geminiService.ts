
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * BRAIN: Processa o texto e gera a resposta pedagógica da Teacher Driza.
 */
export const getDrizaResponse = async (userPrompt: string, isPrivate: boolean, chatHistory: any[]) => {
  const modelName = 'gemini-3-flash-preview';
  
  const systemInstruction = isPrivate 
    ? `Você é a Teacher Driza, uma professora de inglês humana, calorosa e muito profissional. 
       
       REGRAS DE LINGUAGEM: Você é bilíngue (PT-BR/EN). Use o português para explicar conceitos complexos e o inglês para prática. 
       
       ESTILO:
       1. CLAREZA VISUAL: Não use asteriscos (**) para negrito ou itálico.
       2. ESTRUTURA: Use quebras de linha simples e parágrafos curtos.
       3. TOM: Encorajador, humano e acessível. Evite ser técnica ou robótica.
       
       OBJETIVO: Ajudar o aluno a praticar, corrigir erros com gentileza e sugerir atividades curtas.`
    : `Você é a Teacher Driza em um chat comunitário. 

       REGRAS: Interaja em PT-BR e EN naturalmente. 
       
       AO SER MENCIONADA (@teacherdriza):
       1. INTERAÇÃO: Responda calorosamente.
       2. CORREÇÃO: Ofereça alternativas naturais para o inglês do aluno sem ser rude.
       3. ENGAJAMENTO: Sempre termine com uma pergunta para manter a conversa fluindo.

       ESTILO: Sem asteriscos. Máximo 3 parágrafos curtos. Vibe energética e profissional.`;

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
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    return { text: response.text || "I'm sorry, I couldn't process that right now." };
  } catch (error) {
    console.error("Gemini Brain Error:", error);
    return { text: "I'm taking a quick coffee break! ☕ I'll be back in a second." };
  }
};

/**
 * STT (Speech-to-Text): Transcreve o áudio do aluno em texto para que a IA possa "entender".
 * Usando gemini-3-flash-preview que suporta multimodalidade (áudio para texto).
 */
export const transcribeAudio = async (audioBase64: string) => {
  const modelName = 'gemini-3-flash-preview';
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'audio/webm', data: audioBase64 } },
            { text: "Transcreva exatamente o que foi dito neste áudio. Se estiver em inglês, mantenha em inglês. Se estiver em português, mantenha em português. Retorne apenas o texto transcrito sem comentários adicionais." }
          ]
        }
      ]
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("STT Error:", error);
    return "";
  }
};

/**
 * TTS (Text-to-Speech): Converte a resposta da Teacher Driza em um áudio natural e acolhedor.
 */
export const textToSpeech = async (text: string) => {
  const modelName = 'gemini-2.5-flash-preview-tts';
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: `Diga de forma clara, natural e acolhedora, como uma professora de inglês dedicada: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // 'Kore' é uma voz feminina, clara e profissional, ideal para a persona da Teacher Driza.
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return audioPart?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};
