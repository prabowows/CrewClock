"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Loader } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="flex items-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Memverifikasi otorisasi...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
