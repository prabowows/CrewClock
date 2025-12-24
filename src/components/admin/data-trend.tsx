"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import { Loader, LineChart } from 'lucide-react';
import type { Store } from '@/lib/types';

type RecapData = {
  'Store': string;
  'Online': number;
  'Offline': number;
  'Total Bersih': number;
  'Belanja Buah': number;
  'Belanja Salad': number;
  'Gajian': number;
  'Bensin Viar': number;
  'Lainnya': number;
};

type TrendData = {
  storeName: string;
  totalBersih: number;
  penjualanOnline: number;
  penjualanOffline: number;
  totalBelanja: number;
};

const currencyFormatter = (value: number) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`;

export default function DataTrend() {
  const [stores, setStores] = useState<Store[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState('weekly');
  const [selectedStore, setSelectedStore] = useState('all');
  const { toast } = useToast();
  const db = getFirestore();

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storeSnapshot = await getDocs(collection(db, "stores"));
        const fetchedStores = storeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
        setStores(fetchedStores);
      } catch (error) {
        console.error("Error fetching stores:", error);
        toast({ title: "Error", description: "Could not fetch store list.", variant: "destructive" });
      }
    };
    fetchStores();
  }, [db, toast]);

  const fetchTrendData = async () => {
    setIsLoading(true);
    setTrendData([]);

    let startDate, endDate;
    const today = new Date();

    if (period === 'weekly') {
      startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      endDate = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
    } else { // monthly
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
    }
    
    try {
      const querySnapshot = await getDocs(collection(db, "dailyReports"));
      const reports = querySnapshot.docs
        .map(doc => ({
            date: new Date(doc.id + 'T00:00:00'), // Treat date as local
            data: JSON.parse(doc.data().jsonData) as RecapData[]
        }))
        .filter(report => report.date >= startDate && report.date <= endDate);

      const aggregatedData: Record<string, Omit<TrendData, 'storeName'>> = {};

      reports.forEach(report => {
        report.data.forEach(item => {
          if (!aggregatedData[item.Store]) {
            aggregatedData[item.Store] = {
              totalBersih: 0,
              penjualanOnline: 0,
              penjualanOffline: 0,
              totalBelanja: 0,
            };
          }
          aggregatedData[item.Store].totalBersih += item['Total Bersih'];
          aggregatedData[item.Store].penjualanOnline += item['Online'];
          aggregatedData[item.Store].penjualanOffline += item['Offline'];
          aggregatedData[item.Store].totalBelanja += (item['Belanja Buah'] + item['Belanja Salad'] + item['Gajian'] + item['Bensin Viar'] + item['Lainnya']);
        });
      });

      const finalData: TrendData[] = Object.entries(aggregatedData).map(([storeName, data]) => ({
        storeName,
        ...data
      }));

      if (finalData.length === 0) {
        toast({
            title: "Tidak Ada Data",
            description: `Tidak ada data laporan ditemukan untuk periode ini.`,
        });
      }
      
      setTrendData(finalData);

    } catch (error) {
      console.error("Error fetching trend data:", error);
      toast({ title: "Error", description: "Could not fetch trend data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTrendData = trendData.filter(d => selectedStore === 'all' || d.storeName === stores.find(s => s.id === selectedStore)?.name);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren Data</CardTitle>
        <CardDescription>Menganalisis tren penjualan dan belanja toko dalam periode mingguan atau bulanan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Mingguan</SelectItem>
              <SelectItem value="monthly">Bulanan</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Pilih Toko" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Toko</SelectItem>
              {stores.map(store => (
                  <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={fetchTrendData} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
            Tampilkan Tren
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : trendData.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Toko</TableHead>
                  <TableHead>Total Bersih</TableHead>
                  <TableHead>Penjualan Online</TableHead>
                  <TableHead>Penjualan Offline</TableHead>
                  <TableHead>Total Belanja</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrendData.map((item) => (
                  <TableRow key={item.storeName}>
                    <TableCell className="font-medium">{item.storeName}</TableCell>
                    <TableCell>{currencyFormatter(item.totalBersih)}</TableCell>
                    <TableCell>{currencyFormatter(item.penjualanOnline)}</TableCell>
                    <TableCell>{currencyFormatter(item.penjualanOffline)}</TableCell>
                    <TableCell>{currencyFormatter(item.totalBelanja)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
            <LineChart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Pilih periode dan klik "Tampilkan Tren" untuk melihat data.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
