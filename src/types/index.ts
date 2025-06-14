export interface Player {
  id: string;
  name: string;
  shirtNumber: number;
}

export interface Team {
  id: string;
  name: string;
  logoUrl: string; // URL to team logo placeholder
  coachName: string;
  players: Player[];
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
  teamA: Team;
  teamB: Team;
  dateTime: Date;
  venue: string;
  status: 'scheduled' | 'live' | 'completed';
  lineupA?: Player[]; // Players who started or are on the bench for Team A
  lineupB?: Player[]; // Players who started or are on the bench for Team B
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
  isLive?: boolean; // Indicates if the team is currently playing a match
  liveScore?: string; // e.g., "1-0" if team is playing
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
}
