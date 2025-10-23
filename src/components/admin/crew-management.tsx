"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from '@/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { CrewMember, Store } from '@/lib/types';
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const crewSchema = z.object({
  name: z.string().min(2, "Crew member name must be at least 2 characters."),
  storeId: z.string().min(1, "Please select a store."),
});

export default function CrewManagement() {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [editingCrew, setEditingCrew] = useState<CrewMember | null>(null);
  const { toast } = useToast();
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;
    const unsubCrew = onSnapshot(collection(db, "crew"), (snapshot) => {
      const crewData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CrewMember));
      setCrewMembers(crewData.sort((a, b) => a.name.localeCompare(b.name)));
    },
    async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'crew',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    const unsubStores = onSnapshot(collection(db, "stores"), (snapshot) => {
      setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
    },
    async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'stores',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    return () => {
      unsubCrew();
      unsubStores();
    };
  }, [db]);

  const form = useForm<z.infer<typeof crewSchema>>({
    resolver: zodResolver(crewSchema),
    defaultValues: {
      name: "",
      storeId: "",
    },
  });
  
  useEffect(() => {
    if (editingCrew) {
      form.reset({
        name: editingCrew.name,
        storeId: editingCrew.storeId,
      });
    } else {
      form.reset({
        name: "",
        storeId: "",
      });
    }
  }, [editingCrew, form]);

  async function onSubmit(values: z.infer<typeof crewSchema>) {
    if (!db) return;
    try {
      if (editingCrew) {
        const crewRef = doc(db, 'crew', editingCrew.id);
        await updateDoc(crewRef, values);
        toast({ title: "Crew Member Updated", description: `${values.name} has been successfully updated.` });
        setEditingCrew(null);
      } else {
        await addDoc(collection(db, 'crew'), values);
        toast({ title: "Crew Member Added", description: `${values.name} has been successfully added.` });
      }
      form.reset({ name: "", storeId: "" });
    } catch (e) {
      if (editingCrew) {
        const crewRef = doc(db, 'crew', editingCrew.id);
        const permissionError = new FirestorePermissionError({
            path: crewRef.path,
            operation: 'update',
            requestResourceData: values,
        });
        errorEmitter.emit('permission-error', permissionError);
      } else {
         const permissionError = new FirestorePermissionError({
            path: 'crew',
            operation: 'create',
            requestResourceData: values,
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    }
  }

  const handleDelete = async (crewId: string) => {
    if (!db) return;
    const docRef = doc(db, "crew", crewId);
    deleteDoc(docRef)
    .then(() => {
        toast({
            title: "Crew Member Deleted",
            description: "The crew member has been successfully deleted.",
            variant: "destructive"
        });
    })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const handleEdit = (crew: CrewMember) => {
    setEditingCrew(crew);
  };

  const handleCancelEdit = () => {
    setEditingCrew(null);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">{editingCrew ? "Edit Crew Member" : "Add New Crew Member"}</h3>
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
                  <Select onValueChange={field.onChange} value={field.value} defaultValue="">
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
            <div className="flex gap-2">
                <Button type="submit">
                    {editingCrew ? <Edit className="mr-2" /> : <PlusCircle className="mr-2" />}
                    {editingCrew ? "Update Crew" : "Add Crew Member"}
                </Button>
                {editingCrew && (
                    <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                )}
            </div>
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
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crewMembers.length > 0 ? crewMembers.map((crew) => (
                <TableRow key={crew.id}>
                  <TableCell className="font-medium">{crew.name}</TableCell>
                  <TableCell>{stores.find(s => s.id === crew.storeId)?.name || 'N/A'}</TableCell>
                  <TableCell className='text-right space-x-2'>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(crew)}>
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
                                    This action cannot be undone. This will permanently delete the crew member "{crew.name}" from the database.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(crew.id)} className='bg-destructive hover:bg-destructive/90'>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No crew members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
