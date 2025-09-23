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
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import type { AttendanceLog } from '@/lib/types';

export default function AttendanceLog() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
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
  }, []);

  return (
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
          {logs.map((log) => (
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
