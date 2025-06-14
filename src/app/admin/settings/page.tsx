
"use client";

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Settings2 } from 'lucide-react';
import { mockTournamentInfo } from '@/lib/data'; // To prefill
import type { TournamentInfo } from '@/types';
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  name: z.string().min(5, { message: "Tournament name must be at least 5 characters." }),
  about: z.string().min(20, { message: "About section must be at least 20 characters." }),
  // logoUrl: z.string().url({ message: "Please enter a valid URL for the logo." }).optional(), // Logo update is complex, handle separately
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
  // This state will hold the settings. For now, changes are only local to this page.
  const [tournamentSettings, setTournamentSettings] = useState<TournamentInfo>(mockTournamentInfo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: tournamentSettings.name,
      about: tournamentSettings.about,
      // logoUrl: tournamentSettings.logoUrl,
    },
  });

  const onSubmit: SubmitHandler<SettingsFormValues> = (data) => {
    setIsSubmitting(true);
    setTournamentSettings(prev => ({
        ...prev,
        name: data.name,
        about: data.about,
        // logoUrl: data.logoUrl || prev.logoUrl, // Keep existing logo if not changed
    }));
    toast({
      title: "Settings Updated",
      description: "Tournament information has been updated locally.",
    });
    setIsSubmitting(false);
     // Note: To make these changes reflect globally (e.g., in TopBar, TournamentHeader),
     // a more robust state management (Context, Zustand) or backend integration is needed.
     // This example updates settings only within this page's scope.
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Settings2 className="mr-3 h-8 w-8" /> Tournament Settings
        </h1>
        <p className="text-muted-foreground">
          Update general tournament information. Changes made here are currently local to this admin session.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>Modify the name and description of the tournament.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
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
              {/* 
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tournament Logo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/tournament_logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              */}
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
            <CardTitle>Current Displayed Info</CardTitle>
            <CardDescription>This is how the tournament info is currently displayed (from local changes on this page):</CardDescription>
        </CardHeader>
        <CardContent>
            <p><strong>Name:</strong> {tournamentSettings.name}</p>
            <p><strong>About:</strong> {tournamentSettings.about}</p>
            {/* <p><strong>Logo URL:</strong> {tournamentSettings.logoUrl}</p> */}
        </CardContent>
       </Card>
    </div>
  );
}

