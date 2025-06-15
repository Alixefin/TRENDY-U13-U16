
import React from 'react';
import MatchesTabs from '@/components/user/matches/MatchesTabs';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import type { Match, Team, Player, SupabaseMatch } from '@/types';
import { placeholderTeamLogo } from '@/lib/data';

export const metadata: Metadata = {
  title: "Matches | Trendy's Tournament Tracker",
  description: "View all scheduled, live, and completed matches.",
};

const mapSupabaseTeamToLocalForUser = (supabaseTeam: any, players: Player[] = []): Team => {
  return {
    id: supabaseTeam.id,
    name: supabaseTeam.name,
    coachName: supabaseTeam.coach_name || 'N/A',
    logoUrl: supabaseTeam.logo_url || placeholderTeamLogo(supabaseTeam.name),
    players: players,
  };
};

const mapFetchedMatchToLocalMatch = (fetchedMatch: any): Match => {
  // Directly use fetched team objects which should have players if selected correctly
  const teamA: Team = fetchedMatch.teamA ? 
    mapSupabaseTeamToLocalUser(fetchedMatch.teamA, (fetchedMatch.teamA.players as Player[] || [])) : 
    { id: 'unknownA', name: 'Unknown Team A', logoUrl: placeholderTeamLogo('?'), coachName: 'N/A', players: [] };

  const teamB: Team = fetchedMatch.teamB ? 
    mapSupabaseTeamToLocalUser(fetchedMatch.teamB, (fetchedMatch.teamB.players as Player[] || [])) : 
    { id: 'unknownB', name: 'Unknown Team B', logoUrl: placeholderTeamLogo('?'), coachName: 'N/A', players: [] };

  return {
    id: fetchedMatch.id,
    teamA: teamA,
    teamB: teamB,
    dateTime: new Date(fetchedMatch.date_time),
    venue: fetchedMatch.venue || 'N/A',
    status: fetchedMatch.status,
    scoreA: fetchedMatch.score_a ?? undefined,
    scoreB: fetchedMatch.score_b ?? undefined,
    events: (fetchedMatch.events as MatchEvent[] | null) || [],
    lineupA: (fetchedMatch.lineup_a_player_ids && teamA.players.length > 0) ? 
             teamA.players.filter(p => fetchedMatch.lineup_a_player_ids.includes(p.id)) : 
             (teamA.players || []).slice(0,11), // Fallback if lineup_a_player_ids is null
    lineupB: (fetchedMatch.lineup_b_player_ids && teamB.players.length > 0) ?
             teamB.players.filter(p => fetchedMatch.lineup_b_player_ids.includes(p.id)) :
             (teamB.players || []).slice(0,11), // Fallback
  };
};


async function getMatchesForUserPage(): Promise<Match[]> {
  const { data: matchesData, error: matchesError } = await supabase
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
      teamA:team_a_id (id, name, logo_url, coach_name),
      teamB:team_b_id (id, name, logo_url, coach_name)
    `)
    .order('date_time', { ascending: false });

  if (matchesError) {
    console.error("Error fetching matches for user page:", matchesError.message);
    return []; // Return empty array on error
  }
  if (!matchesData) return [];

  // Map Supabase data to our local Match[] type
  return matchesData.map((m) => {
    const teamA = m.teamA ? mapSupabaseTeamToLocalForUser(m.teamA) : { id: 'unknownA', name: 'Unknown Team A', logoUrl: placeholderTeamLogo('UA'), coachName: '', players: [] };
    const teamB = m.teamB ? mapSupabaseTeamToLocalForUser(m.teamB) : { id: 'unknownB', name: 'Unknown Team B', logoUrl: placeholderTeamLogo('UB'), coachName: '', players: [] };
    
    return {
        id: m.id,
        teamA,
        teamB,
        dateTime: new Date(m.date_time),
        venue: m.venue || 'N/A',
        status: m.status as 'scheduled' | 'live' | 'completed',
        scoreA: m.score_a ?? undefined,
        scoreB: m.score_b ?? undefined,
        events: (m.events as any[] | null) || [], // Cast events
        // Lineups would typically be fetched on demand for a specific match or if small enough, included here
        // For now, we're keeping lineups simpler for the match list view
        lineupA: [], 
        lineupB: [],
      };
  });
}


export default async function MatchesPage() {
  const matches = await getMatchesForUserPage();

  return (
    <MatchesTabs matches={matches} />
  );
}
