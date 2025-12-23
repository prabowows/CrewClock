
"use client";

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

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
  'Belanja': number;
  'Belanja Salad': number;
  'Uang Offline': number;
  'Total Bersih': number;
  'Sum Uang Offline': number;
  'Sum Uang Online': number;
  'Cup Offline': number;
  'Cup Online': number;
};

const currencyFormatter = (value: number) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`;

export default function Recap() {
  const [data, setData] = useState<RecapData[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
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

        const requiredColumns = ['Store', 'Hari', 'Tanggal', 'QRIS', 'Gojek', 'Grab', 'Shopee', 'Online', 'Offline', 'Omset Kotor', 'Belanja Buah', 'Belanja Salad', 'Uang Offline', 'Total Bersih', 'Sum Uang Offline', 'Sum Uang Online', 'Cup Offline', 'Cup Online'];
        
        const headers = Object.keys(jsonData[0] || {});
        const missingColumns = requiredColumns.filter(col => !headers.includes(col) && col !== 'Belanja');
        if (missingColumns.length > 0 && !headers.includes('Belanja Buah')) {
            toast({
                variant: 'destructive',
                title: 'Format File Salah',
                description: `Kolom yang hilang: ${missingColumns.join(', ')}`,
            });
            resetState();
            return;
        }

        const formattedData: RecapData[] = jsonData.map(row => ({
          'Store': row['Store'],
          'Hari': row['Hari'],
          'Tanggal': row['Tanggal'],
          'QRIS': Number(row['QRIS']) || 0,
          'Gojek': Number(row['Gojek']) || 0,
          'Grab': Number(row['Grab']) || 0,
          'Shopee': Number(row['Shopee']) || 0,
          'Online': Number(row['Online']) || 0,
          'Offline': Number(row['Offline']) || 0,
          'Omset Kotor': Number(row['Omset Kotor']) || 0,
          'Belanja': Number(row['Belanja Buah']) || 0,
          'Belanja Salad': Number(row['Belanja Salad']) || 0,
          'Uang Offline': Number(row['Uang Offline']) || 0,
          'Total Bersih': Number(row['Total Bersih']) || 0,
          'Sum Uang Offline': Number(row['Sum Uang Offline']) || 0,
          'Sum Uang Online': Number(row['Sum Uang Online']) || 0,
          'Cup Offline': Number(row['Cup Offline']) || 0,
          'Cup Online': Number(row['Cup Online']) || 0,
        }));
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

  const resetState = () => {
    setData([]);
    setFileName(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const chartData = data.map(item => ({
    name: item.Store,
    'Omset Kotor': item['Omset Kotor'],
    'Belanja': item['Belanja'],
    'Total Bersih': item['Total Bersih'],
    'Penjualan Online': item.Online,
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
                        <Bar dataKey="QRIS" stackId="a" fill="#16a34a" />
                        <Bar dataKey="Gojek" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="Grab" stackId="a" fill="#ea580c" />
                        <Bar dataKey="Shopee" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]}/>
                    </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </>
      )}
    </div>
  );
}
