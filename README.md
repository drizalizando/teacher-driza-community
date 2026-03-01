# Teacher Driza Community App

A SaaS platform for English learning through immersive practice and AI-powered guidance.

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google Gemini API key
- Asaas account (for payments)

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Run the SQL from `supabase_schema.sql` in the SQL Editor
3. Create a storage bucket named `avatars` and make it public
4. Set up Edge Functions:
   ```bash
   supabase functions deploy ai-chat
   supabase functions deploy validate-profile-picture
   supabase functions deploy asaas-checkout
   supabase functions deploy expire-trials
   ```
5. Add secrets to Edge Functions:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_gemini_key
   supabase secrets set ASAAS_API_KEY=your_asaas_key
   ```

### 4. Database Setup

Enable required extensions:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

Set up daily trial expiration cron:
```sql
SELECT cron.schedule(
  'expire-trials-daily',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url:='YOUR_SUPABASE_URL/functions/v1/expire-trials',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

### 5. Run Development Server

```bash
npm run dev
```

### 6. Build for Production

```bash
npm run build
npm run preview
```

## Architecture

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI**: Google Gemini 1.5 Flash
- **Payments**: Asaas API
- **Real-time**: Supabase Realtime

## Key Features

-  Email/password authentication
-  Profile onboarding with AI-validated avatars
-  Public & private chat channels
-  AI-powered English teacher (Teacher Driza)
-  Voice transcription and TTS
-  7-day free trial with automatic expiration
-  Asaas payment integration
-  Subscription management

## Security

- API keys are stored server-side in Edge Functions
- Row Level Security (RLS) enabled on all tables
- Profile pictures validated with AI before upload
- Rate limiting on all critical endpoints

## Support

For issues, contact: [your-email@example.com]
