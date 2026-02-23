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
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          full_name: string | null;
          role: "student" | "moderator" | "ops_admin" | "super_admin";
          avatar_url: string | null;
          status: string | null;
          is_owner: boolean | null;
          settings: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          full_name?: string | null;
          role?: "student" | "moderator" | "ops_admin" | "super_admin";
          avatar_url?: string | null;
          status?: string | null;
          is_owner?: boolean | null;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          full_name?: string | null;
          role?: "student" | "moderator" | "ops_admin" | "super_admin";
          avatar_url?: string | null;
          status?: string | null;
          is_owner?: boolean | null;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          subject: string | null;
          content: string | null;
          is_public: boolean;
          rating: number;
          downloads: number;
          uploaded_by_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          subject?: string | null;
          content?: string | null;
          is_public?: boolean;
          rating?: number;
          downloads?: number;
          uploaded_by_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          subject?: string | null;
          content?: string | null;
          is_public?: boolean;
          rating?: number;
          downloads?: number;
          uploaded_by_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      planner_tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          deadline: string | null;
          priority: "low" | "medium" | "high";
          status: "todo" | "in_progress" | "done";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          deadline?: string | null;
          priority?: "low" | "medium" | "high";
          status?: "todo" | "in_progress" | "done";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          deadline?: string | null;
          priority?: "low" | "medium" | "high";
          status?: "todo" | "in_progress" | "done";
          created_at?: string;
          updated_at?: string;
        };
      };
      community_posts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          image_url: string | null;
          likes_count: number;
          comments_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          image_url?: string | null;
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          image_url?: string | null;
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
        };
      };
      community_likes: {
        Row: {
          post_id: string;
          user_id: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
        };
      };
      doubts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          subject: string | null;
          is_resolved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          subject?: string | null;
          is_resolved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          subject?: string | null;
          is_resolved?: boolean;
          created_at?: string;
        };
      };
      doubt_replies: {
        Row: {
          id: string;
          doubt_id: string;
          user_id: string;
          content: string;
          is_correct_answer: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          doubt_id: string;
          user_id: string;
          content: string;
          is_correct_answer?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          doubt_id?: string;
          user_id?: string;
          content?: string;
          is_correct_answer?: boolean;
          created_at?: string;
        };
      };
      study_rooms: {
        Row: {
          id: string;
          name: string;
          capacity: number;
          description: string | null;
          is_available: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          capacity: number;
          description?: string | null;
          is_available?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          capacity?: number;
          description?: string | null;
          is_available?: boolean;
        };
      };
      room_bookings: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          start_time?: string;
          end_time?: string;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          location: string | null;
          start_time: string;
          end_time: string | null;
          category: string | null;
          image_url: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          location?: string | null;
          start_time: string;
          end_time?: string | null;
          category?: string | null;
          image_url?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          start_time?: string;
          end_time?: string | null;
          category?: string | null;
          image_url?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          description: string;
          status: "open" | "closed";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          description: string;
          status?: "open" | "closed";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          description?: string;
          status?: "open" | "closed";
          created_at?: string;
        };
      };
      system_settings: {
        Row: {
          id: number;
          broadcast: Json | null;
          lockdown: boolean | null;
          maintenance: boolean | null;
        };
        Insert: {
          id?: number;
          broadcast?: Json | null;
          lockdown?: boolean | null;
          maintenance?: boolean | null;
        };
        Update: {
          id?: number;
          broadcast?: Json | null;
          lockdown?: boolean | null;
          maintenance?: boolean | null;
        };
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          topic: string | null;
          host_id: string | null;
          participants: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          topic?: string | null;
          host_id?: string | null;
          participants?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          topic?: string | null;
          host_id?: string | null;
          participants?: number;
          created_at?: string;
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
      audit_logs: {
        Row: {
          id: string;
          actor_id: string;
          actor_email: string | null;
          role: string | null;
          action: string;
          target_id: string | null;
          details: Json | null;
          blocked: boolean;
          timestamp: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          actor_email?: string | null;
          role?: string | null;
          action: string;
          target_id?: string | null;
          details?: Json | null;
          blocked?: boolean;
          timestamp?: string;
        };
        Update: {
          id?: string;
          actor_id?: string;
          actor_email?: string | null;
          role?: string | null;
          action?: string;
          target_id?: string | null;
          details?: Json | null;
          blocked?: boolean;
          timestamp?: string;
        };
      };
      login_history: {
        Row: {
          id: string;
          user_id: string | null;
          user_email: string | null;
          user_name: string | null;
          event_type: string;
          user_agent: string | null;
          timestamp: string;
          session_id: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_email?: string | null;
          user_name?: string | null;
          event_type: string;
          user_agent?: string | null;
          timestamp?: string;
          session_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          user_email?: string | null;
          user_name?: string | null;
          event_type?: string;
          user_agent?: string | null;
          timestamp?: string;
          session_id?: string | null;
        };
      };
      forum_questions: {
        Row: {
          id: string;
          question: string;
          subject: string;
          author_id: string | null;
          author_name: string;
          answers_count: number;
          votes: number;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          subject: string;
          author_id?: string | null;
          author_name: string;
          answers_count?: number;
          votes?: number;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          subject?: string;
          author_id?: string | null;
          author_name?: string;
          answers_count?: number;
          votes?: number;
          timestamp?: string;
          created_at?: string;
        };
      };
      system_config: {
        Row: {
          id: string;
          key_name: string;
          key_value: string;
          last_updated_by: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          key_name: string;
          key_value: string;
          last_updated_by?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          key_name?: string;
          key_value?: string;
          last_updated_by?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      api_keys: {
        Row: {
          id: string;
          provider: string;
          api_key: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          api_key: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          api_key?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
    Functions: {
      book_study_room: {
        Args: {
          request_room_id: string;
          request_start: string;
          request_end: string;
        };
        Returns: Json;
      };
      increment_votes: {
        Args: {
          question_id: string;
        };
        Returns: void;
      };
    };
    Views: {
      student_stats: {
        Row: {
          user_id: string;
          pending_tasks: number;
          total_notes: number;
          open_doubts: number;
        };
      };
    };
  };
}
