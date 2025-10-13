
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, orderBy, query, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Send, Trash2, Link2 } from 'lucide-react';
import type { BroadcastMessage as BroadcastMessageType } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from '../ui/card';

const broadcastSchema = z.object({
  message: z.string().min(10, "Message must be at least 10 characters.").max(500, "Message cannot exceed 500 characters."),
  attachmentURL: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

export default function BroadcastMessage() {
  const [broadcasts, setBroadcasts] = useState<BroadcastMessageType[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "broadcasts"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp).toDate(),
        } as BroadcastMessageType;
      });
      setBroadcasts(messages);
    });
    return () => unsub();
  }, []);

  const form = useForm<z.infer<typeof broadcastSchema>>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      message: "",
      attachmentURL: "",
    },
  });

  async function onSubmit(values: z.infer<typeof broadcastSchema>) {
    try {
      const docData: { message: string; timestamp: Date; attachmentURL?: string } = {
        message: values.message,
        timestamp: new Date(),
      };

      if (values.attachmentURL) {
        docData.attachmentURL = values.attachmentURL;
      }

      await addDoc(collection(db, 'broadcasts'), docData);
      toast({
        title: "Broadcast Sent!",
        description: "Your message has been sent to all crew members.",
      });
      form.reset();
    } catch (e) {
      console.error("Error sending broadcast: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not send broadcast." });
    }
  }

  const handleDelete = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'broadcasts', id));
        toast({
            title: "Broadcast Deleted",
            description: "The message has been removed from the history.",
            variant: "destructive"
        });
    } catch (error) {
        console.error("Error deleting broadcast: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete the message."
        });
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">Send New Broadcast</h3>
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
            <FormField
              control={form.control}
              name="attachmentURL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attachment Link (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/document.pdf"
                      className="text-base"
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

      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">Broadcast History</h3>
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Message</TableHead>
                            <TableHead className='w-32'>Time</TableHead>
                            <TableHead className='text-right w-12'>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {broadcasts.length > 0 ? broadcasts.map((msg) => (
                            <TableRow key={msg.id}>
                                <TableCell className='whitespace-pre-wrap break-words'>
                                  <p>{msg.message}</p>
                                  {msg.attachmentURL && (
                                    <a
                                      href={msg.attachmentURL}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline text-sm mt-2 inline-flex items-center gap-1"
                                    >
                                      <Link2 className="h-3 w-3" />
                                      Lampiran
                                    </a>
                                  )}
                                </TableCell>
                                <TableCell className='text-muted-foreground'>
                                    {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                                </TableCell>
                                <TableCell className='text-right'>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className='text-destructive hover:text-destructive'>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete this broadcast message.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(msg.id)} className='bg-destructive hover:bg-destructive/90'>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No broadcast messages sent yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
