
-- SCHEMA REPAIR FOR TEACHER DRIZA COMMUNITY
-- This SQL file cleans up the database state and sets up a single source of truth.

-- 1. CLEAN UP EXISTING TRIGGERS AND FUNCTIONS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. ENSURE PROFILES TABLE EXISTS WITH CORRECT STRUCTURE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT DEFAULT '',
  handle TEXT DEFAULT '',
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  trial_end_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENSURE MESSAGES TABLE EXISTS
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users,
  user_id UUID REFERENCES auth.users,
  sender_name TEXT,
  content TEXT,
  channel TEXT, -- 'public' or 'private'
  is_ai BOOLEAN DEFAULT FALSE,
  type TEXT, -- 'user', 'teacher', 'system'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. CLEAN UP AND REBUILD POLICIES FOR PROFILES
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 6. CLEAN UP AND REBUILD POLICIES FOR MESSAGES
DROP POLICY IF EXISTS "Public messages are viewable by everyone" ON public.messages;
DROP POLICY IF EXISTS "Private messages are viewable by the user involved" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;

CREATE POLICY "Public messages are viewable by everyone"
  ON public.messages FOR SELECT
  USING (channel = 'public');

CREATE POLICY "Private messages are viewable by the user involved"
  ON public.messages FOR SELECT
  USING (channel = 'private' AND (auth.uid() = user_id OR auth.uid() = sender_id));

CREATE POLICY "Users can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = user_id);

-- 7. REALTIME ENABLEMENT
-- Drop and recreate publication to avoid duplicates
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.messages;

-- 8. AUTOMATIC PROFILE CREATION TRIGGER
-- This function runs with SECURITY DEFINER to ensure it has permissions to write to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_status, trial_end_date)
  VALUES (NEW.id, NEW.email, 'trialing', NOW() + INTERVAL '7 days')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
