
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Settings2, ImagePlus } from 'lucide-react';
import { mockTournamentInfo, placeholderTeamLogo } from '@/lib/data'; 
import type { TournamentInfo } from '@/types';
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  name: z.string().min(5, { message: "Tournament name must be at least 5 characters." }),
  about: z.string().min(20, { message: "About section must be at least 20 characters." }),
  logoFile: z.instanceof(File).optional(),
  logoUrl: z.string().optional(),
  knockoutImageFile: z.instanceof(File).optional(),
  knockoutImageUrl: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
  const [tournamentSettings, setTournamentSettings] = useState<TournamentInfo>(mockTournamentInfo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [tournamentLogoPreview, setTournamentLogoPreview] = useState<string | null>(tournamentSettings.logoUrl);
  const [knockoutImagePreview, setKnockoutImagePreview] = useState<string | null>(tournamentSettings.knockoutImageUrl || null);


  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: tournamentSettings.name,
      about: tournamentSettings.about,
      logoUrl: tournamentSettings.logoUrl,
      knockoutImageUrl: tournamentSettings.knockoutImageUrl,
    },
  });
  
  useEffect(() => {
    setTournamentLogoPreview(tournamentSettings.logoUrl);
    setKnockoutImagePreview(tournamentSettings.knockoutImageUrl || null);
    form.reset({
        name: tournamentSettings.name,
        about: tournamentSettings.about,
        logoUrl: tournamentSettings.logoUrl,
        knockoutImageUrl: tournamentSettings.knockoutImageUrl,
    });
  }, [tournamentSettings, form]);


  const handleTournamentLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('logoFile', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTournamentLogoPreview(reader.result as string);
        form.setValue('logoUrl', reader.result as string); 
      };
      reader.readAsDataURL(file);
    } else {
      setTournamentLogoPreview(mockTournamentInfo.logoUrl); // Fallback or existing
      form.setValue('logoFile', undefined);
      form.setValue('logoUrl', tournamentSettings.logoUrl);
    }
  };

  const handleKnockoutImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('knockoutImageFile', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setKnockoutImagePreview(reader.result as string);
        form.setValue('knockoutImageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setKnockoutImagePreview(mockTournamentInfo.knockoutImageUrl || null); // Fallback or existing
      form.setValue('knockoutImageFile', undefined);
      form.setValue('knockoutImageUrl', tournamentSettings.knockoutImageUrl);
    }
  };

  const onSubmit: SubmitHandler<SettingsFormValues> = (data) => {
    setIsSubmitting(true);
    
    let finalLogoUrl = data.logoUrl || tournamentSettings.logoUrl;
    if (data.logoFile && data.logoUrl?.startsWith('data:image')) {
        finalLogoUrl = data.logoUrl;
    } else if (!data.logoFile && !finalLogoUrl) {
        finalLogoUrl = placeholderTeamLogo('Tournament');
    }

    let finalKnockoutImageUrl = data.knockoutImageUrl || tournamentSettings.knockoutImageUrl;
    if (data.knockoutImageFile && data.knockoutImageUrl?.startsWith('data:image')) {
        finalKnockoutImageUrl = data.knockoutImageUrl;
    } else if (!data.knockoutImageFile && !finalKnockoutImageUrl) {
        finalKnockoutImageUrl = `https://placehold.co/800x500/F0FAF4/50C878.png?text=Knockout+Diagram&font=poppins`;
    }

    setTournamentSettings(prev => ({
        ...prev,
        name: data.name,
        about: data.about,
        logoUrl: finalLogoUrl,
        knockoutImageUrl: finalKnockoutImageUrl,
    }));
    toast({
      title: "Settings Updated",
      description: "Tournament information has been updated locally.",
    });
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Settings2 className="mr-3 h-8 w-8" /> Tournament Settings
        </h1>
        <p className="text-muted-foreground">
          Update general tournament information, logo, and knockout diagram. Changes are local.
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
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="logoFile"
                render={({ field }) => (
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
                    <FormDescription>Select an image for the tournament logo.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="knockoutImageFile"
                render={({ field }) => (
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
                    <FormDescription>Upload an image showing the tournament's knockout bracket.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Settings"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
       <Card className="mt-6">
        <CardHeader>
            <CardTitle>Current Displayed Info (Locally Updated)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            <p><strong>Name:</strong> {tournamentSettings.name}</p>
            <p><strong>About:</strong> {tournamentSettings.about}</p>
            <div>
                <strong>Logo:</strong>
                {tournamentSettings.logoUrl ? 
                    <Image src={tournamentSettings.logoUrl} alt="Current tournament logo" width={64} height={64} className="mt-1 rounded-md border p-1" data-ai-hint="logo" /> : 
                    <span className="text-muted-foreground"> Not set</span>}
            </div>
             <div>
                <strong>Knockout Diagram:</strong>
                {tournamentSettings.knockoutImageUrl ? 
                    <Image src={tournamentSettings.knockoutImageUrl} alt="Current knockout diagram" width={240} height={150} className="mt-1 rounded-md border p-1 object-contain" data-ai-hint="diagram" /> : 
                    <span className="text-muted-foreground"> Not set</span>}
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
