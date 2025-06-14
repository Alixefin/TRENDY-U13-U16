
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Users, Edit, Trash2, PlusCircle, UserPlus } from 'lucide-react';
import { mockTeams as initialTeams, placeholderTeamLogo } from '@/lib/data';
import type { Team, Player } from '@/types';
import { useToast } from "@/hooks/use-toast";

const playerSchema = z.object({
  name: z.string().min(2, "Player name must be at least 2 characters."),
  shirtNumber: z.coerce.number().min(1, "Shirt number must be 1 or greater.").max(99, "Shirt number must be 99 or less."),
});
type PlayerFormValues = z.infer<typeof playerSchema>;

const teamSchema = z.object({
  name: z.string().min(2, { message: "Team name must be at least 2 characters." }),
  coachName: z.string().min(2, { message: "Coach name must be at least 2 characters." }),
  logoFile: z.instanceof(File).optional(),
  logoUrl: z.string().optional(), // For existing URL or data URI preview
});
type TeamFormValues = z.infer<typeof teamSchema>;

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [selectedTeamForPlayers, setSelectedTeamForPlayers] = useState<Team | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const teamForm = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: '', coachName: '', logoUrl: '' },
  });

  const playerForm = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: { name: '', shirtNumber: undefined },
  });

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      teamForm.setValue('logoFile', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        teamForm.setValue('logoUrl', reader.result as string); // Store as data URI for submission if no URL
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
      teamForm.setValue('logoFile', undefined);
      teamForm.setValue('logoUrl', ''); // Clear if file is removed
    }
  };

  const onTeamSubmit: SubmitHandler<TeamFormValues> = async (data) => {
    setIsSubmitting(true);
    let finalLogoUrl = data.logoUrl || ''; // Use data URI from preview if available

    if (data.logoFile && !finalLogoUrl.startsWith('data:image')) {
      // This case should ideally not happen if preview sets data.logoUrl
      // but as a fallback, we re-process. This is more for direct URL input.
      finalLogoUrl = placeholderTeamLogo(data.name); // Fallback if file processing fails or URL is bad
    } else if (!finalLogoUrl) {
      finalLogoUrl = placeholderTeamLogo(data.name);
    }
    
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: data.name,
      coachName: data.coachName,
      logoUrl: finalLogoUrl,
      players: [],
    };
    setTeams(prevTeams => [...prevTeams, newTeam]);
    toast({
      title: "Team Added",
      description: `${data.name} has been successfully added.`,
    });
    teamForm.reset();
    setLogoPreview(null);
    setIsSubmitting(false);
  };

  const onPlayerSubmit: SubmitHandler<PlayerFormValues> = (data) => {
    if (!selectedTeamForPlayers) return;

    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name: data.name,
      shirtNumber: data.shirtNumber,
    };

    setTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === selectedTeamForPlayers.id
          ? { ...team, players: [...team.players, newPlayer] }
          : team
      )
    );
    toast({ title: "Player Added", description: `${data.name} added to ${selectedTeamForPlayers.name}.` });
    playerForm.reset();
    // Keep modal open to add more players or setIsPlayerModalOpen(false);
  };
  
  const openPlayerManagementModal = (team: Team) => {
    setSelectedTeamForPlayers(team);
    playerForm.reset(); // Reset form for new player entry
    setIsPlayerModalOpen(true);
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
        <Form {...teamForm}>
          <form onSubmit={teamForm.handleSubmit(onTeamSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={teamForm.control}
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
                control={teamForm.control}
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
              <FormItem>
                <FormLabel>Team Logo</FormLabel>
                <FormControl>
                  <Input type="file" accept="image/*" onChange={handleLogoFileChange} />
                </FormControl>
                {logoPreview && (
                  <div className="mt-2">
                    <Image src={logoPreview} alt="Logo preview" width={64} height={64} className="rounded-md" data-ai-hint="logo preview"/>
                  </div>
                )}
                <FormDescription>Select an image file for the team logo. If left blank, a placeholder will be used.</FormDescription>
                <FormMessage />
              </FormItem>
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
                <TableHead>Players</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
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
                    <TableCell>{team.players.length}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="mr-2" onClick={() => openPlayerManagementModal(team)}>
                        <UserPlus className="mr-1 h-4 w-4" /> Manage Players
                      </Button>
                      <Button variant="ghost" size="icon" className="mr-2" onClick={() => alert(`Edit functionality for ${team.name} coming soon!`)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit Team</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => alert(`Delete functionality for ${team.name} coming soon!`)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Team</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Player Management Modal */}
      <Dialog open={isPlayerModalOpen} onOpenChange={setIsPlayerModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Players for {selectedTeamForPlayers?.name}</DialogTitle>
            <CardDescription>Add new players to the team roster.</CardDescription>
          </DialogHeader>
          <Form {...playerForm}>
            <form onSubmit={playerForm.handleSubmit(onPlayerSubmit)} className="space-y-4 py-4">
              <FormField
                control={playerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={playerForm.control}
                name="shirtNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shirt Number</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Add Player</Button>
            </form>
          </Form>
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Current Players ({selectedTeamForPlayers?.players?.length || 0})</h4>
            {selectedTeamForPlayers?.players && selectedTeamForPlayers.players.length > 0 ? (
              <ul className="max-h-40 overflow-y-auto space-y-1 text-sm">
                {selectedTeamForPlayers.players.map(player => (
                  <li key={player.id} className="flex justify-between items-center p-1 bg-muted/50 rounded">
                    <span>{player.name} (#{player.shirtNumber})</span>
                    {/* Future: Add delete player button here */}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No players added yet.</p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
