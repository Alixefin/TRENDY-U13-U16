
// This file will be used for Supabase generated types.
// You can generate these types from your Supabase dashboard or using the Supabase CLI.
// For example, npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
// For now, we'll define a placeholder.

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
        Row: { // The data expected from a SELECT statement
          id: string // Assuming UUID, auto-generated
          created_at: string // Assuming timestamptz, auto-generated
          name: string
          coach_name: string | null
          logo_url: string | null
        }
        Insert: { // The data expected when inserting a new row
          id?: string // id is usually auto-generated
          created_at?: string // created_at is usually auto-generated
          name: string
          coach_name?: string | null
          logo_url?: string | null
        }
        Update: { // The data expected when updating a row
          id?: string
          created_at?: string
          name?: string
          coach_name?: string | null
          logo_url?: string | null
        }
      }
      // Define your other tables (players, matches, groups, tournament_settings) here
      // based on your Supabase schema.
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      // Example:
      // match_status: "scheduled" | "live" | "completed"
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
