"use client";

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import type { CrewMember, Store } from '@/lib/types';
import { validateAddressAction } from '@/lib/actions';
import { PlusCircle, Sparkles, Loader } from 'lucide-react';

const crewSchema = z.object({
  name: z.string().min(2, "Crew member name must be at least 2 characters."),
  storeId: z.string().min(1, "Please select a store."),
  address: z.string().min(10, "Address must be at least 10 characters."),
});

export default function CrewManagement() {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [addressValidation, setAddressValidation] = useState<{ isValid: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const unsubCrew = onSnapshot(collection(db, "crew"), (snapshot) => {
      setCrewMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CrewMember)));
    });
    const unsubStores = onSnapshot(collection(db, "stores"), (snapshot) => {
      setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
    });
    return () => {
      unsubCrew();
      unsubStores();
    };
  }, []);

  const form = useForm<z.infer<typeof crewSchema>>({
    resolver: zodResolver(crewSchema),
    defaultValues: {
      name: "",
      storeId: "",
      address: "",
    },
  });

  const handleValidateAddress = async () => {
    const address = form.getValues("address");
    if (!address) {
      form.setError("address", { type: "manual", message: "Address cannot be empty." });
      return;
    }

    setAddressValidation(null);
    startTransition(async () => {
      const result = await validateAddressAction({ address });
      if (result.isValid) {
        setAddressValidation({ isValid: true, message: "Address is valid!" });
        form.setValue("address", result.standardizedAddress);
      } else {
        setAddressValidation({ isValid: false, message: "Address could not be validated." });
      }
    });
  };

  async function onSubmit(values: z.infer<typeof crewSchema>) {
    try {
      await addDoc(collection(db, 'crew'), values);
      toast({ title: "Crew Member Added", description: `${values.name} has been successfully added.` });
      form.reset();
      setAddressValidation(null);
    } catch (e) {
      console.error("Error adding document: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not add crew member." });
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">Add New Crew Member</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crew Member Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Alex Johnson" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Store</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a store" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Home Address</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="e.g., 123 Main St, Los Angeles, CA" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={handleValidateAddress} disabled={isPending}>
                      {isPending ? <Loader className="animate-spin" /> : <Sparkles />}
                      <span className="ml-2 hidden md:inline">Validate</span>
                    </Button>
                  </div>
                  {addressValidation && (
                    <FormDescription className={addressValidation.isValid ? 'text-green-600' : 'text-destructive'}>
                      {addressValidation.message}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit"><PlusCircle className="mr-2" /> Add Crew Member</Button>
          </form>
        </Form>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">Existing Crew</h3>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Store</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crewMembers.map((crew) => (
                <TableRow key={crew.id}>
                  <TableCell className="font-medium">{crew.name}</TableCell>
                  <TableCell>{stores.find(s => s.id === crew.storeId)?.name || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
