
"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Copy, Check, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Textarea } from '../ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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


export default function Recap() {
  const [data, setData] = useState<RecapData[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [reportText, setReportText] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileData = e.target?.result;
        const workbook = XLSX.read(fileData, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        if (jsonData.length === 0) {
            toast({
                variant: 'destructive',
                title: 'File Kosong',
                description: 'File Excel yang Anda unggah tidak berisi data.',
            });
            resetState();
            return;
        }
        
        const originalHeaders = Object.keys(jsonData[0] || {});
        const headerMap: { [key: string]: string } = {};
        originalHeaders.forEach(h => {
            headerMap[h.toLowerCase().trim()] = h;
        });

        const requiredColumns = ['Store', 'Hari', 'Tanggal', 'QRIS', 'Gojek', 'Grab', 'Shopee', 'Offline', 'Omset Kotor', 'Belanja Buah', 'Belanja Salad', 'Bensin Viar', 'Uang Offline', 'Total Bersih', 'Sum Uang Offline', 'Sum Uang Online', 'CupOffline', 'CupOnline'];
        
        const normalizedHeaders = Object.keys(headerMap);
        const missingColumns = requiredColumns.filter(col => !normalizedHeaders.includes(col.toLowerCase().trim()));

        if (missingColumns.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Format File Salah',
                description: `Kolom yang hilang: ${missingColumns.join(', ')}`,
            });
            resetState();
            return;
        }
        
        const formattedData: RecapData[] = jsonData.map(row => {
          const get = (key: string) => row[headerMap[key.toLowerCase().trim()]];
        
          const qris = Number(get('QRIS')) || 0;
          const gojek = Number(get('Gojek')) || 0;
          const grab = Number(get('Grab')) || 0;
          const shopee = Number(get('Shopee')) || 0;
          const offline = Number(get('Offline')) || 0;

          return {
            'Store': get('Store'),
            'Hari': get('Hari'),
            'Tanggal': get('Tanggal'),
            'QRIS': qris,
            'Gojek': gojek,
            'Grab': grab,
            'Shopee': shopee,
            'Online': qris + gojek + grab + shopee,
            'Offline': offline,
            'Omset Kotor': Number(get('Omset Kotor')),
            'Belanja Buah': Number(get('Belanja Buah')) || 0,
            'Belanja Salad': Number(get('Belanja Salad')) || 0,
            'Gajian': Number(get('Gajian')) || 0,
            'Bensin Viar': Number(get('Bensin Viar')) || 0,
            'Lainnya': Number(get('Lainnya')) || 0,
            'Uang Offline': Number(get('Uang Offline')),
            'Total Bersih': Number(get('Total Bersih')),
            'Sum Uang Offline': Number(get('Sum Uang Offline')),
            'Sum Uang Online': Number(get('Sum Uang Online')),
            'CupOffline': Number(get('CupOffline')) || 0,
            'CupOnline': Number(get('CupOnline')) || 0,
          };
        });
        setData(formattedData);
        toast({
          title: 'File Berhasil Diproses',
          description: `${file.name} telah berhasil diunggah dan diproses.`,
        });
      } catch (error) {
        console.error("File processing error:", error)
        toast({
            variant: 'destructive',
            title: 'Gagal Memproses File',
            description: 'Terjadi kesalahan saat membaca file Excel. Pastikan formatnya benar.',
        });
        resetState();
      }
    };
    reader.readAsBinaryString(file);
  };
  
  const generateHardcodedReport = (recapData: RecapData[]) => {
    if (recapData.length === 0) return "";

    const date = recapData[0].Tanggal;
    let report = `Laporan Penjualan - ${date}\n\n`;

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

  useEffect(() => {
    if (data.length > 0) {
      const generatedText = generateHardcodedReport(data);
      setReportText(generatedText);
    } else {
      setReportText("");
    }
  }, [data]);

  const handleCopyAndSave = () => {
    // 1. Copy to clipboard
    navigator.clipboard.writeText(reportText).then(() => {
        setIsCopied(true);
        toast({ title: 'Laporan disalin ke clipboard!'});
        setTimeout(() => setIsCopied(false), 2000);
    });

    // 2. Save to localStorage
    const reportDate = data[0]?.Tanggal;
    if (reportDate) {
        // Here we could convert the date to a standard format like YYYY-MM-DD
        const reportId = `report-${reportDate}`;
        const dataToSave = {
            id: reportId,
            date: reportDate,
            data: data, // The processed data array
        };
        localStorage.setItem(reportId, JSON.stringify(dataToSave));
        toast({
            title: "Laporan Disimpan",
            description: `Laporan untuk tanggal ${reportDate} telah disimpan di peramban.`
        })
    }
  };

  const resetState = () => {
    setData([]);
    setFileName(null);
    setReportText("");
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

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


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Unggah Laporan Penjualan</CardTitle>
          <CardDescription>Unggah file Excel laporan penjualan Anda untuk membuat visualisasi.</CardDescription>
        </CardHeader>
        <CardContent>
            <div 
                className="flex items-center justify-center w-full"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    if(e.dataTransfer.files && e.dataTransfer.files[0]) {
                        processFile(e.dataTransfer.files[0]);
                    }
                }}
            >
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Klik untuk mengunggah</span> atau seret dan lepas</p>
                        <p className="text-xs text-muted-foreground">File Excel (.xlsx, .xls)</p>
                    </div>
                    <input ref={fileInputRef} id="dropzone-file" type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx, .xls"/>
                </label>
            </div>
          {fileName && (
            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-foreground">File Terpilih: {fileName}</p>
              <Button variant="link" size="sm" onClick={resetState} className="text-destructive">Hapus File</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {data.length > 0 && (
        <>
            <div className="grid md:grid-cols-2 gap-6">
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
                    <CardDescription>Ringkasan teks dari data yang Anda unggah. Klik salin untuk menempelkannya di tempat lain.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea 
                        readOnly
                        value={reportText}
                        className="min-h-[300px] bg-muted/50 text-sm font-mono"
                        placeholder="Unggah file untuk membuat laporan teks..."
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="w-full" disabled={!reportText}>
                            <Save className="mr-2 h-4 w-4" />
                            Salin & Simpan Laporan
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Konfirmasi Tanggal Laporan</AlertDialogTitle>
                              <AlertDialogDescription>
                                  Apakah tanggal laporan ini sudah benar? 
                                  <br />
                                  <strong className="text-foreground text-lg">{data[0]?.Tanggal}</strong>
                                  <br />
                                  Data akan disimpan berdasarkan tanggal ini.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={handleCopyAndSave}>Ya, Simpan Laporan</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </>
      )}
    </div>
  );
}

    