"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { UserCog } from "lucide-react";

export default function Header() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleAdminClick = () => {
    setIsDialogOpen(true);
  };

  const handlePasswordSubmit = () => {
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
          <Link href="/" className="text-2xl font-bold text-primary">
            CrewClock
          </Link>
          <Button variant="outline" onClick={handleAdminClick}>
            <UserCog className="h-5 w-5 mr-2" />
            Admin
          </Button>
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
