
"use client";

import React, { useState } from 'react';
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
import { CalendarClock, PlusCircle, Edit } from 'lucide-react';
import { mockMatches as initialMatches, mockTeams } from '@/lib/data';
import type { Match, Team } from '@/types';
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

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [teams] = useState<Team[]>(mockTeams);
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);
  const [isUpdatingMatch, setIsUpdatingMatch] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

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
      lineupA: [],
      lineupB: [],
    };
    setMatches(prevMatches => [...prevMatches, newMatch].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()));
    toast({ title: "Match Scheduled", description: `Match between ${teamA.name} and ${teamB.name} has been scheduled.` });
    scheduleForm.reset();
    setIsSubmittingMatch(false);
  };

  const openEditModal = (match: Match) => {
    setSelectedMatch(match);
    updateForm.reset({
      scoreA: match.scoreA ?? undefined,
      scoreB: match.scoreB ?? undefined,
      status: match.status,
    });
    setIsEditModalOpen(true);
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
            }
          : m
      )
    );
    toast({ title: "Match Updated", description: `Match details for ${selectedMatch.teamA.name} vs ${selectedMatch.teamB.name} updated.` });
    setIsUpdatingMatch(false);
    setIsEditModalOpen(false);
    setSelectedMatch(null);
  };
  
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Match: {selectedMatch?.teamA.name} vs {selectedMatch?.teamB.name}</DialogTitle>
            <CardDescription>Update scores and status for this match.</CardDescription>
          </DialogHeader>
          {selectedMatch && (
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
                  <>
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
                  </>
                )}
                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isUpdatingMatch}>
                    {isUpdatingMatch ? "Updating..." : "Update Match"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
