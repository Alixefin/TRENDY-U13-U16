
import type { Team, Match, Group, TournamentInfo, Player, GoalEvent, CardEvent } from '@/types';

export const placeholderTeamLogo = (name: string) => `https://placehold.co/128x128/FFFFFF/50C878.png?text=${name.substring(0,2).toUpperCase()}&font=poppins`;

const createPlayer = (id: string, name: string, shirtNumber: number, team_id: string): Player => ({ id, name, shirt_number: shirtNumber, team_id });

// Mock teams for user-facing components - Admin panel fetches from Supabase.
export const exampleTeamsForUserDisplay: Team[] = [
  {
    id: 'user-team1',
    name: 'Green Lions (User)',
    logoUrl: placeholderTeamLogo('GL'),
    coachName: 'Coach Arthur',
    players: [
      createPlayer('user-p1', 'Leo Green', 10, 'user-team1'),
      createPlayer('user-p2', 'Sam Stripes', 7, 'user-team1'),
    ],
  },
  {
    id: 'user-team2',
    name: 'Blue Eagles (User)',
    logoUrl: placeholderTeamLogo('BE'),
    coachName: 'Coach Bella',
    players: [
      createPlayer('user-p6', 'Eva Blue', 10, 'user-team2'),
    ],
  },
   {
    id: 'user-team3',
    name: 'Red Dragons (User)',
    logoUrl: placeholderTeamLogo('RD'),
    coachName: 'Coach Drake',
    players: [createPlayer('user-p11', 'Ruby Fire', 9, 'user-team3')],
  },
  {
    id: 'user-team4',
    name: 'Yellow Hornets (User)',
    logoUrl: placeholderTeamLogo('YH'),
    coachName: 'Coach Stinger',
    players: [createPlayer('user-p16', 'Buzz Gold', 10, 'user-team4')],
  },
];


const now = new Date();

// Mock matches for user-facing components. Admin panel fetches from Supabase.
export const mockMatches: Match[] = [
  {
    id: 'match1-user',
    teamA: exampleTeamsForUserDisplay[0],
    teamB: exampleTeamsForUserDisplay[1],
    dateTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    venue: 'Stadium Alpha (User)',
    status: 'scheduled',
    events: [],
  },
  {
    id: 'match2-user',
    teamA: exampleTeamsForUserDisplay[2],
    teamB: exampleTeamsForUserDisplay[3],
    dateTime: new Date(now.getTime() - 15 * 60 * 1000),
    venue: 'Stadium Beta (User)',
    status: 'live',
    scoreA: 1,
    scoreB: 0,
    lineupA: exampleTeamsForUserDisplay[2].players.slice(0, 5),
    lineupB: exampleTeamsForUserDisplay[3].players.slice(0, 5),
    events: [
      { id: 'e1-user', type: 'goal', time: "10'", playerName: 'Ruby Fire', playerId: 'user-p11', teamId: 'user-team3' } as GoalEvent,
    ],
  },
  {
    id: 'match3-user',
    teamA: exampleTeamsForUserDisplay[0],
    teamB: exampleTeamsForUserDisplay[2],
    dateTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    venue: 'Stadium Gamma (User)',
    status: 'completed',
    scoreA: 2,
    scoreB: 1,
    lineupA: exampleTeamsForUserDisplay[0].players.slice(0, 5),
    lineupB: exampleTeamsForUserDisplay[2].players.slice(0, 5),
    events: [
      { id: 'e2-user', type: 'goal', time: "25'", playerName: 'Leo Green', playerId: 'user-p1', teamId: 'user-team1' } as GoalEvent,
      { id: 'e3-user', type: 'goal', time: "55'", playerName: 'Ruby Fire', playerId: 'user-p11', teamId: 'user-team3' } as GoalEvent,
      { id: 'e4-user', type: 'goal', time: "80'", playerName: 'Sam Stripes', playerId: 'user-p2', teamId: 'user-team1' } as GoalEvent,
      { id: 'e5-user', type: 'card', time: "60'", playerName: 'Ken Flame (User)', playerId: 'user-p12placeholder', teamId: 'user-team3', cardType: 'yellow', details: 'Foul tackle' } as CardEvent,
    ],
  },
];

// Fallback Tournament Info for components not yet refactored or if Supabase fails.
// Admin panel and key user pages fetch live data from Supabase.
export const mockTournamentInfo: TournamentInfo = {
  id: 1, // Default ID
  name: "Trendy's U13/U16 Championship (Fallback)",
  logoUrl: placeholderTeamLogo('TT'),
  about: "Welcome to the most exciting youth championship! Trendy's U13/U16 tournament brings together the best young talents to compete for glory. (This is fallback data).",
  knockoutImageUrl: `https://placehold.co/800x500/F0FAF4/50C878.png?text=Knockout+Diagram&font=poppins`,
};

// Mock Groups for user-facing components. Admin panel will manage via Supabase eventually.
export const mockGroups: Group[] = [
  {
    id: 'groupA-user',
    name: 'Group A (User)',
    teams: [
      { team: exampleTeamsForUserDisplay[0], played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 1, goalDifference: 1, points: 3 },
      { team: exampleTeamsForUserDisplay[1], played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
    ],
  },
  {
    id: 'groupB-user',
    name: 'Group B (User)',
    teams: [
      { team: exampleTeamsForUserDisplay[2], played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 2, goalDifference: -1, points: 0, isLive: true, liveScore: '1-0 vs YH' },
      { team: exampleTeamsForUserDisplay[3], played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, isLive: true, liveScore: '0-1 vs RD' },
    ],
  },
];

// This function is used by user-facing match details page. Keep it using mockMatches for now.
export const getMatchById = (id: string): Match | undefined => {
  const match = mockMatches.find(m => m.id === id); 
  if (match) {
    // Ensure players are attached if not explicitly part of mock match lineups
    const teamAWithPlayers = exampleTeamsForUserDisplay.find(t => t.id === match.teamA.id) || match.teamA;
    const teamBWithPlayers = exampleTeamsForUserDisplay.find(t => t.id === match.teamB.id) || match.teamB;
    
    return { 
        ...match, 
        teamA: {...teamAWithPlayers, players: teamAWithPlayers.players || []},
        teamB: {...teamBWithPlayers, players: teamBWithPlayers.players || []},
        events: match.events || [],
        lineupA: match.lineupA || teamAWithPlayers.players?.slice(0,11) || [], // Fallback lineup
        lineupB: match.lineupB || teamBWithPlayers.players?.slice(0,11) || [], // Fallback lineup
    };
  }
  return undefined;
};
    
