
"use client";

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Edit, Trash2, PlusCircle } from 'lucide-react';
import { mockTeams as initialTeams, placeholderTeamLogo } from '@/lib/data';
import type { Team } from '@/types';
import { useToast } from "@/hooks/use-toast";

const teamSchema = z.object({
  name: z.string().min(2, { message: "Team name must be at least 2 characters." }),
  coachName: z.string().min(2, { message: "Coach name must be at least 2 characters." }),
  logoUrl: z.string().url({ message: "Please enter a valid URL for the logo." }).optional().or(z.literal('')),
});

type TeamFormValues = z.infer<typeof teamSchema>;

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      coachName: '',
      logoUrl: '',
    },
  });

  const onSubmit: SubmitHandler<TeamFormValues> = (data) => {
    setIsSubmitting(true);
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: data.name,
      coachName: data.coachName,
      logoUrl: data.logoUrl || placeholderTeamLogo(data.name),
      players: [], // New teams start with no players by default
    };
    setTeams(prevTeams => [...prevTeams, newTeam]);
    toast({
      title: "Team Added",
      description: `${data.name} has been successfully added.`,
    });
    form.reset();
    setIsSubmitting(false);
  };

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Team
          </CardTitle>
          <CardDescription>Fill in the details below to add a new team to the tournament.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., The Mighty Ducks" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coachName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coach Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Gordon Bombay" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} />
                    </FormControl>
                    <FormDescription>If left blank, a placeholder logo will be generated.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding Team..." : "Add Team"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Teams ({teams.length})</CardTitle>
          <CardDescription>List of all teams participating in the tournament.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No teams added yet.
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <Image src={team.logoUrl} alt={`${team.name} logo`} width={40} height={40} className="rounded-full" data-ai-hint="team logo"/>
                    </TableCell>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.coachName}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-2" onClick={() => alert(`Edit functionality for ${team.name} coming soon!`)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => alert(`Delete functionality for ${team.name} coming soon!`)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
