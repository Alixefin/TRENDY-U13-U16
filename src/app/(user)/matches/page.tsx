
import React from 'react';
import MatchesTabs from '@/components/user/matches/MatchesTabs';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import type { Match, Team, Player, MatchEvent } from '@/types';
import { placeholderTeamLogo } from '@/lib/data';

export const dynamic = 'force-dynamic'; // Ensures the page is always dynamically rendered

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
      duration,
      player_of_the_match_id,
      teamA:team_a_id (id, name, logo_url, coach_name, players (id, name, shirt_number, team_id)),
      teamB:team_b_id (id, name, logo_url, coach_name, players (id, name, shirt_number, team_id))
    `)
    .order('date_time', { ascending: false });

  if (matchesError) {
    console.error("Error fetching matches for user page:", matchesError.message);
    return [];
  }
  if (!matchesData) return [];

  return matchesData.map((m) => {
    const teamARaw = m.teamA as any;
    const teamBRaw = m.teamB as any;

    const teamA: Team = teamARaw ? 
      mapSupabaseTeamToLocalForUser(teamARaw, (teamARaw.players as Player[] || [])) : 
      { id: 'unknownA', name: 'Unknown Team A', logoUrl: placeholderTeamLogo('UA'), coachName: 'N/A', players: [] };

    const teamB: Team = teamBRaw ? 
      mapSupabaseTeamToLocalForUser(teamBRaw, (teamBRaw.players as Player[] || [])) : 
      { id: 'unknownB', name: 'Unknown Team B', logoUrl: placeholderTeamLogo('UB'), coachName: 'N/A', players: [] };
    
    let lineupA: Player[] = [];
    if (m.lineup_a_player_ids && m.lineup_a_player_ids.length > 0 && teamA.players.length > 0) {
      const lineupIdsA = new Set(m.lineup_a_player_ids);
      lineupA = teamA.players.filter(p => lineupIdsA.has(p.id));
    } else if (teamA.players.length > 0) {
      lineupA = teamA.players.slice(0, 11); 
    }
    
    let lineupB: Player[] = [];
    if (m.lineup_b_player_ids && m.lineup_b_player_ids.length > 0 && teamB.players.length > 0) {
       const lineupIdsB = new Set(m.lineup_b_player_ids);
       lineupB = teamB.players.filter(p => lineupIdsB.has(p.id));
    } else if (teamB.players.length > 0) {
      lineupB = teamB.players.slice(0, 11);
    }

    return {
        id: m.id,
        teamA,
        teamB,
        dateTime: new Date(m.date_time),
        venue: m.venue || 'N/A',
        status: m.status as 'scheduled' | 'live' | 'completed' | 'halftime',
        scoreA: m.score_a ?? undefined,
        scoreB: m.score_b ?? undefined,
        events: (m.events as MatchEvent[] | null) || [],
        lineupA, 
        lineupB,
        duration: m.duration ?? undefined,
        playerOfTheMatchId: m.player_of_the_match_id ?? undefined,
      };
  });
}


export default async function MatchesPage() {
  const matches = await getMatchesForUserPage();

  return (
    <MatchesTabs matches={matches} />
  );
}

    