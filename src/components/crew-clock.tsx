"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LogIn, LogOut, MapPin, WifiOff, CheckCircle2, XCircle, Loader } from "lucide-react";
import { crewMembers, stores, attendanceLogs as initialLogs } from "@/lib/data";
import type { CrewMember, AttendanceLog } from "@/lib/types";
import { calculateDistance } from "@/lib/location";
import { useToast } from "@/hooks/use-toast";

export default function CrewClock() {
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<AttendanceLog[]>(initialLogs);
  const { toast } = useToast();

  const selectedCrewMember = useMemo(
    () => crewMembers.find((c) => c.id === selectedCrewId),
    [selectedCrewId]
  );
  
  const assignedStore = useMemo(
    () => stores.find((s) => s.id === selectedCrewMember?.storeId),
    [selectedCrewMember]
  );

  const lastAction = useMemo(() => {
    return attendance
      .filter((log) => log.crewMemberId === selectedCrewId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }, [attendance, selectedCrewId]);

  const canClockIn = distance !== null && distance <= 1 && (!lastAction || lastAction.type === 'out');
  const canClockOut = distance !== null && distance <= 1 && lastAction && lastAction.type === 'in';

  useEffect(() => {
    if (!selectedCrewId) {
      setLocation(null);
      setDistance(null);
      setLocationError(null);
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLocation = { lat: latitude, lon: longitude };
        setLocation(currentLocation);

        if (assignedStore) {
          const dist = calculateDistance(
            currentLocation.lat,
            currentLocation.lon,
            assignedStore.latitude,
            assignedStore.longitude
          );
          setDistance(dist);
        }
        setIsLocating(false);
      },
      (error) => {
        setLocationError(error.message);
        setIsLocating(false);
        setDistance(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [selectedCrewId, assignedStore]);

  const handleClockAction = (type: 'in' | 'out') => {
    if (!selectedCrewMember || !assignedStore) return;

    const newLog: AttendanceLog = {
      id: `log-${Date.now()}`,
      crewMemberId: selectedCrewMember.id,
      crewMemberName: selectedCrewMember.name,
      storeId: assignedStore.id,
      storeName: assignedStore.name,
      timestamp: new Date(),
      type,
    };
    setAttendance((prev) => [...prev, newLog]);
    toast({
      title: `Successfully Clocked ${type === 'in' ? 'In' : 'Out'}!`,
      description: `${selectedCrewMember.name} at ${assignedStore.name}`,
      variant: "default",
    });
  };

  const getStatus = () => {
    if (!selectedCrewId) return <AlertDescription>Please select your name to start.</AlertDescription>;
    if (isLocating) return <AlertDescription className="flex items-center"><Loader className="mr-2 h-4 w-4 animate-spin" />Getting your location...</AlertDescription>;
    if (locationError) return <AlertDescription className="flex items-center text-destructive"><WifiOff className="mr-2 h-4 w-4" />Could not get location: {locationError}</AlertDescription>;
    if (distance === null) return <AlertDescription>Verifying distance from store...</AlertDescription>;
    if (distance > 1) return <AlertDescription className="flex items-center text-destructive"><XCircle className="mr-2 h-4 w-4" />You are {distance.toFixed(2)} km away. Please move within 1 km of the store to clock in/out.</AlertDescription>;
    return <AlertDescription className="flex items-center text-green-600"><CheckCircle2 className="mr-2 h-4 w-4" />You are in range ({distance.toFixed(2)} km away). Ready to clock in/out.</AlertDescription>;
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-primary">Crew Attendance</CardTitle>
        <CardDescription className="text-center">
          Select your name and clock in or out.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Select onValueChange={setSelectedCrewId} value={selectedCrewId || ""}>
          <SelectTrigger className="w-full text-lg h-12">
            <SelectValue placeholder="Select your name..." />
          </SelectTrigger>
          <SelectContent>
            {crewMembers.map((crew: CrewMember) => (
              <SelectItem key={crew.id} value={crew.id}>
                {crew.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertTitle>Location Status</AlertTitle>
          {getStatus()}
        </Alert>

      </CardContent>
      <CardFooter className="flex justify-between gap-4">
        <Button className="w-full h-14 text-lg" disabled={!canClockIn} onClick={() => handleClockAction('in')}>
          <LogIn className="mr-2 h-6 w-6" /> Clock In
        </Button>
        <Button variant="outline" className="w-full h-14 text-lg" disabled={!canClockOut} onClick={() => handleClockAction('out')}>
          <LogOut className="mr-2 h-6 w-6" /> Clock Out
        </Button>
      </CardFooter>
    </Card>
  );
}
