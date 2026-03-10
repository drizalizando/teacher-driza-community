const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://teacher-driza-community.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const { audioBase64 } = await req.json()
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    if (!audioBase64) {
      throw new Error('Missing audio data')
    }

    // Clean base64 if it has prefix
    const base64Data = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: 'audio/mp3', data: base64Data } },
            { text: "Transcribe this audio message. Output the transcription only, no extra text. If it is in Portuguese, transcribe it in Portuguese. If in English, transcribe it in English." }
          ]
        }]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini API error:', data)
      throw new Error(`Gemini API failed: ${response.status}`)
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(
      JSON.stringify({ error: error.message, text: "" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
