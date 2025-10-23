
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserCog, LogOut, Loader } from "lucide-react";
import { useUser, useFirebaseApp } from "@/firebase";
import { getAuth, signOut } from "firebase/auth";

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
    <header className="bg-card shadow-md">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
          <span className="text-xl font-bold">CrewClock</span>
        </Link>
          <div className="flex items-center gap-4">
            {isUserLoading ? (
              <Button variant="outline" size="icon" disabled>
                <Loader className="h-5 w-5 animate-spin" />
              </Button>
            ) : user ? (
              <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? <Loader className="h-5 w-5 mr-2 animate-spin" /> : <LogOut className="h-5 w-5 mr-2" />}
                Keluar
              </Button>
            ) : (
              <Button variant="outline" onClick={handleAdminClick} disabled={isNavigating}>
                {isNavigating ? <Loader className="h-5 w-5 mr-2 animate-spin" /> : <UserCog className="h-5 w-5 mr-2" />}
                Admin
              </Button>
            )}
          </div>
        </nav>
      </header>
  );
}
