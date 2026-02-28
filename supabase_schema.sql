
-- SCHEMA SETUP FOR TEACHER DRIZA COMMUNITY

-- 1. PROFILES TABLE
-- This table stores additional user information.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  handle TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  trial_end_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MESSAGES TABLE
-- This table stores both community and private AI chat messages.
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users,
  user_id UUID REFERENCES auth.users, -- For private messages, identifies which user's chat this belongs to
  sender_name TEXT,
  content TEXT,
  channel TEXT, -- 'public' or 'private'
  is_ai BOOLEAN DEFAULT FALSE,
  type TEXT, -- 'user', 'teacher', 'system'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES FOR PROFILES
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 5. POLICIES FOR MESSAGES
CREATE POLICY "Public messages are viewable by everyone"
  ON messages FOR SELECT
  USING (channel = 'public');

CREATE POLICY "Private messages are viewable by the user involved"
  ON messages FOR SELECT
  USING (channel = 'private' AND (auth.uid() = user_id OR auth.uid() = sender_id));

CREATE POLICY "Authenticated users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = user_id);

-- 6. REALTIME ENABLEMENT
-- Enable realtime for the messages table to allow live chat updates.
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 7. AUTOMATIC PROFILE CREATION (OPTIONAL BUT RECOMMENDED)
-- This function and trigger automatically create a profile when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
