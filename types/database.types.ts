// Auto-generated types for Supabase schema
// Generate with: npx supabase gen types typescript --local > types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string
          position_x: number
          position_y: number
          is_admin: boolean
          last_active_at: string
          created_at: string
        }
        Insert: {
          id: string
          nickname: string
          position_x?: number
          position_y?: number
          is_admin?: boolean
          last_active_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          nickname?: string
          position_x?: number
          position_y?: number
          is_admin?: boolean
          last_active_at?: string
          created_at?: string
        }
      }
      thoughts: {
        Row: {
          id: string
          user_id: string
          content: string
          position_x: number
          position_y: number
          created_at: string
          is_hidden: boolean
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          position_x: number
          position_y: number
          created_at?: string
          is_hidden?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          position_x?: number
          position_y?: number
          created_at?: string
          is_hidden?: boolean
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          thought_id: string
          parent_comment_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          thought_id: string
          parent_comment_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          thought_id?: string
          parent_comment_id?: string | null
          content?: string
          created_at?: string
        }
      }
      comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          created_at?: string
        }
      }
      open_chat: {
        Row: {
          id: string
          user_id: string
          nickname: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nickname: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nickname?: string
          message?: string
          created_at?: string
        }
      }
      private_chats: {
        Row: {
          id: string
          user_1_id: string
          user_2_id: string
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_1_id: string
          user_2_id: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_1_id?: string
          user_2_id?: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
      }
      private_messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          message: string
          created_at: string
          is_read: boolean
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          message: string
          created_at?: string
          is_read?: boolean
        }
        Update: {
          id?: string
          chat_id?: string
          sender_id?: string
          message?: string
          created_at?: string
          is_read?: boolean
        }
      }
      admin_actions: {
        Row: {
          id: string
          admin_id: string
          action_type: 'delete_user' | 'delete_thought' | 'delete_comment' | 'delete_chat_message' | 'manual_reset' | 'promote_admin'
          target_id: string | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action_type: 'delete_user' | 'delete_thought' | 'delete_comment' | 'delete_chat_message' | 'manual_reset' | 'promote_admin'
          target_id?: string | null
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action_type?: 'delete_user' | 'delete_thought' | 'delete_comment' | 'delete_chat_message' | 'manual_reset' | 'promote_admin'
          target_id?: string | null
          reason?: string | null
          created_at?: string
        }
      }
      spam_reports: {
        Row: {
          id: string
          reporter_id: string
          thought_id: string | null
          comment_id: string | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          thought_id?: string | null
          comment_id?: string | null
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          thought_id?: string | null
          comment_id?: string | null
          reason?: string | null
          created_at?: string
        }
      }
      world_state: {
        Row: {
          id: number
          next_reset_at: string
          last_reset_at: string | null
          reset_count: number
        }
        Insert: {
          id?: number
          next_reset_at: string
          last_reset_at?: string | null
          reset_count?: number
        }
        Update: {
          id?: number
          next_reset_at?: string
          last_reset_at?: string | null
          reset_count?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reset_world: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
    }
    Enums: {
      chat_status: 'pending' | 'accepted' | 'declined'
      admin_action_type: 'delete_user' | 'delete_thought' | 'delete_comment' | 'delete_chat_message' | 'manual_reset' | 'promote_admin'
    }
  }
}
