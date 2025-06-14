
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Users, Edit, Trash2, PlusCircle, UserPlus, Loader2 } from 'lucide-react';
import { placeholderTeamLogo } from '@/lib/data';
import type { Team, Player } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';

const playerSchema = z.object({
  name: z.string().min(2, "Player name must be at least 2 characters."),
  shirt_number: z.coerce.number().min(1, "Shirt number must be 1 or greater.").max(999, "Shirt number must be 999 or less."),
});
type PlayerFormValues = z.infer<typeof playerSchema>;

const teamSchema = z.object({
  name: z.string().min(2, { message: "Team name must be at least 2 characters." }),
  coachName: z.string().min(2, { message: "Coach name must be at least 2 characters." }),
  logoFile: z.instanceof(File).optional(),
  logoUrl: z.string().optional(), 
});
type TeamFormValues = z.infer<typeof teamSchema>;

const mapSupabaseTeamToLocal = (supabaseTeam: any, players: Player[] = []): Team => {
  return {
    id: supabaseTeam.id,
    name: supabaseTeam.name,
    coachName: supabaseTeam.coach_name,
    logoUrl: supabaseTeam.logo_url || placeholderTeamLogo(supabaseTeam.name),
    players: players, 
    created_at: supabaseTeam.created_at,
  };
};

const mapSupabasePlayerToLocal = (supabasePlayer: any): Player => {
  return {
    id: supabasePlayer.id,
    name: supabasePlayer.name,
    shirt_number: supabasePlayer.shirt_number,
    team_id: supabasePlayer.team_id,
    created_at: supabasePlayer.created_at,
  };
};


export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);
  const [isSubmittingPlayer, setIsSubmittingPlayer] = useState(false);
  const { toast } = useToast();
  
  const [selectedTeamForPlayers, setSelectedTeamForPlayers] = useState<Team | null>(null);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const teamForm = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: '', coachName: '', logoUrl: '' },
  });

  const playerForm = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: { name: '', shirt_number: undefined },
  });

  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching teams:', error);
        toast({ variant: "destructive", title: "Error fetching teams", description: error.message });
        setTeams([]);
      } else {
        setTeams(data.map(team => mapSupabaseTeamToLocal(team)) || []);
      }
      setIsLoading(false);
    };
    fetchTeams();
  }, [toast]);

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      teamForm.setValue('logoFile', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
      teamForm.setValue('logoFile', undefined);
    }
  };

  const onTeamSubmit: SubmitHandler<TeamFormValues> = async (data) => {
    setIsSubmittingTeam(true);
    let logoUrlToSave = placeholderTeamLogo(data.name);

    if (data.logoFile) {
      const file = data.logoFile;
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const filePath = `public/${fileName}`; 

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('team-logos') 
        .upload(filePath, file);

      if (uploadError) {
        toast({ variant: "destructive", title: "Logo Upload Failed", description: uploadError.message });
        setIsSubmittingTeam(false);
        return;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('team-logos')
        .getPublicUrl(filePath);
      
      logoUrlToSave = publicUrlData.publicUrl;
    }
    
    const { data: newTeamData, error: insertError } = await supabase
      .from('teams')
      .insert([{
        name: data.name,
        coach_name: data.coachName,
        logo_url: logoUrlToSave,
      }])
      .select()
      .single();

    if (insertError) {
      toast({ variant: "destructive", title: "Failed to Add Team", description: insertError.message });
    } else if (newTeamData) {
      setTeams(prevTeams => [mapSupabaseTeamToLocal(newTeamData), ...prevTeams]);
      toast({
        title: "Team Added",
        description: `${data.name} has been successfully added.`,
      });
      teamForm.reset();
      setLogoPreview(null);
    }
    setIsSubmittingTeam(false);
  };
  
  const fetchPlayersForTeam = async (teamId: string) => {
    setIsLoadingPlayers(true);
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('shirt_number', { ascending: true });
    
    setIsLoadingPlayers(false);
    if (error) {
      toast({ variant: "destructive", title: `Error fetching players for ${selectedTeamForPlayers?.name}`, description: error.message });
      return [];
    }
    return data.map(mapSupabasePlayerToLocal);
  };

  const openPlayerManagementModal = async (team: Team) => {
    setSelectedTeamForPlayers(team); // Set team first for the modal title
    setIsPlayerModalOpen(true);
    playerForm.reset(); 
    const players = await fetchPlayersForTeam(team.id);
    setSelectedTeamForPlayers(currentTeam => currentTeam ? {...currentTeam, players: players} : null);
  };

  const onPlayerSubmit: SubmitHandler<PlayerFormValues> = async (data) => {
    if (!selectedTeamForPlayers) return;
    setIsSubmittingPlayer(true);

    const { data: newPlayerData, error } = await supabase
      .from('players')
      .insert([{
        name: data.name,
        shirt_number: data.shirt_number,
        team_id: selectedTeamForPlayers.id,
      }])
      .select()
      .single();

    setIsSubmittingPlayer(false);
    if (error) {
      toast({ variant: "destructive", title: "Failed to Add Player", description: error.message });
    } else if (newPlayerData) {
      const newPlayer = mapSupabasePlayerToLocal(newPlayerData);
      setSelectedTeamForPlayers(prevTeam => {
        if (!prevTeam) return null;
        const updatedPlayers = [...(prevTeam.players || []), newPlayer].sort((a,b) => a.shirt_number - b.shirt_number);
        // Also update the main teams list's player count/data if needed for immediate reflection outside modal
        setTeams(prevTeams => prevTeams.map(t => t.id === prevTeam.id ? {...t, players: updatedPlayers} : t));
        return { ...prevTeam, players: updatedPlayers };
      });
      toast({ title: "Player Added", description: `${data.name} added to ${selectedTeamForPlayers.name}.` });
      playerForm.reset();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Users className="mr-3 h-8 w-8" /> Manage Teams
        </h1>
        <p className="text-muted-foreground">
          Add new teams and manage their player rosters. Team data is stored in Supabase.
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
              <FormField
                control={teamForm.control}
                name="logoFile"
                render={() => ( 
                  <FormItem>
                    <FormLabel>Team Logo</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" onChange={handleLogoFileChange} className="[&::file-selector-button]:mr-2 [&::file-selector-button]:border-none [&::file-selector-button]:bg-primary/10 [&::file-selector-button]:text-primary [&::file-selector-button]:rounded-md [&::file-selector-button]:px-2 [&::file-selector-button]:py-1 hover:[&::file-selector-button]:bg-primary/20" />
                    </FormControl>
                    {logoPreview && (
                      <div className="mt-2 p-1 border rounded-md inline-block bg-muted/50">
                        <Image src={logoPreview} alt="Logo preview" width={64} height={64} className="rounded-md" data-ai-hint="logo preview"/>
                      </div>
                    )}
                    <FormDescription>Select an image file for the team logo. If left blank, a placeholder will be used.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmittingTeam || isLoading}>
                {isSubmittingTeam ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding Team...</> : "Add Team"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Teams ({teams.length})</CardTitle>
          <CardDescription>List of all teams participating in the tournament. Player counts reflect data from Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading teams...</p>
            </div>
          ) : (
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
                      No teams added yet. Add one using the form above.
                    </TableCell>
                  </TableRow>
                ) : (
                  teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <Image src={team.logoUrl || placeholderTeamLogo(team.name)} alt={`${team.name} logo`} width={40} height={40} className="rounded-full" data-ai-hint="team logo"/>
                      </TableCell>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>{team.coachName}</TableCell>
                      <TableCell>{team.players?.length || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="mr-2" onClick={() => openPlayerManagementModal(team)}>
                          <UserPlus className="mr-1 h-4 w-4" /> Manage Players
                        </Button>
                         <Button variant="ghost" size="icon" className="mr-2" onClick={() => alert(`Edit for ${team.name} (Supabase) coming soon!`)} disabled={true}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Team</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => alert(`Delete for ${team.name} (Supabase) coming soon!`)} disabled={true}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Team</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isPlayerModalOpen} onOpenChange={setIsPlayerModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Players for {selectedTeamForPlayers?.name}</DialogTitle>
            <CardDescription>Add new players to the team roster. Players are stored in Supabase.</CardDescription>
          </DialogHeader>
          <Form {...playerForm}>
            <form onSubmit={playerForm.handleSubmit(onPlayerSubmit)} className="space-y-4 pt-4">
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
                name="shirt_number"
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
              <Button type="submit" disabled={isSubmittingPlayer || isLoadingPlayers}>
                {isSubmittingPlayer ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : "Add Player"}
              </Button>
            </form>
          </Form>
          <div className="mt-6">
            <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Current Players ({selectedTeamForPlayers?.players?.length || 0})</h4>
            {isLoadingPlayers ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading players...
              </div>
            ) : selectedTeamForPlayers?.players && selectedTeamForPlayers.players.length > 0 ? (
              <ScrollArea className="h-[200px] border rounded-md p-2">
                <ul className="space-y-1 text-sm">
                  {selectedTeamForPlayers.players.map(player => (
                    <li key={player.id} className="flex justify-between items-center p-1.5 bg-muted/50 rounded hover:bg-muted transition-colors">
                      <span>{player.name} (#{player.shirt_number})</span>
                      {/* Delete player button can be added here in future */}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No players added yet for this team.</p>
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
