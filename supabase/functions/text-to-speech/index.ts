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
    const { text } = await req.json()
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // To implement functional TTS, we recommend using Google Cloud Text-to-Speech.
    // Ensure you have the 'GOOGLE_CLOUD_API_KEY' or service account configured in Supabase secrets.
    // Below is a structural implementation that uses Google TTS if an API key is present.

    const googleApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY') || geminiApiKey; // Fallback to Gemini key if it's a restricted-but-capable API key

    const ttsResponse = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'en-US', name: 'en-US-Neural2-F' },
        audioConfig: { audioEncoding: 'MP3' }
      })
    })

    const ttsData = await ttsResponse.json()

    if (!ttsResponse.ok) {
      console.warn('TTS API warning (might need separate Google Cloud TTS setup):', ttsData)
      return new Response(
        JSON.stringify({
          audioBase64: null,
          message: "TTS requires active Google Cloud Text-to-Speech API. Please check your API key permissions."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ audioBase64: ttsData.audioContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
