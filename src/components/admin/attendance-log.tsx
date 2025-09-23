"use client";

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { attendanceLogs as initialLogs } from "@/lib/data";

export default function AttendanceLog() {
  const [logs] = useState(initialLogs.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()));

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
