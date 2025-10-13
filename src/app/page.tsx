import CrewClock from "@/components/crew-clock";
import Header from "@/components/header";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gray-50">
        <CrewClock />
      </main>
    </div>
  );
}
