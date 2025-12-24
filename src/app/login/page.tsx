
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useFirebaseApp, useUser, useFirestore } from '@/firebase';
import Header from '@/components/header';
import { Loader, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Alamat email tidak valid.'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@example.com',
      password: 'password123',
    }
  });

  useEffect(() => {
    // This effect redirects an already logged-in admin user.
    if (!isUserLoading && user) {
        const adminRoleRef = doc(db, 'roles_admin', user.uid);
        getDoc(adminRoleRef).then(docSnap => {
            if (docSnap.exists()) {
                router.push('/admin');
            } else {
                // If a non-admin user is logged in, log them out.
                // This handles cases where a non-admin might navigate back to /login
                signOut(auth);
            }
        });
    }
  }, [user, isUserLoading, router, db, auth]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const loggedInUser = userCredential.user;

      // After successful sign-in, check for admin role
      const adminRoleRef = doc(db, 'roles_admin', loggedInUser.uid);
      const docSnap = await getDoc(adminRoleRef);

      if (docSnap.exists()) {
        // User is an admin, redirect them. The useEffect will also catch this,
        // but redirecting here provides a faster user experience.
        toast({
            title: 'Login Berhasil!',
            description: 'Mengarahkan ke dasbor admin...',
        });
        router.push('/admin');
      } else {
        // Not an admin, sign them out immediately and show an error.
        await signOut(auth);
        toast({
          variant: 'destructive',
          title: 'Login Gagal',
          description: 'Anda tidak memiliki hak akses admin.',
        });
      }

    } catch (error: any) {
      let description = 'Terjadi kesalahan saat mencoba masuk. Silakan coba lagi.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = 'Email atau kata sandi yang Anda masukkan salah.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Login Gagal',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>
              Masukkan kredensial Anda untuk mengakses dasbor admin.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  {...register('email')}
                  disabled={isLoading || isUserLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    disabled={isLoading || isUserLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                    disabled={isLoading || isUserLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading || isUserLoading}>
                {(isLoading || isUserLoading) && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                Masuk
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
