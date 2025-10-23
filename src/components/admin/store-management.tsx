
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
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
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
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const storeSchema = z.object({
  name: z.string().min(2, "Store name must be at least 2 characters."),
  latitude: z.coerce.number().min(-90, "Latitude must be between -90 and 90."),
  longitude: z.coerce.number().min(-180, "Longitude must be between -180 and 180."),
});

export default function StoreManagement() {
  const [stores, setStores] = useState<Store[]>([]);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const { toast } = useToast();
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, "stores"), (snapshot) => {
        setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
    },
    async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'stores',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    return () => unsubscribe();
  }, [db]);

  const form = useForm<z.infer<typeof storeSchema>>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      latitude: "" as any,
      longitude: "" as any,
    },
  });

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
    if (!db) return;
    if (editingStore) {
      const storeRef = doc(db, 'stores', editingStore.id);
      updateDoc(storeRef, values)
        .then(() => {
            toast({ title: "Store Updated", description: `${values.name} has been successfully updated.` });
            setEditingStore(null);
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: storeRef.path,
              operation: 'update',
              requestResourceData: values
            });
            errorEmitter.emit('permission-error', permissionError);
        });

    } else {
      addDoc(collection(db, 'stores'), values)
        .then(() => {
            toast({ title: "Store Added", description: `${values.name} has been successfully added.` });
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: 'stores',
              operation: 'create',
              requestResourceData: values
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }
    form.reset({ name: "", latitude: "" as any, longitude: "" as any });
  }

  const handleDelete = async (storeId: string) => {
    if (!db) return;
    const storeRef = doc(db, 'stores', storeId);
    deleteDoc(storeRef)
        .then(() => {
            toast({
                title: "Store Deleted",
                description: "The store has been successfully deleted.",
                variant: "destructive"
            });
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: storeRef.path,
              operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
  }
  
  const handleCancelEdit = () => {
    setEditingStore(null);
    form.reset({
      name: "",
      latitude: "" as any,
      longitude: "" as any,
    });
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
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
                    <Input placeholder="e.g., Downtown Central" {...field} />
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
                      <Input type="number" placeholder="e.g., 34.0522" {...field} />
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
                      <Input type="number" placeholder="e.g., -118.2436" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-2">
                <Button type="submit">
                    {editingStore ? <Edit className="mr-2" /> : <PlusCircle className="mr-2" />} 
                    {editingStore ? "Update Store" : "Add Store"}
                </Button>
                {editingStore && (
                    <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
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
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(store)}>
                        <Edit className="h-4 w-4" />
                    </Button>
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
