
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, PlusCircle, Users2, Loader2 } from 'lucide-react';
import { mockGroups as initialGroups } from '@/lib/data'; // Groups still from mock for now
import type { Group, Team, GroupTeam } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import { placeholderTeamLogo } from '@/lib/data';


const groupSchema = z.object({
  name: z.string().min(1, { message: "Group name cannot be empty." }),
});
type GroupFormValues = z.infer<typeof groupSchema>;

const assignTeamSchema = z.object({
  groupId: z.string().min(1, "Please select a group."),
  teamId: z.string().min(1, "Please select a team to assign."),
});
type AssignTeamFormValues = z.infer<typeof assignTeamSchema>;

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>(initialGroups); // Groups still mock
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoadingTeams(true);
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, logo_url, coach_name, players (id, name, shirt_number, team_id)'); // Fetch players too

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        toast({ variant: "destructive", title: "Error fetching teams", description: teamsError.message });
        setTeams([]);
      } else {
        const fetchedTeams = teamsData?.map(t => ({
            id: t.id,
            name: t.name,
            logoUrl: t.logo_url || placeholderTeamLogo(t.name),
            coachName: t.coach_name || 'N/A',
            players: (t.players as Player[] || []),
        })) || [];
        setTeams(fetchedTeams);
      }
      setIsLoadingTeams(false);
    };
    fetchTeams();
  }, [toast]);


  const groupForm = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '' },
  });

  const assignTeamForm = useForm<AssignTeamFormValues>({
    resolver: zodResolver(assignTeamSchema),
    defaultValues: { groupId: '', teamId: '' },
  });

  // TODO: Refactor group creation to use Supabase
  const onGroupSubmit: SubmitHandler<GroupFormValues> = (data) => {
    setIsSubmittingGroup(true);
    // Simulating Supabase insert for now
    const newGroup: Group = {
      id: `group-${Date.now()}`, // Temporary ID
      name: data.name,
      teams: [],
    };
    setGroups(prevGroups => [...prevGroups, newGroup]);
    toast({ title: "Group Created (Locally)", description: `Group "${data.name}" has been successfully created. Supabase integration pending.` });
    groupForm.reset();
    setIsSubmittingGroup(false);
  };

  // TODO: Refactor team assignment to use Supabase (group_teams table)
  const onAssignTeamSubmit: SubmitHandler<AssignTeamFormValues> = (data) => {
    setIsSubmittingAssignment(true);
    const targetGroup = groups.find(g => g.id === data.groupId);
    const targetTeam = teams.find(t => t.id === data.teamId);

    if (!targetGroup || !targetTeam) {
      toast({ variant: "destructive", title: "Error", description: "Selected group or team not found." });
      setIsSubmittingAssignment(false);
      return;
    }
    
    if (targetGroup.teams.some(gt => gt.team.id === targetTeam.id)) {
      toast({ variant: "destructive", title: "Error", description: `${targetTeam.name} is already in ${targetGroup.name}.` });
      setIsSubmittingAssignment(false);
      return;
    }

    const newGroupTeam: GroupTeam = {
      team: targetTeam,
      played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
    };

    setGroups(prevGroups =>
      prevGroups.map(group =>
        group.id === data.groupId
          ? { ...group, teams: [...group.teams, newGroupTeam] }
          : group
      )
    );
    toast({ title: "Team Assigned (Locally)", description: `${targetTeam.name} assigned to ${targetGroup.name}. Supabase integration pending.` });
    assignTeamForm.reset();
    setIsSubmittingAssignment(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Trophy className="mr-3 h-8 w-8" /> Manage Groups
        </h1>
        <p className="text-muted-foreground">
          Create tournament groups and assign teams to them. Teams are fetched from Supabase. Group data is local.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><PlusCircle className="mr-2 h-5 w-5" />Create New Group</CardTitle>
            <CardDescription>Add a new group to the tournament structure. (Local state for now)</CardDescription>
          </CardHeader>
          <Form {...groupForm}>
            <form onSubmit={groupForm.handleSubmit(onGroupSubmit)}>
              <CardContent>
                <FormField
                  control={groupForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Group C" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmittingGroup}>
                  {isSubmittingGroup ? "Creating..." : "Create Group (Local)"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Users2 className="mr-2 h-5 w-5" />Assign Team to Group</CardTitle>
            <CardDescription>Add a team to an existing group. (Local state for now)</CardDescription>
          </CardHeader>
          <Form {...assignTeamForm}>
            <form onSubmit={assignTeamForm.handleSubmit(onAssignTeamSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={assignTeamForm.control}
                  name="groupId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Group</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={groups.length === 0}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Choose a group" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groups.map(group => (
                            <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={assignTeamForm.control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Team</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingTeams || teams.length === 0}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder={isLoadingTeams? "Loading teams..." : "Choose a team"} /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teams.map(team => (
                            <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmittingAssignment || isLoadingTeams}>
                  {isSubmittingAssignment ? "Assigning..." : "Assign Team (Local)"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Groups & Standings (Local Data)</CardTitle>
          <CardDescription>Overview of all groups and their assigned teams. Standings are illustrative.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingTeams && groups.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <p className="text-muted-foreground">Loading team data and initializing groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No groups created yet.</p>
          ) : (
            groups.map(group => (
              <div key={group.id}>
                <h3 className="text-xl font-semibold mb-2 font-headline">{group.name}</h3>
                {group.teams.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-2">No teams assigned to this group yet.</p>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Logo</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">P</TableHead>
                      <TableHead className="text-center">W</TableHead>
                      <TableHead className="text-center">D</TableHead>
                      <TableHead className="text-center">L</TableHead>
                      <TableHead className="text-center">GF</TableHead>
                      <TableHead className="text-center">GA</TableHead>
                      <TableHead className="text-center">GD</TableHead>
                      <TableHead className="text-center">Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.teams
                      .sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor)
                      .map(gt => (
                      <TableRow key={gt.team.id}>
                        <TableCell>
                          <Image src={gt.team.logoUrl} alt={gt.team.name} width={24} height={24} className="rounded-full" data-ai-hint="team logo" />
                        </TableCell>
                        <TableCell className="font-medium">{gt.team.name}</TableCell>
                        <TableCell className="text-center">{gt.played}</TableCell>
                        <TableCell className="text-center">{gt.won}</TableCell>
                        <TableCell className="text-center">{gt.drawn}</TableCell>
                        <TableCell className="text-center">{gt.lost}</TableCell>
                        <TableCell className="text-center">{gt.goalsFor}</TableCell>
                        <TableCell className="text-center">{gt.goalsAgainst}</TableCell>
                        <TableCell className="text-center">{gt.goalDifference}</TableCell>
                        <TableCell className="text-center font-semibold">{gt.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    