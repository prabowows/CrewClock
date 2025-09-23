import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserCog } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-card shadow-md">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-2xl font-bold text-primary">
          CrewClock
        </Link>
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin">
            <UserCog className="h-6 w-6 text-primary" />
            <span className="sr-only">Admin Dashboard</span>
          </Link>
        </Button>
      </nav>
    </header>
  );
}
