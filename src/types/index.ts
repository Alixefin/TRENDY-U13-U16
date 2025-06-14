
export interface Player {
  id: string; // Will come from Supabase
  name: string;
  shirt_number: number; // Renamed from shirtNumber for consistency with DB
  team_id: string; // Foreign key to teams table
  created_at?: string;
}

export interface Team {
  id: string; 
  name: string;
  logoUrl: string;
  coachName: string;
  players: Player[]; // This will store players fetched for the team
  created_at?: string; 
}

// Base interface for all match events
export interface MatchEventBase {
  id: string; 
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

export interface Match {
  id: string;
  teamA: Team; 
  teamB: Team; 
  dateTime: Date;
  venue: string;
  status: 'scheduled' | 'live' | 'completed';
  lineupA?: Player[];
  lineupB?: Player[];
  scoreA?: number;
  scoreB?: number;
  events?: MatchEvent[];
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
  isLive?: boolean;
  liveScore?: string;
}

export interface Group {
  id: string;
  name: string;
  teams: GroupTeam[]; 
}

export interface TournamentInfo {
  name: string;
  logoUrl: string;
  about: string;
  knockoutImageUrl?: string;
}
