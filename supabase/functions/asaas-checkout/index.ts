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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { type } = await req.json()

    // Get or create Asaas customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('asaas_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.asaas_customer_id

    if (!customerId) {
      // Create customer in Asaas
      const customerResponse = await fetch('https://www.asaas.com/api/v3/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey
        },
        body: JSON.stringify({
          name: user.email,
          email: user.email
        })
      })

      const customerData = await customerResponse.json()
      customerId = customerData.id

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ asaas_customer_id: customerId })
        .eq('id', user.id)
    }

    if (type === 'subscription') {
      // Create subscription checkout
      const subscriptionResponse = await fetch('https://www.asaas.com/api/v3/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: 'CREDIT_CARD',
          cycle: 'MONTHLY',
          value: 33.00,
          nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'Teacher Driza Community - Monthly Subscription'
        })
      })

      const subscriptionData = await subscriptionResponse.json()

      return new Response(
        JSON.stringify({ url: subscriptionData.invoiceUrl || 'https://asaas.com' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (type === 'portal') {
      // Return Asaas customer portal URL
      return new Response(
        JSON.stringify({ url: `https://www.asaas.com/customer/${customerId}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
