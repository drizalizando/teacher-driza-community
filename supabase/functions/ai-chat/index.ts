import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, isPrivate, chatHistory } = await req.json()
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const systemInstruction = `You are Teacher Driza, a human-like English mentor.
    ENVIRONMENT: Immersion mode. Users MUST practice English.
    TONE: Supportive, professional, and slightly casual (like a modern teacher).
    RULES:
    1. If a user speaks Portuguese, gently encourage them to try in English.
    2. Correct mistakes implicitly by modeling the correct sentence.
    3. Keep messages concise.
    4. NO markdown asterisks for bold/italic.
    5. Be a guardian of community well-being: promote kindness and positivity.`

    const history = chatHistory
      .filter((msg: any) => msg.senderId !== 'system')
      .map((msg: any) => ({
        role: msg.isAi ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }))

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { temperature: 0.7 }
      })
    })

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Keep practicing! I'm listening."

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, text: "Let's try that again in English! ☕" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
