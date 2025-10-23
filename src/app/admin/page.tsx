import Header from "@/components/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookUser, Building2, Users, MessageSquare } from 'lucide-react';
import AttendanceLog from "@/components/admin/attendance-log";
import StoreManagement from "@/components/admin/store-management";
import CrewManagement from "@/components/admin/crew-management";
import BroadcastMessage from "@/components/admin/broadcast-message";

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
            <TabsList className="hidden">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="stores">Stores</TabsTrigger>
              <TabsTrigger value="crew">Crew</TabsTrigger>
              <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <Card className="p-4 flex flex-col items-center justify-center text-center">
                        <Users className="w-8 h-8 mb-2 text-primary" />
                        <p className="text-2xl font-bold">54</p>
                        <p className="text-sm text-muted-foreground">Total Karyawan</p>
                    </Card>
                     <Card className="p-4 flex flex-col items-center justify-center text-center">
                        <BookUser className="w-8 h-8 mb-2 text-primary" />
                        <p className="text-2xl font-bold">42</p>
                        <p className="text-sm text-muted-foreground">Total Hadir</p>
                    </Card>
                     <Card className="p-4 flex flex-col items-center justify-center text-center">
                        <Users className="w-8 h-8 mb-2 text-yellow-500" />
                        <p className="text-2xl font-bold">14</p>
                        <p className="text-sm text-muted-foreground">Total Terlambat</p>
                    </Card>
                     <Card className="p-4 flex flex-col items-center justify-center text-center">
                        <Users className="w-8 h-8 mb-2 text-red-500" />
                        <p className="text-2xl font-bold">2</p>
                        <p className="text-sm text-muted-foreground">Total Cuti</p>
                    </Card>
                  </CardContent>
                </Card>
                <div className="grid md:grid-cols-2 gap-6">
                    <AttendanceLog />
                    <CrewManagement />
                </div>
                 <div className="grid md:grid-cols-2 gap-6">
                    <StoreManagement />
                    <BroadcastMessage />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
