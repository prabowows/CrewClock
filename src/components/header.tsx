
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserCog, LogOut, Loader, Settings } from "lucide-react";
import { useUser, useFirebaseApp } from "@/firebase";
import { getAuth, signOut } from "firebase/auth";
import Image from "next/image";

export default function Header() {
  const router = useRouter();
  const { toast } = useToast();
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const { user, isUserLoading } = useUser();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleAdminClick = () => {
    setIsNavigating(true);
    router.push("/login");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      toast({
        title: "Logout Berhasil",
        description: "Anda telah berhasil keluar.",
      });
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Gagal",
        description: "Terjadi kesalahan saat mencoba keluar.",
      });
    } finally {
        setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-card shadow-sm print:hidden">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-3 text-xl font-bold text-primary">
          <span className="text-xl font-bold">CrewClock</span>
        </Link>
          <div className="flex items-center gap-4">
            {isUserLoading ? (
              <Button variant="ghost" size="icon" disabled>
                <Loader className="h-5 w-5 animate-spin" />
              </Button>
            ) : user ? (
               <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-sm">Mr. Super Admin</p>
                    <p className="text-xs text-muted-foreground">Best wishes!</p>
                  </div>
                  <Image src="https://i.pravatar.cc/150?u=admin" alt="Admin" width={40} height={40} className="rounded-full" />
                  <Button variant="ghost" size="icon" onClick={handleLogout} disabled={isLoggingOut}>
                    {isLoggingOut ? <Loader className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
                  </Button>
               </div>
            ) : (
              <Button variant="ghost" onClick={handleAdminClick} disabled={isNavigating}>
                {isNavigating ? <Loader className="h-5 w-5 mr-2 animate-spin" /> : <UserCog className="h-5 w-5 mr-2" />}
                Admin Login
              </Button>
            )}
          </div>
        </nav>
      </header>
  );
}
