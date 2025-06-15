
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
import { Settings2, ImagePlus, Loader2 } from 'lucide-react';
import { placeholderTeamLogo } from '@/lib/data'; 
import type { TournamentInfo } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';

const settingsSchema = z.object({
  name: z.string().min(5, { message: "Tournament name must be at least 5 characters." }),
  about: z.string().min(20, { message: "About section must be at least 20 characters." }).nullable(),
  logoFile: z.instanceof(File).optional(),
  logoUrl: z.string().url("Must be a valid URL or will be auto-generated.").nullable().optional(),
  knockoutImageFile: z.instanceof(File).optional(),
  knockoutImageUrl: z.string().url("Must be a valid URL or will be auto-generated.").nullable().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const defaultTournamentSettings: TournamentInfo = {
  id: 1,
  name: "Trendy's Tournament Tracker",
  about: "Welcome to the tournament! Update this description.",
  logoUrl: placeholderTeamLogo('TT'),
  knockoutImageUrl: `https://placehold.co/800x500/F0FAF4/50C878.png?text=Knockout+Diagram&font=poppins`,
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
      logoUrl: defaultTournamentSettings.logoUrl,
      knockoutImageUrl: defaultTournamentSettings.knockoutImageUrl,
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
      setTournamentSettings(defaultTournamentSettings);
      form.reset(defaultTournamentSettings);
      setTournamentLogoPreview(defaultTournamentSettings.logoUrl);
      setKnockoutImagePreview(defaultTournamentSettings.knockoutImageUrl);
    } else {
      const fetchedSettings = data as TournamentInfo;
      setTournamentSettings(fetchedSettings);
      form.reset({
        name: fetchedSettings.name,
        about: fetchedSettings.about,
        logoUrl: fetchedSettings.logoUrl,
        knockoutImageUrl: fetchedSettings.knockoutImageUrl,
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
    
    let finalLogoUrl = tournamentSettings.logoUrl; // Start with existing URL
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
        finalLogoUrl = publicUrlData.publicUrl;
    }

    let finalKnockoutImageUrl = tournamentSettings.knockoutImageUrl; // Start with existing URL
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
        finalKnockoutImageUrl = publicUrlData.publicUrl;
    }
    
    const settingsToUpdate = {
        name: data.name,
        about: data.about,
        logo_url: finalLogoUrl || placeholderTeamLogo('TT'), // Fallback for logo
        knockout_image_url: finalKnockoutImageUrl || `https://placehold.co/800x500/F0FAF4/50C878.png?text=Knockout+Diagram&font=poppins`, // Fallback for knockout
        updated_at: new Date().toISOString(),
    };

    const { data: updatedData, error: updateError } = await supabase
        .from('tournament_settings')
        .update(settingsToUpdate)
        .eq('id', 1)
        .select()
        .single();

    if (updateError) {
        toast({ variant: "destructive", title: "Failed to Update Settings", description: updateError.message });
    } else if (updatedData) {
        setTournamentSettings(updatedData as TournamentInfo);
        setTournamentLogoPreview(updatedData.logo_url);
        setKnockoutImagePreview(updatedData.knockout_image_url);
        toast({ title: "Settings Updated", description: "Tournament information has been saved to Supabase." });
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
                render={({ field }) => ( // field is not directly used for value, but needed for RHF state
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
                render={({ field }) => ( // field not directly used
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
            <CardTitle>Current Displayed Info (from Supabase)</CardTitle>
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
