import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarClock, Construction } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Manage Matches | Admin Panel",
  description: "Schedule matches, update scores, and log match events.",
};

export default function AdminMatchesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <CalendarClock className="mr-3 h-8 w-8" /> Manage Matches
        </h1>
        <p className="text-muted-foreground">
          Set up match schedules, input live scores, lineups, and log important events like goals and cards.
        </p>
      </div>

      <Card className="min-h-[400px] flex flex-col items-center justify-center text-center border-2 border-dashed">
        <CardHeader>
          <Construction className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <CardTitle className="text-2xl font-headline">Match Management - Coming Soon</CardTitle>
          <CardDescription className="mt-2">
            This section will provide tools to manage all match-related information:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-muted-foreground text-left space-y-1">
            <li>Scheduling new matches (teams, date/time, venue).</li>
            <li>Inputting and updating team lineups.</li>
            <li>Real-time score updates for live matches.</li>
            <li>Logging match events (goals, substitutions, cards).</li>
            <li>Finalizing match results.</li>
          </ul>
          <p className="mt-6 font-semibold">Stay tuned for updates!</p>
        </CardContent>
      </Card>
    </div>
  );
}
