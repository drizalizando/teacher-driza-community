
-- REVISED SCHEMA FOR TEACHER DRIZA COMMUNITY
-- This SQL script repairs the database schema to match the dashboard image and application logic.

-- 1. CLEAN UP PREVIOUS TRIGGERS AND FUNCTIONS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. ENSURE PROFILES TABLE MATCHES THE DASHBOARD IMAGE
-- Adds 'full_name' and 'role' as shown in the screenshot.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT DEFAULT '',
  role TEXT DEFAULT 'student',
  handle TEXT DEFAULT '',
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  trial_end_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENSURE CHATS TABLE EXISTS (From image)
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  type TEXT DEFAULT 'private', -- 'public' or 'private'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one public chat exists
CREATE UNIQUE INDEX IF NOT EXISTS unique_public_chat ON public.chats (type) WHERE type = 'public';

-- 4. ENSURE MESSAGES TABLE EXISTS (From image)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats ON DELETE CASCADE,
  sender TEXT, -- UUID of sender or bot ID
  sender_name TEXT, -- Added for UI convenience
  content TEXT,
  is_ai BOOLEAN DEFAULT FALSE,
  type TEXT DEFAULT 'user', -- 'user', 'teacher', 'system'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES FOR PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 7. POLICIES FOR CHATS
DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can insert own chats" ON public.chats;

CREATE POLICY "Users can view own chats" ON public.chats FOR SELECT USING (auth.uid() = user_id OR type = 'public');
CREATE POLICY "Users can insert own chats" ON public.chats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. POLICIES FOR MESSAGES
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;

CREATE POLICY "Users can view messages in their chats"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.chats WHERE id = chat_id AND (user_id = auth.uid() OR type = 'public')
  ));

CREATE POLICY "Users can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE id = chat_id AND (user_id = auth.uid() OR type = 'public')
    )
  );

-- 9. REALTIME ENABLEMENT
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.chats, public.messages;

-- 10. AUTOMATIC PROFILE CREATION TRIGGER
-- This function runs with SECURITY DEFINER to bypass RLS during signup.
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
