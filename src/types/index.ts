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

export interface MatchEvent {
  id: string;
  type: 'goal' | 'substitution' | 'card'; // card can be 'yellow' or 'red'
  time: string; // e.g., "45+2'"
  playerName?: string;
  teamId?: string;
  details?: string; // e.g., "Red card for tackle" or "Sub: Player A out, Player B in"
}

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
