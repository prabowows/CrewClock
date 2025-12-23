
"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Copy, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Textarea } from '../ui/textarea';

type RecapData = {
  'Store': string;
  'Hari': string;
  'Tanggal': string;
  'QRIS': number;
  'Gojek': number;
  'Grab': number;
  'Shopee': number;
  'Online Order': number;
  'Offline': number;
  'Omset Kotor': number;
  'Belanja': number;
  'Belanja Salad': number;
  'Uang Offline': number;
  'Total Bersih': number;
  'Sum Uang Offline': number;
  'Sum Uang Online': number;
  'CupOffline': number;
  'CupOnline': number;
};

const currencyFormatter = (value: number) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`;

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

        const requiredColumns = ['Store', 'Hari', 'Tanggal', 'QRIS', 'Gojek', 'Grab', 'Shopee', 'Online Order', 'Offline', 'Omset Kotor', 'Belanja', 'Belanja Salad', 'Uang Offline', 'Total Bersih', 'Sum Uang Offline', 'Sum Uang Online', 'CupOffline', 'CupOnline'];
        
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
        
          return {
            'Store': get('Store') || '',
            'Hari': get('Hari') || '',
            'Tanggal': get('Tanggal') || '',
            'QRIS': Number(get('QRIS')) || 0,
            'Gojek': Number(get('Gojek')) || 0,
            'Grab': Number(get('Grab')) || 0,
            'Shopee': Number(get('Shopee')) || 0,
            'Online Order': Number(get('Online Order')) || 0,
            'Offline': Number(get('Offline')) || 0,
            'Omset Kotor': Number(get('Omset Kotor')) || 0,
            'Belanja': Number(get('Belanja')) || 0,
            'Belanja Salad': Number(get('Belanja Salad')) || 0,
            'Uang Offline': Number(get('Uang Offline')) || 0,
            'Total Bersih': Number(get('Total Bersih')) || 0,
            'Sum Uang Offline': Number(get('Sum Uang Offline')) || 0,
            'Sum Uang Online': Number(get('Sum Uang Online')) || 0,
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
        report += `Penjualan Online: ${currencyFormatter(item['Online Order'])}\n`;
        report += `Penjualan Offline: ${currencyFormatter(item['Offline'])}\n`;
        report += `\n`;
        report += `Total Belanja: ${currencyFormatter(item['Belanja'] + item['Belanja Salad'])}\n`;
        report += `   - Belanja Buah: ${currencyFormatter(item['Belanja'])}\n`;
        report += `   - Belanja Salad: ${currencyFormatter(item['Belanja Salad'])}\n`;
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

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText).then(() => {
        setIsCopied(true);
        toast({ title: 'Laporan disalin ke clipboard!'});
        setTimeout(() => setIsCopied(false), 2000);
    });
  }

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
    'Belanja': item['Belanja'],
    'Total Bersih': item['Total Bersih'],
    'Penjualan Online': item['Online Order'],
    'Penjualan Offline': item.Offline,
    'QRIS': item.QRIS,
    'Gojek': item.Gojek,
    'Grab': item.Grab,
    'Shopee': item.Shopee,
  }));

  const renderChart = (dataKey: string[], title: string, fillColors: string[]) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={currencyFormatter} fontSize={12} tickLine={false} axisLine={false}/>
            <Tooltip formatter={currencyFormatter}/>
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
                {renderChart(['Omset Kotor', 'Total Bersih'], 'Perbandingan Omset dan Laba Bersih', ['#16a34a', '#3b82f6'])}
                {renderChart(['Penjualan Online', 'Penjualan Offline'], 'Perbandingan Penjualan Online vs Offline', ['#ea580c', '#8b5cf6'])}
            </div>
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
                    <Button onClick={handleCopy} disabled={!reportText}>
                        {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                        {isCopied ? "Disalin!" : "Salin Laporan"}
                    </Button>
                </CardContent>
            </Card>
        </>
      )}
    </div>
  );
}

    