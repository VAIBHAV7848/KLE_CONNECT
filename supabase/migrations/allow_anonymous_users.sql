-- ============================================================================
-- SQL MIGRATION: Allow Anonymous Users
-- Run this script in your Supabase SQL Editor to fix Guest Login
-- ============================================================================

-- 1. Allow NULL for email in the public.users table (Anonymous users have no email)
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- 2. Drop the existing trigger constraint to replace the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Redefine the function to handle anonymous users gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role, status, is_owner)
  VALUES (
    NEW.id, 
    -- Use NULL if email is missing (Anonymous), or the provided email
    NEW.email, 
    -- Default display name logic
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Guest User'), 
    'user', 
    'Active', 
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Confirmation
SELECT 'Successfully updated schema to support Anonymous Users' as status;
