import CrewClock from "@/components/crew-clock";
import Header from "@/components/header";
import Image from "next/image";
import { placeholderImages } from "@/app/lib/placeholder-images.json";

export default function Home() {
  const heroImage = placeholderImages.find(p => p.id === "home-hero");

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
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
  );
}
