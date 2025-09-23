"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Send } from 'lucide-react';

const broadcastSchema = z.object({
  message: z.string().min(10, "Message must be at least 10 characters.").max(500, "Message cannot exceed 500 characters."),
});

export default function BroadcastMessage() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof broadcastSchema>>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof broadcastSchema>) {
    try {
      await addDoc(collection(db, 'broadcasts'), {
        message: values.message,
        timestamp: new Date(),
      });
      toast({
        title: "Broadcast Sent!",
        description: "Your message has been saved to Firebase and sent to all crew members.",
      });
      form.reset();
    } catch (e) {
        console.error("Error sending broadcast: ", e);
        toast({ variant: "destructive", title: "Error", description: "Could not send broadcast." });
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg">Message</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Type your announcement here... e.g., 'Team meeting at 5 PM today.'"
                    className="min-h-[150px] text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full">
            <Send className="mr-2 h-5 w-5" /> Send Broadcast
          </Button>
        </form>
      </Form>
    </div>
  );
}
