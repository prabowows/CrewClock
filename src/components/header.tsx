
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCog, LogOut } from "lucide-react";

export default function Header() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const isAdminPage = pathname === "/admin";

  const handleAdminClick = () => {
    setIsDialogOpen(true);
  };

  const handleExitAdminClick = () => {
    router.push("/");
  };

  const handlePasswordSubmit = async () => {
    if (password === "1234") {
      toast({
        title: "Akses Diberikan",
        description: "Mengarahkan ke halaman admin...",
      });
      setIsDialogOpen(false);
      setPassword("");
      router.push("/admin");
    } else {
      toast({
        variant: "destructive",
        title: "Akses Ditolak",
        description: "Kata sandi yang Anda masukkan salah.",
      });
      setPassword("");
    }
  };

  return (
    <>
      <header className="bg-card shadow-md">
        <nav className="container mx-auto flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Image src="data:image/png;base64,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" alt="CrewClock Logo" width={32} height={32} />
            <span className="text-xl font-bold">CrewClock</span>
          </Link>
          {isAdminPage ? (
            <Button variant="outline" onClick={handleExitAdminClick}>
              <LogOut className="h-5 w-5 mr-2" />
              Exit Admin
            </Button>
          ) : (
            <Button variant="outline" onClick={handleAdminClick}>
              <UserCog className="h-5 w-5 mr-2" />
              Admin
            </Button>
          )}
        </nav>
      </header>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Akses Terbatas</DialogTitle>
            <DialogDescription>
              Silakan masukkan kata sandi untuk mengakses dasbor admin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Kata Sandi
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handlePasswordSubmit}>Masuk</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    