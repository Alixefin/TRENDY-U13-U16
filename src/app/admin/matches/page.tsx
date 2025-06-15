
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarClock, PlusCircle, Edit, Trash2, Goal, CreditCardIcon, Loader2 } from 'lucide-react';
import type { Match, Team, Player, MatchEvent, GoalEvent, CardEvent, SupabaseMatch } from '@/types';
import type { Tables } from '@/types/supabase';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import { placeholderTeamLogo } from '@/lib/data'; 

const matchSchema = z.object({
  teamAId: z.string().min(1, "Please select Team A."),
  teamBId: z.string().min(1, "Please select Team B."),
  dateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date and time.",
  }),
  venue: z.string().min(3, { message: "Venue must be at least 3 characters." }),
}).refine(data => data.teamAId !== data.teamBId, {
  message: "Team A and Team B cannot be the same.",
  path: ["teamBId"],
});
type MatchFormValues = z.infer<typeof matchSchema>;

const updateMatchSchema = z.object({
  scoreA: z.coerce.number().min(0).optional(),
  scoreB: z.coerce.number().min(0).optional(),
  status: z.enum(['scheduled', 'live', 'completed']),
});
type UpdateMatchFormValues = z.infer<typeof updateMatchSchema>;

const mapSupabaseMatchToLocal = (sm: SupabaseMatch, teamsList: Team[]): Match => {
  const teamA = teamsList.find(t => t.id === sm.team_a_id);
  const teamB = teamsList.find(t => t.id === sm.team_b_id);
  return {
    id: sm.id,
    teamA: teamA || { id: sm.team_a_id, name: 'Unknown Team A', logoUrl: placeholderTeamLogo('?'), coachName: '', players: [] },
    teamB: teamB || { id: sm.team_b_id, name: 'Unknown Team B', logoUrl: placeholderTeamLogo('?'), coachName: '', players: [] },
    dateTime: new Date(sm.date_time),
    venue: sm.venue || 'N/A',
    status: sm.status,
    scoreA: sm.score_a ?? undefined,
    scoreB: sm.score_b ?? undefined,
    events: (sm.events as MatchEvent[] | null) || [], 
    lineupA: [], 
    lineupB: [], 
  };
};

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);
  const [isUpdatingMatch, setIsUpdatingMatch] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const [goalPlayerId, setGoalPlayerId] = useState('');
  const [goalTime, setGoalTime] = useState('');
  const [cardPlayerId, setCardPlayerId] = useState('');
  const [cardType, setCardType] = useState<'yellow' | 'red'>('yellow');
  const [cardTime, setCardTime] = useState('');
  const [cardDetails, setCardDetails] = useState('');

  const scheduleForm = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: { teamAId: '', teamBId: '', dateTime: '', venue: '' },
  });

  const updateForm = useForm<UpdateMatchFormValues>({
    resolver: zodResolver(updateMatchSchema),
  });

  const fetchTeamsAndMatches = useCallback(async () => {
    setIsLoading(true);
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        logo_url,
        coach_name,
        players (id, name, shirt_number, team_id)
      `);

    if (teamsError) {
      toast({ variant: "destructive", title: "Error fetching teams", description: teamsError.message });
      setTeams([]);
    } else {
      const fetchedTeams = teamsData?.map(t => ({
        id: t.id,
        name: t.name,
        logoUrl: t.logo_url || placeholderTeamLogo(t.name),
        coachName: t.coach_name || 'N/A',
        players: t.players as Player[] || [],
      })) || [];
      setTeams(fetchedTeams);

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('date_time', { ascending: false });

      if (matchesError) {
        toast({ variant: "destructive", title: "Error fetching matches", description: matchesError.message });
        setMatches([]);
      } else {
        setMatches(matchesData?.map(m => mapSupabaseMatchToLocal(m as SupabaseMatch, fetchedTeams)) || []);
      }
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchTeamsAndMatches();
  }, [fetchTeamsAndMatches]);

  const onScheduleSubmit: SubmitHandler<MatchFormValues> = async (data) => {
    setIsSubmittingMatch(true);
    const teamA = teams.find(t => t.id === data.teamAId);
    const teamB = teams.find(t => t.id === data.teamBId);

    if (!teamA || !teamB) {
      toast({ variant: "destructive", title: "Error", description: "Selected team(s) not found." });
      setIsSubmittingMatch(false);
      return;
    }
    
    const { data: newMatchData, error } = await supabase
      .from('matches')
      .insert([{
        team_a_id: data.teamAId,
        team_b_id: data.teamBId,
        date_time: new Date(data.dateTime).toISOString(),
        venue: data.venue,
        status: 'scheduled',
        events: [],
      }])
      .select()
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Failed to Schedule Match", description: error.message });
    } else if (newMatchData) {
      setMatches(prevMatches => [mapSupabaseMatchToLocal(newMatchData as SupabaseMatch, teams), ...prevMatches].sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()));
      toast({ title: "Match Scheduled", description: `Match between ${teamA.name} and ${teamB.name} has been scheduled.` });
      scheduleForm.reset();
    }
    setIsSubmittingMatch(false);
  };

  const openEditModal = (match: Match) => {
    setSelectedMatch({ ...match, events: match.events ? [...match.events] : [] });
    updateForm.reset({
      scoreA: match.scoreA ?? undefined,
      scoreB: match.scoreB ?? undefined,
      status: match.status,
    });
    setGoalPlayerId(''); setGoalTime('');
    setCardPlayerId(''); setCardType('yellow'); setCardTime(''); setCardDetails('');
    setIsEditModalOpen(true);
  };
  
  const getTeamForPlayer = (playerId: string, match: Match): Team | undefined => {
    if (match.teamA.players.some(p => p.id === playerId)) return match.teamA;
    if (match.teamB.players.some(p => p.id === playerId)) return match.teamB;
    const teamA = teams.find(t => t.id === match.teamA.id);
    if (teamA?.players.some(p => p.id === playerId)) return teamA;
    const teamB = teams.find(t => t.id === match.teamB.id);
    if (teamB?.players.some(p => p.id === playerId)) return teamB;
    return undefined;
  };

  const handleAddGoal = () => {
    if (!selectedMatch || !goalPlayerId || !goalTime) {
      toast({ variant: "destructive", title: "Error", description: "Player and time are required for a goal." });
      return;
    }
    
    const playerTeam = getTeamForPlayer(goalPlayerId, selectedMatch);
    if (!playerTeam) {
         toast({ variant: "destructive", title: "Error", description: "Could not determine player's team." });
         return;
    }
    const player = playerTeam.players.find(p => p.id === goalPlayerId);
    if (!player) return;

    const newGoalEvent: GoalEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'goal',
      time: goalTime,
      playerId: player.id,
      playerName: player.name,
      teamId: playerTeam.id,
    };
    setSelectedMatch(prev => prev ? ({ ...prev, events: [...(prev.events || []), newGoalEvent] }) : null);
    setGoalPlayerId(''); setGoalTime('');
    toast({ title: "Goal Added (Locally)", description: `${player.name} scored at ${goalTime}. Save changes to persist.`});
  };

  const handleAddCard = () => {
    if (!selectedMatch || !cardPlayerId || !cardTime) {
      toast({ variant: "destructive", title: "Error", description: "Player, card type, and time are required." });
      return;
    }
    
    const playerTeam = getTeamForPlayer(cardPlayerId, selectedMatch);
     if (!playerTeam) {
         toast({ variant: "destructive", title: "Error", description: "Could not determine player's team." });
         return;
    }
    const player = playerTeam.players.find(p => p.id === cardPlayerId);
    if (!player) return;
    
    const newCardEvent: CardEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'card',
      cardType: cardType,
      time: cardTime,
      playerId: player.id,
      playerName: player.name,
      details: cardDetails,
      teamId: playerTeam.id,
    };
    setSelectedMatch(prev => prev ? ({ ...prev, events: [...(prev.events || []), newCardEvent] }) : null);
    setCardPlayerId(''); setCardTime(''); setCardType('yellow'); setCardDetails('');
    toast({ title: "Card Added (Locally)", description: `${player.name} received a ${cardType} card at ${cardTime}. Save changes to persist.`});
  };
  
  const handleRemoveEvent = (eventId: string) => {
    setSelectedMatch(prev => prev ? ({ ...prev, events: prev.events?.filter(event => event.id !== eventId) }) : null);
    toast({ title: "Event Removed (Locally)", description: "Save changes to persist."});
  };

  const updateGroupStandings = useCallback(async (
    teamAId: string,
    teamBId: string,
    finalScoreA: number,
    finalScoreB: number
  ) => {
    try {
      const teamsToProcess = [
        { teamId: teamAId, matchScore: finalScoreA, opponentMatchScore: finalScoreB },
        { teamId: teamBId, matchScore: finalScoreB, opponentMatchScore: finalScoreA },
      ];

      let standingsActuallyUpdated = false;

      for (const { teamId, matchScore, opponentMatchScore } of teamsToProcess) {
        // Find all group_teams entries for this team. A team might be in multiple groups theoretically,
        // but for tournament logic, it's typically one. This handles if it's >1 for some reason.
        const { data: groupTeamEntries, error: fetchError } = await supabase
          .from('group_teams')
          .select('*')
          .eq('team_id', teamId);

        if (fetchError) {
          console.error(`Error fetching group standings for team ${teamId}: ${fetchError.message}`);
          toast({ variant: "destructive", title: "Standings Fetch Error", description: `Could not fetch standings for team ID ${teamId}. This team's standings were not updated.` });
          continue; // Skip this team, try to update the other
        }
        
        if (groupTeamEntries && groupTeamEntries.length > 0) {
          for (const groupTeamEntry of groupTeamEntries) {
            const updates: Partial<Tables<'group_teams'>> = {
              played: (groupTeamEntry.played || 0) + 1,
              goals_for: (groupTeamEntry.goals_for || 0) + matchScore,
              goals_against: (groupTeamEntry.goals_against || 0) + opponentMatchScore,
              points: groupTeamEntry.points || 0,
              won: groupTeamEntry.won || 0,
              drawn: groupTeamEntry.drawn || 0,
              lost: groupTeamEntry.lost || 0,
            };

            if (matchScore > opponentMatchScore) { // Team won
              updates.won = (updates.won || 0) + 1;
              updates.points = (updates.points || 0) + 3;
            } else if (matchScore < opponentMatchScore) { // Team lost
              updates.lost = (updates.lost || 0) + 1;
            } else { // Draw
              updates.drawn = (updates.drawn || 0) + 1;
              updates.points = (updates.points || 0) + 1;
            }

            const { error: updateError } = await supabase
              .from('group_teams')
              .update(updates)
              .eq('id', groupTeamEntry.id); // group_teams has its own 'id' primary key

            if (updateError) {
              console.error(`Error updating group standings for team ${teamId} (group_team_id: ${groupTeamEntry.id}): ${updateError.message}`);
              toast({ variant: "destructive", title: "Standings Update Error", description: `Failed to update standings for team ID ${teamId}.` });
            } else {
              standingsActuallyUpdated = true;
            }
          }
        }
      }
      if (standingsActuallyUpdated) {
         toast({ title: "Group Standings Updated", description: "Relevant group standings have been recalculated based on the match result." });
      }
      // If neither team was found in group_teams, no specific toast is needed here unless desired.
    } catch (error: any) {
      console.error("Unexpected error in updateGroupStandings logic:", error);
      toast({ variant: "destructive", title: "Standings Logic Error", description: error.message || "An unexpected error occurred while updating standings." });
    }
  }, [toast]);


  const onUpdateMatchSubmit: SubmitHandler<UpdateMatchFormValues> = async (data) => {
    if (!selectedMatch) return;
    setIsUpdatingMatch(true);
    
    const updatedMatchPayload = {
      score_a: data.status !== 'scheduled' ? (data.scoreA ?? selectedMatch.scoreA ?? 0) : null,
      score_b: data.status !== 'scheduled' ? (data.scoreB ?? selectedMatch.scoreB ?? 0) : null,
      status: data.status,
      events: selectedMatch.events || [],
      team_a_id: selectedMatch.teamA.id, // Keep these in case they were editable for scheduled matches
      team_b_id: selectedMatch.teamB.id,
      date_time: new Date(selectedMatch.dateTime).toISOString(),
      venue: selectedMatch.venue,
    };

    const { data: updatedMatchFromDb, error } = await supabase
      .from('matches')
      .update(updatedMatchPayload)
      .eq('id', selectedMatch.id)
      .select()
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Failed to Update Match", description: error.message });
    } else if (updatedMatchFromDb) {
      const locallyMappedUpdatedMatch = mapSupabaseMatchToLocal(updatedMatchFromDb as SupabaseMatch, teams);
      setMatches(prevMatches =>
        prevMatches.map(m =>
          m.id === selectedMatch.id
            ? locallyMappedUpdatedMatch
            : m
        ).sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
      );
      
      toast({ title: "Match Updated", description: `Match details for ${selectedMatch.teamA.name} vs ${selectedMatch.teamB.name} updated.` });
      
      // If match is completed, update group standings
      if (updatedMatchFromDb.status === 'completed') {
        const finalScoreA = updatedMatchFromDb.score_a ?? 0;
        const finalScoreB = updatedMatchFromDb.score_b ?? 0;
        // Call updateGroupStandings AFTER match update is successful and state is set
        // Make sure selectedMatch.teamA.id and selectedMatch.teamB.id are valid
        await updateGroupStandings(selectedMatch.teamA.id, selectedMatch.teamB.id, finalScoreA, finalScoreB);
      }
      
      setIsEditModalOpen(false);
      setSelectedMatch(null);
    }
    setIsUpdatingMatch(false);
  };

  const handleDeleteMatch = async (matchId: string, matchIdentifier: string) => {
    const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

    if (error) {
        toast({ variant: "destructive", title: `Error Deleting Match: ${matchIdentifier}`, description: error.message });
    } else {
        setMatches(prevMatches => prevMatches.filter(m => m.id !== matchId));
        toast({ title: "Match Deleted", description: `Match: ${matchIdentifier} has been removed.` });
    }
  };
  
  const availablePlayersForEvents = selectedMatch ? 
    [
      ...(selectedMatch.teamA.players || []).map(p => ({...p, teamName: selectedMatch.teamA.name, teamId: selectedMatch.teamA.id})),
      ...(selectedMatch.teamB.players || []).map(p => ({...p, teamName: selectedMatch.teamB.name, teamId: selectedMatch.teamB.id}))
    ].sort((a,b) => a.name.localeCompare(b.name))
    : [];
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <CalendarClock className="mr-3 h-8 w-8" /> Manage Matches
        </h1>
        <p className="text-muted-foreground">
          Set up match schedules, input live scores, lineups, and log important events. Data is stored in Supabase.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><PlusCircle className="mr-2 h-5 w-5" />Schedule New Match</CardTitle>
          <CardDescription>Define the teams, date, time, and venue for a new match.</CardDescription>
        </CardHeader>
        <Form {...scheduleForm}>
          <form onSubmit={scheduleForm.handleSubmit(onScheduleSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={scheduleForm.control}
                  name="teamAId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team A</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || teams.length === 0}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder={isLoading? "Loading teams..." : "Select Team A"} /></SelectTrigger>
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
                <FormField
                  control={scheduleForm.control}
                  name="teamBId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team B</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || teams.length === 0}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder={isLoading? "Loading teams..." : "Select Team B"} /></SelectTrigger>
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
              </div>
              <FormField
                control={scheduleForm.control}
                name="dateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scheduleForm.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Stadium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmittingMatch || isLoading}>
                {isSubmittingMatch ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Scheduling...</> : "Schedule Match"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Matches ({matches.length})</CardTitle>
          <CardDescription>Overview of all scheduled, live, and completed matches from Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading matches...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team A</TableHead>
                  <TableHead>Team B</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      No matches found in the database.
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>{match.teamA.name}</TableCell>
                      <TableCell>{match.teamB.name}</TableCell>
                      <TableCell>{new Date(match.dateTime).toLocaleString()}</TableCell>
                      <TableCell>{match.venue}</TableCell>
                      <TableCell className="capitalize">{match.status}</TableCell>
                      <TableCell>
                        {match.status !== 'scheduled' ? `${match.scoreA ?? '-'} : ${match.scoreB ?? '-'}` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(match)}>
                            <Edit className="h-4 w-4 mr-1" /> 
                            {match.status === 'scheduled' ? 'Edit' : 'Manage'}
                        </Button>
                        {match.status === 'scheduled' && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure you want to delete this match?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the match:
                                    <br /><strong>{match.teamA.name} vs {match.teamB.name} on {new Date(match.dateTime).toLocaleDateString()}</strong>.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                    onClick={() => handleDeleteMatch(match.id, `${match.teamA.name} vs ${match.teamB.name}`)}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    >
                                    Delete Match
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Match: {selectedMatch?.teamA.name} vs {selectedMatch?.teamB.name}</DialogTitle>
            <CardDescription>Update scores, status, and log match events. Changes will be saved to Supabase.</CardDescription>
          </DialogHeader>
          {selectedMatch && (
            <>
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateMatchSubmit)} className="space-y-4 py-2">
                {selectedMatch.status === 'scheduled' && (
                    <>
                        <FormField
                            control={scheduleForm.control} 
                            name="teamAId" 
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Team A (Scheduled)</FormLabel>
                                <Select 
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        setSelectedMatch(prev => prev ? {...prev, teamA: teams.find(t => t.id === value) || prev.teamA} : null);
                                    }} 
                                    defaultValue={selectedMatch.teamA.id} 
                                    disabled={isLoading || teams.length === 0}
                                >
                                    <FormControl>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                         <FormField
                            control={scheduleForm.control} 
                            name="teamBId" 
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Team B (Scheduled)</FormLabel>
                                 <Select 
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        setSelectedMatch(prev => prev ? {...prev, teamB: teams.find(t => t.id === value) || prev.teamB} : null);
                                    }} 
                                    defaultValue={selectedMatch.teamB.id} 
                                    disabled={isLoading || teams.length === 0}
                                >
                                    <FormControl>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {teams.map(team => (
                                        <SelectItem key={team.id} value={team.id} disabled={team.id === selectedMatch.teamA.id}>{team.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>Date & Time (Scheduled)</FormLabel>
                            <Input 
                                type="datetime-local" 
                                defaultValue={new Date(selectedMatch.dateTime.getTime() - selectedMatch.dateTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                                onChange={(e) => setSelectedMatch(prev => prev ? {...prev, dateTime: new Date(e.target.value)} : null)}
                            />
                        </FormItem>
                        <FormItem>
                            <FormLabel>Venue (Scheduled)</FormLabel>
                            <Input 
                                defaultValue={selectedMatch.venue}
                                onChange={(e) => setSelectedMatch(prev => prev ? {...prev, venue: e.target.value} : null)}
                            />
                        </FormItem>
                    </>
                )}
                <FormField
                  control={updateForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="live">Live</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {updateForm.watch('status') !== 'scheduled' && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={updateForm.control}
                      name="scoreA"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{selectedMatch.teamA.name} Score</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={updateForm.control}
                      name="scoreB"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{selectedMatch.teamB.name} Score</FormLabel>
                          <FormControl>
                             <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </form>
            </Form>
            
            <div className="mt-6 space-y-6">
              <h3 className="text-lg font-medium border-t pt-4">Manage Match Events</h3>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Recorded Events ({selectedMatch.events?.length || 0}):</h4>
                {selectedMatch.events && selectedMatch.events.length > 0 ? (
                  <ul className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                    {selectedMatch.events.map(event => (
                      <li key={event.id} className="text-xs flex justify-between items-center p-1 bg-muted/50 rounded">
                        <span>
                          {event.time} - {event.type.toUpperCase()}: {event.playerName}
                          {event.type === 'card' && ` (${(event as CardEvent).cardType})`}
                          {event.type === 'card' && (event as CardEvent).details && ` - ${(event as CardEvent).details}`}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveEvent(event.id)}>
                          <Trash2 className="h-3 w-3 text-destructive"/>
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-xs text-muted-foreground">No events recorded yet.</p>}
              </div>

              <div className="space-y-2 border p-3 rounded-md">
                 <h4 className="text-sm font-semibold flex items-center"><Goal className="h-4 w-4 mr-1 text-green-500"/>Add Goal Event</h4>
                 <Select onValueChange={setGoalPlayerId} value={goalPlayerId}>
                    <SelectTrigger><SelectValue placeholder="Select Player" /></SelectTrigger>
                    <SelectContent>
                        {availablePlayersForEvents.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.teamName})</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
                 <Input type="text" placeholder="Time (e.g., 45+2')" value={goalTime} onChange={e => setGoalTime(e.target.value)} />
                 <Button type="button" size="sm" onClick={handleAddGoal} disabled={!goalPlayerId || !goalTime}>Add Goal to List</Button>
              </div>

              <div className="space-y-2 border p-3 rounded-md">
                 <h4 className="text-sm font-semibold flex items-center"><CreditCardIcon className="h-4 w-4 mr-1 text-yellow-500"/>Add Card Event</h4>
                 <Select onValueChange={setCardPlayerId} value={cardPlayerId}>
                    <SelectTrigger><SelectValue placeholder="Select Player" /></SelectTrigger>
                    <SelectContent>
                        {availablePlayersForEvents.map(p => (
                             <SelectItem key={p.id} value={p.id}>{p.name} ({p.teamName})</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
                 <Select onValueChange={(v) => setCardType(v as 'yellow' | 'red')} value={cardType}>
                    <SelectTrigger><SelectValue placeholder="Select Card Type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="yellow">Yellow</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                    </SelectContent>
                 </Select>
                 <Input type="text" placeholder="Time (e.g., 60')" value={cardTime} onChange={e => setCardTime(e.target.value)} />
                 <Input type="text" placeholder="Details (optional)" value={cardDetails} onChange={e => setCardDetails(e.target.value)} />
                 <Button type="button" size="sm" onClick={handleAddCard} disabled={!cardPlayerId || !cardTime}>Add Card to List</Button>
              </div>
            </div>
            <DialogFooter className="mt-6 border-t pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                    type="button" 
                    onClick={() => updateForm.handleSubmit(onUpdateMatchSubmit)()} 
                    disabled={isUpdatingMatch}
                >
                    {isUpdatingMatch ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving All Changes...</> : "Save All Changes"}
                </Button>
            </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
    

    
