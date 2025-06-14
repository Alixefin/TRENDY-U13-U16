import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, CalendarClock, Trophy, Settings2, BarChart3 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Admin Dashboard | Trendy's Tournament Tracker",
  description: "Manage tournament settings, teams, matches, and groups.",
};

const adminLinks = [
  { href: '/admin/teams', title: 'Manage Teams', description: 'Add, edit, or remove teams and player information.', icon: Users },
  { href: '/admin/matches', title: 'Manage Matches', description: 'Schedule matches, update scores, and record match events.', icon: CalendarClock },
  { href: '/admin/groups', title: 'Manage Groups', description: 'Configure tournament groups and view standings.', icon: Trophy },
  { href: '/admin/settings', title: 'Tournament Settings', description: 'Update general tournament information and configurations.', icon: Settings2, disabled: true },
];


export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome! Manage your tournament efficiently from here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminLinks.map((link) => (
          <Card key={link.href} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium font-headline">{link.title}</CardTitle>
              <link.icon className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{link.description}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" disabled={link.disabled}>
                <Link href={link.href}>{link.disabled ? 'Coming Soon' : `Go to ${link.title.split(' ')[1]}`}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><BarChart3 className="mr-2 h-5 w-5"/>Quick Stats</CardTitle>
          <CardDescription>Overview of current tournament data.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold text-primary">4</p>
            <p className="text-sm text-muted-foreground">Teams</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold text-primary">4</p>
            <p className="text-sm text-muted-foreground">Matches</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold text-primary">2</p>
            <p className="text-sm text-muted-foreground">Groups</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold text-primary">1</p>
            <p className="text-sm text-muted-foreground">Live Match</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
