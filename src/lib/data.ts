import type { Team, Match, Group, TournamentInfo, Player } from '@/types';

const createPlayer = (id: string, name: string, shirtNumber: number): Player => ({ id, name, shirtNumber });

const placeholderLogo = (seed: string) => `https://placehold.co/64x64/50C878/FFFFFF.png?text=${seed.substring(0,1).toUpperCase()}&font=poppins`;
export const placeholderTeamLogo = (name: string) => `https://placehold.co/128x128/FFFFFF/50C878.png?text=${name.substring(0,2).toUpperCase()}&font=poppins`;


export const mockTeams: Team[] = [
  {
    id: 'team1',
    name: 'Green Lions',
    logoUrl: placeholderTeamLogo('GL'),
    coachName: 'Coach Arthur',
    players: [
      createPlayer('p1', 'Leo Green', 10),
      createPlayer('p2', 'Sam Stripes', 7),
      createPlayer('p3', 'Alex Field', 1),
      createPlayer('p4', 'Max Power', 9),
      createPlayer('p5', 'Chris Keep', 5),
    ],
  },
  {
    id: 'team2',
    name: 'Blue Eagles',
    logoUrl: placeholderTeamLogo('BE'),
    coachName: 'Coach Bella',
    players: [
      createPlayer('p6', 'Eva Blue', 10),
      createPlayer('p7', 'Tom Sky', 7),
      createPlayer('p8', 'Rick Guard', 1),
      createPlayer('p9', 'Nina Fast', 11),
      createPlayer('p10', 'Ben Strong', 4),
    ],
  },
  {
    id: 'team3',
    name: 'Red Dragons',
    logoUrl: placeholderTeamLogo('RD'),
    coachName: 'Coach Drake',
    players: [
      createPlayer('p11', 'Ruby Fire', 9),
      createPlayer('p12', 'Ken Flame', 8),
      createPlayer('p13', 'Zoe Blaze', 1),
      createPlayer('p14', 'Dan Heat', 6),
      createPlayer('p15', 'Ivy Ash', 3),
    ],
  },
  {
    id: 'team4',
    name: 'Yellow Hornets',
    logoUrl: placeholderTeamLogo('YH'),
    coachName: 'Coach Stinger',
    players: [
      createPlayer('p16', 'Buzz Gold', 10),
      createPlayer('p17', 'Honey Comb', 7),
      createPlayer('p18', 'Wasp Net', 1),
      createPlayer('p19', 'Pollen Swift', 9),
      createPlayer('p20', 'Nectar Guard', 2),
    ],
  },
];

const now = new Date();

export const mockMatches: Match[] = [
  {
    id: 'match1',
    teamA: mockTeams[0],
    teamB: mockTeams[1],
    dateTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
    venue: 'Stadium Alpha',
    status: 'scheduled',
  },
  {
    id: 'match2',
    teamA: mockTeams[2],
    teamB: mockTeams[3],
    dateTime: new Date(now.getTime() - 15 * 60 * 1000), // Started 15 mins ago
    venue: 'Stadium Beta',
    status: 'live',
    scoreA: 1,
    scoreB: 0,
    lineupA: mockTeams[2].players.slice(0, 5),
    lineupB: mockTeams[3].players.slice(0, 5),
    events: [
      { id: 'e1', type: 'goal', time: "10'", playerName: 'Ruby Fire', teamId: 'team3' },
    ],
  },
  {
    id: 'match3',
    teamA: mockTeams[0],
    teamB: mockTeams[2],
    dateTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    venue: 'Stadium Gamma',
    status: 'completed',
    scoreA: 2,
    scoreB: 1,
    lineupA: mockTeams[0].players.slice(0, 5),
    lineupB: mockTeams[2].players.slice(0, 5),
    events: [
      { id: 'e2', type: 'goal', time: "25'", playerName: 'Leo Green', teamId: 'team1' },
      { id: 'e3', type: 'goal', time: "55'", playerName: 'Ruby Fire', teamId: 'team3' },
      { id: 'e4', type: 'goal', time: "80'", playerName: 'Sam Stripes', teamId: 'team1' },
      { id: 'e5', type: 'card', time: "60'", playerName: 'Ken Flame', details: 'Yellow Card', teamId: 'team3' },
    ],
  },
  {
    id: 'match4',
    teamA: mockTeams[1],
    teamB: mockTeams[3],
    dateTime: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes from now
    venue: 'Stadium Delta',
    status: 'scheduled',
  },
];

export const mockTournamentInfo: TournamentInfo = {
  name: "Trendy's U13/U16 Championship Tournament",
  logoUrl: placeholderLogo('Trendy'), // Placeholder
  about: "Welcome to the most exciting youth championship! Trendy's U13/U16 tournament brings together the best young talents to compete for glory. Witness skill, passion, and the future stars of tomorrow. This tournament emphasizes fair play, sportsmanship, and community engagement. Join us for a festival of football!",
};

export const mockGroups: Group[] = [
  {
    id: 'groupA',
    name: 'Group A',
    teams: [
      { team: mockTeams[0], played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 1, goalDifference: 1, points: 3 },
      { team: mockTeams[1], played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
    ],
  },
  {
    id: 'groupB',
    name: 'Group B',
    teams: [
      { team: mockTeams[2], played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 2, goalDifference: -1, points: 0, isLive: true, liveScore: '1-0 vs YH' },
      { team: mockTeams[3], played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, isLive: true, liveScore: '0-1 vs RD' },
    ],
  },
];

export const getMatchById = (id: string): Match | undefined => mockMatches.find(match => match.id === id);
export const getTeamById = (id: string): Team | undefined => mockTeams.find(team => team.id === id);
