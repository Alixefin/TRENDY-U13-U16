
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      matches: {
        Row: {
          id: string
          created_at: string
          team_a_id: string
          team_b_id: string
          date_time: string
          venue: string | null
          status: MatchStatusEnum
          score_a: number | null
          score_b: number | null
          events: Json | null
          lineup_a_player_ids: string[] | null
          lineup_b_player_ids: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          team_a_id: string
          team_b_id: string
          date_time: string
          venue?: string | null
          status?: MatchStatusEnum
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
          status?: MatchStatusEnum
          score_a?: number | null
          score_b?: number | null
          events?: Json | null
          lineup_a_player_ids?: string[] | null
          lineup_b_player_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
      }
      group_teams: {
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
        Relationships: [
          {
            foreignKeyName: "group_teams_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      tournament_settings: {
        Row: {
          id: number
          name: string
          about: string | null
          logo_url: string | null
          knockout_image_url: string | null
          updated_at: string
        }
        Insert: {
          id: 1
          name?: string
          about?: string | null
          logo_url?: string | null
          knockout_image_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: 1
          name?: string
          about?: string | null
          logo_url?: string | null
          knockout_image_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      moddatetime_on_settings_update: {
        Args: Record<string, unknown>
        Returns: unknown // Typically 'trigger' but simplified here
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
