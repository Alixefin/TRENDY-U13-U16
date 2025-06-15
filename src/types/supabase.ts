// This file will be used for Supabase generated types.
// You can generate these types from your Supabase dashboard or using the Supabase CLI.
// For example, npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
// The content below is a more detailed placeholder based on the provided SQL schema.
// **ALWAYS run the CLI command after applying schema changes to get the most accurate types.**

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MatchStatusEnum = "scheduled" | "live" | "completed";

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string // uuid
          created_at: string // timestamptz
          name: string // text
          coach_name: string | null // text
          logo_url: string | null // text
        }
        Insert: {
          id?: string // uuid
          created_at?: string // timestamptz
          name: string // text
          coach_name?: string | null // text
          logo_url?: string | null // text
        }
        Update: {
          id?: string // uuid
          created_at?: string // timestamptz
          name?: string // text
          coach_name?: string | null // text
          logo_url?: string | null // text
        }
      }
      players: {
        Row: {
          id: string // uuid
          created_at: string // timestamptz
          name: string // text
          shirt_number: number // int2
          team_id: string // uuid
        }
        Insert: {
          id?: string // uuid
          created_at?: string // timestamptz
          name: string // text
          shirt_number: number // int2
          team_id: string // uuid
        }
        Update: {
          id?: string // uuid
          created_at?: string // timestamptz
          name?: string // text
          shirt_number?: number // int2
          team_id?: string // uuid
        }
      }
      matches: {
        Row: {
          id: string // uuid
          created_at: string // timestamptz
          team_a_id: string // uuid
          team_b_id: string // uuid
          date_time: string // timestamptz
          venue: string | null // text
          status: MatchStatusEnum // match_status_enum
          score_a: number | null // int2
          score_b: number | null // int2
          events: Json | null // jsonb
          lineup_a_player_ids: string[] | null // uuid[]
          lineup_b_player_ids: string[] | null // uuid[]
        }
        Insert: {
          id?: string // uuid
          created_at?: string // timestamptz
          team_a_id: string // uuid
          team_b_id: string // uuid
          date_time: string // timestamptz
          venue?: string | null // text
          status?: MatchStatusEnum // match_status_enum
          score_a?: number | null // int2
          score_b?: number | null // int2
          events?: Json | null // jsonb
          lineup_a_player_ids?: string[] | null // uuid[]
          lineup_b_player_ids?: string[] | null // uuid[]
        }
        Update: {
          id?: string // uuid
          created_at?: string // timestamptz
          team_a_id?: string // uuid
          team_b_id?: string // uuid
          date_time?: string // timestamptz
          venue?: string | null // text
          status?: MatchStatusEnum // match_status_enum
          score_a?: number | null // int2
          score_b?: number | null // int2
          events?: Json | null // jsonb
          lineup_a_player_ids?: string[] | null // uuid[]
          lineup_b_player_ids?: string[] | null // uuid[]
        }
      }
      groups: {
        Row: {
          id: string // uuid
          created_at: string // timestamptz
          name: string // text (unique)
        }
        Insert: {
          id?: string // uuid
          created_at?: string // timestamptz
          name: string // text
        }
        Update: {
          id?: string // uuid
          created_at?: string // timestamptz
          name?: string // text
        }
      }
      group_teams: {
        Row: {
          id: string // uuid
          group_id: string // uuid
          team_id: string // uuid
          played: number // int2
          won: number // int2
          drawn: number // int2
          lost: number // int2
          goals_for: number // int2
          goals_against: number // int2
          points: number // int2
        }
        Insert: {
          id?: string // uuid
          group_id: string // uuid
          team_id: string // uuid
          played?: number // int2
          won?: number // int2
          drawn?: number // int2
          lost?: number // int2
          goals_for?: number // int2
          goals_against?: number // int2
          points?: number // int2
        }
        Update: {
          id?: string // uuid
          group_id?: string // uuid
          team_id?: string // uuid
          played?: number // int2
          won?: number // int2
          drawn?: number // int2
          lost?: number // int2
          goals_for?: number // int2
          goals_against?: number // int2
          points?: number // int2
        }
      }
      tournament_settings: {
        Row: {
          id: number // int2, primary key, default 1
          name: string // text
          about: string | null // text
          logo_url: string | null // text
          knockout_image_url: string | null // text
          updated_at: string // timestamptz
        }
        Insert: {
          id: 1 // Must be 1
          name?: string // text
          about?: string | null // text
          logo_url?: string | null // text
          knockout_image_url?: string | null // text
          updated_at?: string // timestamptz
        }
        Update: {
          id?: 1
          name?: string // text
          about?: string | null // text
          logo_url?: string | null // text
          knockout_image_url?: string | null // text
          updated_at?: string // timestamptz
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      moddatetime_on_settings_update: {
        Args: {}
        Returns: unknown // trigger type
      }
    }
    Enums: {
      match_status_enum: MatchStatusEnum
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