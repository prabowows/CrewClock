
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BookUser, Users, Clock, Plane, Loader, Building, UserCheck } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, where, Timestamp, orderBy, limit } from 'firebase/firestore';
import type { CrewMember, AttendanceLog, Store } from '@/lib/types';
import { format, isToday } from 'date-fns';
import { Badge } from '../ui/badge';
import Image from 'next/image';

const chartConfig = {
  present: {
    label: "Hadir",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function Overview() {
    const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
    const [recentLogs, setRecentLogs] = useState<AttendanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const db = useFirestore();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const crewSnapshot = await getDocs(collection(db, "crew"));
                setCrewMembers(crewSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CrewMember)));

                const storeSnapshot = await getDocs(collection(db, "stores"));
                setStores(storeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));

                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);

                const attendanceQuery = query(
                    collection(db, "attendance"), 
                    where("timestamp", ">=", Timestamp.fromDate(todayStart)),
                    where("timestamp", "<=", Timestamp.fromDate(todayEnd)),
                );
                const attendanceSnapshot = await getDocs(attendanceQuery);
                const todayLogs = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: (doc.data().timestamp as Timestamp).toDate() } as AttendanceLog));
                setAttendanceLogs(todayLogs);
                
                const recentLogQuery = query(collection(db, "attendance"), orderBy("timestamp", "desc"), limit(5));
                const recentLogSnapshot = await getDocs(recentLogQuery);
                setRecentLogs(recentLogSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: (doc.data().timestamp as Timestamp).toDate() } as AttendanceLog)));


            } catch (error) {
                console.error("Error fetching overview data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [db]);

    const totalCrew = crewMembers.length;
    const totalStores = stores.length;

    const { presentTodayCount, attendanceByStore } = useMemo(() => {
        const presentIds = new Set<string>();
        const byStore: Record<string, Set<string>> = {};

        attendanceLogs.forEach(log => {
            if (log.type === 'in') {
                presentIds.add(log.crewMemberId);
                if (!byStore[log.storeName]) {
                    byStore[log.storeName] = new Set();
                }
                byStore[log.storeName].add(log.crewMemberId);
            }
        });

        const chartData = stores.map(store => ({
            store: store.name,
            present: byStore[store.name]?.size || 0,
        }));
        
        return { 
            presentTodayCount: presentIds.size,
            attendanceByStore: chartData,
        };
    }, [attendanceLogs, stores]);
    
    // Static for now
    const onLeaveCount = 2;

    const renderStatCard = (icon: React.ReactNode, value: number, label: string, loading: boolean, colorClass: string) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <div className={colorClass}>{icon}</div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-7 w-12 bg-muted rounded-md animate-pulse mt-1" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className='space-y-6'>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {renderStatCard(<Users className="h-4 w-4" />, totalCrew, "Total Kru", isLoading, "text-primary")}
                {renderStatCard(<Building className="h-4 w-4" />, totalStores, "Total Toko", isLoading, "text-primary")}
                {renderStatCard(<UserCheck className="h-4 w-4" />, presentTodayCount, "Hadir Hari Ini", isLoading, "text-green-500")}
                {renderStatCard(<Plane className="h-4 w-4" />, onLeaveCount, "Total Cuti", false, "text-red-500")}
            </div>

            <div className='grid md:grid-cols-2 gap-6'>
                <Card>
                    <CardHeader>
                        <CardTitle>Kehadiran per Toko</CardTitle>
                        <CardDescription>Jumlah kru yang hadir hari ini di setiap toko.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={attendanceByStore} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="store" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        content={<ChartTooltipContent />}
                                    />
                                    <Bar dataKey="present" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Aktivitas Terbaru</CardTitle>
                        <CardDescription>5 log kehadiran terakhir di semua toko.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kru</TableHead>
                                    <TableHead>Tindakan</TableHead>
                                    <TableHead className='text-right'>Waktu</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <div className='flex items-center gap-3'>
                                                <Image 
                                                    src={log.photoURL || `https://i.pravatar.cc/150?u=${log.crewMemberId}`}
                                                    alt={log.crewMemberName}
                                                    width={32}
                                                    height={32}
                                                    className='rounded-full object-cover'
                                                />
                                                <div>
                                                    <div className='font-medium'>{log.crewMemberName}</div>
                                                    <div className='text-xs text-muted-foreground'>{log.storeName}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={log.type === "in" ? "default" : "secondary"} className={log.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                {log.type === "in" ? "Clock In" : "Clock Out"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className='text-right text-xs text-muted-foreground'>
                                            {format(log.timestamp, 'HH:mm')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
