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
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-4 sm:p-6 md:p-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-primary">Admin Dashboard</h1>
          <Tabs defaultValue="attendance" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
              <TabsTrigger value="attendance" className="py-2"><BookUser className="mr-2" /> Attendance</TabsTrigger>
              <TabsTrigger value="stores" className="py-2"><Building2 className="mr-2" /> Stores</TabsTrigger>
              <TabsTrigger value="crew" className="py-2"><Users className="mr-2" /> Crew</TabsTrigger>
              <TabsTrigger value="broadcast" className="py-2"><MessageSquare className="mr-2" /> Broadcast</TabsTrigger>
            </TabsList>
            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Log</CardTitle>
                  <CardDescription>View all clock-in and clock-out records for store crew.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AttendanceLog />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="stores">
              <Card>
                <CardHeader>
                  <CardTitle>Store Management</CardTitle>
                  <CardDescription>Add new stores and view existing ones.</CardDescription>
                </CardHeader>
                <CardContent>
                  <StoreManagement />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="crew">
              <Card>
                <CardHeader>
                  <CardTitle>Crew Management</CardTitle>
                  <CardDescription>Add new store crew members to the system.</CardDescription>
                </CardHeader>
                <CardContent>
                  <CrewManagement />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="broadcast">
              <Card>
                <CardHeader>
                  <CardTitle>Broadcast Message</CardTitle>
                  <CardDescription>Send an announcement to all store crew members.</CardDescription>
                </CardHeader>
                <CardContent>
                  <BroadcastMessage />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
