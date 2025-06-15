
import type { Team, Match, Group, TournamentInfo, Player, GoalEvent, CardEvent } from '@/types';

// This file will now primarily hold mock data for USER-FACING components
// or initial structures if needed. Admin panel will fetch from Supabase.

export const placeholderTeamLogo = (name: string) => `https://placehold.co/128x128/FFFFFF/50C878.png?text=${name.substring(0,2).toUpperCase()}&font=poppins`;

// Initial player creation helper - might be useful for user-side display if not fetching full details
const createPlayer = (id: string, name: string, shirtNumber: number, team_id: string): Player => ({ id, name, shirt_number: shirtNumber, team_id });


// Mock teams - kept for user-side components that might need a quick example or until they are refactored
// Admin panel should NOT use this.
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

// Mock matches - kept for user-facing components. Admin panel fetches from Supabase.
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

// Tournament Info - can remain mock for now, or be fetched from Supabase settings table
export const mockTournamentInfo: TournamentInfo = {
  name: "Trendy's U13/U16 Championship Tournament",
  logoUrl: placeholderTeamLogo('TT'),
  about: "Welcome to the most exciting youth championship! Trendy's U13/U16 tournament brings together the best young talents to compete for glory. Witness skill, passion, and the future stars of tomorrow. This tournament emphasizes fair play, sportsmanship, and community engagement. Join us for a festival of football!",
  knockoutImageUrl: `https://placehold.co/800x500/F0FAF4/50C878.png?text=Knockout+Diagram&font=poppins`,
};

// Mock Groups - kept for user-facing components. Admin panel will manage via Supabase eventually.
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
  const match = mockMatches.find(match => match.id === id); // User-side still uses mockMatches
  if (match) {
    return { ...match, events: match.events || [] };
  }
  return undefined;
};
// getTeamById is not actively used by admin pages anymore as they fetch directly.
// It could be kept if user-side pages need it for mock data.
// For now, I'll comment it out to avoid confusion.
// export const getTeamById = (id: string): Team | undefined => exampleTeamsForUserDisplay.find(team => team.id === id);

    