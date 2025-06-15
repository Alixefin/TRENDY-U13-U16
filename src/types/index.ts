
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
  id: string; 
  time: string; // e.g., "45", "45+2", "90"
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
  playerInId: string; // Changed from optional
  playerInName: string; // Changed from optional
  playerOutId: string; // Changed from optional
  playerOutName: string; // Changed from optional
}

export type MatchEvent = GoalEvent | CardEvent | SubstitutionEvent;

export interface Match {
  id: string; 
  teamA: Team; 
  teamB: Team; 
  dateTime: Date; 
  venue: string; 
  status: 'scheduled' | 'live' | 'completed' | 'halftime'; 
  scoreA?: number; 
  scoreB?: number; 
  events?: MatchEvent[]; 
  lineupA?: Player[]; 
  lineupB?: Player[];
  duration?: number; // Match duration in minutes
  playerOfTheMatchId?: string; // ID of the player of the match
  playerOfTheMatch?: Player; // Optional: full player object if fetched
}

export interface SupabaseMatch {
    id: string;
    team_a_id: string;
    team_b_id: string;
    date_time: string; 
    venue: string | null;
    status: 'scheduled' | 'live' | 'completed' | 'halftime';
    score_a: number | null;
    score_b: number | null;
    events: unknown | null; 
    lineup_a_player_ids: string[] | null;
    lineup_b_player_ids: string[] | null;
    created_at?: string;
    duration?: number | null;
    player_of_the_match_id?: string | null;
}


export interface GroupTeam {
  id?: string; 
  team: Team; 
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  isLive?: boolean; 
  liveScore?: string; 
}

export interface Group {
  id: string; 
  name: string; 
  teams: GroupTeam[]; 
  created_at?: string;
}

export interface TournamentInfo {
  id?: number; 
  name: string;
  about: string | null;
  logoUrl: string | null;
  knockoutImageUrl?: string | null;
  updated_at?: string;
}
    
