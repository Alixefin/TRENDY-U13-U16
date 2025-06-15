
import React from 'react';
import Image from 'next/image';
import TournamentHeader from '@/components/user/tournament/TournamentHeader';
import GroupTable from '@/components/user/tournament/GroupTable';
import { mockGroups, placeholderTeamLogo } from '@/lib/data'; // mockGroups for now, will be replaced
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import type { TournamentInfo } from '@/types';

// This function fetches data at build time or on demand for SSR/ISR
async function getTournamentPageData() {
  let tournamentInfo: TournamentInfo | null = null;
  
  const { data: settingsData, error: settingsError } = await supabase
    .from('tournament_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (settingsError || !settingsData) {
    console.error("Error fetching tournament settings for user page:", settingsError?.message);
    // Fallback to a default structure if Supabase fetch fails
    tournamentInfo = { 
        name: "Tournament Tracker", 
        about: "Details about the tournament will appear here soon.",
        logoUrl: placeholderTeamLogo("TT"),
        knockoutImageUrl: `https://placehold.co/800x500/F0FAF4/50C878.png?text=Knockout+Diagram&font=poppins`
    };
  } else {
    tournamentInfo = settingsData as TournamentInfo;
  }

  // For now, groups are still mock. This would be fetched from Supabase in a future step.
  const groups = mockGroups; 

  return { tournamentInfo, groups };
}

export async function generateMetadata(): Promise<Metadata> {
  const { tournamentInfo } = await getTournamentPageData();
  return {
    title: `${tournamentInfo?.name || 'Tournament Overview'} | Trendy's Tournament Tracker`,
    description: `View tournament details, group standings, and progression for ${tournamentInfo?.name || 'the tournament'}.`,
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
      <p className="text-muted-foreground mb-6 text-center md:text-left">
        Group standings are currently using placeholder data and will be updated with live data soon.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {groups.map((group) => (
          <GroupTable key={group.id} group={group} />
        ))}
      </div>

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
