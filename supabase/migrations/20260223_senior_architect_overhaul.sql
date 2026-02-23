-- ==========================================
-- KLE CONNECT: SENIOR ARCHITECT OVERHAUL
-- Optimized for Supabase Free Tier
-- ==========================================

-- 1. ROLES AND PROFILES
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('student', 'ops_admin', 'super_admin');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    role user_role DEFAULT 'student',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AI & LEARNING TOOLS
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Chat',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT,
    content TEXT, -- Markdown or JSON
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDY PLANNER
CREATE TABLE IF NOT EXISTS public.planner_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    deadline TIMESTAMPTZ,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMMUNITY & DOUBTS
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_likes (
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.doubts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    subject TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.doubt_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doubt_id UUID NOT NULL REFERENCES public.doubts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_correct_answer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CAMPUS & EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    category TEXT,
    image_url TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STUDY ROOMS (BOOKING)
CREATE TABLE IF NOT EXISTS public.study_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.room_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- 7. PLATFORM
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- REAL-TIME CONFLICT PREVENTION (RPC)
-- ==========================================

CREATE OR REPLACE FUNCTION public.book_study_room(
    request_room_id UUID,
    request_start TIMESTAMPTZ,
    request_end TIMESTAMPTZ
) RETURNS JSON AS $$
DECLARE
    has_conflict BOOLEAN;
    booking_id UUID;
BEGIN
    -- Check for overlapping bookings
    SELECT EXISTS (
        SELECT 1 FROM public.room_bookings
        WHERE room_id = request_room_id
        AND (
            (start_time, end_time) OVERLAPS (request_start, request_end)
        )
    ) INTO has_conflict;

    IF has_conflict THEN
        RETURN json_build_object('success', false, 'error', 'Room already booked for this time slot');
    END IF;

    -- Create booking
    INSERT INTO public.room_bookings (room_id, user_id, start_time, end_time)
    VALUES (request_room_id, auth.uid(), request_start, request_end)
    RETURNING id INTO booking_id;

    RETURN json_build_object('success', true, 'booking_id', booking_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubt_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Users can read all (for community), but only update own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. AI Tutor: Strictly private
CREATE POLICY "Users can only access own conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access own messages" ON public.ai_messages FOR ALL 
USING (EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid()));

-- 3. Notes: Own private or public
CREATE POLICY "Notes visibility" ON public.notes FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Notes CRUD own" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- 4. Planner: Strictly private
CREATE POLICY "Planner private" ON public.planner_tasks FOR ALL USING (auth.uid() = user_id);

-- 5. Community: View all, CRUD own
CREATE POLICY "Community view" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Community CRUD own" ON public.community_posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Likes CRUD own" ON public.community_likes FOR ALL USING (auth.uid() = user_id);

-- 6. Events: Everyone view, only admins insert/update/delete
CREATE POLICY "Events view" ON public.events FOR SELECT USING (true);
CREATE POLICY "Events admin only" ON public.events FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'ops_admin' OR role = 'super_admin')));

-- 7. Admin Panel role management (Super admin only)
CREATE POLICY "Super admin manage roles" ON public.profiles FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- ==========================================
-- REALTIME REPLICA SETTINGS
-- ==========================================
-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planner_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doubt_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ==========================================
-- TRIGGERS FOR SYNCING UPDATED_AT
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_notes_modtime BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON public.planner_tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- AGGREGATED STATS VIEW (DASHBOARD)
-- ==========================================
CREATE OR REPLACE VIEW public.student_stats AS
SELECT 
    user_id,
    (SELECT count(*) FROM public.planner_tasks WHERE user_id = p.id AND status != 'done') as pending_tasks,
    (SELECT count(*) FROM public.notes WHERE user_id = p.id) as total_notes,
    (SELECT count(*) FROM public.doubts WHERE user_id = p.id AND is_resolved = false) as open_doubts
FROM public.profiles p;

GRANT SELECT ON public.student_stats TO authenticated;

-- ==========================================
-- ADD MISSING UPDATED_AT COLUMNS & TRIGGERS
-- ==========================================
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.room_bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TRIGGER update_community_modtime BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bookings_modtime BEFORE UPDATE ON public.room_bookings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

SELECT 'Senior Architect Schema - Audit Refinements Applied ✅' as status;

