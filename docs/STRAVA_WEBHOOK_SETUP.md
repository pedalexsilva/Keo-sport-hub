# Configuração do Webhook Strava (Supabase Edge Functions)

Este guia descreve como configurar a integração de Webhooks do Strava utilizando Supabase Edge Functions. Esta configuração permite receber notificações em tempo real sempre que uma atividade é criada, atualizada ou apagada no Strava.

## 1. Pré-requisitos

*   Projeto Supabase criado.
*   Conta de Developer no Strava (com `Client ID` e `Client Secret`).
*   Supabase CLI instalado e logado.

## 2. Configuração de Variáveis de Ambiente (Secrets)

No teu projeto Supabase, define os seguintes segredos. Isto é essencial para que as funções comuniquem de forma segura.

Execute no terminal:

```powershell
npx supabase secrets set STRAVA_CLIENT_ID=teu_client_id
npx supabase secrets set STRAVA_CLIENT_SECRET=teu_client_secret
npx supabase secrets set STRAVA_WEBHOOK_VERIFY_TOKEN=UM_TOKEN_SEGURO_DA_TUA_ESCOLHA
npx supabase secrets set STRAVA_ENCRYPTION_KEY=uma_chave_longa_para_encriptacao
```

*Nota: `STRAVA_WEBHOOK_VERIFY_TOKEN` é uma string qualquer (ex: "MINHA_APP_SECRET_2024") que tu inventas. O Strava vai enviar isto de volta para confirmar a identidade.*

## 3. Edge Function: Receiver (`strava-webhook`)

Esta função é o "ouvido" da tua aplicação. Ela recebe os eventos do Strava.

**Ficheiro:** `supabase/functions/strava-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. GET Request: Subscription Validation (Hub Challenge)
    // O Strava envia isto quando registamos o webhook pela primeira vez.
    if (req.method === 'GET') {
        const url = new URL(req.url)
        const mode = url.searchParams.get('hub.mode')
        const token = url.searchParams.get('hub.verify_token')
        const challenge = url.searchParams.get('hub.challenge')

        const VERIFY_TOKEN = Deno.env.get('STRAVA_WEBHOOK_VERIFY_TOKEN') || 'STRAVA'

        console.log(`[Webhook Verify] Mode: ${mode}, Token: ${token}, Expected: ${VERIFY_TOKEN}`)

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED: Matches!')
            return new Response(JSON.stringify({ "hub.challenge": challenge }), {
                headers: { 'Content-Type': 'application/json' },
            })
        }
        
        console.error(`[Webhook Verify] FAILED. Token mismatch? ${token !== VERIFY_TOKEN}`)
        return new Response(JSON.stringify({ 
            error: 'Forbidden', 
            debug: { received: token, expected: VERIFY_TOKEN, match: token === VERIFY_TOKEN }
        }), { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    // 2. POST Request: Event Handling (Nova Atividade, etc.)
    if (req.method === 'POST') {
        try {
            const payload = await req.json()
            console.log("Webhook Event:", payload)

            // Aqui implementas a tua lógica (ex: guardar na BD)
            // ... (ver implementação completa no projeto atual para exemplo de processamento)

            return new Response('EVENT_RECEIVED', {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        } catch (error) {
            console.error("Webhook Processing Error:", error)
            return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }
    }
})
```

## 4. Edge Function: Manager (`strava-manage-webhook`)

Esta função serve para **registar** o webhook no Strava sem expor as tuas chaves secretas no cliente/browser.

**Ficheiro:** `supabase/functions/strava-manage-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID')
        const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET')
        const STRAVA_WEBHOOK_VERIFY_TOKEN = Deno.env.get('STRAVA_WEBHOOK_VERIFY_TOKEN')

        const currentUrl = new URL(req.url)
        // FORCE HTTPS: Strava strictly requires https.
        const baseUrl = `https://${currentUrl.host}/functions/v1`
        const webhookUrl = `${baseUrl}/strava-webhook`

        if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_WEBHOOK_VERIFY_TOKEN) {
            throw new Error("Missing required environment variables")
        }

        // Consultar subscrições atuais
        const checkRes = await fetch(`https://www.strava.com/api/v3/push_subscriptions?client_id=${STRAVA_CLIENT_ID}&client_secret=${STRAVA_CLIENT_SECRET}`)
        const currentSubs = await checkRes.json()

        const body = await req.json().catch(() => ({}))
        const action = body.action || 'view'

        // ACTION: DELETE (Cleanup)
        if (action === 'delete') {
            if (currentSubs.length === 0) return new Response(JSON.stringify({ message: "No subscriptions." }), { headers: corsHeaders })
            const subId = currentSubs[0].id
            await fetch(`https://www.strava.com/api/v3/push_subscriptions/${subId}?client_id=${STRAVA_CLIENT_ID}&client_secret=${STRAVA_CLIENT_SECRET}`, { method: 'DELETE' })
            return new Response(JSON.stringify({ success: true, message: `Deleted ${subId}` }), { headers: corsHeaders })
        }

        // ACTION: CREATE (Register)
        if (action === 'create') {
            if (currentSubs.length > 0) {
                 return new Response(JSON.stringify({ success: false, message: "Already exists.", current: currentSubs }), { headers: corsHeaders })
            }

            const verifyTokenToUse = body.verify_token || STRAVA_WEBHOOK_VERIFY_TOKEN;
            console.log(`Registering webhook: ${webhookUrl}`)

            // URLSearchParams é obrigatório para a API do Strava
            const params = new URLSearchParams();
            params.append('client_id', STRAVA_CLIENT_ID);
            params.append('client_secret', STRAVA_CLIENT_SECRET);
            params.append('callback_url', webhookUrl);
            params.append('verify_token', verifyTokenToUse);

            const createRes = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
                method: 'POST',
                body: params
            })

            const createData = await createRes.json()
            if (!createRes.ok) throw new Error(`Failed to register: ${JSON.stringify(createData)}`)

            return new Response(JSON.stringify({ success: true, data: createData }), { headers: corsHeaders })
        }
        
        // ACTION: VALIDATE (Auto-Diagnóstico)
        if (action === 'validate') {
             const verifyTokenToUse = body.verify_token || STRAVA_WEBHOOK_VERIFY_TOKEN;
             const challenge = 'self-test-challenge'; 
             const validateUrl = `${webhookUrl}?hub.mode=subscribe&hub.verify_token=${verifyTokenToUse}&hub.challenge=${challenge}`
             const valRes = await fetch(validateUrl)
             return new Response(JSON.stringify({ success: valRes.ok, status: valRes.status, response: await valRes.text() }), { headers: corsHeaders })
        }

        // DEFAULT: View Config
        return new Response(JSON.stringify({ status: "ok", config: { webhookUrl }, subs: currentSubs }), { headers: corsHeaders })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
    }
})
```

## 5. Deployment e Registo

### Passo 1: Deploy das Funções
Importante: Usar `--no-verify-jwt` para garantir que o Strava consegue aceder ao endpoint público.

```powershell
npx supabase functions deploy strava-webhook --no-verify-jwt
npx supabase functions deploy strava-manage-webhook --no-verify-jwt
```

### Passo 2: Validar Conectividade (Opcional mas recomendado)
Isto faz com que o servidor teste a si próprio antes de falar com o Strava.

```powershell
Invoke-RestMethod -Uri "https://[PROJECT_REF].supabase.co/functions/v1/strava-manage-webhook" -Method POST -ContentType "application/json" -Body '{"action":"validate"}'
```

### Passo 3: Registar no Strava
Se a validação passou, regista oficialmente.

```powershell
Invoke-RestMethod -Uri "https://[PROJECT_REF].supabase.co/functions/v1/strava-manage-webhook" -Method POST -ContentType "application/json" -Body '{"action":"create"}'
```

Se receberes `success: true` e um ID, está feito!

## Resolução de Problemas Comuns
*   **Erro 403 / Token Mismatch**: Verifica se o `STRAVA_WEBHOOK_VERIFY_TOKEN` nos segredos coincide com o que o Strava está a enviar (ou força-o no body do pedido de registo).
*   **Callback URL not 200**: O Strava não conseguiu chegar à função. Verifica se fizeste deploy com `--no-verify-jwt` e se o URL gerado começa por `https://`.
*   **Bad Request no Registo**: Garante que estás a usar `URLSearchParams` na função de gestão e não `FormData`.
