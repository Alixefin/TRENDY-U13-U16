import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Construction } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Manage Groups | Admin Panel",
  description: "Organize teams into groups and manage tournament standings.",
};

export default function AdminGroupsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Trophy className="mr-3 h-8 w-8" /> Manage Groups
        </h1>
        <p className="text-muted-foreground">
          Create and manage tournament groups, assign teams, and oversee group standings.
        </p>
      </div>

      <Card className="min-h-[400px] flex flex-col items-center justify-center text-center border-2 border-dashed">
        <CardHeader>
          <Construction className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <CardTitle className="text-2xl font-headline">Group Management - Coming Soon</CardTitle>
          <CardDescription className="mt-2">
            This area will enable comprehensive group and standings management:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-muted-foreground text-left space-y-1">
            <li>Defining tournament groups.</li>
            <li>Assigning teams from the database to specific groups.</li>
            <li>Manually adjusting standings if necessary (e.g., for tie-breakers not automatically calculated).</li>
            <li>Viewing and verifying automatically updated group tables based on match results.</li>
          </ul>
          <p className="mt-6 font-semibold">Stay tuned for updates!</p>
        </CardContent>
      </Card>
    </div>
  );
}
