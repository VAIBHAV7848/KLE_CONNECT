-- ============================================================================
-- ALLOW ADMIN ACCESS TO API KEYS
-- ============================================================================

-- 1. Drop the strict "Service Role Only" policy we just made
DROP POLICY IF EXISTS "Service Role Only" ON api_keys;

-- 2. Allow Service Role (Backend) full access
CREATE POLICY "Service Role Full Access" ON api_keys
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Allow Owners/Super Admins to Manage Keys
CREATE POLICY "Owner Manage Keys" ON api_keys
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (
    -- Allow if user is owner OR super_admin
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_owner = true OR users.role = 'super_admin')
    )
  )
  WITH CHECK (
    -- Allow if user is owner OR super_admin
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_owner = true OR users.role = 'super_admin')
    )
  );

-- 4. Audit Log for Key Access (Optional but good)
-- We won't add strict auditing triggers here to keep it simple, 
-- but the frontend should log actions to audit_logs.
