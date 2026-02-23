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
          role: "student" | "ops_admin" | "super_admin";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          role?: "student" | "ops_admin" | "super_admin";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          role?: "student" | "ops_admin" | "super_admin";
          avatar_url?: string | null;
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
