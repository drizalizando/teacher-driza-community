import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const { text } = await req.json()
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Usando a API do Gemini para converter texto em fala (via representação de texto descritiva ou similar)
    // Nota: O Gemini 1.5 Flash não gera áudio MP3 diretamente via REST de forma simples como texto.
    // Como solução de contorno para o protótipo, retornamos null ou uma mensagem de erro controlada.
    // Para um sistema real, integraríamos com Google Cloud TTS.

    return new Response(
      JSON.stringify({ audioBase64: null, message: "TTS requires Google Cloud integration" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
