"use client";

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore';
import type { AttendanceLog } from '@/lib/types';
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isValid } from "date-fns";
import { DateRange } from 'react-day-picker';

type FilterType = 'day' | 'week' | 'month';

export default function AttendanceLog() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [filter, setFilter] = useState<FilterType>('day');

  const selectedRange: DateRange | undefined = date && isValid(date)
    ? {
        from: filter === 'week' ? startOfWeek(date) : (filter === 'month' ? startOfMonth(date) : startOfDay(date)),
        to: filter === 'week' ? endOfWeek(date) : (filter === 'month' ? endOfMonth(date) : endOfDay(date))
      }
    : undefined;


  useEffect(() => {
    if (!selectedRange?.from || !selectedRange?.to) return;
    
    const startTimestamp = Timestamp.fromDate(selectedRange.from);
    const endTimestamp = Timestamp.fromDate(selectedRange.to);

    const q = query(
      collection(db, 'attendance'), 
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<=', endTimestamp),
      orderBy('timestamp', 'desc')
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
  }, [selectedRange]);
  
  const handleDateSelect = (selected: Date | undefined) => {
    setDate(selected);
  }

  const getDateDisplay = () => {
    if (!date || !isValid(date)) return <span>Pick a date</span>;

    if (filter === 'day') {
      return format(date, "PPP");
    }

    if (filter === 'week') {
      const start = startOfWeek(date);
      const end = endOfWeek(date);
      if (format(start, 'y') !== format(end, 'y')) {
        return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
      }
      if (format(start, 'M') !== format(end, 'M')) {
         return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
      }
      return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
    }

    if (filter === 'month') {
      return format(date, "MMMM yyyy");
    }
  }


  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Button variant={filter === 'day' ? 'default' : 'outline'} onClick={() => setFilter('day')}>Day</Button>
          <Button variant={filter === 'week' ? 'default' : 'outline'} onClick={() => setFilter('week')}>Week</Button>
          <Button variant={filter === 'month' ? 'default' : 'outline'} onClick={() => setFilter('month')}>Month</Button>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-auto min-w-[280px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {getDateDisplay()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              modifiers={{ range: selectedRange || {} }}
              modifiersClassNames={{ range: "rdp-day_range" }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Crew Member</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? logs.map((log) => (
              <TableRow key={log.id}>
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
                <TableCell colSpan={4} className="h-24 text-center">
                  No attendance records found for this period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
