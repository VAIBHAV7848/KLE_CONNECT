-- ============================================================================
-- KLE CONNECT — COMPLETE NEW SUPABASE SETUP SCRIPT (PRODUCTION-GRADE)
-- Project: thrshfigvpafopddosto
-- Run this ENTIRE file in Supabase Dashboard → SQL Editor → New Query
-- ============================================================================
-- ✅ Fixed: DROP TRIGGER removed (crashes fresh DBs — table must exist first)
-- ✅ Fixed: pgcrypto extension added
-- ✅ Fixed: RLS hardened on sensitive tables
-- ✅ Fixed: Missing updated_at triggers added
-- ✅ Fixed: Forum votes index added
-- ============================================================================

-- ============================================================================
-- PART 1: CLEANUP
-- Drop tables in reverse dependency order (CASCADE drops triggers automatically)
-- DO NOT drop triggers separately — they don't exist yet on a fresh database!
-- ============================================================================

DROP PUBLICATION IF EXISTS supabase_realtime;

DROP FUNCTION IF EXISTS decrement_answers_count CASCADE;
DROP FUNCTION IF EXISTS increment_answers_count CASCADE;
DROP FUNCTION IF EXISTS increment_votes CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_ai_analytics CASCADE;
DROP FUNCTION IF EXISTS increment_failures CASCADE;
DROP FUNCTION IF EXISTS log_auth_event CASCADE;

-- Drop tables (CASCADE automatically removes foreign keys AND triggers)
DROP TABLE IF EXISTS login_history CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS ai_usage_stats CASCADE;
DROP TABLE IF EXISTS provider_health CASCADE;
DROP TABLE IF EXISTS failover_config CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS embeddings CASCADE;
DROP TABLE IF EXISTS chunks CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS room_participants CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS forum_answers CASCADE;
DROP TABLE IF EXISTS forum_questions CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- PART 2: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- PART 3: CORE APPLICATION TABLES
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
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
CREATE INDEX idx_forum_questions_votes ON forum_questions(votes DESC);  -- New: for sorting by popularity

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
  topic TEXT DEFAULT 'General',
  host_id UUID REFERENCES users(id) ON DELETE SET NULL,
  participants INTEGER DEFAULT 0,
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

-- 8. SYSTEM CONFIG TABLE (sensitive — admin only)
CREATE TABLE system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT UNIQUE NOT NULL,
  key_value TEXT NOT NULL,
  last_updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SYSTEM SETTINGS TABLE
CREATE TABLE system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  lockdown BOOLEAN NOT NULL DEFAULT false,
  broadcast JSONB NOT NULL DEFAULT '{"active": false, "message": "", "timestamp": 0, "sentBy": ""}',
  maintenance BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_settings (id, lockdown, broadcast, maintenance)
VALUES (1, false, '{"active": false, "message": "", "timestamp": 0, "sentBy": ""}', false)
ON CONFLICT (id) DO NOTHING;

-- 10. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT,
  role TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  blocked BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);

-- 11. LOGIN HISTORY TABLE
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'GUEST_LOGIN', 'GOOGLE_LOGIN', 'PHONE_LOGIN', 'EMAIL_LOGIN')),
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT
);

CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_timestamp ON login_history(timestamp DESC);
CREATE INDEX idx_login_history_event_type ON login_history(event_type);

-- 12. AI USAGE STATS TABLE
CREATE TABLE ai_usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  response_time_ms INTEGER,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  error_message TEXT,
  route_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_provider ON ai_usage_stats(provider);
CREATE INDEX idx_ai_usage_created_at ON ai_usage_stats(created_at);
CREATE INDEX idx_ai_usage_user ON ai_usage_stats(user_id);

-- 13. PROVIDER HEALTH TABLE
CREATE TABLE provider_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  response_time_ms INTEGER,
  error_message TEXT,
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  consecutive_failures INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_provider_health_provider ON provider_health(provider);
CREATE INDEX idx_provider_health_status ON provider_health(status);

-- 14. FAILOVER CONFIG TABLE
CREATE TABLE failover_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_provider TEXT NOT NULL UNIQUE,
  fallback_order TEXT[] NOT NULL,
  max_failures_before_failover INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO failover_config (primary_provider, fallback_order, max_failures_before_failover)
VALUES
  ('OPENAI_API_KEY', ARRAY['GROQ_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'MISTRAL_API_KEY'], 3),
  ('GROQ_API_KEY', ARRAY['OPENAI_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'MISTRAL_API_KEY'], 3),
  ('GEMINI_API_KEY', ARRAY['OPENAI_API_KEY', 'GROQ_API_KEY', 'ANTHROPIC_API_KEY', 'MISTRAL_API_KEY'], 3),
  ('ANTHROPIC_API_KEY', ARRAY['OPENAI_API_KEY', 'GROQ_API_KEY', 'GEMINI_API_KEY', 'MISTRAL_API_KEY'], 3),
  ('MISTRAL_API_KEY', ARRAY['OPENAI_API_KEY', 'GROQ_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY'], 3)
ON CONFLICT (primary_provider) DO NOTHING;

-- 15. PROFILES TABLE
CREATE TABLE profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  branch TEXT,
  year TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. THINKLM TABLES
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  semester TEXT NOT NULL,
  course TEXT NOT NULL,
  unit TEXT NOT NULL,
  topic TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  page_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  page_number INT,
  ordinal INT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE embeddings (
  chunk_id UUID PRIMARY KEY REFERENCES chunks(id) ON DELETE CASCADE,
  embedding vector(1536)
);

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 4: ROW LEVEL SECURITY (Enable on all tables)
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
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE failover_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 5: RLS POLICIES
-- Public app tables → open to authenticated users
-- Sensitive admin tables → restricted to admins only
-- ============================================================================

-- ---- PUBLIC APP TABLES (authenticated users can read/write) ----

-- Users: authenticated users can view all; only update their own
CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Service role full access to users"
  ON users FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role insert users"
  ON users FOR INSERT TO service_role WITH CHECK (true);

-- Chats: anyone authenticated can read/write
CREATE POLICY "Authenticated users full access to chats"
  ON chats FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Forum Questions
CREATE POLICY "Authenticated users full access to forum_questions"
  ON forum_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Forum Answers
CREATE POLICY "Authenticated users full access to forum_answers"
  ON forum_answers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notes
CREATE POLICY "Authenticated users full access to notes"
  ON notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Rooms
CREATE POLICY "Authenticated users full access to rooms"
  ON rooms FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access to room_participants"
  ON room_participants FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- System Settings (read by all authenticated, write by admins)
CREATE POLICY "Authenticated users can read system_settings"
  ON system_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify system_settings"
  ON system_settings FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
  );

-- Profiles
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ThinkLM tables (user-scoped)
CREATE POLICY "Users access own subjects"
  ON subjects FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users access own materials"
  ON materials FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Chunks: scoped through subject ownership
CREATE POLICY "Users access own chunks"
  ON chunks FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = chunks.subject_id
      AND subjects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = chunks.subject_id
      AND subjects.user_id = auth.uid()
    )
  );

-- Embeddings: scoped through chunk → subject ownership
CREATE POLICY "Users access own embeddings"
  ON embeddings FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chunks
      JOIN subjects ON subjects.id = chunks.subject_id
      WHERE chunks.id = embeddings.chunk_id
      AND subjects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chunks
      JOIN subjects ON subjects.id = chunks.subject_id
      WHERE chunks.id = embeddings.chunk_id
      AND subjects.user_id = auth.uid()
    )
  );

-- Assets: scoped through subject ownership
CREATE POLICY "Users access own assets"
  ON assets FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = assets.subject_id
      AND subjects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = assets.subject_id
      AND subjects.user_id = auth.uid()
    )
  );

-- ---- SENSITIVE / ADMIN-ONLY TABLES ----

-- Audit Logs: admins can see all, users can see nothing via anon key
CREATE POLICY "Admins can view audit_logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
  );

CREATE POLICY "Authenticated users can insert audit_logs"
  ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Service role full access to audit_logs"
  ON audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Login History: only admins can view
CREATE POLICY "Admins can view login_history"
  ON login_history FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
  );

CREATE POLICY "Authenticated users can insert login_history"
  ON login_history FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Service role full access to login_history"
  ON login_history FOR ALL TO service_role USING (true) WITH CHECK (true);

-- AI Usage Stats: admins only
CREATE POLICY "Admins can view ai_usage_stats"
  ON ai_usage_stats FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
  );

CREATE POLICY "Authenticated users can insert ai_usage_stats"
  ON ai_usage_stats FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Service role full access to ai_usage_stats"
  ON ai_usage_stats FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Provider Health: admins only
CREATE POLICY "Admins can manage provider_health"
  ON provider_health FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
  );

CREATE POLICY "Service role full access to provider_health"
  ON provider_health FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Failover Config: super_admin only
CREATE POLICY "Super admins can manage failover_config"
  ON failover_config FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  );

CREATE POLICY "Service role full access to failover_config"
  ON failover_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- System Config (API keys): super_admin only
CREATE POLICY "Super admins can manage system_config"
  ON system_config FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  );

CREATE POLICY "Service role full access to system_config"
  ON system_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- PART 6: FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new user signup (email, anonymous, Google, phone)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role, status, is_owner)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      'User'
    ),
    'user',
    'Active',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, users.email),
    display_name = COALESCE(EXCLUDED.display_name, users.display_name);

  -- Also create a profile entry
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name')
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment vote count on forum questions
CREATE OR REPLACE FUNCTION increment_votes(question_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE forum_questions
  SET votes = votes + 1
  WHERE id = question_id;
END;
$$ LANGUAGE plpgsql;

-- Increment failure count for provider health
CREATE OR REPLACE FUNCTION increment_failures(provider_name TEXT)
RETURNS INTEGER AS $$
DECLARE
  current_failures INTEGER;
BEGIN
  UPDATE provider_health
  SET consecutive_failures = consecutive_failures + 1,
      last_checked = NOW()
  WHERE provider = provider_name
  RETURNING consecutive_failures INTO current_failures;
  RETURN COALESCE(current_failures, 1);
END;
$$ LANGUAGE plpgsql;

-- Auto-increment forum answers_count
CREATE OR REPLACE FUNCTION increment_answers_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE forum_questions SET answers_count = answers_count + 1 WHERE id = NEW.question_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-decrement forum answers_count
CREATE OR REPLACE FUNCTION decrement_answers_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE forum_questions SET answers_count = GREATEST(0, answers_count - 1) WHERE id = OLD.question_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Clean old AI analytics (keeps last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_ai_analytics()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_usage_stats WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 7: TRIGGERS
-- ============================================================================

-- updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_questions_updated_at
  BEFORE UPDATE ON forum_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_health_updated_at
  BEFORE UPDATE ON provider_health
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_failover_config_updated_at
  BEFORE UPDATE ON failover_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update forum answers_count
CREATE TRIGGER on_forum_answer_inserted
  AFTER INSERT ON forum_answers
  FOR EACH ROW EXECUTE FUNCTION increment_answers_count();

CREATE TRIGGER on_forum_answer_deleted
  AFTER DELETE ON forum_answers
  FOR EACH ROW EXECUTE FUNCTION decrement_answers_count();

-- ============================================================================
-- PART 8: REALTIME PUBLICATION (all critical tables)
-- ============================================================================

CREATE PUBLICATION supabase_realtime FOR TABLE
  users,
  chats,
  forum_questions,
  forum_answers,
  notes,
  rooms,
  room_participants,
  system_settings,
  audit_logs,
  login_history,
  ai_usage_stats,
  provider_health;

-- ============================================================================
-- PART 9: VERIFY SETUP
-- ============================================================================

SELECT
  table_name,
  'CREATED ✅' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
