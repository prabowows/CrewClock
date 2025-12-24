
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns';
import { Loader, LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Store } from '@/lib/types';

type RecapData = {
  'Store': string;
  'Total Bersih': number;
  'Online': number;
  'Offline': number;
  'Belanja Buah': number;
  'Belanja Salad': number;
  'Gajian': number;
  'Bensin Viar': number;
  'Lainnya': number;
};

type DailyDataPoint = {
  date: string;
  [storeName: string]: number | string;
};

const currencyFormatter = (value: number) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`;

const METRIC_OPTIONS = {
  'Total Bersih': 'Total Bersih',
  'Penjualan Online': 'Online',
  'Penjualan Offline': 'Offline',
  'Total Belanja': 'Total Belanja',
};

const STORE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

export default function DataTrend() {
  const [stores, setStores] = useState<Store[]>([]);
  const [trendData, setTrendData] = useState<DailyDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState('weekly');
  const [selectedMetric, setSelectedMetric] = useState<keyof typeof METRIC_OPTIONS>('Total Bersih');
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
    
    const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });

    try {
      const querySnapshot = await getDocs(collection(db, "dailyReports"));
      const reportsByDate: { [date: string]: RecapData[] } = {};
      
      querySnapshot.docs.forEach(doc => {
        const reportDate = new Date(doc.id + 'T00:00:00');
        if (reportDate >= startDate && reportDate <= endDate) {
          const formattedDate = format(reportDate, 'yyyy-MM-dd');
          reportsByDate[formattedDate] = JSON.parse(doc.data().jsonData);
        }
      });
      
      const dataForChart = intervalDays.map(day => {
        const formattedDate = format(day, 'yyyy-MM-dd');
        const dayStr = format(day, 'dd/MM');
        const dailyReport = reportsByDate[formattedDate];
        
        const dataPoint: DailyDataPoint = { date: dayStr };

        stores.forEach(store => {
          const storeData = dailyReport?.find(r => r.Store === store.name);
          let value = 0;
          if (storeData) {
            if (selectedMetric === 'Total Belanja') {
              value = (storeData['Belanja Buah'] || 0) + (storeData['Belanja Salad'] || 0) + (storeData['Gajian'] || 0) + (storeData['Bensin Viar'] || 0) + (storeData['Lainnya'] || 0);
            } else {
              value = storeData[METRIC_OPTIONS[selectedMetric] as keyof RecapData] as number || 0;
            }
          }
          dataPoint[store.name] = value;
        });

        return dataPoint;
      });

      if (dataForChart.every(d => stores.every(s => d[s.name] === 0))) {
          toast({
              title: "Tidak Ada Data",
              description: `Tidak ada data laporan ditemukan untuk metrik "${selectedMetric}" pada periode ini.`,
          });
          setTrendData([]);
      } else {
        setTrendData(dataForChart);
      }

    } catch (error) {
      console.error("Error fetching trend data:", error);
      toast({ title: "Error", description: "Could not fetch trend data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Automatically fetch data when metric changes, if data already exists
    if (trendData.length > 0) {
      fetchTrendData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMetric]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Tren</CardTitle>
        <CardDescription>Menganalisis tren data toko dalam periode mingguan atau bulanan.</CardDescription>
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
          <Select value={selectedMetric} onValueChange={(val) => setSelectedMetric(val as keyof typeof METRIC_OPTIONS)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Pilih Metrik" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(METRIC_OPTIONS).map(key => (
                 <SelectItem key={key} value={key}>{key}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={fetchTrendData} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
            Tampilkan Tren
          </Button>
        </div>

        <div className="h-[400px] w-full">
            {isLoading ? (
            <div className="flex justify-center items-center h-full">
                <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
            ) : trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={trendData}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis tickFormatter={currencyFormatter} width={80} />
                        <Tooltip formatter={currencyFormatter} />
                        <Legend />
                        {stores.map((store, index) => (
                            <Line 
                                key={store.id} 
                                type="monotone" 
                                dataKey={store.name} 
                                stroke={STORE_COLORS[index % STORE_COLORS.length]} 
                                activeDot={{ r: 8 }} 
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed rounded-lg">
                    <LineChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Pilih periode dan metrik, lalu klik "Tampilkan Tren" untuk melihat data.</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

    