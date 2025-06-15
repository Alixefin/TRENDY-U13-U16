
import React from 'react';
import Image from 'next/image';
import TournamentHeader from '@/components/user/tournament/TournamentHeader';
import GroupTable from '@/components/user/tournament/GroupTable';
import { placeholderTeamLogo, mockTournamentInfo } from '@/lib/data'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import type { TournamentInfo, Group, Team, GroupTeam, Player } from '@/types';

const mapDbTeamToGroupTeam = (dbTeamEntry: any): GroupTeam => {
  const team: Team = {
    id: dbTeamEntry.team.id,
    name: dbTeamEntry.team.name,
    logoUrl: dbTeamEntry.team.logo_url || placeholderTeamLogo(dbTeamEntry.team.name),
    coachName: dbTeamEntry.team.coach_name || 'N/A',
    players: (dbTeamEntry.team.players as Player[] || []), // Assuming players might be joined
  };
  return {
    team: team,
    played: dbTeamEntry.played,
    won: dbTeamEntry.won,
    drawn: dbTeamEntry.drawn,
    lost: dbTeamEntry.lost,
    goalsFor: dbTeamEntry.goals_for,
    goalsAgainst: dbTeamEntry.goals_against,
    goalDifference: dbTeamEntry.goals_for - dbTeamEntry.goals_against,
    points: dbTeamEntry.points,
    // isLive and liveScore would require more complex logic, defaulting to false/undefined
    isLive: false, 
    liveScore: undefined,
  };
};

async function getTournamentPageData() {
  let tournamentInfo: TournamentInfo | null = null;
  let groups: Group[] = [];
  
  const { data: settingsData, error: settingsError } = await supabase
    .from('tournament_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (settingsError || !settingsData) {
    console.error("Error fetching tournament settings for user page:", settingsError?.message);
    tournamentInfo = mockTournamentInfo; // Use mock as fallback
  } else {
    tournamentInfo = settingsData as TournamentInfo;
  }

  const { data: dbGroups, error: groupsError } = await supabase
    .from('groups')
    .select('id, name');

  if (groupsError) {
    console.error("Error fetching groups:", groupsError.message);
    // Potentially use mockGroups as fallback or return empty
  } else if (dbGroups) {
    for (const dbGroup of dbGroups) {
      const { data: groupTeamsData, error: groupTeamsError } = await supabase
        .from('group_teams')
        .select(`
          played,
          won,
          drawn,
          lost,
          goals_for,
          goals_against,
          points,
          team:teams (id, name, logo_url, coach_name) 
        `)
        .eq('group_id', dbGroup.id)
        .order('points', { ascending: false })
        .order('goals_for', { ascending: false }); // Consider goal_difference if available

      if (groupTeamsError) {
        console.error(`Error fetching teams for group ${dbGroup.name}:`, groupTeamsError.message);
        groups.push({ id: dbGroup.id, name: dbGroup.name, teams: [] });
      } else {
        const teamsForGroup: GroupTeam[] = groupTeamsData ? groupTeamsData.map(mapDbTeamToGroupTeam) : [];
        groups.push({ id: dbGroup.id, name: dbGroup.name, teams: teamsForGroup });
      }
    }
  }
  
  // If groups are empty after fetching (e.g. error or no data), could use mock as fallback
  if (groups.length === 0) {
    console.warn("No groups fetched from Supabase, falling back to empty or consider mock groups.");
    // groups = mockGroups; // Example fallback
  }


  return { tournamentInfo, groups };
}

export async function generateMetadata(): Promise<Metadata> {
  // Fetch minimal data for metadata, or rely on defaults if initial fetch is slow
  let tournamentName = "Tournament Overview";
  try {
    const { data: settingsData } = await supabase
      .from('tournament_settings')
      .select('name')
      .eq('id', 1)
      .single();
    if (settingsData?.name) tournamentName = settingsData.name;
  } catch (e) { /* ignore */ }
  
  return {
    title: `${tournamentName} | Trendy's Tournament Tracker`,
    description: `View tournament details, group standings, and progression for ${tournamentName}.`,
  };
}


export default async function TournamentPage() {
  const { tournamentInfo, groups } = await getTournamentPageData();

  if (!tournamentInfo) {
    // This case should ideally be handled by the fallback in getTournamentPageData
    return <div className="container mx-auto py-8 px-4 text-center">Error loading tournament information.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <TournamentHeader info={tournamentInfo} />
      
      <h2 className="text-2xl font-headline font-bold mb-6 text-center md:text-left">Group Standings</h2>
      {groups.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {groups.map((group) => (
            <GroupTable key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mb-6 text-center md:text-left py-8">
          Group standings are not yet available. Please check back later.
        </p>
      )}


      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Knockout Stage Progression</CardTitle>
        </CardHeader>
        <CardContent>
          {tournamentInfo.knockoutImageUrl ? (
            <div className="relative w-full aspect-[16/10] md:aspect-[16/9] rounded-lg overflow-hidden border-2 border-muted bg-muted/20">
              <Image 
                src={tournamentInfo.knockoutImageUrl} 
                alt="Tournament knockout stage progression diagram" 
                fill={true}
                style={{objectFit: "contain"}}
                data-ai-hint="diagram chart" 
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg bg-muted/20">
              <p className="text-muted-foreground">Tournament progression diagram coming soon!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
