# 🚀 KLE Connect — New Supabase Migration Implementation Plan

> **Generated:** 2026-02-21  
> **Objective:** Replace old Supabase project with new one and ensure full live real-time sync across all features.

---

## 📊 Project Analysis Summary

Before diving into the plan, here is what was found in the codebase:

| Area | Details |
|---|---|
| **Framework** | Vite + React 18 + TypeScript |
| **Supabase SDK** | `@supabase/supabase-js` v2.95.3 |
| **Old Project URL** | `https://vwhhxdkxwgonzhpruymh.supabase.co` |
| **New Project URL** | `https://thrshfigvpafopddosto.supabase.co` |
| **Supabase client** | `src/lib/supabase.ts` (single source of truth) |
| **Auth system** | `src/hooks/useAuth.tsx` (515 lines, full auth flow) |
| **Realtime used in** | `useChat`, `useForum`, `useNotes`, `useAuth`, `roomSync`, `Admin.tsx` |
| **Database tables** | `users`, `chats`, `forum_questions`, `forum_answers`, `notes`, `rooms`, `room_participants`, `system_config`, `system_settings`, `audit_logs`, `ai_usage_stats` |
| **Key migrations** | 8 SQL migration files in `supabase/migrations/` |
| **Schema file** | `supabase/schema.sql` (302 lines) — the master schema |
| **Realtime publication** | `supabase_realtime` covering: chats, forum_questions, forum_answers, notes, rooms, room_participants, system_settings |
| **Auth methods** | Email/Password, Google OAuth, Phone OTP, Anonymous (Guest) |
| **Login history** | Currently via `audit_logs` table — needs enhancement |

---

## 🔑 New Supabase Credentials

| Key | Value |
|---|---|
| **Project URL** | `https://thrshfigvpafopddosto.supabase.co` |
| **Publishable (Anon) Key** | `<SUPABASE_KEY_HIDDEN>` |
| **Secret Key** | `[REDACTED — stored in .env only, never commit]` |

> ⚠️ **Security Note:** The Secret Key must NEVER be exposed in frontend code or Git. Store it only in `.env` (which is gitignored) or Vercel environment variables.

---

## 📋 Implementation Plan — Phase by Phase

---

### ✅ PHASE 1: Environment Variable Update
**Goal:** Point the app to the new Supabase project.

**Files to change:**
- `.env` (your local active env file)
- `.env.example` (update template)
- `VERCEL_ENV_SETUP.md` (update deployment docs)

**Actions:**
1. Open `.env` file (or create one from `.env.example`)
2. Replace old values:
   ```
   VITE_SUPABASE_URL=https://thrshfigvpafopddosto.supabase.co
   VITE_SUPABASE_ANON_KEY=<SUPABASE_KEY_HIDDEN>
   ```
3. Remove old leftover vars: `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY` (these are from backup, not used)
4. Update `.env.example` comments to reflect new key names clearly
5. **Do NOT commit** `.env` — it's already in `.gitignore` ✅

**Verification:** After saving, restart the dev server. The `supabase.ts` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — it will automatically point to the new project.

---

### ✅ PHASE 2: Full Database Schema Setup on New Project
**Goal:** Recreate all tables, functions, triggers, RLS policies, and Realtime publications in the new Supabase project.

**The new project starts empty. Everything must be applied via the Supabase Dashboard → SQL Editor.**

**Step 2.1 — Run Master Schema SQL**
- File: `supabase/schema.sql`
- This is a "drop & recreate all" script. Run it first.
- It creates: `users`, `chats`, `forum_questions`, `forum_answers`, `notes`, `rooms`, `room_participants`, `system_config`, `system_settings`, `audit_logs`
- It also creates: `handle_new_user` trigger, `update_updated_at_column` triggers, RLS policies, and the `supabase_realtime` publication

**Step 2.2 — Run Additional Migration Files (in order)**
Execute each file in `supabase/migrations/` in chronological order:

| Order | File | Purpose |
|---|---|---|
| 1 | `20250209000000_ai_usage_analytics.sql` | Creates `ai_usage_stats` table for AI feature tracking |
| 2 | `20250209000001_health_checks.sql` | Health check infrastructure |
| 3 | `20250209000002_failover_function.sql` | Failover/recovery function |
| 4 | `20251222145628_02c6a2e7-b8f0-4709-a002-974169218de6.sql` | Creates `profiles` table + trigger |
| 5 | `20251229094500_thinklm.sql` | ThinkLM feature setup |
| 6 | `allow_admin_keys.sql` | Admin-specific key policies |
| 7 | `allow_anonymous_users.sql` | Anonymous/Guest user policies |
| 8 | `fix_guest_login.sql` | Guest login fix (allow NULL email) |

> ⚠️ **Important:** Run them in the exact order above. Some depend on tables from the master schema.

**Step 2.3 — Verify via SQL Editor**
Run this to confirm all tables exist:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
```

---

### ✅ PHASE 3: Enable Realtime on New Project
**Goal:** Enable live sync for all critical tables.

**The `supabase_realtime` publication is already created in `schema.sql`, but Supabase Realtime must also be enabled from the Dashboard.**

**Steps (in Supabase Dashboard → Database → Replication):**
1. Enable Realtime for these tables by toggling them ON:
   - `chats` ← (Live chat messages)
   - `forum_questions` ← (Q&A live updates)
   - `forum_answers` ← (Answer live updates)
   - `notes` ← (Shared notes)
   - `rooms` ← (Study rooms live)
   - `room_participants` ← (Who's in which room)
   - `system_settings` ← (Admin broadcast, lockdown)
   - `users` ← (User profile changes, role updates) ⭐ **NEW — currently missing from publication!**
   - `audit_logs` ← (Admin activity feed)

> ⚠️ **Gap Found:** The current `schema.sql` does NOT include `users` and `audit_logs` in the Realtime publication. This means admin dashboards don't get live user updates correctly. This must be fixed in the new project.

**Fix to add in SQL Editor (after running schema.sql):**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_usage_stats;
```

---

### ✅ PHASE 4: Login History (User Session Tracking) — Live Sync Enhancement
**Goal:** Track every login event with full details and sync it live to the Admin panel.

**Current state:** The `audit_logs` table exists and is used for admin actions, but login/logout events are NOT being recorded automatically.

**Step 4.1 — Create a `login_history` table (recommended approach)**

Add this new table to the new Supabase project via SQL Editor:
```sql
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'GUEST_LOGIN', 'GOOGLE_LOGIN', 'PHONE_LOGIN')),
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT
);

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for login_history" ON login_history FOR ALL USING (true) WITH CHECK (true);

-- Add to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE login_history;

-- Index for fast queries
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_timestamp ON login_history(timestamp DESC);
CREATE INDEX idx_login_history_event_type ON login_history(event_type);
```

**Step 4.2 — Auto-capture via Database Trigger (Server-side)**

Create a PostgreSQL function that auto-logs auth events:
```sql
CREATE OR REPLACE FUNCTION public.log_auth_event()
RETURNS TRIGGER AS $$
BEGIN
  -- This fires when auth.sessions are created/modified
  INSERT INTO public.login_history (user_id, user_email, event_type, timestamp)
  SELECT 
    NEW.user_id,
    au.email,
    'SIGNED_IN',
    NOW()
  FROM auth.users au 
  WHERE au.id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

> Note: Direct triggers on `auth.sessions` require careful Supabase SECURITY DEFINER setup. The simpler and more reliable approach is client-side logging (Step 4.3).

**Step 4.3 — Client-Side Login Logging in `useAuth.tsx`**

In `src/hooks/useAuth.tsx`, inside the `onAuthStateChange` listener, add login history inserts when events fire:

- On `SIGNED_IN` → insert row into `login_history` with `event_type = 'SIGNED_IN'`
- On `SIGNED_OUT` → insert row into `login_history` with `event_type = 'SIGNED_OUT'`
- Capture: `user.email`, `user.id`, `navigator.userAgent`, timestamp

**Step 4.4 — Live Sync in Admin Panel**

The `Admin.tsx` already subscribes to `audit_logs` changes. We extend it to also subscribe to `login_history` changes using `supabase.channel('login_history_changes')` with `postgres_changes` on `event: 'INSERT'`.

A new "Login History" tab or section will appear in the Admin panel's overview, showing:
- Who logged in/out
- When (timestamp)
- What method (email, Google, phone, guest)

---

### ✅ PHASE 5: Google OAuth Redirect URL Update
**Goal:** Ensure Google Sign-In works with the new Supabase project.

**In the new Supabase Dashboard → Authentication → URL Configuration:**
1. Set **Site URL** to your app URL (e.g., `https://kleconnect.vercel.app` or `http://localhost:8080`)
2. Add **Redirect URLs**:
   - `http://localhost:8080`
   - `http://localhost:5173`
   - Your production URL (e.g., `https://kleconnect.vercel.app`)

**In Google Cloud Console:**
- Keep the same OAuth 2.0 Client ID/Secret (reuse from old project OR create new)
- Add the new Supabase callback URL: `https://thrshfigvpafopddosto.supabase.co/auth/v1/callback`
- Configure this in Supabase Dashboard → Authentication → Providers → Google

---

### ✅ PHASE 6: Vercel / Production Deployment Update
**Goal:** Update environment variables on Vercel so production also uses the new Supabase.

**Steps:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Update:
   - `VITE_SUPABASE_URL` → `https://thrshfigvpafopddosto.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` → `<SUPABASE_KEY_HIDDEN>`
3. Redeploy (trigger a new deployment)

**File to update:** `VERCEL_ENV_SETUP.md` — update example values to match new credentials (without the actual secret key).

---

### ✅ PHASE 7: Supabase CLI Config Update (Optional but Recommended)
**Goal:** Update local Supabase CLI config so `supabase` commands link to the new project.

**File:** `supabase/config.toml`

Update `project_id` from old project ID to the new one: `thrshfigvpafopddosto`

```toml
project_id = "thrshfigvpafopddosto"
```

This ensures `supabase db push`, `supabase functions deploy`, etc. target the new project.

---

### ✅ PHASE 8: Audit & Schema Fixes for Better Live Sync
**Goal:** Fix gaps in the existing schema for robust real-time behavior.

**8.1 — Fix `audit_logs` schema**

The current `audit_logs` table is missing columns that `Admin.tsx` writes to:
- `actor_email` (TEXT)
- `role` (TEXT)
- `target_id` (TEXT)
- `blocked` (BOOLEAN)

Add via SQL:
```sql
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_email TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS target_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false;
```

**8.2 — Fix `rooms` table**

The `rooms` table is missing a `topic` and `participants` column that `Admin.tsx` and `roomSync.ts` read:
```sql
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT 'General';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS participants INTEGER DEFAULT 0;
```

**8.3 — Fix `system_settings` schema**

The current `broadcast` column is TEXT, but `Admin.tsx` stores a full JSON object (`BroadcastData`) in it. Change it to JSONB:
```sql
ALTER TABLE system_settings ALTER COLUMN broadcast TYPE JSONB USING broadcast::jsonb;
```

---

## 📁 Files That Need Changes (Summary)

| File | Change Required |
|---|---|
| `.env` | Update `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |
| `.env.example` | Update template with new URL format |
| `supabase/config.toml` | Update `project_id` to `thrshfigvpafopddosto` |
| `supabase/schema.sql` | Add `users`, `audit_logs`, `ai_usage_stats` to realtime publication |
| `src/hooks/useAuth.tsx` | Add login history insert on `SIGNED_IN` / `SIGNED_OUT` events |
| `src/pages/Admin.tsx` | Add `login_history` realtime subscription + display section |
| `VERCEL_ENV_SETUP.md` | Update env var example values |

**No changes needed to:**
- `src/lib/supabase.ts` — Already correctly reads from env vars ✅
- `src/hooks/useChat.tsx` — Realtime already works correctly ✅
- `src/hooks/useForum.tsx` — Realtime already works correctly ✅
- `src/hooks/useNotes.tsx` — Realtime already works correctly ✅
- `src/lib/roomSync.ts` — Already works correctly ✅
- `package.json` — Supabase JS SDK version is fine ✅

---

## 🔄 Execution Order (Step-by-Step Checklist)

```
[ ] 1. Update .env with new Supabase URL + Anon Key
[ ] 2. In new Supabase Dashboard → SQL Editor → Run schema.sql
[ ] 3. Run all 8 migration files in order
[ ] 4. Run schema fixes (audit_logs columns, rooms columns, broadcast JSONB)
[ ] 5. Run SQL to enable Realtime on users, audit_logs, login_history
[ ] 6. Create login_history table SQL
[ ] 7. Enable Realtime toggles in Supabase Dashboard → Database → Replication
[ ] 8. Configure Google OAuth redirect URLs in Supabase + Google Console
[ ] 9. Update supabase/config.toml project_id
[ ] 10. Update src/hooks/useAuth.tsx → add login history tracking
[ ] 11. Update src/pages/Admin.tsx → add login history display with live subscription
[ ] 12. Update Vercel env vars → redeploy
[ ] 13. Test: Sign up a new user → verify new entry in users table
[ ] 14. Test: Send a chat → verify realtime update without page refresh
[ ] 15. Test: Admin panel → verify users list + login history update live
```

---

## ⚡ Live Sync Coverage (After Migration)

| Feature | Live Sync Method | Status After Migration |
|---|---|---|
| Chat messages | `postgres_changes` INSERT on `chats` | ✅ Live |
| Forum questions | `postgres_changes` ALL on `forum_questions` | ✅ Live |
| Notes shared | `postgres_changes` ALL on `notes` | ✅ Live |
| Study rooms | `postgres_changes` ALL on `rooms` | ✅ Live |
| Room participants | `postgres_changes` ALL on `room_participants` | ✅ Live |
| Admin broadcast | `postgres_changes` ALL on `system_settings` | ✅ Live |
| Lockdown state | `postgres_changes` ALL on `system_settings` | ✅ Live |
| User roles/status | `postgres_changes` ALL on `users` | ✅ Live (after fix) |
| Audit logs | `postgres_changes` ALL on `audit_logs` | ✅ Live (after fix) |
| **Login history** | `postgres_changes` INSERT on `login_history` | ✅ **NEW — Live** |

---

*This plan requires zero changes to the core Supabase client logic, routing, or component structure. All changes are purely credential/schema/tracking additions.*
