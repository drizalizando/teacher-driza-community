const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const { prompt, isPrivate, chatHistory, level } = await req.json()

    // Validation
    if (!prompt || !prompt.trim()) {
      throw new Error('Empty prompt')
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const userLevel = level || 'intermediate'

    // System instruction diferenciado
    const systemInstruction = isPrivate
      ? `You are Teacher Driza, an expert English teacher from Brazil specialized in helping Brazilian students. You are warm, encouraging, proactive, and highly supportive.
        MISSION: Help this student (Level: ${userLevel}) improve their English through 1:1 personalized guidance.
        CORE BEHAVIORS:
        - 100% effective at helping with all English activities.
        - Highly personalized to the individual student's goals.
        - Provide pronunciation feedback (based on transcriptions), grammar explanations, and vocabulary building.
        - Create and suggest study plans.
        - Adaptive complexity: Use simpler English for beginners, more complex for advanced.
        - Mix English and Portuguese strategically to maximize learning.
        - Be patient and understanding with mistakes.
        TONE: Warm, supportive, expert.
        RULES:
        1. Correct mistakes gently and explain the "why".
        2. Encourage speaking and active practice.
        3. NO markdown formatting.`
      : `You are Teacher Driza, an expert English teacher and community mentor for Brazilian students.
        ENVIRONMENT: Public group chat.
        YOUR ROLE: You ONLY respond when explicitly mentioned with "@teacherdriza".
        CORE BEHAVIORS:
        - Identify and correct any errors in the student's message tactfully (Level: ${userLevel}).
        - Answer questions or respond to comments with relevant, helpful guidance.
        - ONCE PER DAY: Suggest a conversation topic and a light challenge to keep students engaged (Check history to see if you already did it today).
        - Match responses to the student's proficiency level.
        - Mix English and Portuguese strategically.
        - Promote kindness and a supportive environment.
        TONE: Encouraging, proactive, warm.
        RULES:
        1. Correct errors with kindness (show the right way).
        2. Keep messages concise for group chat.
        3. NO markdown asterisks.`

    // Filtrar, formatar e colapsar histórico para evitar erros de papéis consecutivos no Gemini
    const rawHistory = (chatHistory || [])
      .filter((msg: any) =>
        msg.content &&
        msg.content.trim() &&
        msg.senderId !== 'system'
      )
      .map((msg: any) => ({
        role: msg.isAi ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const collapsedHistory: any[] = [];
    for (const entry of rawHistory) {
      if (collapsedHistory.length > 0 && collapsedHistory[collapsedHistory.length - 1].role === entry.role) {
        collapsedHistory[collapsedHistory.length - 1].parts[0].text += "\n" + entry.parts[0].text;
      } else {
        collapsedHistory.push(entry);
      }
    }

    // Preparar o payload final garantindo que o último papel seja 'user' se necessário
    let finalContents = collapsedHistory;
    if (finalContents.length > 0 && finalContents[finalContents.length - 1].role === 'user') {
      finalContents[finalContents.length - 1].parts[0].text += "\n" + prompt;
    } else {
      finalContents.push({ role: 'user', parts: [{ text: prompt }] });
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: finalContents,
        system_instruction: { parts: [{ text: systemInstruction }] },
        generation_config: {
          temperature: isPrivate ? 0.8 : 0.7,
          max_output_tokens: 500
        }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini API error:', data)
      throw new Error(`Gemini API failed: ${response.status}`)
    }

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
