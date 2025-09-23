"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
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
import { LogIn, LogOut, MapPin, WifiOff, CheckCircle2, XCircle, Loader, Camera } from "lucide-react";
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
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const canClockIn = distance !== null && distance <= 1 && (!lastAction || lastAction.type === 'out') && !!capturedImage;
  const canClockOut = distance !== null && distance <= 1 && lastAction && lastAction.type === 'in' && !!capturedImage;

  useEffect(() => {
    async function getCameraPermission() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (error) {
          console.error("Error accessing camera:", error);
          setHasCameraPermission(false);
          toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description: "Please enable camera permissions in your browser settings.",
          });
        }
      } else {
        setHasCameraPermission(false);
      }
    }
    getCameraPermission();
  }, [toast]);


  useEffect(() => {
    if (!selectedCrewId) {
      setLocation(null);
      setDistance(null);
      setLocationError(null);
      setCapturedImage(null);
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
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
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
      photoURL: capturedImage || undefined,
    };
    setAttendance((prev) => [...prev, newLog]);
    toast({
      title: `Successfully Clocked ${type === 'in' ? 'In' : 'Out'}!`,
      description: `${selectedCrewMember.name} at ${assignedStore.name}`,
      variant: "default",
    });
    setCapturedImage(null); // Reset image after clocking action
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
      }
    }
  };


  const getStatus = () => {
    if (!selectedCrewId) return <AlertDescription>Silakan pilih nama Anda untuk memulai.</AlertDescription>;
    if (isLocating) return <AlertDescription className="flex items-center"><Loader className="mr-2 h-4 w-4 animate-spin" />Mendapatkan lokasi Anda...</AlertDescription>;
    if (locationError) return <AlertDescription className="flex items-center text-destructive"><WifiOff className="mr-2 h-4 w-4" />Tidak bisa mendapatkan lokasi: Gagal memperbarui posisi.</AlertDescription>;
    if (distance === null) return <AlertDescription>Memverifikasi jarak dari toko...</AlertDescription>;
    if (distance > 1) return <AlertDescription className="flex items-center text-destructive"><XCircle className="mr-2 h-4 w-4" />Anda berjarak {distance.toFixed(2)} km. Harap berada dalam jarak 1 km dari toko untuk clock in/out.</AlertDescription>;
    return <AlertDescription className="flex items-center text-green-600"><CheckCircle2 className="mr-2 h-4 w-4" />Anda dalam jangkauan ({distance.toFixed(2)} km). Siap untuk clock in/out.</AlertDescription>;
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-primary">Absensi Kru</CardTitle>
        <CardDescription className="text-center">
          Pilih nama Anda dan lakukan clock in atau out.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Select onValueChange={(value) => { setSelectedCrewId(value); setCapturedImage(null);}} value={selectedCrewId || ""}>
          <SelectTrigger className="w-full text-lg h-12">
            <SelectValue placeholder="Pilih nama Anda..." />
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
          <AlertTitle>Status Lokasi</AlertTitle>
          {getStatus()}
        </Alert>

        {selectedCrewId && (
          <div className="space-y-4 text-center">
            {capturedImage ? (
              <div className="relative">
                <Image src={capturedImage} alt="Selfie" width={400} height={300} className="rounded-lg mx-auto" />
                <Button onClick={() => setCapturedImage(null)} variant="outline" size="sm" className="mt-2">Ambil Ulang Foto</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay playsInline muted />
                {!hasCameraPermission && hasCameraPermission !== null && (
                   <Alert variant="destructive">
                     <AlertTitle>Perlu Akses Kamera</AlertTitle>
                     <AlertDescription>
                       Izinkan akses kamera untuk menggunakan fitur ini.
                     </AlertDescription>
                   </Alert>
                )}
                 <Button onClick={handleCapture} disabled={!hasCameraPermission} size="lg">
                   <Camera className="mr-2" />
                   Ambil Selfie
                 </Button>
              </div>
            )}
             <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

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

    