-- ============================================================================
-- FIX GUEST LOGIN AND GENERIC USER CREATION
-- ============================================================================

-- 1. Ensure 'users' table policies allow INSERT by authenticated users (including anonymous)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users can insert their own profile"
ON public.users
FOR INSERT
TO authenticated, anon
WITH CHECK ( auth.uid() = id );

-- 2. Allow anonymous users to SELECT themselves
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated, anon
USING ( auth.uid() = id );

-- 3. Allow anonymous users to UPDATE themselves
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated, anon
USING ( auth.uid() = id );

-- 4. Make email optional in users table (since Guest users have no email)
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- 5. Disable strict constraint on email format for guests
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_check;
