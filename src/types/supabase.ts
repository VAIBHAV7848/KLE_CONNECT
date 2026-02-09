export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          role: "user" | "ops_admin" | "super_admin";
          status: "Active" | "Suspended";
          is_owner: boolean;
          last_seen: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          role?: "user" | "ops_admin" | "super_admin";
          status?: "Active" | "Suspended";
          is_owner?: boolean;
          last_seen?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          role?: "user" | "ops_admin" | "super_admin";
          status?: "Active" | "Suspended";
          is_owner?: boolean;
          last_seen?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      chats: {
        Row: {
          id: string;
          channel_id: string;
          sender_id: string | null;
          sender_name: string;
          text: string;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          channel_id: string;
          sender_id?: string | null;
          sender_name: string;
          text: string;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          sender_id?: string | null;
          sender_name?: string;
          text?: string;
          timestamp?: string;
          created_at?: string;
        };
      };
      forum_questions: {
        Row: {
          id: string;
          question: string;
          author_id: string | null;
          author_name: string;
          subject: string;
          answers_count: number;
          votes: number;
          timestamp: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          author_id?: string | null;
          author_name: string;
          subject: string;
          answers_count?: number;
          votes?: number;
          timestamp?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          author_id?: string | null;
          author_name?: string;
          subject?: string;
          answers_count?: number;
          votes?: number;
          timestamp?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      forum_answers: {
        Row: {
          id: string;
          question_id: string;
          answer: string;
          author_id: string | null;
          author_name: string;
          votes: number;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          answer: string;
          author_id?: string | null;
          author_name: string;
          votes?: number;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          answer?: string;
          author_id?: string | null;
          author_name?: string;
          votes?: number;
          timestamp?: string;
          created_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          title: string;
          subject: string;
          link: string;
          rating: number;
          downloads: number;
          uploaded_by: string | null;
          uploaded_by_name: string;
          uploaded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subject: string;
          link: string;
          rating?: number;
          downloads?: number;
          uploaded_by?: string | null;
          uploaded_by_name: string;
          uploaded_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subject?: string;
          link?: string;
          rating?: number;
          downloads?: number;
          uploaded_by?: string | null;
          uploaded_by_name?: string;
          uploaded_at?: string;
          created_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          host_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          host_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          host_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      room_participants: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          user_name: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          user_name: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          user_name?: string;
          joined_at?: string;
        };
      };
      system_config: {
        Row: {
          id: string;
          key_name: string;
          key_value: string;
          last_updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key_name: string;
          key_value: string;
          last_updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key_name?: string;
          key_value?: string;
          last_updated_by?: string | null;
          updated_at?: string;
        };
      };
      system_settings: {
        Row: {
          id: number;
          lockdown: boolean;
          broadcast: string;
          maintenance: boolean;
          updated_at: string;
        };
        Insert: {
          id?: number;
          lockdown?: boolean;
          broadcast?: string;
          maintenance?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: number;
          lockdown?: boolean;
          broadcast?: string;
          maintenance?: boolean;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          action: string;
          actor_id: string | null;
          details: Json;
          timestamp: string;
        };
        Insert: {
          id?: string;
          action: string;
          actor_id?: string | null;
          details?: Json;
          timestamp?: string;
        };
        Update: {
          id?: string;
          action?: string;
          actor_id?: string | null;
          details?: Json;
          timestamp?: string;
      };
    };
    ai_usage_stats: {
      Row: {
        id: string;
        provider: string;
        user_id: string | null;
        success: boolean;
        response_time_ms: number | null;
        prompt_tokens: number;
        completion_tokens: number;
        error_message: string | null;
        route_status: string | null;
        created_at: string;
      };
      Insert: {
        id?: string;
        provider: string;
        user_id?: string | null;
        success?: boolean;
        response_time_ms?: number | null;
        prompt_tokens?: number;
        completion_tokens?: number;
        error_message?: string | null;
        route_status?: string | null;
        created_at?: string;
      };
      Update: {
        id?: string;
        provider?: string;
        user_id?: string | null;
        success?: boolean;
        response_time_ms?: number | null;
        prompt_tokens?: number;
        completion_tokens?: number;
        error_message?: string | null;
        route_status?: string | null;
        created_at?: string;
      };
    };
    provider_health: {
      Row: {
        id: string;
        provider: string;
        status: "healthy" | "degraded" | "unhealthy";
        response_time_ms: number | null;
        error_message: string | null;
        last_checked: string;
        consecutive_failures: number;
      };
      Insert: {
        id?: string;
        provider: string;
        status?: "healthy" | "degraded" | "unhealthy";
        response_time_ms?: number | null;
        error_message?: string | null;
        last_checked?: string;
        consecutive_failures?: number;
      };
      Update: {
        id?: string;
        provider?: string;
        status?: "healthy" | "degraded" | "unhealthy";
        response_time_ms?: number | null;
        error_message?: string | null;
        last_checked?: string;
        consecutive_failures?: number;
      };
    };
    failover_config: {
      Row: {
        id: string;
        primary_provider: string;
        fallback_order: string[];
        max_failures_before_failover: number;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        primary_provider: string;
        fallback_order: string[];
        max_failures_before_failover?: number;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        primary_provider?: string;
        fallback_order?: string[];
        max_failures_before_failover?: number;
        created_at?: string;
        updated_at?: string;
      };
    };
  };
}

// Type helpers
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Specific table types
export type User = Tables<"users">;
export type Chat = Tables<"chats">;
export type ForumQuestion = Tables<"forum_questions">;
export type ForumAnswer = Tables<"forum_answers">;
export type Note = Tables<"notes">;
export type Room = Tables<"rooms">;
export type RoomParticipant = Tables<"room_participants">;
export type SystemConfig = Tables<"system_config">;
export type SystemSettings = Tables<"system_settings">;
export type AuditLog = Tables<"audit_logs">;
