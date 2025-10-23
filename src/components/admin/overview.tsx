
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookUser, Users } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { CrewMember, AttendanceLog } from '@/lib/types';
import { isToday } from 'date-fns';

export default function Overview() {
    const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
    const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const db = useFirestore();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const crewSnapshot = await getDocs(collection(db, "crew"));
                setCrewMembers(crewSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CrewMember)));

                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);

                const attendanceQuery = query(
                    collection(db, "attendance"), 
                    where("timestamp", ">=", Timestamp.fromDate(todayStart)),
                    where("timestamp", "<=", Timestamp.fromDate(todayEnd)),
                    where("type", "==", "in")
                );
                const attendanceSnapshot = await getDocs(attendanceQuery);
                setAttendanceLogs(attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: (doc.data().timestamp as Timestamp).toDate() } as AttendanceLog)));
            } catch (error) {
                console.error("Error fetching overview data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [db]);

    const totalKaryawan = crewMembers.length;
    const totalHadir = useMemo(() => {
        const presentIds = new Set(attendanceLogs.map(log => log.crewMemberId));
        return presentIds.size;
    }, [attendanceLogs]);
    
    // These are still static as we don't have late/leave data
    const totalTerlambat = 14; 
    const totalCuti = 2;

    const renderStatCard = (icon: React.ReactNode, value: number, label: string, loading: boolean) => (
        <Card className="p-4 flex flex-col items-center justify-center text-center">
            {icon}
            {loading ? (
                <div className="h-7 w-12 bg-muted rounded-md animate-pulse mt-1 mb-2" />
            ) : (
                <p className="text-2xl font-bold">{value}</p>
            )}
            <p className="text-sm text-muted-foreground">{label}</p>
        </Card>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Today's Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderStatCard(<Users className="w-8 h-8 mb-2 text-primary" />, totalKaryawan, "Total Karyawan", isLoading)}
                {renderStatCard(<BookUser className="w-8 h-8 mb-2 text-primary" />, totalHadir, "Total Hadir", isLoading)}
                {renderStatCard(<Users className="w-8 h-8 mb-2 text-yellow-500" />, totalTerlambat, "Total Terlambat", false)}
                {renderStatCard(<Users className="w-8 h-8 mb-2 text-red-500" />, totalCuti, "Total Cuti", false)}
            </CardContent>
        </Card>
    );
}
