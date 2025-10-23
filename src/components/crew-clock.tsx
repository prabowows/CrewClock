
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
import { LogIn, LogOut, MapPin, WifiOff, CheckCircle2, XCircle, Loader, Camera, RefreshCcw, Bell, Link2 } from "lucide-react";
import type { CrewMember, Store, AttendanceLog, BroadcastMessage } from "@/lib/types";
import { calculateDistance } from "@/lib/location";
import { useToast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { formatDistanceToNow } from 'date-fns';
import Autoplay from "embla-carousel-autoplay";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp, onSnapshot } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function CrewClock() {
  const [allCrewMembers, setAllCrewMembers] = useState<CrewMember[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<AttendanceLog | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const autoplay = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  const { toast } = useToast();

  const fetchInitialData = async () => {
    try {
      const crewSnapshot = await getDocs(collection(db, "crew"));
      setAllCrewMembers(crewSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CrewMember)));
      
      const storeSnapshot = await getDocs(collection(db, "stores"));
      setStores(storeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
    } catch(error) {
      console.error("Failed to fetch initial data", error);
      toast({ title: "Error", description: "Could not fetch store or crew data.", variant: "destructive" });
    }
  }

  useEffect(() => {
    fetchInitialData();
    
    const qBroadcasts = query(collection(db, "broadcasts"), orderBy("timestamp", "desc"));
    const unsubBroadcasts = onSnapshot(qBroadcasts, (snapshot) => {
        const broadcastsData: BroadcastMessage[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            broadcastsData.push({
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as Timestamp).toDate(),
            } as BroadcastMessage);
        });
        setBroadcasts(broadcastsData);
    });

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
      unsubBroadcasts();
    };
  }, []);
  
  const filteredCrewMembers = useMemo(() => {
    if (!selectedStoreId) return [];
    return allCrewMembers.filter(crew => crew.storeId === selectedStoreId);
  }, [selectedStoreId, allCrewMembers]);

  const selectedCrewMember = useMemo(
    () => allCrewMembers.find((c) => c.id === selectedCrewId),
    [selectedCrewId, allCrewMembers]
  );
  
  const assignedStore = useMemo(
    () => stores.find((s) => s.id === selectedCrewMember?.storeId),
    [selectedCrewMember, stores]
  );

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
  
  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    setSelectedCrewId(null);
    setSelectedShift(null);
    setCapturedImage(null);
    setLastAction(null);
  };
  
  const handleCrewChange = (crewId: string) => {
    setSelectedCrewId(crewId);
    setSelectedShift(null);
    setCapturedImage(null);
  }

  const fetchLastAction = async (crewId: string) => {
    if (!crewId) {
      setLastAction(null);
      return;
    }
    try {
      const q = query(
        collection(db, 'attendance'),
        where('crewMemberId', '==', crewId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        setLastAction({
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp).toDate(),
        } as AttendanceLog);
      } else {
        setLastAction(null);
      }
    } catch (error) {
      console.error("Error fetching last action:", error);
      setLastAction(null);
    }
  }

  useEffect(() => {
    if (selectedCrewId) {
      fetchLastAction(selectedCrewId);
    } else {
      setCapturedImage(null);
      setSelectedShift(null);
      setLastAction(null);
    }
  }, [selectedCrewId]);


  const canClockIn = distance !== null && distance <= 1 && (!lastAction || lastAction.type === 'out') && !!capturedImage && !!selectedShift;
  const canClockOut = distance !== null && distance <= 1 && lastAction && lastAction.type === 'in' && !!capturedImage && !!selectedShift;

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
    if (!selectedCrewMember || !assignedStore || !capturedImage || !selectedShift) return;
  
    setIsProcessing(true);
    
    const attendanceData = {
      crewMemberId: selectedCrewMember.id,
      crewMemberName: selectedCrewMember.name,
      storeId: assignedStore.id,
      storeName: assignedStore.name,
      timestamp: new Date(),
      type,
      photoURL: capturedImage,
      shift: selectedShift,
    };
    const collectionRef = collection(db, 'attendance');

    addDoc(collectionRef, attendanceData)
      .then(() => {
        toast({
          title: `Successfully Clocked ${type === 'in' ? 'In' : 'Out'}!`,
          description: `${selectedCrewMember.name} at ${assignedStore.name}`,
          variant: 'default',
        });
        setCapturedImage(null);
        setSelectedCrewId(null);
        setSelectedShift(null);
        setSelectedStoreId(null);
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'create',
          requestResourceData: attendanceData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };


  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.translate(video.videoWidth, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setCapturedImage(dataUrl);
      }

      const stream = video.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    const currentId = selectedCrewId;
    setSelectedCrewId(null);
    setTimeout(() => setSelectedCrewId(currentId), 0);
  };

  const getStatus = () => {
    if (isLocating) return <AlertDescription className="flex items-center"><Loader className="mr-2 h-4 w-4 animate-spin" />Mendapatkan lokasi Anda...</AlertDescription>;
    if (locationError) return <AlertDescription className="flex items-center text-destructive"><WifiOff className="mr-2 h-4 w-4" />Tidak bisa mendapatkan lokasi: Gagal memperbarui posisi.</AlertDescription>;
    if (!selectedCrewId) return <AlertDescription>Silakan pilih toko dan nama Anda untuk memulai.</AlertDescription>;
    if (distance === null) return <AlertDescription>Memverifikasi jarak dari toko...</AlertDescription>;
    if (distance > 1) return <AlertDescription className="flex items-center text-destructive"><XCircle className="mr-2 h-4 w-4" />Anda berjarak {distance.toFixed(2)} km. Harap berada dalam jarak 1 km dari toko.</AlertDescription>;
    return <AlertDescription className="flex items-center text-green-600"><CheckCircle2 className="mr-2 h-4 w-4" />Anda dalam jangkauan ({distance.toFixed(2)} km). Siap untuk clock in/out.</AlertDescription>;
  }

  return (
    <Card className="w-full max-w-lg shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-background/80 backdrop-blur-sm p-6">
        <CardTitle className="text-3xl font-bold text-center text-primary">CrewClock</CardTitle>
        <CardDescription className="text-center text-base">
          Pilih toko, nama, ambil foto, dan lakukan clock in/out.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {broadcasts.length > 0 && (
          <div className="space-y-3">
             <h3 className="text-sm font-semibold text-muted-foreground flex items-center"><Bell className="mr-2 h-4 w-4" /> Papan Pengumuman</h3>
              <Carousel
                  plugins={[autoplay.current]}
                  opts={{ align: "start", loop: true }}
                  className="w-full"
                  onMouseEnter={autoplay.current.stop}
                  onMouseLeave={autoplay.current.reset}
              >
                  <CarouselContent>
                      {broadcasts.map((message) => (
                          <CarouselItem key={message.id}>
                              <div className="p-1">
                                  <div className="bg-primary/10 border-primary/20 border rounded-lg p-4">
                                      <p className="text-sm text-foreground/90">{message.message}</p>
                                      {message.attachmentURL && (
                                        <a
                                          href={message.attachmentURL}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline text-xs mt-2 inline-flex items-center gap-1"
                                        >
                                          <Link2 className="h-3 w-3" />
                                          Lampiran
                                        </a>
                                      )}
                                      <p className="text-xs text-right text-muted-foreground pt-2">
                                          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                                      </p>
                                  </div>
                              </div>
                          </CarouselItem>
                      ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:flex -left-4" />
                  <CarouselNext className="hidden sm:flex -right-4" />
              </Carousel>
          </div>
        )}

        <div className="space-y-4">
          <Select onValueChange={handleStoreChange} value={selectedStoreId || ""}>
            <SelectTrigger className="w-full text-base h-12 rounded-xl">
              <SelectValue placeholder="1. Pilih Toko Anda" />
            </SelectTrigger>
            <SelectContent>
              {stores.map(store => (
                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={handleCrewChange} value={selectedCrewId || ""} disabled={!selectedStoreId}>
            <SelectTrigger className="w-full text-base h-12 rounded-xl">
              <SelectValue placeholder="2. Pilih Nama Anda" />
            </SelectTrigger>
            <SelectContent>
              {filteredCrewMembers.map(crew => (
                <SelectItem key={crew.id} value={crew.id}>{crew.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select onValueChange={setSelectedShift} value={selectedShift || ""} disabled={!selectedCrewId}>
            <SelectTrigger className="w-full text-base h-12 rounded-xl">
              <SelectValue placeholder="3. Pilih Shift Anda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Shift 1">Shift 1</SelectItem>
              <SelectItem value="Shift 2">Shift 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Alert className="rounded-xl">
          <MapPin className="h-4 w-4" />
          <AlertTitle className="font-semibold">Status Lokasi</AlertTitle>
          {getStatus()}
        </Alert>

        {selectedCrewId && (
          <div className="space-y-4 text-center">
            <canvas ref={canvasRef} className="hidden" />

            {capturedImage ? (
              <div className="relative group w-full aspect-[4/3] mx-auto">
                <img src={capturedImage} alt="Selfie" className="rounded-xl object-cover w-full h-full" />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                    <Button onClick={handleRetakePhoto} variant="secondary" size="sm" disabled={isProcessing}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Ambil Ulang
                    </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full aspect-[4/3] bg-muted rounded-xl overflow-hidden flex items-center justify-center">
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
                     <div className="absolute flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader className="animate-spin h-6 w-6" />
                        <p className="text-sm">Memulai kamera...</p>
                     </div>
                   )}
                </div>
                 <Button onClick={handleTakePhoto} size="lg" className="w-full rounded-xl" disabled={hasCameraPermission !== true || isProcessing}>
                   <Camera className="mr-2" />
                   4. Ambil Foto
                 </Button>
              </div>
            )}
          </div>
        )}

      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 p-6 bg-muted/50">
        <Button className="w-full h-16 text-lg rounded-xl" disabled={!canClockIn || isProcessing} onClick={() => handleClockAction('in')}>
          {isProcessing && (!canClockOut) ? <Loader className="animate-spin" /> : <LogIn className="mr-2 h-6 w-6" />}
          Clock In
        </Button>
        <Button variant="secondary" className="w-full h-16 text-lg rounded-xl" disabled={!canClockOut || isProcessing} onClick={() => handleClockAction('out')}>
          {isProcessing && canClockOut ? <Loader className="animate-spin" /> : <LogOut className="mr-2 h-6 w-6" />}
          Clock Out
        </Button>
      </CardFooter>
    </Card>
  );
}
