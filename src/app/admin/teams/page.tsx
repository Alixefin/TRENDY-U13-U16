import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Construction } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Manage Teams | Admin Panel",
  description: "Add, edit, and manage teams for the tournament.",
};

export default function AdminTeamsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Users className="mr-3 h-8 w-8" /> Manage Teams
        </h1>
        <p className="text-muted-foreground">
          Add new teams, update player rosters, and manage coach information.
        </p>
      </div>

      <Card className="min-h-[400px] flex flex-col items-center justify-center text-center border-2 border-dashed">
        <CardHeader>
            <Construction className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <CardTitle className="text-2xl font-headline">Team Management - Coming Soon</CardTitle>
          <CardDescription className="mt-2">
            This section will allow you to manage all aspects of team data, including:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-muted-foreground text-left space-y-1">
            <li>Adding new teams with names and logos.</li>
            <li>Assigning coaches to teams.</li>
            <li>Managing player lists with names and shirt numbers.</li>
            <li>Editing existing team information.</li>
          </ul>
          <p className="mt-6 font-semibold">Stay tuned for updates!</p>
        </CardContent>
      </Card>
    </div>
  );
}
