import CrewClock from "@/components/crew-clock";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow w-full flex items-center justify-center p-4">
        <CrewClock />
      </main>
    </div>
  );
}
