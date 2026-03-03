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

    // Validation
    if (!prompt || !prompt.trim()) {
      throw new Error('Empty prompt')
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // System instruction diferenciado
    const systemInstruction = isPrivate
      ? `You are Teacher Driza, a dedicated English tutor in a 1:1 session.
        MISSION: Help this student improve their English through personalized guidance.
        CAPABILITIES:
        - Create custom study plans
        - Translate texts (English ↔ Portuguese when needed)
        - Correct pronunciation and grammar
        - Provide detailed explanations
        TONE: Patient, encouraging, professional.
        RULES:
        1. Always respond in English unless translating.
        2. Correct mistakes gently and explain why.
        3. Keep responses concise but informative.
        4. NO markdown formatting.`
      : `You are Teacher Driza, a community moderator and English mentor.
        ENVIRONMENT: Public community chat - students practice together.
        YOUR ROLE: You are ONLY activated when tagged with @teacherdriza
        RESPONSIBILITIES:
        - Correct English mistakes (show correct version)
        - Answer grammar questions
        - Post "Challenge of the Day" occasionally
        - Keep the community positive
        TONE: Friendly, supportive, professional.
        RULES:
        1. Encourage English-only practice.
        2. Keep messages short.
        3. NO markdown asterisks.
        4. Promote kindness.`

    // Filtrar e formatar histórico
    const history = (chatHistory || [])
      .filter((msg: any) =>
        msg.content &&
        msg.content.trim() &&
        msg.senderId !== 'system'
      )
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
        generationConfig: {
          temperature: isPrivate ? 0.8 : 0.7,
          maxOutputTokens: 500
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API failed: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ||
                 "Keep practicing! I'm here to help. 💪"

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
