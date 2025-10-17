"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp, doc, updateDoc, addDoc, orderBy } from 'firebase/firestore';
import type { AttendanceLog, Store, CrewMember } from '@/lib/types';
import { cn } from "@/lib/utils";
import { CalendarIcon, Camera, Users, Loader, Edit, Plus } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type AttendanceSummary = {
  crewMemberId: string;
  crewMemberName: string;
  storeName: string;
  clockInCount: number;
  logs: AttendanceLog[];
};

const manualEntrySchema = z.object({
  storeId: z.string().min(1, "Please select a store."),
  crewMemberId: z.string().min(1, "Please select a crew member."),
  date: z.date({ required_error: "Please select a date." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)."),
  type: z.enum(['in', 'out'], { required_error: "Please select a type." }),
  shift: z.string().min(1, "Please select a shift."),
  notes: z.string().optional(),
});


export default function AttendanceLog() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(date);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedLogForImage, setSelectedLogForImage] = useState<AttendanceLog | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLogForNotes, setSelectedLogForNotes] = useState<AttendanceLog | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualEntryStore, setManualEntryStore] = useState<string | undefined>();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof manualEntrySchema>>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      storeId: "",
      crewMemberId: "",
      time: format(new Date(), "HH:mm"),
      shift: "",
      notes: "",
    },
  });

  useEffect(() => {
    const unsubStores = onSnapshot(collection(db, 'stores'), (snapshot) => {
      const storesData: Store[] = [];
      snapshot.forEach((doc) => {
        storesData.push({ id: doc.id, ...doc.data() } as Store);
      });
      setStores(storesData);
    });

    const unsubCrew = onSnapshot(collection(db, 'crew'), (snapshot) => {
        const crewData: CrewMember[] = [];
        snapshot.forEach((doc) => {
            crewData.push({ id: doc.id, ...doc.data() } as CrewMember);
        });
        setCrewMembers(crewData);
    });

    return () => {
      unsubStores();
      unsubCrew();
    };
  }, []);
  
 useEffect(() => {
    if (!date?.from) return;
    
    setIsLoading(true);
    const fromDate = new Date(date.from);
    const toDate = date.to || date.from;

    const startOfDayFrom = new Date(fromDate.setHours(0, 0, 0, 0));
    const endOfDayTo = new Date(toDate.setHours(23, 59, 59, 999));

    const startTimestamp = Timestamp.fromDate(startOfDayFrom);
    const endTimestamp = Timestamp.fromDate(endOfDayTo);
    
    const q = query(
        collection(db, 'attendance'),
        where('timestamp', '>=', startTimestamp),
        where('timestamp', '<=', endTimestamp),
        orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let logsData: AttendanceLog[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logsData.push({
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp).toDate(),
        } as AttendanceLog);
      });
      
      if (selectedStoreId !== 'all') {
          logsData = logsData.filter(log => log.storeId === selectedStoreId);
      }

      setLogs(logsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching attendance logs:", error);
      setIsLoading(false);
      if (error.code === 'failed-precondition') {
         toast({
            variant: "destructive",
            title: "Indeks Firestore Diperlukan",
            description: "Kueri ini memerlukan indeks. Silakan buat di Firebase Console.",
        });
      } else {
        toast({
            variant: "destructive",
            title: "Error Memuat Log",
            description: "Gagal memuat data kehadiran.",
        });
      }
    });

    return () => unsubscribe();
  }, [date, selectedStoreId, toast]);

  const attendanceSummary: AttendanceSummary[] = useMemo(() => {
    const summary: Record<string, AttendanceSummary> = {};

    logs.forEach(log => {
        if (!summary[log.crewMemberId]) {
            summary[log.crewMemberId] = {
                crewMemberId: log.crewMemberId,
                crewMemberName: log.crewMemberName,
                storeName: log.storeName,
                clockInCount: 0,
                logs: []
            };
        }
        if (log.type === 'in') {
            summary[log.crewMemberId].clockInCount++;
        }
        summary[log.crewMemberId].logs.push(log);
    });
    // Sort logs for each crew member by timestamp descending
    Object.values(summary).forEach(s => s.logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    
    return Object.values(summary).sort((a,b) => a.crewMemberName.localeCompare(b.crewMemberName));
  }, [logs]);

  const manualEntryFilteredCrew = useMemo(() => {
    if (!manualEntryStore) return [];
    return crewMembers.filter(c => c.storeId === manualEntryStore);
  }, [manualEntryStore, crewMembers]);


  const handleApplyDateRange = () => {
    setDate(selectedDateRange);
    setIsPopoverOpen(false);
  };
  
  const handleCancel = () => {
    setSelectedDateRange(date); // Revert to the last applied date range
    setIsPopoverOpen(false);
  }

  const handleOpenNotesDialog = (log: AttendanceLog) => {
    setSelectedLogForNotes(log);
    setNoteInput(log.notes || "");
  };
  
  const handleSaveNote = async () => {
    if (!selectedLogForNotes) return;
    try {
      const logRef = doc(db, 'attendance', selectedLogForNotes.id);
      await updateDoc(logRef, {
        notes: noteInput,
      });
      toast({
        title: "Catatan Disimpan",
        description: "Catatan kehadiran telah diperbarui.",
      });
      setSelectedLogForNotes(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan catatan.",
      });
      console.error("Error saving note:", error);
    }
  };

  async function onManualEntrySubmit(values: z.infer<typeof manualEntrySchema>) {
    const selectedCrew = crewMembers.find(c => c.id === values.crewMemberId);
    const assignedStore = stores.find(s => s.id === values.storeId);

    if (!selectedCrew || !assignedStore) {
        toast({ variant: "destructive", title: "Error", description: "Invalid crew or store." });
        return;
    }

    const [hours, minutes] = values.time.split(':').map(Number);
    const finalTimestamp = new Date(values.date);
    finalTimestamp.setHours(hours, minutes);

    try {
        await addDoc(collection(db, 'attendance'), {
            crewMemberId: selectedCrew.id,
            crewMemberName: selectedCrew.name,
            storeId: assignedStore.id,
            storeName: assignedStore.name,
            timestamp: Timestamp.fromDate(finalTimestamp),
            type: values.type,
            shift: values.shift,
            notes: `Manual Entry. ${values.notes || ''}`.trim(),
            photoURL: '', // No photo for manual entry
        });
        toast({
            title: "Entri Manual Berhasil",
            description: `Log absensi untuk ${selectedCrew.name} telah ditambahkan.`,
        });
        setIsManualEntryOpen(false);
        form.reset({
            storeId: "",
            crewMemberId: "",
            time: format(new Date(), "HH:mm"),
            shift: "",
            notes: "",
        });
    } catch (error) {
        console.error("Error adding manual entry:", error);
        toast({ variant: "destructive", title: "Error", description: "Gagal menyimpan entri manual." });
    }
  }


  const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
        <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className='space-y-6 relative'>
      <div className="flex items-center gap-4 mb-4">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={selectedDateRange?.from}
              selected={selectedDateRange}
              onSelect={setSelectedDateRange}
              numberOfMonths={2}
            />
            <div className="flex justify-end gap-2 p-4 border-t">
                <Button variant="outline" onClick={handleCancel}>Batal</Button>
                <Button onClick={handleApplyDateRange}>Oke</Button>
            </div>
          </PopoverContent>
        </Popover>
        <Select value={selectedStoreId} onValueChange={setSelectedStoreId} disabled={isLoading}>
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a store" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua Toko</SelectItem>
                {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedSummary(null)}>
        <Card className='relative'>
            {isLoading && <LoadingOverlay />}
            <CardHeader>
                <CardTitle className="flex items-center"><Users className="mr-3"/>Ringkasan Kehadiran</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Crew Member</TableHead>
                                <TableHead>Store</TableHead>
                                <TableHead>Total Clock In</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendanceSummary.length > 0 ? attendanceSummary.map((summary) => (
                                <TableRow key={summary.crewMemberId}>
                                    <TableCell className='font-medium'>{summary.crewMemberName}</TableCell>
                                    <TableCell>{summary.storeName}</TableCell>
                                    <TableCell>{summary.clockInCount} kali</TableCell>
                                    <TableCell className='text-right'>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => setSelectedSummary(summary)}>
                                                Lihat Detail
                                            </Button>
                                        </DialogTrigger>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Tidak ada ringkasan untuk periode ini.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
        {selectedSummary && (
             <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Detail Kehadiran: {selectedSummary.crewMemberName}</DialogTitle>
                    <DialogDescription>
                       {selectedSummary.storeName}
                       {' - '}
                        {date?.from && format(date.from, "LLL dd, y")}
                        {date?.to && date.from?.getTime() !== date.to?.getTime() ? ` s/d ${format(date.to, "LLL dd, y")}` : ''}
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 max-h-[60vh] overflow-y-auto">
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Waktu</TableHead>
                                <TableHead>Shift</TableHead>
                                <TableHead className='text-right'>Tindakan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedSummary.logs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>{log.timestamp.toLocaleString()}</TableCell>
                                    <TableCell>{log.shift || '-'}</TableCell>
                                    <TableCell className='text-right'>
                                       <Badge variant={log.type === "in" ? "default" : "secondary"} className={log.type === "in" ? "bg-green-600 text-white" : ""}>
                                         {log.type === "in" ? "Clock In" : "Clock Out"}
                                       </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                   </Table>
                </div>
            </DialogContent>
        )}
      </Dialog>
      
      <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedLogForNotes(null)}>
        <div className='relative'>
            {isLoading && <LoadingOverlay />}
          <h3 className="text-xl font-semibold mb-4 text-primary">Log Lengkap</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Crew Member</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                       <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedLogForImage(null)}>
                          <DialogTrigger asChild>
                              <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedLogForImage(log); }}
                                  className="w-16 h-16 rounded-md overflow-hidden bg-muted cursor-pointer block"
                              >
                                {log.photoURL ? (
                                    <Image src={log.photoURL} alt={`Photo of ${log.crewMemberName}`} width={64} height={64} className="object-cover w-full h-full" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Camera className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                )}
                              </button>
                          </DialogTrigger>
                           {selectedLogForImage && selectedLogForImage.id === log.id && (
                               <DialogContent className="sm:max-w-md">
                                   <DialogHeader>
                                       <DialogTitle>{selectedLogForImage.crewMemberName}</DialogTitle>
                                       <DialogDescription>
                                           {selectedLogForImage.storeName} - {selectedLogForImage.timestamp.toLocaleString()}
                                       </DialogDescription>
                                   </DialogHeader>
                                   <div className="mt-4">
                                       <Image src={selectedLogForImage.photoURL!} alt={`Enlarged photo for ${selectedLogForImage.crewMemberName}`} width={400} height={400} className="rounded-lg object-contain w-full" />
                                   </div>
                               </DialogContent>
                           )}
                       </Dialog>
                    </TableCell>
                    <TableCell className="font-medium">{log.crewMemberName}</TableCell>
                    <TableCell>{log.storeName}</TableCell>
                    <TableCell>{log.timestamp.toLocaleString()}</TableCell>
                    <TableCell>{log.shift || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={log.type === "in" ? "default" : "secondary"} className={log.type === "in" ? "bg-green-600 text-white" : ""}>
                        {log.type === "in" ? "Clock In" : "Clock Out"}
                      </Badge>
                    </TableCell>
                     <TableCell>
                        <DialogTrigger asChild>
                          <div onClick={() => handleOpenNotesDialog(log)} className='w-full text-left cursor-pointer'>
                           {log.notes ? (
                               <p className="truncate max-w-[150px] hover:underline">{log.notes}</p>
                           ) : (
                               <div className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted">
                                   <Edit className="h-4 w-4 text-muted-foreground" />
                               </div>
                           )}
                          </div>
                        </DialogTrigger>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Tidak ada catatan kehadiran untuk periode ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {selectedLogForNotes && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add/Edit Note</DialogTitle>
              <DialogDescription>
                Add a note for {selectedLogForNotes.crewMemberName} at {selectedLogForNotes.timestamp.toLocaleString()}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="notes">Note</Label>
                <Textarea
                  id="notes"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="e.g., Crew sakit, shift digantikan oleh..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedLogForNotes(null)}>Batal</Button>
              <Button onClick={handleSaveNote}>Simpan Catatan</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      
      <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
        <DialogTrigger asChild>
            <Button
                className="fixed bottom-16 right-8 h-16 w-16 rounded-full shadow-lg"
            >
                <Plus className="h-8 w-8" />
                <span className="sr-only">Add Manual Entry</span>
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Entri Kehadiran Manual</DialogTitle>
                <DialogDescription>
                    Masukkan detail kehadiran untuk kru yang tidak dapat clock-in/out.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onManualEntrySubmit)} className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="storeId"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Store</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setManualEntryStore(value);
                                  form.setValue('crewMemberId', ''); // Reset crew member selection
                                }} 
                                value={field.value}
                              >
                                  <FormControl>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Pilih toko" />
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
                        name="crewMemberId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Crew Member</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={!manualEntryStore}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih seorang kru" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {manualEntryFilteredCrew.map(crew => (
                                            <SelectItem key={crew.id} value={crew.id}>{crew.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Tanggal</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? format(field.value, "PPP") : <span>Pilih tanggal</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Waktu (HH:MM)</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Tipe</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex gap-4"
                                    >
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl><RadioGroupItem value="in" /></FormControl>
                                            <FormLabel className="font-normal">Clock In</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl><RadioGroupItem value="out" /></FormControl>
                                            <FormLabel className="font-normal">Clock Out</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="shift"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Shift</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih shift" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Shift 1">Shift 1</SelectItem>
                                        <SelectItem value="Shift 2">Shift 2</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Catatan (Opsional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g., Lupa clock in pagi ini" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsManualEntryOpen(false)}>Batal</Button>
                        <Button type="submit">Simpan</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
