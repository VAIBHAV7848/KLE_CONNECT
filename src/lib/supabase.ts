import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file.\n" +
    "Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  );
}

// Create Supabase client pointing to new project
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Export commonly used auth and database helpers
export const auth = supabase.auth;
export const db = supabase;

// Realtime payload type
interface RealtimePayload<T = unknown> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  errors: string[];
}

// Realtime subscription helper
export const subscribeToTable = <T = unknown>(
  table: string,
  callback: (payload: RealtimePayload<T>) => void,
  filter?: { column: string; value: string }
) => {
  const channel = supabase
    .channel(`${table}_changes_${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: table,
        ...(filter && { filter: `${filter.column}=eq.${filter.value}` }),
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

// Helper to get current user
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper to get current session
export const getCurrentSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Helper to log login/logout events to login_history table
export const logLoginEvent = async (
  userId: string | null,
  userEmail: string | null,
  userName: string | null,
  eventType: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'GUEST_LOGIN' | 'GOOGLE_LOGIN' | 'PHONE_LOGIN' | 'EMAIL_LOGIN',
  sessionId?: string
) => {
  try {
    await supabase.from('login_history').insert({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      event_type: eventType,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      session_id: sessionId || null,
    });
  } catch (err) {
    // Non-blocking — login history failure should not affect app functionality
    console.warn('[LoginHistory] Could not log event:', err);
  }
};
