
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Store } from '@/lib/types';
import { PlusCircle, Edit, Trash2, Loader } from 'lucide-react';
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
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';


const storeSchema = z.object({
  name: z.string().min(2, "Store name must be at least 2 characters."),
  latitude: z.coerce.number().min(-90, "Latitude must be between -90 and 90.").max(90, "Latitude must be between -90 and 90."),
  longitude: z.coerce.number().min(-180, "Longitude must be between -180 and 180.").max(180, "Longitude must be between -180 and 180."),
});

export default function StoreManagement() {
  const [stores, setStores] = useState<Store[]>([]);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof storeSchema>>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      latitude: "" as any,
      longitude: "" as any,
    },
  });

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(collection(db, "stores"), (snapshot) => {
        setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching stores:", error);
        toast({ title: "Error", description: "Could not fetch stores.", variant: "destructive" });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    if (editingStore) {
      form.reset({
        name: editingStore.name,
        latitude: editingStore.latitude,
        longitude: editingStore.longitude,
      });
    } else {
      form.reset({
        name: "",
        latitude: "" as any,
        longitude: "" as any,
      });
    }
  }, [editingStore, form]);

  async function onSubmit(values: z.infer<typeof storeSchema>) {
    setIsLoading(true);
    try {
      if (editingStore) {
        const storeRef = doc(db, "stores", editingStore.id);
        await updateDoc(storeRef, values);
        toast({
          title: "Success",
          description: `Store ${values.name} updated.`,
        });
      } else {
        await addDoc(collection(db, "stores"), values);
        toast({
          title: "Success",
          description: `Store ${values.name} added.`,
        });
      }
      setEditingStore(null);
      form.reset();
    } catch (error) {
      console.error("Error saving store:", error);
      toast({
        title: "Error",
        description: "Could not save store.",
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  }

  const handleDelete = async (storeId: string) => {
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "stores", storeId));
      toast({
        title: "Success",
        description: "Store deleted.",
      });
    } catch (error) {
      console.error("Error deleting store:", error);
      toast({
        title: "Error",
        description: "Could not delete store.",
        variant: "destructive"
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
  }
  
  const handleCancelEdit = () => {
    setEditingStore(null);
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 relative">
       {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">{editingStore ? "Edit Store" : "Add New Store"}</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Downtown Central" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="e.g., 34.0522" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="e.g., -118.2436" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                    {editingStore ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />} 
                    {editingStore ? "Update Store" : "Add Store"}
                </Button>
                {editingStore && (
                    <Button variant="outline" onClick={handleCancelEdit} disabled={isLoading}>Cancel</Button>
                )}
            </div>
          </form>
        </Form>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">Existing Stores</h3>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell>{store.latitude}, {store.longitude}</TableCell>
                  <TableCell className='text-right space-x-2'>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(store)} disabled={isLoading}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className='text-destructive hover:text-destructive' disabled={isLoading}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the store "{store.name}" from the database.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(store.id)} className='bg-destructive hover:bg-destructive/90'>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
