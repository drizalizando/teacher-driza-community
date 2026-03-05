import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Block expired trials
    const { data, error } = await supabase
      .from('profiles')
      .update({ subscription_status: 'blocked' })
      .eq('subscription_status', 'trialing')
      .lt('trial_end_date', new Date().toISOString())

    if (error) throw error

    console.log(`Expired ${data?.length || 0} trial accounts`)

    return new Response(
      JSON.stringify({ success: true, expired: data?.length || 0 }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
