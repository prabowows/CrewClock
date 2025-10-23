import CrewClock from "@/components/crew-clock";
import Header from "@/components/header";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <CrewClock />
      </main>
    </div>
  );
}
