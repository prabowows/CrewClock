import { Loader } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      <div className="flex items-center gap-4">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Memuat Halaman Admin...</p>
      </div>
    </div>
  );
}
