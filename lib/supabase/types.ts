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
      habits: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          is_removable: boolean | null
          created_by_admin: boolean | null
          created_at: string | null
          is_active: boolean
          why_it_matters: string | null
          impact: number
          icon: string | null
          default_freq: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: string | null
          is_removable?: boolean | null
          created_by_admin?: boolean | null
          created_at?: string | null
          is_active?: boolean
          why_it_matters?: string | null
          impact: number
          icon?: string | null
          default_freq: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string | null
          is_removable?: boolean | null
          created_by_admin?: boolean | null
          created_at?: string | null
          is_active?: boolean
          why_it_matters?: string | null
          impact?: number
          icon?: string | null
          default_freq?: string
        }
      }
      user_habits: {
        Row: {
          id: string
          user_id: string | null
          habit_id: string | null
          custom_name: string | null
          frequency: string | null
          started_at: string
          is_active: boolean | null
          source: string | null
          ended_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          habit_id?: string | null
          custom_name?: string | null
          frequency?: string | null
          started_at?: string
          is_active?: boolean | null
          source?: string | null
          ended_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          habit_id?: string | null
          custom_name?: string | null
          frequency?: string | null
          started_at?: string
          is_active?: boolean | null
          source?: string | null
          ended_at?: string | null
        }
      }
      habit_recommendations: {
        Row: {
          criteria: string | null
          reason: string | null
          habit_id: string
          user_id: string
          id: string
          created_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          criteria?: string | null
          reason?: string | null
          habit_id?: string
          user_id?: string
          id?: string
          created_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          criteria?: string | null
          reason?: string | null
          habit_id?: string
          user_id?: string
          id?: string
          created_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 