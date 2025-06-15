
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { checkAdminPin, setAdminAuthenticated } from '@/lib/adminAuth';
import { LockKeyhole, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const pinFormSchema = z.object({
  pin: z.string().length(4, { message: "PIN must be 4 digits." }).regex(/^\d{4}$/, { message: "PIN must be numeric." }),
});

type PinFormValues = z.infer<typeof pinFormSchema>;

const PinForm: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PinFormValues>({
    resolver: zodResolver(pinFormSchema),
    defaultValues: {
      pin: '',
    },
  });

  const onSubmit: SubmitHandler<PinFormValues> = async (data) => {
    setIsSubmitting(true);
    if (checkAdminPin(data.pin)) {
      setAdminAuthenticated();
      toast({
        title: "Access Granted",
        description: "Welcome to the Admin Panel.",
      });
      router.push('/admin/dashboard');
    } else {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Invalid PIN. Please try again.",
      });
      form.reset(); // Clear the input field
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <LockKeyhole className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl font-headline">Admin Access</CardTitle>
          <CardDescription>Enter the 4-digit PIN to manage the tournament.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="pin-input">Admin PIN</FormLabel>
                    <FormControl>
                      <Input
                        id="pin-input"
                        type="password"
                        maxLength={4}
                        placeholder="••••"
                        className="text-center text-lg tracking-[0.5em]"
                        {...field}
                        aria-describedby="pin-message"
                      />
                    </FormControl>
                    <FormMessage id="pin-message" />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Verifying...' : 'Unlock'}
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/matches">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return
                </Link>
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default PinForm;
