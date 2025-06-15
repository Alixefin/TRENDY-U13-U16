
"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Edit, Trash2, PlusCircle, UserPlus, Loader2, Pencil } from 'lucide-react';
import { placeholderTeamLogo } from '@/lib/data';
import type { Team, Player } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import { ScrollArea } from '@/components/ui/scroll-area';

const playerSchema = z.object({
  name: z.string().min(2, "Player name must be at least 2 characters."),
  shirt_number: z.coerce.number().min(1, "Shirt number must be 1 or greater.").max(999, "Shirt number must be 999 or less."),
});
type PlayerFormValues = z.infer<typeof playerSchema>;

const teamSchema = z.object({
  name: z.string().min(2, { message: "Team name must be at least 2 characters." }),
  coachName: z.string().min(2, { message: "Coach name must be at least 2 characters." }),
  logoFile: z.instanceof(File).optional(),
  logoUrl: z.string().url().optional().nullable(), // To hold existing URL for edit
});
type TeamFormValues = z.infer<typeof teamSchema>;

const mapSupabaseTeamToLocal = (supabaseTeam: any, players: Player[] = []): Team => {
  return {
    id: supabaseTeam.id,
    name: supabaseTeam.name,
    coachName: supabaseTeam.coach_name,
    logoUrl: supabaseTeam.logo_url || placeholderTeamLogo(supabaseTeam.name),
    players: players.map(p => ({ // Ensure players are mapped correctly
        id: p.id,
        name: p.name,
        shirt_number: p.shirt_number,
        team_id: p.team_id,
        created_at: p.created_at,
    })),
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
  
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null); // For both add and edit

  const addTeamForm = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: '', coachName: '', logoFile: undefined, logoUrl: '' },
  });

  const editTeamForm = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: '', coachName: '', logoFile: undefined, logoUrl: '' },
  });

  const playerForm = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: { name: '', shirt_number: undefined },
  });

  const fetchAllTeams = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, coach_name, logo_url, created_at, players (id, name, shirt_number)') // Fetch player count via relation
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching teams:', error);
      toast({ variant: "destructive", title: "Error fetching teams", description: error.message });
      setTeams([]);
    } else {
       setTeams(data.map(team => ({
        ...mapSupabaseTeamToLocal(team),
        players: (team.players as Player[] || []) // Ensure players from relation are correctly typed
      })) || []);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchAllTeams();
  }, [fetchAllTeams]);

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>, formType: 'add' | 'edit') => {
    const file = event.target.files?.[0];
    const currentForm = formType === 'add' ? addTeamForm : editTeamForm;
    if (file) {
      currentForm.setValue('logoFile', file);
      currentForm.setValue('logoUrl', URL.createObjectURL(file)); // For preview
      setLogoPreview(URL.createObjectURL(file));
    } else {
      currentForm.setValue('logoFile', undefined);
      const existingUrl = formType === 'edit' && teamToEdit ? teamToEdit.logoUrl : null;
      currentForm.setValue('logoUrl', existingUrl); // Revert to original if file cleared
      setLogoPreview(existingUrl);
    }
  };

  const onAddTeamSubmit: SubmitHandler<TeamFormValues> = async (data) => {
    setIsSubmittingTeam(true);
    let logoUrlToSave = placeholderTeamLogo(data.name);

    if (data.logoFile) {
      const file = data.logoFile;
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const filePath = `public/${fileName}`; 

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('team-logos') 
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast({ variant: "destructive", title: "Logo Upload Failed", description: uploadError.message });
        setIsSubmittingTeam(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('team-logos').getPublicUrl(filePath);
      logoUrlToSave = publicUrlData.publicUrl;
    }
    
    const { data: newTeamData, error: insertError } = await supabase
      .from('teams')
      .insert([{ name: data.name, coach_name: data.coachName, logo_url: logoUrlToSave }])
      .select('*, players (id, name, shirt_number)')
      .single();

    if (insertError) {
      toast({ variant: "destructive", title: "Failed to Add Team", description: insertError.message });
    } else if (newTeamData) {
      const newTeamWithPlayers = { ...mapSupabaseTeamToLocal(newTeamData), players: (newTeamData.players as Player[] || [])};
      setTeams(prevTeams => [newTeamWithPlayers, ...prevTeams]);
      toast({ title: "Team Added", description: `${data.name} has been successfully added.` });
      addTeamForm.reset({ name: '', coachName: '', logoFile: undefined, logoUrl: '' });
      setLogoPreview(null);
    }
    setIsSubmittingTeam(false);
  };

  const onEditTeamSubmit: SubmitHandler<TeamFormValues> = async (data) => {
    if (!teamToEdit) return;
    setIsSubmittingTeam(true);
    let logoUrlToUpdate = teamToEdit.logoUrl; // Start with existing logo

    if (data.logoFile) { // If a new logo file is provided
      const file = data.logoFile;
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const filePath = `public/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('team-logos')
        .upload(filePath, file, { upsert: true }); // upsert will overwrite if path is same, good for edits

      if (uploadError) {
        toast({ variant: "destructive", title: "Logo Upload Failed", description: uploadError.message });
        setIsSubmittingTeam(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('team-logos').getPublicUrl(filePath);
      logoUrlToUpdate = publicUrlData.publicUrl;
    }
    
    const { data: updatedTeamData, error: updateError } = await supabase
      .from('teams')
      .update({ name: data.name, coach_name: data.coachName, logo_url: logoUrlToUpdate })
      .eq('id', teamToEdit.id)
      .select('*, players (id, name, shirt_number)')
      .single();

    if (updateError) {
      toast({ variant: "destructive", title: "Failed to Update Team", description: updateError.message });
    } else if (updatedTeamData) {
      const updatedTeamWithPlayers = { ...mapSupabaseTeamToLocal(updatedTeamData), players: (updatedTeamData.players as Player[] || [])};
      setTeams(prevTeams => prevTeams.map(t => t.id === teamToEdit.id ? updatedTeamWithPlayers : t));
      toast({ title: "Team Updated", description: `${data.name} has been successfully updated.` });
      setIsEditTeamModalOpen(false);
      setTeamToEdit(null);
      editTeamForm.reset();
      setLogoPreview(null);
    }
    setIsSubmittingTeam(false);
  };
  
  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    // Check dependencies: matches
    const { count: matchCount, error: matchError } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`);

    if (matchError) {
      toast({ variant: "destructive", title: `Error checking matches for ${teamName}`, description: matchError.message });
      return;
    }
    if (matchCount && matchCount > 0) {
      toast({ variant: "destructive", title: `Cannot Delete ${teamName}`, description: "Team is scheduled in matches. Please remove from matches first." });
      return;
    }

    // Check dependencies: group_teams
    const { count: groupTeamCount, error: groupTeamError } = await supabase
      .from('group_teams')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId);
    
    if (groupTeamError) {
      toast({ variant: "destructive", title: `Error checking group assignments for ${teamName}`, description: groupTeamError.message });
      return;
    }
    if (groupTeamCount && groupTeamCount > 0) {
      toast({ variant: "destructive", title: `Cannot Delete ${teamName}`, description: "Team is assigned to groups. Please remove from groups first." });
      return;
    }

    // Delete players
    const { error: playerDeleteError } = await supabase
      .from('players')
      .delete()
      .eq('team_id', teamId);

    if (playerDeleteError) {
      toast({ variant: "destructive", title: `Error Deleting Players for ${teamName}`, description: playerDeleteError.message });
      return;
    }

    // Delete team
    const { error: teamDeleteError } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (teamDeleteError) {
      toast({ variant: "destructive", title: `Error Deleting Team ${teamName}`, description: teamDeleteError.message });
    } else {
      setTeams(prevTeams => prevTeams.filter(t => t.id !== teamId));
      toast({ title: "Team Deleted", description: `${teamName} and its players have been removed.` });
    }
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
    setSelectedTeamForPlayers(team);
    setIsPlayerModalOpen(true);
    playerForm.reset(); 
    const players = await fetchPlayersForTeam(team.id);
    setSelectedTeamForPlayers(currentTeam => {
        const updatedTeam = currentTeam ? {...currentTeam, players: players} : null;
        if(updatedTeam){
            setTeams(prevTeams => prevTeams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
        }
        return updatedTeam;
    });
  };

  const openEditTeamModal = (team: Team) => {
    setTeamToEdit(team);
    editTeamForm.reset({
      name: team.name,
      coachName: team.coachName,
      logoFile: undefined, // Clear file input, user must re-select if changing
      logoUrl: team.logoUrl // This is for display and keeping existing if no new file
    });
    setLogoPreview(team.logoUrl);
    setIsEditTeamModalOpen(true);
  };

  const onPlayerSubmit: SubmitHandler<PlayerFormValues> = async (data) => {
    if (!selectedTeamForPlayers) return;
    setIsSubmittingPlayer(true);

    const { data: newPlayerData, error } = await supabase
      .from('players')
      .insert([{ name: data.name, shirt_number: data.shirt_number, team_id: selectedTeamForPlayers.id }])
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
        setTeams(prevTeamsList => prevTeamsList.map(t => {
          if (t.id === prevTeam.id) return { ...t, players: updatedPlayers };
          return t;
        }));
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
          Add, edit, or delete teams and manage their player rosters.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><PlusCircle className="mr-2 h-5 w-5" /> Add New Team</CardTitle>
          <CardDescription>Fill in the details below to add a new team.</CardDescription>
        </CardHeader>
        <Form {...addTeamForm}>
          <form onSubmit={addTeamForm.handleSubmit(onAddTeamSubmit)}>
            <CardContent className="space-y-4">
              <FormField control={addTeamForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Team Name</FormLabel><FormControl><Input placeholder="e.g., The Mighty Ducks" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={addTeamForm.control} name="coachName" render={({ field }) => (<FormItem><FormLabel>Coach Name</FormLabel><FormControl><Input placeholder="e.g., Gordon Bombay" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={addTeamForm.control} name="logoFile" render={({ field }) => ( 
                  <FormItem>
                    <FormLabel>Team Logo</FormLabel>
                    <FormControl><Input type="file" accept="image/*" onChange={(e) => handleLogoFileChange(e, 'add')} className="[&::file-selector-button]:mr-2 [&::file-selector-button]:border-none [&::file-selector-button]:bg-primary/10 [&::file-selector-button]:text-primary [&::file-selector-button]:rounded-md [&::file-selector-button]:px-2 [&::file-selector-button]:py-1 hover:[&::file-selector-button]:bg-primary/20" /></FormControl>
                    {logoPreview && addTeamForm.getValues("logoFile") && (<div className="mt-2 p-1 border rounded-md inline-block bg-muted/50"><Image src={logoPreview} alt="Logo preview" width={64} height={64} className="rounded-md" data-ai-hint="logo preview"/></div>)}
                    <FormDescription>Select an image file. Placeholder used if blank.</FormDescription><FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter><Button type="submit" disabled={isSubmittingTeam || isLoading}>{isSubmittingTeam && !teamToEdit ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : "Add Team"}</Button></CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader><CardTitle>Current Teams ({teams.length})</CardTitle><CardDescription>List of all teams. Player counts reflect Supabase data.</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? (<div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading teams...</p></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead className="w-[80px]">Logo</TableHead><TableHead>Name</TableHead><TableHead>Coach</TableHead><TableHead>Players</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {teams.length === 0 ? (<TableRow><TableCell colSpan={5} className="text-center h-24">No teams added yet.</TableCell></TableRow>
                ) : (
                  teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell><Image src={team.logoUrl || placeholderTeamLogo(team.name)} alt={`${team.name} logo`} width={40} height={40} className="rounded-full" data-ai-hint="team logo"/></TableCell>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>{team.coachName}</TableCell>
                      <TableCell>{team.players?.length || 0}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="sm" onClick={() => openPlayerManagementModal(team)}><UserPlus className="mr-1 h-4 w-4" /> Players</Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditTeamModal(team)}><Pencil className="h-4 w-4" /><span className="sr-only">Edit</span></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /><span className="sr-only">Delete</span></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete "{team.name}"?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the team and all its players. This action cannot be undone. Ensure the team is not part of any matches or groups.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteTeam(team.id, team.name)} className="bg-destructive hover:bg-destructive/90">Delete Team</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Team Modal */}
      <Dialog open={isEditTeamModalOpen} onOpenChange={(isOpen) => { setIsEditTeamModalOpen(isOpen); if (!isOpen) { setTeamToEdit(null); setLogoPreview(null); editTeamForm.reset(); }}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Team: {teamToEdit?.name}</DialogTitle><CardDescription>Update team details below.</CardDescription></DialogHeader>
          <Form {...editTeamForm}>
            <form onSubmit={editTeamForm.handleSubmit(onEditTeamSubmit)} className="space-y-4 pt-4">
              <FormField control={editTeamForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Team Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editTeamForm.control} name="coachName" render={({ field }) => (<FormItem><FormLabel>Coach Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editTeamForm.control} name="logoFile" render={() => ( 
                  <FormItem>
                    <FormLabel>Team Logo</FormLabel>
                    <FormControl><Input type="file" accept="image/*" onChange={(e) => handleLogoFileChange(e, 'edit')} className="[&::file-selector-button]:mr-2 [&::file-selector-button]:border-none [&::file-selector-button]:bg-primary/10 [&::file-selector-button]:text-primary [&::file-selector-button]:rounded-md [&::file-selector-button]:px-2 [&::file-selector-button]:py-1 hover:[&::file-selector-button]:bg-primary/20" /></FormControl>
                    {logoPreview && (<div className="mt-2 p-1 border rounded-md inline-block bg-muted/50"><Image src={logoPreview} alt="Logo preview" width={64} height={64} className="rounded-md" data-ai-hint="logo preview"/></div>)}
                    <FormDescription>Select new logo if replacing. Current logo shown.</FormDescription><FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-4">
                <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmittingTeam}>{isSubmittingTeam ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Manage Players Modal */}
      <Dialog open={isPlayerModalOpen} onOpenChange={setIsPlayerModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Manage Players for {selectedTeamForPlayers?.name}</DialogTitle><CardDescription>Add new players to the team roster.</CardDescription></DialogHeader>
          <Form {...playerForm}>
            <form onSubmit={playerForm.handleSubmit(onPlayerSubmit)} className="space-y-4 pt-4">
              <FormField control={playerForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Player Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={playerForm.control} name="shirt_number" render={({ field }) => (<FormItem><FormLabel>Shirt Number</FormLabel><FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={isSubmittingPlayer || isLoadingPlayers}>{isSubmittingPlayer ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : "Add Player"}</Button>
            </form>
          </Form>
          <div className="mt-6">
            <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Current Players ({selectedTeamForPlayers?.players?.length || 0})</h4>
            {isLoadingPlayers ? (<div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</div>
            ) : selectedTeamForPlayers?.players && selectedTeamForPlayers.players.length > 0 ? (
              <ScrollArea className="h-[200px] border rounded-md p-2">
                <ul className="space-y-1 text-sm">
                  {selectedTeamForPlayers.players.map(player => (
                    <li key={player.id} className="flex justify-between items-center p-1.5 bg-muted/50 rounded hover:bg-muted transition-colors">
                      <span>{player.name} (#{player.shirt_number})</span>
                      {/* Delete player button for future:
                       <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => handleDeletePlayer(player.id, player.name)}>
                         <Trash2 className="h-3 w-3"/>
                       </Button> 
                       */}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (<p className="text-sm text-muted-foreground py-4 text-center">No players added yet.</p>)}
          </div>
          <DialogFooter className="mt-4"><DialogClose asChild><Button variant="outline">Close</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
