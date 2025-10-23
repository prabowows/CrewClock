
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
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
import { LogIn, LogOut, MapPin, CheckCircle2, XCircle, Loader, Camera, RefreshCcw, UserCog } from "lucide-react";
import type { CrewMember, Store, AttendanceLog, BroadcastMessage } from "@/lib/types";
import { calculateDistance } from "@/lib/location";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp, onSnapshot } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

function DigitalClock() {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        // Set time only on the client
        setTime(new Date());
        const timerId = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => {
            clearInterval(timerId);
        };
    }, []);

    if (!time) {
        return (
          <div className="text-center h-[68px]">
             <div className="text-5xl font-bold text-[#e42841]">- - : - -</div>
             <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        );
    }

    return (
        <div className="text-center">
            <p className="text-5xl font-bold text-[#e42841]">
                {format(time, 'HH:mm')}
            </p>
            <p className="text-base text-muted-foreground">
                {format(time, 'eeee, dd MMMM yyyy')}
            </p>
        </div>
    );
}

export default function CrewClock() {
  const [allCrewMembers, setAllCrewMembers] = useState<CrewMember[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<AttendanceLog | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const db = useFirestore();
  const router = useRouter();

  const handleAdminClick = () => {
    setIsNavigating(true);
    router.push("/login");
  };

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
    () => stores.find((s) => s.id === selectedStoreId),
    [selectedStoreId, stores]
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
    setLastAction(null);
  };
  
  const handleCrewChange = (crewId: string) => {
    setSelectedCrewId(crewId);
    setSelectedShift(null);
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
      setSelectedShift(null);
      setLastAction(null);
    }
  }, [selectedCrewId]);

  useEffect(() => {
    let stream: MediaStream | null = null;
  
    const getCameraPermission = async () => {
      if (!isCameraOpen) {
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
  }, [isCameraOpen, toast]);

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
        setIsCameraOpen(false); 

        const stream = video.srcObject as MediaStream;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
      }
    }
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setIsCameraOpen(true);
  };

  const nextActionType = !lastAction || lastAction.type === 'out' ? 'in' : 'out';
  const canClock = distance !== null && distance <= 1 && !!capturedImage && !!selectedShift && !!selectedCrewId;

  return (
    <div className="w-full max-w-sm mx-auto">
      <Card className="w-full shadow-2xl rounded-2xl overflow-hidden bg-[#e42841] text-primary-foreground">
        <CardHeader className="p-6 space-y-4">
          <div className="flex justify-between items-center">
             <h1 className="text-2xl font-bold">Attendance</h1>
             <Button variant="ghost" size="icon" onClick={handleAdminClick} disabled={isNavigating}>
                {isNavigating ? <Loader className="h-5 w-5 animate-spin" /> : <UserCog className="w-6 h-6" />}
             </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-card text-card-foreground rounded-t-3xl space-y-6">
          <DigitalClock />

          <div className="space-y-4">
              {!capturedImage ? (
                <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                  <DialogTrigger asChild>
                      <button
                          className="w-40 h-40 rounded-full bg-card border-[6px] border-[#e42841] flex flex-col items-center justify-center mx-auto transition-transform active:scale-95 disabled:opacity-50"
                          disabled={isProcessing}
                      >
                          <Camera className="w-16 h-16 text-[#e42841]" />
                          <span className="text-lg font-semibold text-[#e42841] mt-1">Ambil Foto</span>
                      </button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Ambil Foto</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 text-center">
                          <canvas ref={canvasRef} className="hidden" />
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
                            {hasCameraPermission === null && (
                              <div className="absolute flex flex-col items-center gap-2 text-muted-foreground">
                                  <Loader className="animate-spin h-6 w-6" />
                                  <p className="text-sm">Memulai kamera...</p>
                              </div>
                            )}
                          </div>
                          <Button onClick={handleTakePhoto} size="lg" className="w-full rounded-xl" disabled={hasCameraPermission !== true || isProcessing}>
                            <Camera className="mr-2" />
                            Ambil Foto
                          </Button>
                      </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="relative group w-40 h-40 mx-auto rounded-full overflow-hidden border-[6px] border-[#e42841]">
                    <img src={capturedImage} alt="Selfie" className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={handleRetakePhoto} className="text-white bg-black/50 p-2 rounded-full">
                            <RefreshCcw className="w-6 h-6" />
                        </button>
                    </div>
                  </div>
              )}
          </div>
          
          <div className="space-y-3">
             <p className="text-center text-muted-foreground">Choose your remote mode</p>
             <div className="grid grid-cols-2 gap-4">
                <Select onValueChange={handleStoreChange} value={selectedStoreId || ""}>
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Pilih Toko" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={handleCrewChange} value={selectedCrewId || ""} disabled={!selectedStoreId}>
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Pilih Kru" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCrewMembers.map(crew => (
                      <SelectItem key={crew.id} value={crew.id}>{crew.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
              <Select onValueChange={setSelectedShift} value={selectedShift || ""} disabled={!selectedCrewId}>
                <SelectTrigger className="w-full h-12 rounded-xl">
                  <SelectValue placeholder="Pilih Shift" />
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
            {isLocating ? <AlertDescription className="flex items-center"><Loader className="mr-2 h-4 w-4 animate-spin" />Mendapatkan lokasi Anda...</AlertDescription> : 
             !assignedStore ? <AlertDescription>Silakan pilih toko untuk memverifikasi lokasi.</AlertDescription> :
             distance === null ? <AlertDescription className="flex items-center"><Loader className="mr-2 h-4 w-4 animate-spin" />Memverifikasi jarak...</AlertDescription> :
             distance > 1 ? <AlertDescription className="flex items-center text-destructive"><XCircle className="mr-2 h-4 w-4" />Anda berjarak {distance.toFixed(2)} km. Harap berada dalam jarak 1 km.</AlertDescription> :
             <AlertDescription className="flex items-center text-green-600"><CheckCircle2 className="mr-2 h-4 w-4" />Anda dalam jangkauan ({distance?.toFixed(2)} km).</AlertDescription>
            }
          </Alert>

          <Button 
            className="w-full h-14 text-lg rounded-xl" 
            disabled={!canClock || isProcessing} 
            onClick={() => handleClockAction(nextActionType)}
          >
            {isProcessing ? <Loader className="animate-spin" /> : (nextActionType === 'in' ? <LogIn className="mr-2 h-6 w-6" /> : <LogOut className="mr-2 h-6 w-6" />)}
            {nextActionType === 'in' ? 'Clock In' : 'Clock Out'}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}

    

    