-- ==========================================
-- KLE CONNECT: PRODUCTION STABILIZATION
-- ==========================================

-- 1. AI PERSISTENCE
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access own conversations" ON public.ai_conversations;
CREATE POLICY "Users can only access own conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only access own messages" ON public.ai_messages;
CREATE POLICY "Users can only access own messages" ON public.ai_messages FOR ALL 
USING (EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid()));

-- 2. PLANNER SYNC
CREATE TABLE IF NOT EXISTS public.planner_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    deadline TIMESTAMPTZ,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Planner private" ON public.planner_tasks;
CREATE POLICY "Planner private" ON public.planner_tasks FOR ALL USING (auth.uid() = user_id);

-- 3. DOUBTS & FORUM (ALIGNMENT)
CREATE TABLE IF NOT EXISTS public.doubts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    subject TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Doubts visibility" ON public.doubts;
CREATE POLICY "Doubts visibility" ON public.doubts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Doubts CRUD" ON public.doubts;
CREATE POLICY "Doubts CRUD" ON public.doubts FOR ALL USING (auth.uid() = user_id);

-- Ensure Realtime is enabled for these
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_conversations;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.planner_tasks;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.doubts;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
