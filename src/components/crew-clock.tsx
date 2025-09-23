"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { LogIn, LogOut, MapPin, WifiOff, CheckCircle2, XCircle, Loader, Camera, RefreshCcw, Bell } from "lucide-react";
import { broadcastMessages } from "@/lib/data";
import type { CrewMember, Store, AttendanceLog } from "@/lib/types";
import { calculateDistance } from "@/lib/location";
import { useToast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { formatDistanceToNow } from 'date-fns';
import Autoplay from "embla-carousel-autoplay";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, getDocs, Timestamp } from "firebase/firestore";


export default function CrewClock() {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<AttendanceLog | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const autoplay = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  const { toast } = useToast();

  useEffect(() => {
    const unsubCrew = onSnapshot(collection(db, "crew"), (snapshot) => {
      setCrewMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CrewMember)));
    });
    const unsubStores = onSnapshot(collection(db, "stores"), (snapshot) => {
      setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
    });

    // Get location once on mount
    setLocationError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lon: longitude });
          setIsLocating(false);
        },
        (error) => {
          setLocationError("Position update is unavailable.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
      setIsLocating(false);
    }

    return () => {
      unsubCrew();
      unsubStores();
    };
  }, []);

  const selectedCrewMember = useMemo(
    () => crewMembers.find((c) => c.id === selectedCrewId),
    [selectedCrewId, crewMembers]
  );
  
  const assignedStore = useMemo(
    () => stores.find((s) => s.id === selectedCrewMember?.storeId),
    [selectedCrewMember, stores]
  );

  // Effect to calculate distance when location or store changes
  useEffect(() => {
    if (location && assignedStore) {
      const dist = calculateDistance(
        location.lat,
        location.lon,
        assignedStore.latitude,
        assignedStore.longitude
      );
      setDistance(dist);
    } else {
      setDistance(null);
    }
  }, [location, assignedStore]);

  useEffect(() => {
    if (!selectedCrewId) {
      setLastAction(null);
      setCapturedImage(null);
      return;
    }
  
    const q = query(
      collection(db, 'attendance'),
      where('crewMemberId', '==', selectedCrewId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        setLastAction({ 
          id: doc.id, 
          ...data,
          timestamp: (data.timestamp as Timestamp).toDate()
        } as AttendanceLog);
      } else {
        setLastAction(null);
      }
    });
  
    return () => unsubscribe();
  }, [selectedCrewId]);


  const canClockIn = distance !== null && distance <= 1 && (!lastAction || lastAction.type === 'out') && !!capturedImage;
  const canClockOut = distance !== null && distance <= 1 && lastAction && lastAction.type === 'in' && !!capturedImage;

  // Effect for camera
  useEffect(() => {
    let stream: MediaStream | null = null;
  
    const getCameraPermission = async () => {
      if (!selectedCrewId) {
        setHasCameraPermission(null);
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        return;
      }
      if (typeof navigator.mediaDevices?.getUserMedia !== 'function') {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Kamera Tidak Didukung',
          description: 'Browser Anda tidak mendukung akses kamera.',
        });
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Akses Kamera Ditolak',
          description: 'Mohon izinkan akses kamera di pengaturan browser Anda.',
        });
      }
    };
  
    getCameraPermission();
  
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedCrewId, toast]);

  const handleClockAction = async (type: 'in' | 'out') => {
    if (!selectedCrewMember || !assignedStore) return;

    try {
      await addDoc(collection(db, 'attendance'), {
        crewMemberId: selectedCrewMember.id,
        crewMemberName: selectedCrewMember.name,
        storeId: assignedStore.id,
        storeName: assignedStore.name,
        timestamp: new Date(),
        type,
        photoURL: capturedImage || '',
      });

      toast({
        title: `Successfully Clocked ${type === 'in' ? 'In' : 'Out'}!`,
        description: `${selectedCrewMember.name} at ${assignedStore.name}`,
        variant: "default",
      });
      setCapturedImage(null);
      // Don't reset selection, allow user to see the button state change
      // setSelectedCrewId(null); 
    } catch (e) {
      console.error("Error adding document: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not record attendance." });
    }
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        // Flip the image horizontally for a mirror effect
        context.translate(video.videoWidth, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
      }

      // Stop the camera stream
      const stream = video.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    // The camera permission useEffect will re-run and start the stream again
    // A bit of a hack to re-trigger the camera useEffect
    const currentId = selectedCrewId;
    setSelectedCrewId(null);
    setTimeout(() => setSelectedCrewId(currentId), 0);
  };


  const getStatus = () => {
    if (isLocating) return <AlertDescription className="flex items-center"><Loader className="mr-2 h-4 w-4 animate-spin" />Mendapatkan lokasi Anda...</AlertDescription>;
    if (locationError) return <AlertDescription className="flex items-center text-destructive"><WifiOff className="mr-2 h-4 w-4" />Tidak bisa mendapatkan lokasi: Gagal memperbarui posisi.</AlertDescription>;
    if (!selectedCrewId) return <AlertDescription>Silakan pilih nama Anda untuk memulai.</AlertDescription>;
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
        <Card className="bg-primary/10 border-primary/20">
            <CardHeader className="p-4">
                <CardTitle className="text-lg flex items-center">
                    <Bell className="mr-2 h-5 w-5 text-primary"/>
                    Papan Pengumuman
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <Carousel
                    plugins={[autoplay.current]}
                    opts={{ align: "start", loop: true }}
                    className="w-full"
                    onMouseEnter={autoplay.current.stop}
                    onMouseLeave={autoplay.current.reset}
                >
                    <CarouselContent>
                        {broadcastMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map((message) => (
                            <CarouselItem key={message.id}>
                                <div className="p-1">
                                    <Card>
                                        <CardContent className="flex flex-col p-4 space-y-2">
                                            <p className="text-sm text-foreground/90">{message.message}</p>
                                            <p className="text-xs text-right text-muted-foreground">
                                                {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex -left-4" />
                    <CarouselNext className="hidden sm:flex -right-4" />
                </Carousel>
            </CardContent>
        </Card>


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
            <canvas ref={canvasRef} className="hidden" />

            {capturedImage ? (
              <div className="relative group">
                <img src={capturedImage} alt="Selfie" className="rounded-lg mx-auto max-w-full h-auto" />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button onClick={handleRetakePhoto} variant="outline" size="sm">
                        <RefreshCcw className="mr-2" />
                        Ambil Ulang
                    </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  <video ref={videoRef} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} autoPlay muted playsInline />
                  {hasCameraPermission === false && (
                     <Alert variant="destructive" className="m-4">
                       <Camera className="h-4 w-4" />
                       <AlertTitle>Akses Kamera Diperlukan</AlertTitle>
                       <AlertDescription>
                         Izinkan akses kamera di browser Anda untuk melanjutkan.
                       </AlertDescription>
                     </Alert>
                  )}
                   {hasCameraPermission === null && selectedCrewId && (
                     <div className="absolute flex flex-col items-center gap-2">
                        <Loader className="animate-spin" />
                        <p className="text-sm text-muted-foreground">Memulai kamera...</p>
                     </div>
                   )}
                </div>
                 <Button onClick={handleTakePhoto} size="lg" disabled={hasCameraPermission !== true}>
                   <Camera className="mr-2" />
                   Ambil Foto
                 </Button>
              </div>
            )}
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
