
"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
import { Trophy, PlusCircle, Users2, Loader2, Trash2 } from 'lucide-react';
import type { Group, Team, GroupTeam, Player } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import { placeholderTeamLogo } from '@/lib/data';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const groupSchema = z.object({
  name: z.string().min(1, { message: "Group name cannot be empty." }),
});
type GroupFormValues = z.infer<typeof groupSchema>;

const assignTeamSchema = z.object({
  groupId: z.string().min(1, "Please select a group."),
  teamId: z.string().min(1, "Please select a team to assign."),
});
type AssignTeamFormValues = z.infer<typeof assignTeamSchema>;

const mapDbTeamToGroupTeam = (dbTeamEntry: any): GroupTeam => {
  const team: Team = {
    id: dbTeamEntry.teams.id, // Supabase SDK nests relation in 'teams' object
    name: dbTeamEntry.teams.name,
    logoUrl: dbTeamEntry.teams.logo_url || placeholderTeamLogo(dbTeamEntry.teams.name),
    coachName: dbTeamEntry.teams.coach_name || 'N/A',
    players: (dbTeamEntry.teams.players as Player[] || []),
  };
  return {
    id: dbTeamEntry.id, // This is the ID from group_teams table
    team: team,
    played: dbTeamEntry.played,
    won: dbTeamEntry.won,
    drawn: dbTeamEntry.drawn,
    lost: dbTeamEntry.lost,
    goalsFor: dbTeamEntry.goals_for,
    goalsAgainst: dbTeamEntry.goals_against,
    goalDifference: dbTeamEntry.goals_for - dbTeamEntry.goals_against,
    points: dbTeamEntry.points,
  };
};


export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const { toast } = useToast();

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    
    // Fetch teams
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, logo_url, coach_name, players (id, name, shirt_number, team_id)');

    if (teamsError) {
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

    // Fetch groups and their teams
    const { data: dbGroups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, group_teams (*, teams (*, players (*)))') // Fetch nested group_teams and then teams
      .order('name', { ascending: true });


    if (groupsError) {
      toast({ variant: "destructive", title: "Error fetching groups", description: groupsError.message });
      setGroups([]);
    } else if (dbGroups) {
      const fetchedGroups: Group[] = dbGroups.map(dbGroup => {
        const teamsForGroup: GroupTeam[] = (dbGroup.group_teams as any[])?.map(mapDbTeamToGroupTeam) || [];
        return {
          id: dbGroup.id,
          name: dbGroup.name,
          teams: teamsForGroup.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor),
        };
      });
      setGroups(fetchedGroups);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);


  const groupForm = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '' },
  });

  const assignTeamForm = useForm<AssignTeamFormValues>({
    resolver: zodResolver(assignTeamSchema),
    defaultValues: { groupId: '', teamId: '' },
  });

  const onGroupSubmit: SubmitHandler<GroupFormValues> = async (data) => {
    setIsSubmittingGroup(true);
    const { data: newGroup, error } = await supabase
      .from('groups')
      .insert({ name: data.name })
      .select()
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Error Creating Group", description: error.message });
    } else if (newGroup) {
      setGroups(prevGroups => [...prevGroups, { ...newGroup, teams: [] }].sort((a,b) => a.name.localeCompare(b.name)));
      toast({ title: "Group Created", description: `Group "${data.name}" has been successfully created.` });
      groupForm.reset();
    }
    setIsSubmittingGroup(false);
  };

  const onAssignTeamSubmit: SubmitHandler<AssignTeamFormValues> = async (data) => {
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

    // Insert into group_teams table
    const { data: newGroupTeamEntry, error } = await supabase
      .from('group_teams')
      .insert({
        group_id: data.groupId,
        team_id: data.teamId,
        // Default standings
        played: 0, won: 0, drawn: 0, lost: 0,
        goals_for: 0, goals_against: 0, points: 0,
      })
      .select('*, teams (*, players (*))') // Re-fetch with team details
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Failed to Assign Team", description: error.message });
    } else if (newGroupTeamEntry) {
      const newGroupTeam = mapDbTeamToGroupTeam(newGroupTeamEntry as any);
      setGroups(prevGroups =>
        prevGroups.map(group =>
          group.id === data.groupId
            ? { ...group, teams: [...group.teams, newGroupTeam].sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor) }
            : group
        )
      );
      toast({ title: "Team Assigned", description: `${targetTeam.name} assigned to ${targetGroup.name}.` });
      assignTeamForm.reset();
    }
    setIsSubmittingAssignment(false);
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    // First, check if group has teams. If so, warn or prevent.
    const groupToDelete = groups.find(g => g.id === groupId);
    if (groupToDelete && groupToDelete.teams.length > 0) {
        toast({
            variant: "destructive",
            title: `Cannot Delete Group "${groupName}"`,
            description: "This group still has teams assigned to it. Please remove teams first.",
        });
        return;
    }

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      toast({ variant: "destructive", title: `Error Deleting Group "${groupName}"`, description: error.message });
    } else {
      setGroups(prevGroups => prevGroups.filter(g => g.id !== groupId));
      toast({ title: "Group Deleted", description: `Group "${groupName}" has been removed.` });
    }
  };

  const handleRemoveTeamFromGroup = async (groupTeamId: string, teamName: string, groupName: string) => {
     const { error } = await supabase
      .from('group_teams')
      .delete()
      .eq('id', groupTeamId); // group_teams has its own primary key 'id'

    if (error) {
      toast({ variant: "destructive", title: `Error Removing Team "${teamName}" from "${groupName}"`, description: error.message });
    } else {
      setGroups(prevGroups =>
        prevGroups.map(g => ({
          ...g,
          teams: g.teams.filter(gt => gt.id !== groupTeamId) // Use group_team.id for filtering
        }))
      );
      toast({ title: "Team Removed", description: `Team "${teamName}" removed from group "${groupName}".` });
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Trophy className="mr-3 h-8 w-8" /> Manage Groups
        </h1>
        <p className="text-muted-foreground">
          Create tournament groups and assign teams. All data is managed via Supabase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><PlusCircle className="mr-2 h-5 w-5" />Create New Group</CardTitle>
            <CardDescription>Add a new group to the tournament structure.</CardDescription>
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
                <Button type="submit" disabled={isSubmittingGroup || isLoading}>
                  {isSubmittingGroup ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creating...</> : "Create Group"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Users2 className="mr-2 h-5 w-5" />Assign Team to Group</CardTitle>
            <CardDescription>Add a team to an existing group.</CardDescription>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || groups.length === 0}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder={isLoading ? "Loading..." : "Choose a group"} /></SelectTrigger>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || teams.length === 0}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder={isLoading? "Loading..." : "Choose a team"} /></SelectTrigger>
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
                <Button type="submit" disabled={isSubmittingAssignment || isLoading}>
                  {isSubmittingAssignment ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Assigning...</> : "Assign Team"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Groups & Standings</CardTitle>
          <CardDescription>Overview of all groups and their assigned teams. Standings are illustrative until matches update them.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <p className="text-muted-foreground">Loading groups and teams...</p>
            </div>
          ) : groups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No groups created yet. Add one using the form above.</p>
          ) : (
            <ScrollArea className="max-h-[600px]">
              {groups.map(group => (
                <div key={group.id} className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-semibold font-headline">{group.name}</h3>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                             <Trash2 className="h-4 w-4 mr-1" /> Delete Group
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to delete "{group.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the group.
                              Make sure no teams are assigned to this group before deleting.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteGroup(group.id, group.name)}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </div>
                  {group.teams.length === 0 ? (
                    <p className="text-sm text-muted-foreground pl-2 py-4 text-center border rounded-md">No teams assigned to this group yet.</p>
                  ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Logo</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-center">P</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">D</TableHead>
                        <TableHead className="text-center">L</TableHead>
                        <TableHead className="text-center">GF</TableHead>
                        <TableHead className="text-center">GA</TableHead>
                        <TableHead className="text-center">GD</TableHead>
                        <TableHead className="text-center">Pts</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.teams
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
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove "{gt.team.name}" from "{group.name}"?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove the team from this group's standings. It will not delete the team itself.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveTeamFromGroup(gt.id!, gt.team.name, group.name)}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                  >
                                    Remove Team
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  )}
                </div>
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    