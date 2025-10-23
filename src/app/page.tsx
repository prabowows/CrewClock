import CrewClock from "@/components/crew-clock";
import Header from "@/components/header";
import Image from "next/image";
import { placeholderImages } from "@/app/lib/placeholder-images.json";

export default function Home() {
  const heroImage = placeholderImages.find(p => p.id === "home-hero");

  return (
    <div className="relative flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=2512&auto=format&fit=crop')", opacity: 0.2 }}
      />
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-white via-transparent to-white dark:from-gray-900 dark:via-transparent dark:to-gray-900" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow w-full container mx-auto p-4 sm:p-6 md:p-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            <CrewClock />
          </div>
          <div className="hidden lg:block relative w-full h-[500px] rounded-2xl overflow-hidden shadow-xl">
             {heroImage && (
                <Image
                  src={heroImage.src}
                  alt={heroImage.alt}
                  fill
                  className="object-cover"
                  data-ai-hint={heroImage.hint}
                />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </main>
      </div>
    </div>
  );
}
