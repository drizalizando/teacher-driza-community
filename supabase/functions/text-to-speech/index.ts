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
    // Deprecated: No longer using server-side TTS to avoid Google Cloud billing.
    // The frontend now uses the browser-native Web Speech API (window.speechSynthesis)
    // which provides a zero-cost solution for Teacher Driza's voice responses.

    return new Response(
      JSON.stringify({
        audioBase64: null,
        message: "TTS migrated to browser-native Web Speech API. No billing required."
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
