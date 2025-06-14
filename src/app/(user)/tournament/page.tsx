
import React from 'react';
import Image from 'next/image';
import TournamentHeader from '@/components/user/tournament/TournamentHeader';
import GroupTable from '@/components/user/tournament/GroupTable';
import { mockTournamentInfo, mockGroups } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Tournament Overview | Trendy's Tournament Tracker",
  description: "View tournament details, group standings, and progression.",
};


export default function TournamentPage() {
  // In a real app, fetch this data
  const tournamentInfo = mockTournamentInfo;
  const groups = mockGroups;

  return (
    <div className="container mx-auto py-8 px-4">
      <TournamentHeader info={tournamentInfo} />
      
      <h2 className="text-2xl font-headline font-bold mb-6 text-center md:text-left">Group Standings</h2>
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
                layout="fill" 
                objectFit="contain" // Use 'contain' to ensure the whole diagram is visible
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
