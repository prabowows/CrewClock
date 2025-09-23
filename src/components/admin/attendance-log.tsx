"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, where, Timestamp, QueryConstraint } from 'firebase/firestore';
import type { AttendanceLog, Store } from '@/lib/types';
import { cn } from "@/lib/utils";
import { CalendarIcon, Camera } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from 'react-day-picker';

export default function AttendanceLog() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(date);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedLogForImage, setSelectedLogForImage] = useState<AttendanceLog | null>(null);


  useEffect(() => {
    const unsubStores = onSnapshot(collection(db, 'stores'), (snapshot) => {
      const storesData: Store[] = [];
      snapshot.forEach((doc) => {
        storesData.push({ id: doc.id, ...doc.data() } as Store);
      });
      setStores(storesData);
    });

    return () => unsubStores();
  }, []);
  
  useEffect(() => {
    if (!date?.from) return;
    
    const fromDate = date.from;
    const toDate = date.to || date.from;

    const startOfDayFrom = new Date(fromDate.setHours(0, 0, 0, 0));
    const endOfDayTo = new Date(toDate.setHours(23, 59, 59, 999));

    const startTimestamp = Timestamp.fromDate(startOfDayFrom);
    const endTimestamp = Timestamp.fromDate(endOfDayTo);

    const queryConstraints: QueryConstraint[] = [
        where('timestamp', '>=', startTimestamp),
        where('timestamp', '<=', endTimestamp),
    ];

    if (selectedStoreId !== 'all') {
        queryConstraints.push(where('storeId', '==', selectedStoreId));
    }
    
    queryConstraints.push(orderBy('timestamp', 'desc'));

    const q = query(
      collection(db, 'attendance'), 
      ...queryConstraints
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logsData: AttendanceLog[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logsData.push({
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp).toDate(),
        } as AttendanceLog);
      });
      setLogs(logsData);
    });

    return () => unsubscribe();
  }, [date, selectedStoreId]);

  const handleApplyDateRange = () => {
    setDate(selectedDateRange);
    setIsPopoverOpen(false);
  };
  
  const handleCancel = () => {
    setSelectedDateRange(date); // Revert to the last applied date range
    setIsPopoverOpen(false);
  }

  return (
    <div>
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
        <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
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
      <Dialog>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Crew Member</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {log.photoURL ? (
                      <DialogTrigger asChild onClick={() => setSelectedLogForImage(log)}>
                        <button className="w-16 h-16 rounded-md overflow-hidden bg-muted cursor-pointer">
                          <Image src={log.photoURL} alt={`Photo of ${log.crewMemberName}`} width={64} height={64} className="object-cover w-full h-full" />
                        </button>
                      </DialogTrigger>
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{log.crewMemberName}</TableCell>
                  <TableCell>{log.storeName}</TableCell>
                  <TableCell>{log.timestamp.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={log.type === "in" ? "default" : "secondary"} className={log.type === "in" ? "bg-green-600 text-white" : ""}>
                      {log.type === "in" ? "Clock In" : "Clock Out"}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No attendance records found for this period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {selectedLogForImage && (
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
    </div>
  );
}
