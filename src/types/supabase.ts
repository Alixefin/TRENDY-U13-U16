
// This file will be used for Supabase generated types.
// You can generate these types from your Supabase dashboard or using the Supabase CLI.
// For example, npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts

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
      teams: {
        Row: {
          id: string
          created_at: string
          name: string
          coach_name: string | null
          logo_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          coach_name?: string | null
          logo_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          coach_name?: string | null
          logo_url?: string | null
        }
      }
      players: {
        Row: {
          id: string
          created_at: string
          name: string
          shirt_number: number
          team_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          shirt_number: number
          team_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          shirt_number?: number
          team_id?: string
        }
      }
      matches: {
        Row: {
          id: string
          created_at: string
          team_a_id: string
          team_b_id: string
          date_time: string // timestamptz
          venue: string | null
          status: "scheduled" | "live" | "completed" // Consider using an ENUM in Supabase
          score_a: number | null
          score_b: number | null
          events: Json | null // For storing match events array
          lineup_a_player_ids: string[] | null // Array of player UUIDs
          lineup_b_player_ids: string[] | null // Array of player UUIDs
        }
        Insert: {
          id?: string
          created_at?: string
          team_a_id: string
          team_b_id: string
          date_time: string
          venue?: string | null
          status: "scheduled" | "live" | "completed"
          score_a?: number | null
          score_b?: number | null
          events?: Json | null
          lineup_a_player_ids?: string[] | null
          lineup_b_player_ids?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          team_a_id?: string
          team_b_id?: string
          date_time?: string
          venue?: string | null
          status?: "scheduled" | "live" | "completed"
          score_a?: number | null
          score_b?: number | null
          events?: Json | null
          lineup_a_player_ids?: string[] | null
          lineup_b_player_ids?: string[] | null
        }
      }
      groups: {
        Row: {
          id: string
          created_at: string
          name: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
        }
      }
      group_teams: { // Junction table for group standings
        Row: {
          id: string
          group_id: string
          team_id: string
          played: number
          won: number
          drawn: number
          lost: number
          goals_for: number
          goals_against: number
          points: number
          // goal_difference can be a generated column in Supabase or calculated in app
        }
        Insert: {
          id?: string
          group_id: string
          team_id: string
          played?: number
          won?: number
          drawn?: number
          lost?: number
          goals_for?: number
          goals_against?: number
          points?: number
        }
        Update: {
          id?: string
          group_id?: string
          team_id?: string
          played?: number
          won?: number
          drawn?: number
          lost?: number
          goals_for?: number
          goals_against?: number
          points?: number
        }
      }
      tournament_settings: {
        Row: {
          id: number // Using a fixed ID like 1 for a single settings row
          name: string
          about: string | null
          logo_url: string | null
          knockout_image_url: string | null
          updated_at: string
        }
        Insert: {
          id: number // Must provide the fixed ID on insert
          name: string
          about?: string | null
          logo_url?: string | null
          knockout_image_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          about?: string | null
          logo_url?: string | null
          knockout_image_url?: string | null
          updated_at?: string
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
      match_status_enum: "scheduled" | "live" | "completed" // Example if you create an ENUM
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper type for global Supabase client instance
declare global {
  var supabaseClientInstance: import('@supabase/supabase-js').SupabaseClient<Database>;
}

    