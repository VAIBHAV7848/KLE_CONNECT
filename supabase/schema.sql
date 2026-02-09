-- ============================================================================
-- KLE_CONNECT Firebase to Supabase Migration Schema
-- BULLETPROOF VERSION - Drop & Recreate Everything
-- ============================================================================

-- First, drop everything that might cause conflicts
DROP TRIGGER IF EXISTS on_forum_answer_deleted ON forum_answers;
DROP TRIGGER IF EXISTS on_forum_answer_inserted ON forum_answers;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_forum_questions_updated_at ON forum_questions;
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
DROP TRIGGER IF EXISTS update_system_config_updated_at ON system_config;
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;

DROP FUNCTION IF EXISTS decrement_answers_count CASCADE;
DROP FUNCTION IF EXISTS increment_answers_count CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Drop publication
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Drop tables in reverse dependency order (safely)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS room_participants CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS forum_answers CASCADE;
DROP TABLE IF EXISTS forum_questions CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREATE ALL TABLES
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'User',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'ops_admin', 'super_admin')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
  is_owner BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- 2. CHATS TABLE
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id TEXT NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chats_channel_id ON chats(channel_id);
CREATE INDEX idx_chats_timestamp ON chats(timestamp DESC);

-- 3. FORUM QUESTIONS TABLE
CREATE TABLE forum_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  answers_count INTEGER NOT NULL DEFAULT 0,
  votes INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forum_questions_subject ON forum_questions(subject);
CREATE INDEX idx_forum_questions_timestamp ON forum_questions(timestamp DESC);

-- 4. FORUM ANSWERS TABLE
CREATE TABLE forum_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES forum_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  votes INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forum_answers_question_id ON forum_answers(question_id);

-- 5. NOTES TABLE
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  link TEXT NOT NULL,
  rating DECIMAL(2,1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  downloads INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_by_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_subject ON notes(subject);

-- 6. ROOMS TABLE
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  host_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ROOM PARTICIPANTS TABLE
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- 8. SYSTEM CONFIG TABLE
CREATE TABLE system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_name TEXT UNIQUE NOT NULL,
  key_value TEXT NOT NULL,
  last_updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SYSTEM SETTINGS TABLE
CREATE TABLE system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  lockdown BOOLEAN NOT NULL DEFAULT false,
  broadcast TEXT NOT NULL DEFAULT '',
  maintenance BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_settings (id, lockdown, broadcast, maintenance)
VALUES (1, false, '', false)
ON CONFLICT (id) DO NOTHING;

-- 10. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (SIMPLIFIED - NO CONFLICTS)
-- ============================================================================

-- Users: Allow all operations for now (simplified)
CREATE POLICY "Enable all for users" ON users FOR ALL USING (true) WITH CHECK (true);

-- Chats: Allow all operations
CREATE POLICY "Enable all for chats" ON chats FOR ALL USING (true) WITH CHECK (true);

-- Forum: Allow all operations
CREATE POLICY "Enable all for forum_questions" ON forum_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for forum_answers" ON forum_answers FOR ALL USING (true) WITH CHECK (true);

-- Notes: Allow all operations
CREATE POLICY "Enable all for notes" ON notes FOR ALL USING (true) WITH CHECK (true);

-- Rooms: Allow all operations
CREATE POLICY "Enable all for rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for room_participants" ON room_participants FOR ALL USING (true) WITH CHECK (true);

-- System: Allow all operations
CREATE POLICY "Enable all for system_config" ON system_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for system_settings" ON system_settings FOR ALL USING (true) WITH CHECK (true);

-- Audit logs: Allow all operations
CREATE POLICY "Enable all for audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_questions_updated_at BEFORE UPDATE ON forum_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role, status, is_owner)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'), 'user', 'Active', false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

CREATE PUBLICATION supabase_realtime FOR TABLE chats, forum_questions, forum_answers, notes, rooms, room_participants, system_settings;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================


-- 11. UPDATE FOR ANONYMOUS USERS (Guest Login Fix)
-- Allow NULL for email in the users table (since Guests have no email)
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- Redefine the function to handle anonymous users gracefully (overwrites previous definition)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role, status, is_owner)
  VALUES (
    NEW.id, 
    NEW.email, -- This can now be NULL for guests
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Guest User'), 
    'user', 
    'Active', 
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach the trigger (just to be safe, though it exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'SUCCESS! All tables created and Guest Login enabled.' as status;
