
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarClock, PlusCircle, Edit, Trash2, Goal, CreditCardIcon, Loader2, Users, Award, Hourglass } from 'lucide-react';
import type { Match, Team, Player, MatchEvent, GoalEvent, CardEvent, SubstitutionEvent, SupabaseMatch } from '@/types';
import type { Tables } from '@/types/supabase';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import { placeholderTeamLogo } from '@/lib/data'; 
import { ScrollArea } from '@/components/ui/scroll-area';

const matchSchema = z.object({
  teamAId: z.string().min(1, "Please select Team A."),
  teamBId: z.string().min(1, "Please select Team B."),
  dateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date and time.",
  }),
  venue: z.string().min(3, { message: "Venue must be at least 3 characters." }),
  duration: z.coerce.number().min(1, "Duration must be positive").optional(),
}).refine(data => data.teamAId !== data.teamBId, {
  message: "Team A and Team B cannot be the same.",
  path: ["teamBId"],
});
type MatchFormValues = z.infer<typeof matchSchema>;

const updateMatchSchema = z.object({
  scoreA: z.coerce.number().min(0).optional(),
  scoreB: z.coerce.number().min(0).optional(),
  status: z.enum(['scheduled', 'live', 'completed', 'halftime']),
  duration: z.coerce.number().min(1).optional().nullable(),
  playerOfTheMatchId: z.string().optional().nullable(),
});
type UpdateMatchFormValues = z.infer<typeof updateMatchSchema>;

const mapSupabaseMatchToLocal = (sm: SupabaseMatch, teamsList: Team[], allPlayers?: Player[]): Match => {
  const teamA = teamsList.find(t => t.id === sm.team_a_id);
  const teamB = teamsList.find(t => t.id === sm.team_b_id);
  
  let playerOfTheMatchObject;
  if (sm.player_of_the_match_id && allPlayers) {
    playerOfTheMatchObject = allPlayers.find(p => p.id === sm.player_of_the_match_id);
  }

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
    duration: sm.duration ?? undefined,
    playerOfTheMatchId: sm.player_of_the_match_id ?? undefined,
    playerOfTheMatch: playerOfTheMatchObject,
  };
};

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
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

  const [subPlayerOutId, setSubPlayerOutId] = useState('');
  const [subPlayerInId, setSubPlayerInId] = useState('');
  const [subTime, setSubTime] = useState('');


  const scheduleForm = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: { teamAId: '', teamBId: '', dateTime: '', venue: '', duration: 90 },
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

      const allFetchedPlayers = fetchedTeams.reduce((acc, team) => acc.concat(team.players), [] as Player[]);
      setAllPlayers(allFetchedPlayers);

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('date_time', { ascending: false });

      if (matchesError) {
        toast({ variant: "destructive", title: "Error fetching matches", description: matchesError.message });
        setMatches([]);
      } else {
        setMatches(matchesData?.map(m => mapSupabaseMatchToLocal(m as SupabaseMatch, fetchedTeams, allFetchedPlayers)) || []);
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
        duration: data.duration,
      }])
      .select()
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Failed to Schedule Match", description: error.message });
    } else if (newMatchData) {
      setMatches(prevMatches => [mapSupabaseMatchToLocal(newMatchData as SupabaseMatch, teams, allPlayers), ...prevMatches].sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()));
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
      duration: match.duration ?? undefined,
      playerOfTheMatchId: match.playerOfTheMatchId ?? undefined,
    });
    setGoalPlayerId(''); setGoalTime('');
    setCardPlayerId(''); setCardType('yellow'); setCardTime(''); setCardDetails('');
    setSubPlayerOutId(''); setSubPlayerInId(''); setSubTime('');
    setIsEditModalOpen(true);
  };
  
  const getTeamForPlayer = (playerId: string, match: Match): Team | undefined => {
    if (match.teamA?.players?.some(p => p.id === playerId)) return match.teamA;
    if (match.teamB?.players?.some(p => p.id === playerId)) return match.teamB;
    
    const teamAFromList = teams.find(t => t.id === match.teamA.id);
    if (teamAFromList?.players.some(p => p.id === playerId)) return teamAFromList;
    const teamBFromList = teams.find(t => t.id === match.teamB.id);
    if (teamBFromList?.players.some(p => p.id === playerId)) return teamBFromList;
    return undefined;
  };

  const handleAddGoal = () => {
    if (!selectedMatch || !goalPlayerId || !goalTime) {
      toast({ variant: "destructive", title: "Error", description: "Player and time are required for a goal." });
      return;
    }
    const playerTeam = getTeamForPlayer(goalPlayerId, selectedMatch);
    if (!playerTeam) { toast({ variant: "destructive", title: "Error", description: "Could not determine player's team." }); return; }
    const player = playerTeam.players.find(p => p.id === goalPlayerId);
    if (!player) { toast({ variant: "destructive", title: "Error", description: "Player not found in team." }); return; }

    const newGoalEvent: GoalEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'goal', time: goalTime, playerId: player.id, playerName: player.name, teamId: playerTeam.id,
    };
    setSelectedMatch(prev => prev ? ({ ...prev, events: [...(prev.events || []), newGoalEvent] }) : null);
    setGoalPlayerId(''); setGoalTime('');
    toast({ title: "Goal Added (Locally)", description: `${player.name} scored at ${goalTime}'. Save changes to persist.`});
  };

  const handleAddCard = () => {
    if (!selectedMatch || !cardPlayerId || !cardTime) {
      toast({ variant: "destructive", title: "Error", description: "Player, card type, and time are required." });
      return;
    }
    const playerTeam = getTeamForPlayer(cardPlayerId, selectedMatch);
    if (!playerTeam) { toast({ variant: "destructive", title: "Error", description: "Could not determine player's team." }); return; }
    const player = playerTeam.players.find(p => p.id === cardPlayerId);
    if (!player) { toast({ variant: "destructive", title: "Error", description: "Player not found in team." }); return; }
    
    let finalCardType = cardType;
    if (cardType === 'yellow') {
      const existingYellowCards = selectedMatch.events?.filter(
        event => event.type === 'card' && (event as CardEvent).cardType === 'yellow' && event.playerId === cardPlayerId
      ).length || 0;
      if (existingYellowCards >= 1) {
        finalCardType = 'red'; 
        toast({ title: "Second Yellow", description: `${player.name} received a second yellow. Recorded as Red Card.`});
      }
    }

    const newCardEvent: CardEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'card', cardType: finalCardType, time: cardTime, playerId: player.id, playerName: player.name, details: cardDetails, teamId: playerTeam.id,
    };
    setSelectedMatch(prev => prev ? ({ ...prev, events: [...(prev.events || []), newCardEvent] }) : null);
    setCardPlayerId(''); setCardTime(''); setCardType('yellow'); setCardDetails('');
    if (finalCardType === 'yellow' && cardType === 'yellow') {
        toast({ title: "Card Added (Locally)", description: `${player.name} received a ${finalCardType} card at ${cardTime}'. Save changes to persist.`});
    }
  };

  const handleAddSubstitution = () => {
    if (!selectedMatch || !subPlayerOutId || !subPlayerInId || !subTime) {
      toast({ variant: "destructive", title: "Error", description: "Player Out, Player In, and Time are required." }); return;
    }
    if (subPlayerOutId === subPlayerInId) {
      toast({ variant: "destructive", title: "Error", description: "Player In and Player Out cannot be the same." }); return;
    }
    const teamPlayerOut = getTeamForPlayer(subPlayerOutId, selectedMatch);
    const playerOut = teamPlayerOut?.players.find(p => p.id === subPlayerOutId);
    const teamPlayerInTeam = getTeamForPlayer(subPlayerInId, selectedMatch); 
    const playerIn = teamPlayerInTeam?.players.find(p => p.id === subPlayerInId);

    if (!playerOut || !playerIn ) {
      toast({ variant: "destructive", title: "Error", description: "Could not find player(s) for substitution." }); return;
    }
    if (!teamPlayerOut) { 
        toast({variant: "destructive", title: "Error", description: `Could not determine team for Player Out: ${playerOut.name}`}); return;
    }
    const newSubEvent: SubstitutionEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'substitution', time: subTime, playerOutId: playerOut.id, playerOutName: playerOut.name,
      playerInId: playerIn.id, playerInName: playerIn.name, teamId: teamPlayerOut.id,
    };
    setSelectedMatch(prev => prev ? ({ ...prev, events: [...(prev.events || []), newSubEvent] }) : null);
    setSubPlayerOutId(''); setSubPlayerInId(''); setSubTime('');
    toast({ title: "Substitution Added (Locally)", description: `${playerOut.name} out, ${playerIn.name} in at ${subTime}'. Save changes.`});
  };
  
  const handleRemoveEvent = (eventId: string) => {
    setSelectedMatch(prev => prev ? ({ ...prev, events: prev.events?.filter(event => event.id !== eventId) }) : null);
    toast({ title: "Event Removed (Locally)", description: "Save changes to persist."});
  };
  
 const recalculateAndUpdateTeamGroupStats = useCallback(async (teamId: string, groupId: string) => {
    // 1. Get all team_ids in the specified group
    const { data: groupTeamIdsData, error: groupTeamIdsError } = await supabase
      .from('group_teams')
      .select('team_id')
      .eq('group_id', groupId);

    if (groupTeamIdsError) {
      console.error(`Error fetching team IDs for group ${groupId}:`, groupTeamIdsError.message);
      toast({ variant: "destructive", title: "Standings Error", description: `Could not fetch teams for group ${groupId}.` });
      return;
    }
    const teamIdsInGroup = groupTeamIdsData.map(gt => gt.team_id);

    // 2. Fetch all 'completed' matches for the current teamId against other teams in the same group
    const { data: completedMatches, error: matchesError } = await supabase
      .from('matches')
      .select('team_a_id, team_b_id, score_a, score_b')
      .eq('status', 'completed')
      .or(`and(team_a_id.eq.${teamId},team_b_id.in.(${teamIdsInGroup.filter(id => id !== teamId).join(',')})),and(team_b_id.eq.${teamId},team_a_id.in.(${teamIdsInGroup.filter(id => id !== teamId).join(',')}))`);


    if (matchesError) {
      console.error(`Error fetching completed matches for team ${teamId} in group ${groupId}:`, matchesError.message);
      toast({ variant: "destructive", title: "Standings Error", description: `Could not fetch matches for team ${teamId}.` });
      return;
    }
    
    let played = 0;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    for (const match of completedMatches) {
      played++;
      let currentTeamScore = 0;
      let opponentScore = 0;

      if (match.team_a_id === teamId) {
        currentTeamScore = match.score_a ?? 0;
        opponentScore = match.score_b ?? 0;
      } else {
        currentTeamScore = match.score_b ?? 0;
        opponentScore = match.score_a ?? 0;
      }

      goalsFor += currentTeamScore;
      goalsAgainst += opponentScore;

      if (currentTeamScore > opponentScore) {
        won++;
      } else if (currentTeamScore < opponentScore) {
        lost++;
      } else {
        drawn++;
      }
    }

    const points = (won * 3) + (drawn * 1);

    // Update the group_teams table
    const { error: updateError } = await supabase
      .from('group_teams')
      .update({
        played,
        won,
        drawn,
        lost,
        goals_for: goalsFor,
        goals_against: goalsAgainst,
        points,
      })
      .eq('team_id', teamId)
      .eq('group_id', groupId);

    if (updateError) {
      console.error(`Error updating standings for team ${teamId} in group ${groupId}:`, updateError.message);
      toast({ variant: "destructive", title: "Standings Update Failed", description: `Failed to update standings for team ${teamId}.` });
    }
  }, [supabase, toast]);

  const triggerStandingsRecalculation = useCallback(async (teamAId: string, teamBId: string) => {
    const teamsToUpdate = [teamAId, teamBId];
    let standingsActuallyUpdated = false;

    for (const teamId of teamsToUpdate) {
      const { data: teamGroups, error: teamGroupsError } = await supabase
        .from('group_teams')
        .select('group_id')
        .eq('team_id', teamId);

      if (teamGroupsError) {
        console.error(`Error fetching groups for team ${teamId}:`, teamGroupsError.message);
        continue;
      }

      for (const groupEntry of teamGroups) {
        await recalculateAndUpdateTeamGroupStats(teamId, groupEntry.group_id);
        standingsActuallyUpdated = true;
      }
    }
    if (standingsActuallyUpdated) {
        toast({ title: "Group Standings Synchronized", description: "Relevant group standings have been recalculated and updated." });
    }

  }, [supabase, toast, recalculateAndUpdateTeamGroupStats]);


  const onUpdateMatchSubmit: SubmitHandler<UpdateMatchFormValues> = async (data) => {
    if (!selectedMatch) return;
    setIsUpdatingMatch(true);
    
    const originalStatus = selectedMatch.status;
    const originalScoreA = selectedMatch.scoreA;
    const originalScoreB = selectedMatch.scoreB;

    const updatedMatchPayload: Partial<SupabaseMatch> & {team_a_id?: string, team_b_id?: string, date_time?:string, venue?:string} = {
      score_a: (data.status !== 'scheduled' ) ? (data.scoreA ?? selectedMatch.scoreA ?? 0) : null,
      score_b: (data.status !== 'scheduled' ) ? (data.scoreB ?? selectedMatch.scoreB ?? 0) : null,
      status: data.status,
      events: selectedMatch.events || [],
      duration: data.duration,
      player_of_the_match_id: data.playerOfTheMatchId === "NONE_SELECTED_POTM_VALUE" ? null : data.playerOfTheMatchId || null,
    };
    
    // If the match was previously scheduled, allow these core details to be updated
    // This is to handle cases where a scheduled match details (like teams, time, venue) might change before it goes live.
    if (originalStatus === 'scheduled') {
        updatedMatchPayload.team_a_id = selectedMatch.teamA.id;
        updatedMatchPayload.team_b_id = selectedMatch.teamB.id;
        updatedMatchPayload.date_time = new Date(selectedMatch.dateTime).toISOString();
        updatedMatchPayload.venue = selectedMatch.venue;
    }


    const { data: updatedMatchFromDb, error } = await supabase
      .from('matches')
      .update(updatedMatchPayload)
      .eq('id', selectedMatch.id)
      .select()
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Failed to Update Match", description: error.message });
    } else if (updatedMatchFromDb) {
      const locallyMappedUpdatedMatch = mapSupabaseMatchToLocal(updatedMatchFromDb as SupabaseMatch, teams, allPlayers);
      
      // Determine if standings need recalculation
      const statusChangedToOrFromCompleted = (originalStatus === 'completed' && updatedMatchFromDb.status !== 'completed') ||
                                           (originalStatus !== 'completed' && updatedMatchFromDb.status === 'completed');
      const scoreChangedWhileCompleted = originalStatus === 'completed' && 
                                          updatedMatchFromDb.status === 'completed' &&
                                          (originalScoreA !== updatedMatchFromDb.score_a || originalScoreB !== updatedMatchFromDb.score_b);

      if (statusChangedToOrFromCompleted || scoreChangedWhileCompleted || updatedMatchFromDb.status === 'completed') {
        await triggerStandingsRecalculation(selectedMatch.teamA.id, selectedMatch.teamB.id);
      }
      
      setMatches(prevMatches =>
        prevMatches.map(m =>
          m.id === selectedMatch.id
            ? locallyMappedUpdatedMatch
            : m
        ).sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
      );
      
      toast({ title: "Match Updated", description: `Match details for ${selectedMatch.teamA.name} vs ${selectedMatch.teamB.name} updated.` });
      
      setIsEditModalOpen(false);
      setSelectedMatch(null); 
    }
    setIsUpdatingMatch(false);
  };

  const handleDeleteMatch = async (matchId: string, matchIdentifier: string) => {
    const matchToDelete = matches.find(m => m.id === matchId);
    
    // Store team IDs before deletion for standings recalculation
    const teamAId = matchToDelete?.teamA.id;
    const teamBId = matchToDelete?.teamB.id;
    const wasCompleted = matchToDelete?.status === 'completed';

    const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

    if (error) {
        toast({ variant: "destructive", title: `Error Deleting Match: ${matchIdentifier}`, description: error.message });
    } else {
        setMatches(prevMatches => prevMatches.filter(m => m.id !== matchId));
        toast({ title: "Match Deleted", description: `Match: ${matchIdentifier} has been removed.` });
        
        // If the deleted match was completed, recalculate standings for the involved teams
        if (wasCompleted && teamAId && teamBId) {
            await triggerStandingsRecalculation(teamAId, teamBId);
        }
    }
  };
  
  const playersForEventsAndPOTM = selectedMatch ? 
    [
      ...(teams.find(t => t.id === selectedMatch.teamA.id)?.players || []),
      ...(teams.find(t => t.id === selectedMatch.teamB.id)?.players || [])
    ].sort((a,b) => a.name.localeCompare(b.name))
    : [];
  
  const playersOnFieldForSubOut = selectedMatch ? playersForEventsAndPOTM : []; 
  const allAvailableSubstitutesForSubIn = selectedMatch ? playersForEventsAndPOTM : [];
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <CalendarClock className="mr-3 h-8 w-8" /> Manage Matches
        </h1>
        <p className="text-muted-foreground">
          Set up match schedules, input live scores, lineups, and log important events.
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
               <FormField
                control={scheduleForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 90" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} />
                    </FormControl>
                    <FormDescription>Default is 90 minutes if not specified.</FormDescription>
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
          <CardDescription>Overview of all scheduled, live, and completed matches.</CardDescription>
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
                      No matches found.
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
                        {(match.status === 'live' || match.status === 'completed' || match.status === 'halftime') ? `${match.scoreA ?? '-'} : ${match.scoreB ?? '-'}` : 'N/A'}
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Manage Match: {selectedMatch?.teamA.name} vs {selectedMatch?.teamB.name}</DialogTitle>
            <CardDescription>Update scores, status, and log match events.</CardDescription>
          </DialogHeader>
          {selectedMatch && (
            <ScrollArea className="max-h-[calc(90vh-150px)] pr-6">
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
                                        field.onChange(value); // RHF update
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
                                        field.onChange(value); // RHF update
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
                                        <SelectItem key={team.id} value={team.id} disabled={selectedMatch && team.id === selectedMatch.teamA.id}>{team.name}</SelectItem>
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
                                defaultValue={new Date(new Date(selectedMatch.dateTime).getTime() - new Date(selectedMatch.dateTime).getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                                onChange={(e) => {
                                    const newDateTime = new Date(e.target.value);
                                    setSelectedMatch(prev => prev ? {...prev, dateTime: newDateTime} : null);
                                    // If using RHF for these fields, update RHF as well if they are part of updateMatchSchema
                                }}
                            />
                        </FormItem>
                        <FormItem>
                            <FormLabel>Venue (Scheduled)</FormLabel>
                            <Input 
                                defaultValue={selectedMatch.venue}
                                onChange={(e) => {
                                   setSelectedMatch(prev => prev ? {...prev, venue: e.target.value} : null);
                                    // If using RHF for these fields, update RHF as well
                                }}
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
                          <SelectItem value="halftime">Half Time</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {(updateForm.watch('status') !== 'scheduled') && (
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
                <FormField
                  control={updateForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 90" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value,10) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {updateForm.watch('status') === 'completed' && (
                    <FormField
                    control={updateForm.control}
                    name="playerOfTheMatchId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Player of the Match</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select player..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="NONE_SELECTED_POTM_VALUE">None</SelectItem>
                                {playersForEventsAndPOTM.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name} (#{p.shirt_number}) - {selectedMatch.teamA.players.some(pl => pl.id === p.id) ? selectedMatch.teamA.name : selectedMatch.teamB.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 )}
              </form>
            </Form>
            
            <div className="mt-6 space-y-6">
              <h3 className="text-lg font-medium border-t pt-4">Manage Match Events</h3>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Recorded Events ({selectedMatch.events?.length || 0}):</h4>
                {selectedMatch.events && selectedMatch.events.length > 0 ? (
                  <ScrollArea className="max-h-40 border rounded-md p-2">
                    <ul className="space-y-1">
                    {selectedMatch.events.sort((a, b) => parseInt(a.time) - parseInt(b.time) || (a.time.includes('+') ? 1 : -1) - (b.time.includes('+') ? 1 : -1)).map(event => (
                      <li key={event.id} className="text-xs flex justify-between items-center p-1 bg-muted/50 rounded">
                        <span>
                          {event.time}' - {event.type.toUpperCase()}: {event.playerName}
                          {event.type === 'card' && ` (${(event as CardEvent).cardType.toUpperCase()})`}
                          {event.type === 'card' && (event as CardEvent).details && ` - ${(event as CardEvent).details}`}
                          {event.type === 'substitution' && ` (OUT: ${(event as SubstitutionEvent).playerOutName} / IN: ${(event as SubstitutionEvent).playerInName})`}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveEvent(event.id)}>
                          <Trash2 className="h-3 w-3 text-destructive"/>
                        </Button>
                      </li>
                    ))}
                  </ul>
                  </ScrollArea>
                ) : <p className="text-xs text-muted-foreground">No events recorded yet.</p>}
              </div>

              <div className="space-y-2 border p-3 rounded-md">
                 <h4 className="text-sm font-semibold flex items-center"><Goal className="h-4 w-4 mr-1 text-green-500"/>Add Goal Event</h4>
                 <Select onValueChange={setGoalPlayerId} value={goalPlayerId}>
                    <SelectTrigger><SelectValue placeholder="Select Player for Goal" /></SelectTrigger>
                    <SelectContent>
                        {playersForEventsAndPOTM.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name} (#{p.shirt_number}) - {selectedMatch.teamA.players.some(pl => pl.id === p.id) ? selectedMatch.teamA.name : selectedMatch.teamB.name}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
                 <Input type="text" placeholder="Time (e.g., 45, 45+2)" value={goalTime} onChange={e => setGoalTime(e.target.value)} />
                 <Button type="button" size="sm" onClick={handleAddGoal} disabled={!goalPlayerId || !goalTime}>Add Goal</Button>
              </div>

              <div className="space-y-2 border p-3 rounded-md">
                 <h4 className="text-sm font-semibold flex items-center"><CreditCardIcon className="h-4 w-4 mr-1 text-yellow-500"/>Add Card Event</h4>
                 <Select onValueChange={setCardPlayerId} value={cardPlayerId}>
                    <SelectTrigger><SelectValue placeholder="Select Player for Card" /></SelectTrigger>
                    <SelectContent>
                        {playersForEventsAndPOTM.map(p => (
                             <SelectItem key={p.id} value={p.id}>{p.name} (#{p.shirt_number}) - {selectedMatch.teamA.players.some(pl => pl.id === p.id) ? selectedMatch.teamA.name : selectedMatch.teamB.name}</SelectItem>
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
                 <Input type="text" placeholder="Time (e.g., 60, 90+1)" value={cardTime} onChange={e => setCardTime(e.target.value)} />
                 <Textarea placeholder="Details for card (optional)" value={cardDetails} onChange={e => setCardDetails(e.target.value)} className="min-h-[60px]" />
                 <Button type="button" size="sm" onClick={handleAddCard} disabled={!cardPlayerId || !cardTime}>Add Card</Button>
              </div>

              <div className="space-y-2 border p-3 rounded-md">
                 <h4 className="text-sm font-semibold flex items-center"><Users className="h-4 w-4 mr-1 text-blue-500"/>Add Substitution Event</h4>
                 <Select onValueChange={setSubPlayerOutId} value={subPlayerOutId}>
                    <SelectTrigger><SelectValue placeholder="Select Player Out" /></SelectTrigger>
                    <SelectContent>
                        {playersOnFieldForSubOut.map(p => ( 
                             <SelectItem key={p.id} value={p.id}>{p.name} (#{p.shirt_number}) - {selectedMatch.teamA.players.some(pl => pl.id === p.id) ? selectedMatch.teamA.name : selectedMatch.teamB.name}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
                 <Select onValueChange={setSubPlayerInId} value={subPlayerInId}>
                    <SelectTrigger><SelectValue placeholder="Select Player In" /></SelectTrigger>
                    <SelectContent>
                        {allAvailableSubstitutesForSubIn.map(p => ( 
                             <SelectItem key={p.id} value={p.id}>{p.name} (#{p.shirt_number}) - {selectedMatch.teamA.players.some(pl => pl.id === p.id) ? selectedMatch.teamA.name : selectedMatch.teamB.name}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
                 <Input type="text" placeholder="Time (e.g., 75)" value={subTime} onChange={e => setSubTime(e.target.value)} />
                 <Button type="button" size="sm" onClick={handleAddSubstitution} disabled={!subPlayerOutId || !subPlayerInId || !subTime}>Add Substitution</Button>
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
                    {isUpdatingMatch ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : "Save All Changes"}
                </Button>
            </DialogFooter>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
    

    