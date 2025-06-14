
"use client";

import React, { useState, useEffect } from 'react';
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
import { CalendarClock, PlusCircle, Edit, Trash2, Goal, CreditCardIcon } from 'lucide-react';
import { mockMatches as initialMatches, mockTeams } from '@/lib/data';
import type { Match, Team, Player, MatchEvent, GoalEvent, CardEvent } from '@/types';
import { useToast } from "@/hooks/use-toast";

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

// Schemas for adding events (not part of the main RHF form for the dialog)
const goalEventSchema = z.object({
  playerId: z.string().min(1, "Select player"),
  time: z.string().min(1, "Enter time (e.g., 45+2')"),
});
type GoalEventFormValues = z.infer<typeof goalEventSchema>;

const cardEventSchema = z.object({
  playerId: z.string().min(1, "Select player"),
  cardType: z.enum(['yellow', 'red']),
  time: z.string().min(1, "Enter time"),
  details: z.string().optional(),
});
type CardEventFormValues = z.infer<typeof cardEventSchema>;


export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [teams] = useState<Team[]>(mockTeams);
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);
  const [isUpdatingMatch, setIsUpdatingMatch] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  // Local state for adding events inside the dialog
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

  const onScheduleSubmit: SubmitHandler<MatchFormValues> = (data) => {
    setIsSubmittingMatch(true);
    const teamA = teams.find(t => t.id === data.teamAId);
    const teamB = teams.find(t => t.id === data.teamBId);

    if (!teamA || !teamB) {
      toast({ variant: "destructive", title: "Error", description: "Selected team(s) not found." });
      setIsSubmittingMatch(false);
      return;
    }

    const newMatch: Match = {
      id: `match-${Date.now()}`,
      teamA: teamA,
      teamB: teamB,
      dateTime: new Date(data.dateTime),
      venue: data.venue,
      status: 'scheduled',
      scoreA: undefined,
      scoreB: undefined,
      events: [],
      lineupA: [], // Initially empty, admin can add later if needed or default to team players
      lineupB: [],
    };
    setMatches(prevMatches => [...prevMatches, newMatch].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()));
    toast({ title: "Match Scheduled", description: `Match between ${teamA.name} and ${teamB.name} has been scheduled.` });
    scheduleForm.reset();
    setIsSubmittingMatch(false);
  };

  const openEditModal = (match: Match) => {
    setSelectedMatch({ ...match, events: match.events ? [...match.events] : [] }); // Clone to allow local modifications
    updateForm.reset({
      scoreA: match.scoreA ?? undefined,
      scoreB: match.scoreB ?? undefined,
      status: match.status,
    });
    // Reset event form fields
    setGoalPlayerId(''); setGoalTime('');
    setCardPlayerId(''); setCardType('yellow'); setCardTime(''); setCardDetails('');
    setIsEditModalOpen(true);
  };

  const handleAddGoal = () => {
    if (!selectedMatch || !goalPlayerId || !goalTime) {
      toast({ variant: "destructive", title: "Error", description: "Player and time are required for a goal." });
      return;
    }
    const allPlayers = [...(selectedMatch.lineupA || selectedMatch.teamA.players), ...(selectedMatch.lineupB || selectedMatch.teamB.players)];
    const player = allPlayers.find(p => p.id === goalPlayerId);
    if (!player) return;

    const teamIdForGoal = selectedMatch.teamA.players.some(p => p.id === playerId) ? selectedMatch.teamA.id : selectedMatch.teamB.id;


    const newGoalEvent: GoalEvent = {
      id: `event-${Date.now()}`,
      type: 'goal',
      time: goalTime,
      playerId: player.id,
      playerName: player.name,
      teamId: selectedMatch.teamA.players.find(p => p.id === player.id) ? selectedMatch.teamA.id : selectedMatch.teamB.id,
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
    const allPlayers = [...(selectedMatch.lineupA || selectedMatch.teamA.players), ...(selectedMatch.lineupB || selectedMatch.teamB.players)];
    const player = allPlayers.find(p => p.id === cardPlayerId);
    if (!player) return;
    
    const teamIdForCard = selectedMatch.teamA.players.some(p => p.id === playerId) ? selectedMatch.teamA.id : selectedMatch.teamB.id;

    const newCardEvent: CardEvent = {
      id: `event-${Date.now()}`,
      type: 'card',
      cardType: cardType,
      time: cardTime,
      playerId: player.id,
      playerName: player.name,
      details: cardDetails,
      teamId: selectedMatch.teamA.players.find(p => p.id === player.id) ? selectedMatch.teamA.id : selectedMatch.teamB.id,
    };
    setSelectedMatch(prev => prev ? ({ ...prev, events: [...(prev.events || []), newCardEvent] }) : null);
    setCardPlayerId(''); setCardTime(''); setCardType('yellow'); setCardDetails('');
    toast({ title: "Card Added (Locally)", description: `${player.name} received a ${cardType} card at ${cardTime}. Save changes to persist.`});
  };
  
  const handleRemoveEvent = (eventId: string) => {
    setSelectedMatch(prev => prev ? ({ ...prev, events: prev.events?.filter(event => event.id !== eventId) }) : null);
    toast({ title: "Event Removed (Locally)", description: "Save changes to persist."});
  };


  const onUpdateMatchSubmit: SubmitHandler<UpdateMatchFormValues> = (data) => {
    if (!selectedMatch) return;
    setIsUpdatingMatch(true);
    
    setMatches(prevMatches =>
      prevMatches.map(m =>
        m.id === selectedMatch.id
          ? { 
              ...m, 
              scoreA: data.status !== 'scheduled' ? (data.scoreA ?? m.scoreA ?? 0) : undefined,
              scoreB: data.status !== 'scheduled' ? (data.scoreB ?? m.scoreB ?? 0) : undefined,
              status: data.status,
              events: selectedMatch.events || [], // Persist locally modified events
            }
          : m
      )
    );
    toast({ title: "Match Updated", description: `Match details for ${selectedMatch.teamA.name} vs ${selectedMatch.teamB.name} updated.` });
    setIsUpdatingMatch(false);
    setIsEditModalOpen(false);
    setSelectedMatch(null);
  };

  const getPlayerTeam = (playerId: string): Team | undefined => {
    if (!selectedMatch) return undefined;
    if (selectedMatch.teamA.players.find(p => p.id === playerId)) return selectedMatch.teamA;
    if (selectedMatch.teamB.players.find(p => p.id === playerId)) return selectedMatch.teamB;
    return undefined;
  };
  
  const availablePlayersForEvents = selectedMatch ? 
    [
      ...(selectedMatch.lineupA && selectedMatch.lineupA.length > 0 ? selectedMatch.lineupA : selectedMatch.teamA.players).map(p => ({...p, teamName: selectedMatch.teamA.name})),
      ...(selectedMatch.lineupB && selectedMatch.lineupB.length > 0 ? selectedMatch.lineupB : selectedMatch.teamB.players).map(p => ({...p, teamName: selectedMatch.teamB.name}))
    ] : [];
  
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select Team A" /></SelectTrigger>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select Team B" /></SelectTrigger>
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
              <Button type="submit" disabled={isSubmittingMatch}>
                {isSubmittingMatch ? "Scheduling..." : "Schedule Match"}
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
                    No matches scheduled yet.
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
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(match)}>
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Match Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Match: {selectedMatch?.teamA.name} vs {selectedMatch?.teamB.name}</DialogTitle>
            <CardDescription>Update scores, status, and log match events.</CardDescription>
          </DialogHeader>
          {selectedMatch && (
            <>
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateMatchSubmit)} className="space-y-4 py-2">
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
                <DialogFooter className="mt-4">
                  <Button type="submit" disabled={isUpdatingMatch}>
                    {isUpdatingMatch ? "Updating Scores/Status..." : "Update Scores/Status"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
            
            {/* Events Management */}
            <div className="mt-6 space-y-6">
              <h3 className="text-lg font-medium border-t pt-4">Manage Match Events</h3>
              
              {/* Display Existing Events */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Recorded Events:</h4>
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

              {/* Add Goal Form */}
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
                 <Button type="button" size="sm" onClick={handleAddGoal} disabled={!goalPlayerId || !goalTime}>Add Goal</Button>
              </div>

              {/* Add Card Form */}
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
                 <Button type="button" size="sm" onClick={handleAddCard} disabled={!cardPlayerId || !cardTime}>Add Card</Button>
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
                    {isUpdatingMatch ? "Saving All Changes..." : "Save All Changes"}
                </Button>
            </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
