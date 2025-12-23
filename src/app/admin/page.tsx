import Header from "@/components/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceLog from "@/components/admin/attendance-log";
import StoreManagement from "@/components/admin/store-management";
import CrewManagement from "@/components/admin/crew-management";
import BroadcastMessage from "@/components/admin/broadcast-message";
import Overview from "@/components/admin/overview";
import Recap from "@/components/admin/recap";

export default function AdminPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow p-4 sm:p-6 md:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mr. Super Admin</h1>
              <p className="text-muted-foreground">Best wishes for your day!</p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-6 h-auto flex-wrap justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="stores">Stores</TabsTrigger>
              <TabsTrigger value="crew">Crew</TabsTrigger>
              <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
              <TabsTrigger value="recap">Recap</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Overview />
            </TabsContent>
            
            <TabsContent value="attendance">
              <AttendanceLog />
            </TabsContent>
            
            <TabsContent value="stores">
                <StoreManagement />
            </TabsContent>

            <TabsContent value="crew">
                <CrewManagement />
            </TabsContent>

            <TabsContent value="broadcast">
                <BroadcastMessage />
            </TabsContent>

            <TabsContent value="recap">
                <Recap />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
