
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader, BarChart, FileSearch, Info, Copy } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Textarea } from '../ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '../ui/button';

type RecapData = {
  'Store': string;
  'Hari': string;
  'Tanggal': string;
  'QRIS': number;
  'Gojek': number;
  'Grab': number;
  'Shopee': number;
  'Online': number;
  'Offline': number;
  'Omset Kotor': number;
  'Belanja Buah': number;
  'Belanja Salad': number;
  'Gajian': number;
  'Bensin Viar': number;
  'Lainnya': number;
  'Uang Offline': number;
  'Total Bersih': number;
  'Sum Uang Offline': number;
  'Sum Uang Online': number;
  'CupOffline': number;
  'CupOnline': number;
};

const currencyFormatter = (value: number) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`;
const numberFormatter = (value: number) => new Intl.NumberFormat('id-ID').format(value);

const generateHardcodedReport = (recapData: RecapData[], date: Date) => {
    if (recapData.length === 0) return "";

    let report = `Laporan Penjualan - ${format(date, 'd MMMM yyyy')}\n\n`;

    recapData.forEach(item => {
        report += `📍 Store: ${item.Store}\n`;
        report += `--------------------------------\n`;
        report += `Omset Kotor: ${currencyFormatter(item['Omset Kotor'])}\n`;
        report += `Total Bersih: ${currencyFormatter(item['Total Bersih'])}\n`;
        report += `\n`;
        report += `Penjualan Online: ${currencyFormatter(item['Online'])}\n`;
        report += `Penjualan Offline: ${currencyFormatter(item['Offline'])}\n`;
        report += `\n`;
        report += `Total Belanja: ${currencyFormatter(item['Belanja Buah'] + item['Belanja Salad'] + item['Gajian'] + item['Bensin Viar'] + item['Lainnya'])}\n`;
        report += `   - Belanja Buah: ${currencyFormatter(item['Belanja Buah'])}\n`;
        report += `   - Belanja Salad: ${currencyFormatter(item['Belanja Salad'])}\n`;
        report += `   - Gajian: ${currencyFormatter(item['Gajian'])}\n`;
        report += `   - Bensin Viar: ${currencyFormatter(item['Bensin Viar'])}\n`;
        report += `   - Lainnya: ${currencyFormatter(item['Lainnya'])}\n`;
        report += `\n`;
        report += `Cup Terjual (Online): ${item['CupOnline']} cups\n`;
        report += `Cup Terjual (Offline): ${item['CupOffline']} cups\n`;
        report += `\n\n`;
    });
    
    const totalOmsetKotor = recapData.reduce((sum, item) => sum + item['Omset Kotor'], 0);
    const totalBersih = recapData.reduce((sum, item) => sum + item['Total Bersih'], 0);

    report += `Ringkasan Total\n`;
    report += `================================\n`;
    report += `Total Omset Kotor (Semua Toko): ${currencyFormatter(totalOmsetKotor)}\n`;
    report += `Total Bersih (Semua Toko): ${currencyFormatter(totalBersih)}\n`;

    return report;
}

export default function DataScience() {
  const [data, setData] = useState<RecapData[]>([]);
  const [reportText, setReportText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [availableReportDates, setAvailableReportDates] = useState<Date[]>([]);
  const { toast } = useToast();
  const db = getFirestore();

  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "dailyReports"));
        const dates = querySnapshot.docs.map(doc => {
            const [year, month, day] = doc.id.split('-').map(Number);
            // Create date as UTC to avoid timezone shifts
            return new Date(Date.UTC(year, month - 1, day));
        });
        setAvailableReportDates(dates);
      } catch (error) {
        console.error("Error fetching available dates:", error);
        toast({
          variant: "destructive",
          title: "Gagal Memuat Tanggal",
          description: "Tidak dapat mengambil daftar laporan yang tersedia."
        });
      }
    };
    fetchAvailableDates();
  }, [db, toast]);


  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;

    setSelectedDate(date);
    setIsLoading(true);
    setData([]);
    setReportText("");

    const formattedDate = format(date, 'yyyy-MM-dd');
    const reportRef = doc(db, 'dailyReports', formattedDate);

    try {
      const docSnap = await getDoc(reportRef);

      if (docSnap.exists()) {
        const reportData = docSnap.data();
        const parsedData = JSON.parse(reportData.jsonData) as RecapData[];
        setData(parsedData);
        const generatedText = generateHardcodedReport(parsedData, date);
        setReportText(generatedText);
        toast({
          title: 'Laporan Ditemukan',
          description: `Menampilkan laporan untuk tanggal ${format(date, 'd MMMM yyyy')}.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Laporan Tidak Ditemukan',
          description: `Tidak ada laporan yang tersimpan untuk tanggal ${format(date, 'd MMMM yyyy')}.`,
        });
      }
    } catch (error) {
      console.error("Error loading report:", error);
      toast({
        variant: 'destructive',
        title: 'Gagal Memuat Laporan',
        description: 'Terjadi kesalahan saat mengambil data dari database.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText).then(() => {
      toast({ title: 'Laporan disalin ke clipboard!' });
    });
  };

  const chartData = data.map(item => ({
    name: item.Store,
    'Omset Kotor': item['Omset Kotor'],
    'Total Bersih': item['Total Bersih'],
    'Penjualan Online': item['Online'],
    'Penjualan Offline': item.Offline,
    'Total Belanja': (item['Belanja Buah'] || 0) + (item['Belanja Salad'] || 0) + (item['Gajian'] || 0) + (item['Bensin Viar'] || 0) + (item['Lainnya'] || 0),
    'QRIS': item.QRIS,
    'Gojek': item.Gojek,
    'Grab': item.Grab,
    'Shopee': item.Shopee,
    'Belanja Buah': item['Belanja Buah'],
    'Belanja Salad': item['Belanja Salad'],
    'Gajian': item['Gajian'],
    'Bensin Viar': item['Bensin Viar'],
    'Lainnya': item['Lainnya'],
    'CupOnline': item.CupOnline,
    'CupOffline': item.CupOffline,
  }));

  const renderChart = (dataKey: string[], title: string, fillColors: string[], formatter: (value: number) => string = currencyFormatter) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatter} fontSize={12} tickLine={false} axisLine={false}/>
            <Tooltip formatter={formatter}/>
            <Legend />
            {dataKey.map((key, index) => (
                 <Bar key={key} dataKey={key} fill={fillColors[index]} radius={[4, 4, 0, 0]} />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const hasDataModifier = { hasData: availableReportDates };
  const modifiersStyles = {
    hasData: {
      textDecoration: 'underline',
      textDecorationColor: 'hsl(var(--primary))',
      textDecorationThickness: '2px',
      textUnderlineOffset: '3px',
    },
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Data Science</CardTitle>
             <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Pilih tanggal pada kalender untuk melihat laporan penjualan yang sudah tersimpan.
              </AlertDescription>
            </Alert>
          </CardHeader>
          <CardContent className="flex justify-center">
              <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border p-4"
                  modifiers={hasDataModifier}
                  modifiersClassNames={{ hasData: 'has-data' }}
              />
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2 space-y-6">
        {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[500px]">
                <Loader className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Memuat laporan...</p>
            </div>
        ) : data.length > 0 ? (
          <>
              <div className="grid lg:grid-cols-2 gap-6">
                  {renderChart(['Omset Kotor', 'Total Bersih', 'Total Belanja'], 'Perbandingan Omset, Laba Bersih, dan Belanja', ['#16a34a', '#3b82f6', '#ef4444'])}
                  {renderChart(['Penjualan Online', 'Penjualan Offline'], 'Perbandingan Penjualan Online vs Offline', ['#ea580c', '#8b5cf6'])}
              </div>
              {renderChart(['Belanja Buah', 'Belanja Salad', 'Gajian', 'Bensin Viar', 'Lainnya'], 'Rincian Belanja per Toko', ['#facc15', '#fb923c', '#4ade80', '#34d399', '#a78bfa'])}
              {renderChart(['CupOnline', 'CupOffline'], 'Perbandingan Penjualan Cup', ['#f97316', '#166534'], numberFormatter)}
              <Card>
                  <CardHeader>
                      <CardTitle className="text-lg">Detail Platform Penjualan Online</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis tickFormatter={currencyFormatter} fontSize={12} tickLine={false} axisLine={false}/>
                          <Tooltip formatter={currencyFormatter}/>
                          <Legend />
                          <Bar dataKey="QRIS" fill="#000000" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Gojek" fill="#86efac" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Grab" fill="#166534" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Shopee" fill="#f97316" radius={[4, 4, 0, 0]}/>
                      </RechartsBarChart>
                      </ResponsiveContainer>
                  </CardContent>
              </Card>
               <Card>
                  <CardHeader>
                      <CardTitle>Laporan Teks</CardTitle>
                      <CardDescription>Ringkasan teks dari data yang dimuat.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <Textarea 
                          readOnly
                          value={reportText}
                          className="min-h-[300px] bg-muted/50 text-sm font-mono"
                          placeholder="Tidak ada data untuk ditampilkan."
                      />
                      <Button onClick={handleCopy} disabled={!reportText} className="w-full">
                          <Copy className="mr-2 h-4 w-4" />
                          Salin ke Clipboard
                      </Button>
                  </CardContent>
              </Card>
          </>
        ) : (
           <Card className='min-h-[500px] flex items-center justify-center'>
              <CardContent className="text-center">
                  <FileSearch className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Pilih Tanggal</h3>
                  <p className="text-muted-foreground">Pilih tanggal dari kalender di sebelah kiri untuk memuat dan menampilkan data laporan.</p>
              </CardContent>
           </Card>
        )}
      </div>
    </div>
  );
}

    