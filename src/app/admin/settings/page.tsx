
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Settings2, Loader2 } from 'lucide-react';
import { placeholderTeamLogo } from '@/lib/data';
import type { TournamentInfo } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import type { Tables } from '@/types/supabase';

type TournamentSettingsRow = Tables<'tournament_settings'>;

const settingsSchema = z.object({
  name: z.string().min(5, { message: "Tournament name must be at least 5 characters." }),
  about: z.string().min(20, { message: "About section must be at least 20 characters." }).nullable(),
  logoFile: z.instanceof(File).optional(),
  logoUrlDisplay: z.string().optional(), // Only for displaying current URL, not for submission of URL
  knockoutImageFile: z.instanceof(File).optional(),
  knockoutImageUrlDisplay: z.string().optional(), // Only for displaying current URL
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const defaultTournamentSettings: TournamentInfo = {
  id: 1,
  name: "Trendy's Tournament Tracker",
  about: "Welcome to the tournament! Update this description.",
  logoUrl: placeholderTeamLogo('TT'),
  knockoutImageUrl: `https://placehold.co/800x500/F0FAF4/50C878.png?text=Knockout+Diagram&font=poppins`,
};

// Helper to map from DB row (snake_case) to TournamentInfo (camelCase)
const mapDbRowToTournamentInfo = (dbRow: TournamentSettingsRow): TournamentInfo => {
  return {
    id: dbRow.id,
    name: dbRow.name,
    about: dbRow.about,
    logoUrl: dbRow.logo_url,
    knockoutImageUrl: dbRow.knockout_image_url,
    updated_at: dbRow.updated_at,
  };
};


export default function AdminSettingsPage() {
  const [tournamentSettings, setTournamentSettings] = useState<TournamentInfo>(defaultTournamentSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [tournamentLogoPreview, setTournamentLogoPreview] = useState<string | null>(null);
  const [knockoutImagePreview, setKnockoutImagePreview] = useState<string | null>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: defaultTournamentSettings.name,
      about: defaultTournamentSettings.about,
      logoUrlDisplay: defaultTournamentSettings.logoUrl || undefined,
      knockoutImageUrlDisplay: defaultTournamentSettings.knockoutImageUrl || undefined,
    },
  });

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('tournament_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      toast({ variant: "destructive", title: "Failed to load settings", description: error?.message || "No settings found. Using defaults." });
      const mappedDefault = mapDbRowToTournamentInfo({ // Ensure default is also mapped if used
        id: defaultTournamentSettings.id || 1,
        name: defaultTournamentSettings.name,
        about: defaultTournamentSettings.about,
        logo_url: defaultTournamentSettings.logoUrl,
        knockout_image_url: defaultTournamentSettings.knockoutImageUrl,
        updated_at: new Date().toISOString(),
      });
      setTournamentSettings(mappedDefault);
      form.reset({
        name: mappedDefault.name,
        about: mappedDefault.about,
        logoUrlDisplay: mappedDefault.logoUrl || undefined,
        knockoutImageUrlDisplay: mappedDefault.knockoutImageUrl || undefined,
      });
      setTournamentLogoPreview(mappedDefault.logoUrl);
      setKnockoutImagePreview(mappedDefault.knockoutImageUrl);
    } else {
      const fetchedSettings = mapDbRowToTournamentInfo(data as TournamentSettingsRow);
      setTournamentSettings(fetchedSettings);
      form.reset({
        name: fetchedSettings.name,
        about: fetchedSettings.about,
        logoUrlDisplay: fetchedSettings.logoUrl || undefined,
        knockoutImageUrlDisplay: fetchedSettings.knockoutImageUrl || undefined,
      });
      setTournamentLogoPreview(fetchedSettings.logoUrl);
      setKnockoutImagePreview(fetchedSettings.knockoutImageUrl);
    }
    setIsLoading(false);
  }, [toast, form]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);


  const handleTournamentLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('logoFile', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTournamentLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setTournamentLogoPreview(tournamentSettings.logoUrl);
      form.setValue('logoFile', undefined);
    }
  };

  const handleKnockoutImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('knockoutImageFile', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setKnockoutImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setKnockoutImagePreview(tournamentSettings.knockoutImageUrl || null);
      form.setValue('knockoutImageFile', undefined);
    }
  };

  const onSubmit: SubmitHandler<SettingsFormValues> = async (data) => {
    setIsSubmitting(true);

    let newLogoUrl = tournamentSettings.logoUrl;
    if (data.logoFile) {
        const file = data.logoFile;
        const fileName = `tournament_logo_${Date.now()}.${file.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('tournament-assets')
            .upload(fileName, file, { upsert: true });

        if (uploadError) {
            toast({ variant: "destructive", title: "Logo Upload Failed", description: uploadError.message });
            setIsSubmitting(false);
            return;
        }
        const { data: publicUrlData } = supabase.storage.from('tournament-assets').getPublicUrl(uploadData.path);
        newLogoUrl = publicUrlData.publicUrl;
    }

    let newKnockoutImageUrl = tournamentSettings.knockoutImageUrl;
    if (data.knockoutImageFile) {
        const file = data.knockoutImageFile;
        const fileName = `knockout_diagram_${Date.now()}.${file.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('tournament-assets')
            .upload(fileName, file, { upsert: true });

        if (uploadError) {
            toast({ variant: "destructive", title: "Knockout Image Upload Failed", description: uploadError.message });
            setIsSubmitting(false);
            return;
        }
        const { data: publicUrlData } = supabase.storage.from('tournament-assets').getPublicUrl(uploadData.path);
        newKnockoutImageUrl = publicUrlData.publicUrl;
    }

    const settingsToUpdate: Partial<TournamentSettingsRow> & { updated_at: string } = {
        name: data.name,
        about: data.about,
        logo_url: newLogoUrl || placeholderTeamLogo('TT'),
        knockout_image_url: newKnockoutImageUrl || `https://placehold.co/800x500/F0FAF4/50C878.png?text=Knockout+Diagram&font=poppins`,
        updated_at: new Date().toISOString(),
    };
    
    // Remove id from settingsToUpdate if it exists, as it's not needed for update payload based on .eq('id',1)
    const { id, ...updatePayload } = settingsToUpdate;


    const { data: updatedDbData, error: updateError } = await supabase
        .from('tournament_settings')
        .update(updatePayload)
        .eq('id', 1)
        .select()
        .single();

    if (updateError) {
        toast({ variant: "destructive", title: "Failed to Update Settings", description: updateError.message });
    } else if (updatedDbData) {
        const updatedSettings = mapDbRowToTournamentInfo(updatedDbData as TournamentSettingsRow);
        setTournamentSettings(updatedSettings);
        // Reset form to reflect newly saved state, including image URLs for display fields
        form.reset({
            name: updatedSettings.name,
            about: updatedSettings.about,
            logoFile: undefined, // Clear file input
            knockoutImageFile: undefined, // Clear file input
            logoUrlDisplay: updatedSettings.logoUrl || undefined,
            knockoutImageUrlDisplay: updatedSettings.knockoutImageUrl || undefined,
        });
        setTournamentLogoPreview(updatedSettings.logoUrl);
        setKnockoutImagePreview(updatedSettings.knockoutImageUrl);
        toast({ title: "Settings Updated", description: "Tournament information has been saved." });
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg">Loading tournament settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Settings2 className="mr-3 h-8 w-8" /> Tournament Settings
        </h1>
        <p className="text-muted-foreground">
          Update general tournament information, logo, and knockout diagram. Data is stored in Supabase.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Information & Branding</CardTitle>
          <CardDescription>Modify the name, description, logo, and knockout diagram of the tournament.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tournament Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Summer Youth Cup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Tournament</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a brief description of the tournament..."
                        className="min-h-[100px]"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoFile"
                render={() => (
                  <FormItem>
                    <FormLabel>Tournament Logo</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" onChange={handleTournamentLogoChange} className="[&::file-selector-button]:mr-2 [&::file-selector-button]:border-none [&::file-selector-button]:bg-primary/10 [&::file-selector-button]:text-primary [&::file-selector-button]:rounded-md [&::file-selector-button]:px-2 [&::file-selector-button]:py-1 hover:[&::file-selector-button]:bg-primary/20" />
                    </FormControl>
                    {tournamentLogoPreview && (
                      <div className="mt-2 p-2 border rounded-md inline-block bg-muted/50">
                        <Image src={tournamentLogoPreview} alt="Tournament logo preview" width={80} height={80} className="rounded-md" data-ai-hint="logo preview" />
                      </div>
                    )}
                    <FormDescription>Select an image for the tournament logo. Current logo will be kept if no new file is selected.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="knockoutImageFile"
                render={() => (
                  <FormItem>
                    <FormLabel>Knockout Stage Progression Image</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" onChange={handleKnockoutImageChange} className="[&::file-selector-button]:mr-2 [&::file-selector-button]:border-none [&::file-selector-button]:bg-primary/10 [&::file-selector-button]:text-primary [&::file-selector-button]:rounded-md [&::file-selector-button]:px-2 [&::file-selector-button]:py-1 hover:[&::file-selector-button]:bg-primary/20" />
                    </FormControl>
                    {knockoutImagePreview && (
                      <div className="mt-2 p-2 border rounded-md inline-block bg-muted/50">
                        <Image src={knockoutImagePreview} alt="Knockout diagram preview" width={200} height={120} className="rounded-md object-contain" data-ai-hint="diagram preview" />
                      </div>
                    )}
                    <FormDescription>Upload an image showing the tournament's knockout bracket. Current image will be kept if no new file is selected.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : "Save Settings"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
       <Card className="mt-6">
        <CardHeader>
            <CardTitle>Current Displayed Info (from State reflecting Supabase)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            <p><strong>Name:</strong> {tournamentSettings.name}</p>
            <p><strong>About:</strong> {tournamentSettings.about || 'Not set'}</p>
            <div>
                <strong>Logo:</strong>
                {tournamentSettings.logoUrl ?
                    <Image src={tournamentSettings.logoUrl} alt="Current tournament logo" width={64} height={64} className="mt-1 rounded-md border p-1" data-ai-hint="logo"/> :
                    <span className="text-muted-foreground"> Not set</span>}
            </div>
             <div>
                <strong>Knockout Diagram:</strong>
                {tournamentSettings.knockoutImageUrl ?
                    <Image src={tournamentSettings.knockoutImageUrl} alt="Current knockout diagram" width={240} height={150} className="mt-1 rounded-md border p-1 object-contain" data-ai-hint="diagram"/> :
                    <span className="text-muted-foreground"> Not set</span>}
            </div>
        </CardContent>
       </Card>
    </div>
  );
}

    