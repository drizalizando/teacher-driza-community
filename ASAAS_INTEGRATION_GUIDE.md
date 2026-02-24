
# Guia de Integração Asaas + Supabase

Para que o sistema de pagamentos funcione corretamente e de forma segura, você deve processar as chamadas do Asaas no **Backend** (usando Supabase Edge Functions). **Nunca coloque sua chave de API do Asaas diretamente no código front-end.**

## 1. Configurar Supabase Edge Function

Crie uma função no Supabase chamada `asaas-checkout`. Esta função deve:
1. Receber o `userId` ou `email` do usuário logado.
2. Criar ou buscar o `customer` no Asaas.
3. Criar a assinatura (`POST /v3/subscriptions`).
4. Retornar a `invoiceUrl` ou um link de checkout.

### Exemplo de lógica (Deno/TypeScript):
```typescript
// supabase/functions/asaas-checkout/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { planId } = await req.json()
  const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')

  // 1. Criar Assinatura no Asaas
  const response = await fetch('https://api.asaas.com/v3/subscriptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY
    },
    body: JSON.stringify({
      customer: 'ID_DO_CLIENTE_NO_ASAAS',
      billingType: 'CREDIT_CARD',
      value: 33,
      nextDueDate: new Date().toISOString().split('T')[0],
      cycle: 'MONTHLY',
      description: 'Teacher Driza Community'
    })
  })

  const data = await response.json()
  return new Response(JSON.stringify({ checkoutUrl: data.invoiceUrl }), { headers: { "Content-Type": "application/json" } })
})
```

## 2. Configurar Webhook do Asaas

Para que o Supabase saiba quando o usuário pagou, você deve configurar um Webhook no painel do Asaas:
1. Vá em **Configurações > Webhooks**.
2. URL do Webhook: `https://[SEU_PROJETO].supabase.co/functions/v1/asaas-webhook`
3. Eventos sugeridos: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `SUBSCRIPTION_DELETED`.

### Lógica do Webhook:
A função `asaas-webhook` deve receber o evento e atualizar a tabela `profiles` no Supabase:
```sql
-- Exemplo de atualização
UPDATE profiles SET subscription_status = 'active' WHERE asaas_customer_id = '...';
```

## 3. Link de Pagamento Simples (Alternativa Rápida)

Se você não quiser usar Edge Functions agora, você pode:
1. Criar um **Link de Pagamento** fixo no painel do Asaas.
2. Atualizar o `getCheckoutUrl` no `services/api.ts` para retornar esse link diretamente.
3. Configurar o Webhook do Asaas para apontar para uma URL que atualize o banco de dados via Supabase.

## Documentação Oficial
Para mais detalhes sobre os campos de assinatura, consulte:
[Criar Nova Assinatura - Asaas](https://docs.asaas.com/reference/criar-nova-assinatura)
