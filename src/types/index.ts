
export interface Player {
  id: string; 
  name: string;
  shirt_number: number;
  team_id: string; 
  created_at?: string;
}

export interface Team {
  id: string; 
  name: string;
  logoUrl: string;
  coachName: string;
  players: Player[]; 
  created_at?: string; 
}

export interface MatchEventBase {
  id: string; // Should be unique for the event, can be client-generated for new events before saving
  time: string; 
  teamId?: string; 
  playerId?: string; 
  playerName?: string; 
}

export interface GoalEvent extends MatchEventBase {
  type: 'goal';
}

export interface CardEvent extends MatchEventBase {
  type: 'card';
  cardType: 'yellow' | 'red';
  details?: string; 
}

export interface SubstitutionEvent extends MatchEventBase {
  type: 'substitution';
  playerInId?: string;
  playerInName?: string;
  playerOutId?: string;
  playerOutName?: string; 
}

export type MatchEvent = GoalEvent | CardEvent | SubstitutionEvent;

// Represents a match object primarily for client-side use, with populated team objects
export interface Match {
  id: string; // from Supabase matches.id
  teamA: Team; 
  teamB: Team; 
  dateTime: Date; // from Supabase matches.date_time
  venue: string; // from Supabase matches.venue
  status: 'scheduled' | 'live' | 'completed'; // from Supabase matches.status
  scoreA?: number; // from Supabase matches.score_a
  scoreB?: number; // from Supabase matches.score_b
  events?: MatchEvent[]; // from Supabase matches.events (JSONB)
  lineupA?: Player[]; // To be populated client-side if using matches.lineup_a_player_ids
  lineupB?: Player[]; // To be populated client-side if using matches.lineup_b_player_ids
}

// Represents the raw match data structure from Supabase, before populating team objects
export interface SupabaseMatch {
    id: string;
    team_a_id: string;
    team_b_id: string;
    date_time: string; // ISO string from Supabase
    venue: string | null;
    status: 'scheduled' | 'live' | 'completed';
    score_a: number | null;
    score_b: number | null;
    events: unknown | null; // JSONB comes as unknown, needs casting
    lineup_a_player_ids: string[] | null;
    lineup_b_player_ids: string[] | null;
    created_at?: string;
}


export interface GroupTeam {
  team: Team; 
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  isLive?: boolean; // Client-side state, not directly from DB
  liveScore?: string; // Client-side state
}

export interface Group {
  id: string; // from Supabase groups.id
  name: string; // from Supabase groups.name
  teams: GroupTeam[]; // Populated client-side using group_teams table data
}

export interface TournamentInfo {
  name: string;
  logoUrl: string;
  about: string;
  knockoutImageUrl?: string;
}

    