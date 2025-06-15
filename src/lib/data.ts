
import type { Team, Match, Player, MatchEvent, SupabaseMatch } from '@/types';
import { supabase } from './supabaseClient';

export const placeholderTeamLogo = (name: string): string => {
  const initials = name.length >= 2 ? name.substring(0, 2).toUpperCase() : name.substring(0,1).toUpperCase() + (name.length > 1 ? name.substring(1,1) : '');
  return `https://placehold.co/128x128/FFFFFF/50C878.png?text=${initials}&font=poppins`;
}

// Helper function to map Supabase team data (potentially with players) to local Team type
const mapSupabaseTeamToLocalUser = (supabaseTeam: any, players: Player[] = []): Team => {
  return {
    id: supabaseTeam.id,
    name: supabaseTeam.name,
    coachName: supabaseTeam.coach_name || 'N/A',
    logoUrl: supabaseTeam.logo_url || placeholderTeamLogo(supabaseTeam.name),
    players: players.map(p => ({
        id: p.id,
        name: p.name,
        shirt_number: p.shirt_number, 
        team_id: p.team_id,
        created_at: p.created_at
    })),
  };
};

export const getMatchById = async (id: string): Promise<Match | null | undefined> => {
  const { data: matchData, error } = await supabase
    .from('matches')
    .select(`
      id,
      date_time,
      venue,
      status,
      score_a,
      score_b,
      events,
      lineup_a_player_ids,
      lineup_b_player_ids,
      duration,
      player_of_the_match_id,
      teamA:team_a_id (id, name, logo_url, coach_name, players (id, name, shirt_number, team_id, created_at)),
      teamB:team_b_id (id, name, logo_url, coach_name, players (id, name, shirt_number, team_id, created_at)),
      playerOfTheMatch:player_of_the_match_id (id, name, shirt_number, team_id)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching match by ID (${id}):`, error.message);
    if (error.code === 'PGRST116') return null; 
    return undefined; 
  }
  if (!matchData) return null;

  const teamARaw = matchData.teamA as any;
  const teamBRaw = matchData.teamB as any;

  const teamA: Team = teamARaw ? 
    mapSupabaseTeamToLocalUser(teamARaw, (teamARaw.players as Player[] || [])) : 
    { id: 'unknownA', name: 'Unknown Team A', logoUrl: placeholderTeamLogo('?'), coachName: 'N/A', players: [] };

  const teamB: Team = teamBRaw ? 
    mapSupabaseTeamToLocalUser(teamBRaw, (teamBRaw.players as Player[] || [])) : 
    { id: 'unknownB', name: 'Unknown Team B', logoUrl: placeholderTeamLogo('?'), coachName: 'N/A', players: [] };

  let lineupA: Player[] = [];
  if (matchData.lineup_a_player_ids && teamA.players.length > 0) {
    const lineupIdsA = new Set(matchData.lineup_a_player_ids);
    lineupA = teamA.players.filter(p => lineupIdsA.has(p.id));
  }
  
  let lineupB: Player[] = [];
  if (matchData.lineup_b_player_ids && teamB.players.length > 0) {
     const lineupIdsB = new Set(matchData.lineup_b_player_ids);
     lineupB = teamB.players.filter(p => lineupIdsB.has(p.id));
  }

  const playerOfTheMatch = matchData.playerOfTheMatch ? {
    id: (matchData.playerOfTheMatch as any).id,
    name: (matchData.playerOfTheMatch as any).name,
    shirt_number: (matchData.playerOfTheMatch as any).shirt_number,
    team_id: (matchData.playerOfTheMatch as any).team_id,
  } : undefined;


  return {
    id: matchData.id,
    teamA,
    teamB,
    dateTime: new Date(matchData.date_time),
    venue: matchData.venue || 'N/A',
    status: matchData.status as 'scheduled' | 'live' | 'completed' | 'halftime',
    scoreA: matchData.score_a ?? undefined,
    scoreB: matchData.score_b ?? undefined,
    events: (matchData.events as MatchEvent[] | null) || [],
    lineupA,
    lineupB,
    duration: matchData.duration ?? undefined,
    playerOfTheMatchId: matchData.player_of_the_match_id ?? undefined,
    playerOfTheMatch: playerOfTheMatch,
  };
};


export const mockTournamentInfo: TournamentInfo = {
  id: 1, 
  name: "Tournament Tracker (Fallback)",
  logoUrl: placeholderTeamLogo('TT'),
  about: "Fallback tournament description. Configure in admin panel.",
  knockoutImageUrl: `https://placehold.co/800x500/F0FAF4/50C878.png?text=Knockout+Diagram&font=poppins`,
};
