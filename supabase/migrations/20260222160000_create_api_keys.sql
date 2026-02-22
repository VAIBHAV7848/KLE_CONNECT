-- ============================================================================
-- CREATE API_KEYS TABLE (Missing from schema)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider)
);

-- Turn on Row Level Security
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- 1. Full Access to Backend Service Role
CREATE POLICY "Service Role Full Access" ON api_keys
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Allow Owners/Super Admins to Manage Keys
CREATE POLICY "Owner Manage Keys" ON api_keys
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_owner = true OR users.role = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_owner = true OR users.role = 'super_admin')
    )
  );

-- Create updated_at trigger for api_keys
CREATE OR REPLACE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
