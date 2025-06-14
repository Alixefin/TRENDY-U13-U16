export interface Player {
  id: string;
  name: string;
  shirtNumber: number;
  team_id?: string; // Optional: if you link players to teams
}

export interface Team {
  id: string; // Will come from Supabase (UUID)
  name: string;
  logoUrl: string;
  coachName: string;
  players: Player[]; // For now, this will be managed locally or fetched separately
  created_at?: string; // From Supabase
}

// Base interface for all match events
export interface MatchEventBase {
  id: string; // Unique ID for the event
  time: string; // e.g., "45+2'"
  teamId?: string; // ID of the team related to the event (e.g., team that scored, or player's team)
  playerId?: string; // ID of the player primarily involved
  playerName?: string; // Name of the player, for display convenience
}

export interface GoalEvent extends MatchEventBase {
  type: 'goal';
  // playerName and teamId will be set
}

export interface CardEvent extends MatchEventBase {
  type: 'card';
  cardType: 'yellow' | 'red';
  details?: string; // Optional: reason for the card
  // playerName and teamId will be set
}

export interface SubstitutionEvent extends MatchEventBase {
  type: 'substitution';
  playerInId?: string;
  playerInName?: string;
  playerOutId?: string;
  playerOutName?: string; // 'playerName' from base could be used for playerOut for simplicity
  // teamId will be set
}

export type MatchEvent = GoalEvent | CardEvent | SubstitutionEvent;

export interface Match {
  id: string;
  teamA: Team; // or teamA_id: string and fetch separately
  teamB: Team; // or teamB_id: string and fetch separately
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
  team: Team; // or team_id: string and fetch separately
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
  teams: GroupTeam[]; // This might become a list of team_ids or a join table
}

export interface TournamentInfo {
  name: string;
  logoUrl: string;
  about: string;
  knockoutImageUrl?: string;
}
