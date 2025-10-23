import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CrewClock",
  description: "An attendance system for store crew.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={cn("relative h-full font-sans antialiased", inter.variable)}>
        <FirebaseClientProvider>
          <main className="relative flex flex-col min-h-screen">
            <div className="flex-grow flex-1">{children}</div>
          </main>
          <Toaster />
          <FirebaseErrorListener />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
