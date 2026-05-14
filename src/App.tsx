/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Users, FileText, CreditCard, Wallet, MapPin, ChevronDown, Filter, ChevronRight, X, Printer, CheckCircle, Download, Loader2, PieChart, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { records as initialRecords, CaseRecord } from './data';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

// Formatting currency in Ringgit Malaysia
const formatRM = (amount: number) => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2
  }).format(amount);
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'reports'>('dashboard');
  const [records, setRecords] = useState<CaseRecord[]>(initialRecords);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKes, setFilterKes] = useState<string>('Semua');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Modal States
  const [paymentRecord, setPaymentRecord] = useState<CaseRecord | null>(null);
  const [statementRecord, setStatementRecord] = useState<CaseRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string>('');
  
  const [editingRecord, setEditingRecord] = useState<CaseRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<CaseRecord | null>(null);

  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [newRecordData, setNewRecordData] = useState({
    nama: '',
    kes: '',
    tarikh: new Date().toISOString().split('T')[0],
    totalFee: '',
    bakiMileage: '0'
  });

  // Printing Reference
  const printRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (paymentRecord) {
      setPaymentAmount('');
      setPaymentError('');
    }
  }, [paymentRecord]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    }
  };

  React.useEffect(() => {
    const manifest = {
      name: "HM Client Lawyer",
      short_name: "HM Lawyer",
      start_url: "/",
      display: "standalone",
      background_color: "#18181b",
      theme_color: "#18181b",
      icons: [
        {
          src: 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" fill="%2318181b" rx="20"/%3E%3Ctext x="96" y="105" font-family="Arial, sans-serif" font-size="80" fill="white" font-weight="bold" text-anchor="middle" dominant-baseline="middle"%3EHM%3C/text%3E%3C/svg%3E',
          sizes: "192x192",
          type: "image/svg+xml",
          purpose: "any maskable"
        },
        {
          src: 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"%3E%3Crect width="512" height="512" fill="%2318181b" rx="50"/%3E%3Ctext x="256" y="280" font-family="Arial, sans-serif" font-size="200" fill="white" font-weight="bold" text-anchor="middle" dominant-baseline="middle"%3EHM%3C/text%3E%3C/svg%3E',
          sizes: "512x512",
          type: "image/svg+xml",
          purpose: "any maskable"
        }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestUrl;

    const swCode = `
      self.addEventListener('install', (event) => {
        self.skipWaiting();
      });
      self.addEventListener('activate', (event) => {
        event.waitUntil(clients.claim());
      });
      self.addEventListener('fetch', (event) => {
        event.respondWith(
          fetch(event.request).catch(() => new Response('Offline'))
        );
      });
    `;
    const swBlob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(swBlob);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(swUrl)
        .then(() => console.log('SW registered with Blob'))
        .catch(err => console.error('SW registration failed', err));
    }
  }, []);

  const handleExportData = () => {
    const headers = ['ID', 'Nama Pelanggan', 'Kategori Kes', 'Total Fee', 'Bayaran Terakhir', 'Tarikh', 'Baki Sebelum', 'Baki Terkini', 'Baki Mileage'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(r => 
        [r.id, `"${r.nama}"`, `"${r.kes}"`, r.totalFee, r.bayaranTerakhir, r.tarikh, r.bakiSebelum, r.bakiFeeTerkini, r.bakiMileage].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekod_Pelanggan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddNewRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordData.nama || !newRecordData.totalFee) return;

    const totalFee = parseFloat(newRecordData.totalFee);
    const bakiMileage = parseFloat(newRecordData.bakiMileage) || 0;

    const newRecord: CaseRecord = {
      id: `C-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      nama: newRecordData.nama,
      kes: newRecordData.kes || 'Umum',
      totalFee: totalFee,
      bayaranTerakhir: 0,
      tarikh: newRecordData.tarikh,
      bakiSebelum: totalFee,
      bakiFeeTerkini: totalFee,
      bakiMileage: bakiMileage
    };

    setRecords(prev => [newRecord, ...prev]);
    setIsNewRecordModalOpen(false);
    setNewRecordData({ nama: '', kes: '', tarikh: new Date().toISOString().split('T')[0], totalFee: '', bakiMileage: '0' });
  };

  const handleEditRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setRecords(prev => prev.map(rec => rec.id === editingRecord.id ? editingRecord : rec));
    setEditingRecord(null);
  };

  const handleDeleteRecord = () => {
    if (!deletingRecord) return;
    setRecords(prev => prev.filter(rec => rec.id !== deletingRecord.id));
    setDeletingRecord(null);
    setExpandedRowId(null);
  };

  const handleUpdatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRecord || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setPaymentError('Sila masukkan jumlah yang sah dan lebih besar daripada RM 0.00');
      return;
    }

    if (amount > paymentRecord.bakiFeeTerkini) {
      setPaymentError('Jumlah bayaran tidak boleh melebihi baki semasa');
      return;
    }

    setPaymentError('');

    setRecords(prev => prev.map(record => {
      if (record.id === paymentRecord.id) {
        const today = new Date();
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear().toString().slice(-2)}`;

        return {
          ...record,
          bayaranTerakhir: amount,
          bakiSebelum: record.bakiFeeTerkini,
          bakiFeeTerkini: Math.max(0, record.bakiFeeTerkini - amount),
          tarikh: dateStr
        };
      }
      return record;
    }));

    setPaymentRecord(null);
    setPaymentAmount('');
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current || !statementRecord) return;
    
    setIsGeneratingPDF(true);
    try {
      const imgData = await toPng(printRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // We need aspect ratio. Let's create an image to get dimensions
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Penyata_${statementRecord.nama.replace(/\s+/g, '_')}_${statementRecord.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Derive summary statistics
  const stats = useMemo(() => {
    return records.reduce((acc, curr) => {
      acc.totalFee += curr.totalFee;
      acc.totalBakiTerkini += curr.bakiFeeTerkini;
      acc.totalMileage += curr.bakiMileage;
      return acc;
    }, { totalFee: 0, totalBakiTerkini: 0, totalMileage: 0, totalKes: records.length });
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = record.nama.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesKes = filterKes === 'Semua' || record.kes.toLowerCase() === filterKes.toLowerCase();
      return matchesSearch && matchesKes;
    });
  }, [searchTerm, filterKes, records]);

  // Extract unique cases for the dropdown
  const uniqueKes = useMemo(() => {
    const list = new Set(initialRecords.map(r => r.kes));
    return ['Semua', ...Array.from(list)];
  }, []);

  // Compute chart data for balances by category
  const chartData = useMemo(() => {
    const totals: Record<string, number> = {};
    records.forEach(record => {
      if (!totals[record.kes]) totals[record.kes] = 0;
      totals[record.kes] += record.bakiFeeTerkini;
    });
    
    return Object.keys(totals)
      .map(kes => ({
        name: kes,
        baki: totals[kes]
      }))
      .filter(item => item.baki > 0)
      .sort((a, b) => b.baki - a.baki);
  }, [records]);

  return (
    <div className="bg-zinc-50 text-zinc-900 font-sans h-screen w-full flex overflow-hidden">
      {/* Sidebar Nav */}
      <aside className="w-56 bg-zinc-900 text-zinc-400 hidden md:flex flex-col border-r border-zinc-800 shrink-0">
        <div className="p-6 border-b border-zinc-800">
          <div className="text-white font-bold tracking-tight text-lg">HM Client<span className="text-blue-500"> Lawyer</span></div>
          <div className="text-[10px] uppercase tracking-widest opacity-50">Sistem Pengurusan</div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <div 
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-2 rounded text-sm flex items-center gap-3 cursor-pointer transition-colors ${activeTab === 'dashboard' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            {activeTab === 'dashboard' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
            Papan Pemuka Kes
          </div>
          <div 
            onClick={() => setActiveTab('records')}
            className={`px-3 py-2 rounded text-sm flex items-center gap-3 cursor-pointer transition-colors ${activeTab === 'records' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            {activeTab === 'records' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
            Rekod Pelanggan
          </div>
          <div 
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-2 rounded text-sm flex items-center gap-3 cursor-pointer transition-colors ${activeTab === 'reports' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            {activeTab === 'reports' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
            Laporan Kewangan
          </div>
        </nav>
        <div className="p-4 border-t border-zinc-800 text-[11px] space-y-2">
          <div className="flex justify-between"><span>Status Server</span><span className="text-emerald-500">Aktif</span></div>
          <div className="w-full bg-zinc-800 h-1 rounded overflow-hidden">
            <div className="bg-emerald-500 h-full w-[85%]"></div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold text-zinc-700">
              Papan Pemuka: <span className="font-mono text-blue-600">
                {activeTab === 'dashboard' ? 'Sistem Pengurusan Kes & Bayaran' : activeTab === 'records' ? 'Senarai Rekod Pelanggan' : 'Analisis & Laporan Kewangan'}
              </span>
            </h1>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase border border-blue-100">Aktif</span>
          </div>
          <div className="flex gap-2">
            {isInstallable && (
              <button 
                onClick={handleInstallApp}
                className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium cursor-pointer flex items-center gap-2"
              >
                <Download size={14} />
                Muat Turun App
              </button>
            )}
            <button 
              onClick={handleExportData}
              className="px-3 py-1.5 text-xs border border-zinc-300 rounded hover:bg-zinc-50 font-medium cursor-pointer"
            >
              Eksport Data
            </button>
            <button 
              onClick={() => setIsNewRecordModalOpen(true)}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium cursor-pointer"
            >
              Rekod Baru
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {activeTab !== 'records' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 shrink-0">
              <div className="bg-white border border-zinc-200 p-4 rounded-sm shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs text-zinc-500">Jumlah Kes</div>
                  <Users size={14} className="text-zinc-400" />
                </div>
                <div className="text-2xl font-bold text-zinc-800">{stats.totalKes}</div>
                <div className="text-[10px] text-zinc-400 mt-1">Keseluruhan pangkalan rekod</div>
              </div>
              
              <div className="bg-white border border-zinc-200 p-4 rounded-sm shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs text-zinc-500">Jumlah Total Fee</div>
                  <Wallet size={14} className="text-zinc-400" />
                </div>
                <div className="text-2xl font-bold text-zinc-800">{formatRM(stats.totalFee)}</div>
                <div className="text-[10px] text-zinc-400 mt-1">Nilai keseluruhan yuran dibenarkan</div>
              </div>

              <div className="bg-white border border-zinc-200 p-4 rounded-sm shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs text-zinc-500">Baki Fee Terkini</div>
                  <CreditCard size={14} className="text-red-400" />
                </div>
                <div className="text-2xl font-bold text-red-600">{formatRM(stats.totalBakiTerkini)}</div>
                <div className="text-[10px] text-red-500/70 mt-1">Perlu dituntut</div>
              </div>

              <div className="bg-white border border-zinc-200 p-4 rounded-sm shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs text-zinc-500">Baki Mileage</div>
                  <MapPin size={14} className="text-zinc-400" />
                </div>
                <div className="text-2xl font-bold text-zinc-800">{formatRM(stats.totalMileage)}</div>
                <div className="text-[10px] text-zinc-400 mt-1">Tuntutan perjalanan</div>
              </div>
            </div>
          )}

          {/* Dashboard Content: Chart and Table */}
          <div className={`flex-1 px-6 pb-6 min-h-0 flex ${activeTab === 'dashboard' ? 'flex-col lg:flex-row' : 'flex-col'} gap-4`}>
            {/* Main Data Table Area */}
            {activeTab !== 'reports' && (
            <div className="flex-1 bg-white border border-zinc-200 rounded-sm shadow-sm flex flex-col h-full overflow-hidden">
              <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={14} className="text-zinc-400" />
                  Senarai Rekod Kes
                </span>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Search size={12} className="text-zinc-400" />
                    </div>
                    <input
                      type="text"
                      className="pl-7 pr-2 py-1 text-xs border border-zinc-300 rounded w-full sm:w-48 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Cari nama pelanggan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Filter size={12} className="text-zinc-400" />
                    </div>
                    <select
                      className="pl-7 pr-6 py-1 appearance-none text-xs border border-zinc-300 rounded w-full sm:w-36 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                      value={filterKes}
                      onChange={(e) => setFilterKes(e.target.value)}
                    >
                      {uniqueKes.map(kes => (
                        <option key={kes} value={kes}>{kes}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                      <ChevronDown size={12} className="text-zinc-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="sticky top-0 bg-zinc-50 z-10 shadow-sm">
                    <tr className="text-[11px] font-bold text-zinc-500 uppercase border-b border-zinc-200">
                      <th className="px-4 py-2 border-r border-zinc-200 text-center w-12">#</th>
                      <th className="px-4 py-2 border-r border-zinc-200">Nama Pelanggan</th>
                      <th className="px-4 py-2 border-r border-zinc-200">Kategori Kes</th>
                      <th className="px-4 py-2 border-r border-zinc-200 text-right">Total Fee</th>
                      <th className="px-4 py-2 border-r border-zinc-200 text-right">Bayaran Terakhir</th>
                      <th className="px-4 py-2 border-r border-zinc-200 text-center">Tarikh</th>
                      <th className="px-4 py-2 border-r border-zinc-200 text-right">Baki Sebelum</th>
                      <th className="px-4 py-2 border-r border-zinc-200 text-right">Baki Terkini</th>
                      <th className="px-4 py-2 text-right">Baki Mileage</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record, index) => (
                        <React.Fragment key={record.id}>
                          <motion.tr 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                            className={`border-b border-zinc-100 hover:bg-zinc-100 cursor-pointer transition-colors ${record.bakiFeeTerkini > 0 && index % 2 === 0 ? 'bg-zinc-50/50' : ''} ${record.bakiFeeTerkini > 2000 ? 'bg-amber-50/30' : ''} ${expandedRowId === record.id ? 'bg-zinc-100' : ''}`}
                          >
                            <td className="px-4 py-2 border-r border-zinc-100">
                              <div className="flex items-center justify-center gap-1.5 font-mono text-zinc-400">
                                {expandedRowId === record.id ? <ChevronDown size={14} className="text-zinc-600" /> : <ChevronRight size={14} className="text-zinc-400" />}
                                <span>{index + 1}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 font-medium border-r border-zinc-100">{record.nama}</td>
                            <td className="px-4 py-2 border-r border-zinc-100">
                              <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-blue-100/50">
                                {record.kes}
                              </span>
                            </td>
                            <td className="px-4 py-2 font-mono border-r border-zinc-100 text-right">{formatRM(record.totalFee)}</td>
                            <td className="px-4 py-2 font-mono border-r border-zinc-100 text-emerald-600 text-right bg-emerald-50/10">
                              {record.bayaranTerakhir > 0 ? '+' : ''}{formatRM(record.bayaranTerakhir)}
                            </td>
                            <td className="px-4 py-2 border-r border-zinc-100 text-center text-zinc-500">{record.tarikh}</td>
                            <td className="px-4 py-2 font-mono border-r border-zinc-100 text-right text-zinc-400">{formatRM(record.bakiSebelum)}</td>
                            <td className={`px-4 py-2 font-mono font-bold border-r border-zinc-100 text-right ${record.bakiFeeTerkini > 2000 ? 'text-red-500 underline decoration-dotted' : 'text-zinc-700'}`}>
                              {formatRM(record.bakiFeeTerkini)}
                            </td>
                            <td className="px-4 py-2 font-mono text-right text-amber-600">
                              {formatRM(record.bakiMileage)}
                            </td>
                          </motion.tr>
                          {expandedRowId === record.id && (
                            <tr className="border-b border-zinc-200 bg-zinc-50/80">
                              <td colSpan={9} className="p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 border-l-2 border-blue-500 m-2 bg-white shadow-sm rounded-sm">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                      <div>
                                        <h4 className="font-bold text-zinc-700 mb-2 border-b border-zinc-100 pb-1 flex items-center gap-2">
                                          <FileText size={14} className="text-zinc-400"/> Maklumat Kes
                                        </h4>
                                        <div className="space-y-1.5">
                                          <p className="text-zinc-500 flex justify-between"><span>ID Rekod:</span> <span className="font-mono text-zinc-800">{record.id}</span></p>
                                          <p className="text-zinc-500 flex justify-between"><span>Kategori:</span> <span className="font-medium text-zinc-800">{record.kes}</span></p>
                                          <p className="text-zinc-500 flex justify-between"><span>Tarikh Kemaskini:</span> <span className="text-zinc-800">{record.tarikh}</span></p>
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-zinc-700 mb-2 border-b border-zinc-100 pb-1 flex items-center gap-2">
                                          <Wallet size={14} className="text-zinc-400"/> Pecahan Kewangan
                                        </h4>
                                        <div className="space-y-1.5">
                                          <p className="text-zinc-500 flex justify-between"><span>Jumlah Fee:</span> <span className="font-mono text-zinc-800">{formatRM(record.totalFee)}</span></p>
                                          <p className="text-zinc-500 flex justify-between"><span>Baki Terdahulu:</span> <span className="font-mono text-zinc-800">{formatRM(record.bakiSebelum)}</span></p>
                                          <p className="text-zinc-500 flex justify-between"><span>Bayaran Terakhir:</span> <span className="font-mono text-emerald-600">{record.bayaranTerakhir > 0 ? '+' : ''}{formatRM(record.bayaranTerakhir)}</span></p>
                                        </div>
                                      </div>
                                      <div className="flex flex-col justify-center gap-2">
                                        <h4 className="font-bold text-zinc-700 mb-2 border-b border-zinc-100 pb-1 flex items-center gap-2">
                                          Tindakan
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                          <button 
                                            className="w-full px-2 py-1.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                            onClick={() => setPaymentRecord(record)}
                                          >
                                            <CreditCard size={12} />
                                            Kemaskini Bayaran
                                          </button>
                                          <button 
                                            className="w-full px-2 py-1.5 text-[11px] border border-zinc-300 rounded bg-white hover:bg-zinc-50 text-zinc-700 font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                            onClick={() => setStatementRecord(record)}
                                          >
                                            <Printer size={12} />
                                            Jana Penyata
                                          </button>
                                          <button 
                                            className="w-full px-2 py-1.5 text-[11px] border border-zinc-300 rounded bg-white hover:bg-zinc-50 text-amber-600 font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                            onClick={() => setEditingRecord({...record})}
                                          >
                                            <Edit size={12} />
                                            Edit Rekod
                                          </button>
                                          <button 
                                            className="w-full px-2 py-1.5 text-[11px] border border-red-200 rounded bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                            onClick={() => setDeletingRecord(record)}
                                          >
                                            <Trash2 size={12} />
                                            Padam
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-zinc-400 font-medium">
                          Tiada rekod dijumpai.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center text-[11px] text-zinc-500">
                <div>Menunjukkan {filteredRecords.length} daripada {records.length} rekod entri</div>
                <div className="flex gap-1 hidden sm:flex">
                  <button className="px-2 py-1 border border-zinc-300 rounded bg-white disabled:opacity-50" disabled>Kembali</button>
                  <button className="px-2 py-1 border border-zinc-300 rounded bg-zinc-800 text-white">1</button>
                  <button className="px-2 py-1 border border-zinc-300 rounded bg-white disabled:opacity-50" disabled>Seterusnya</button>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl border border-zinc-200 w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50">
                <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                  <Edit size={18} className="text-amber-600" />
                  Edit Rekod Pelanggan
                </h3>
                <button onClick={() => setEditingRecord(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleEditRecordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wider">
                      Nama Pelanggan / Entiti
                    </label>
                    <input
                      type="text"
                      required
                      className="px-3 py-2 w-full border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-800"
                      value={editingRecord.nama}
                      onChange={(e) => setEditingRecord({ ...editingRecord, nama: e.target.value })}
                      autoFocus
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wider">
                        Kategori Kes
                      </label>
                      <input
                        type="text"
                        required
                        className="px-3 py-2 w-full border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-800"
                        value={editingRecord.kes}
                        onChange={(e) => setEditingRecord({ ...editingRecord, kes: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wider">
                        Tarikh
                      </label>
                      <input
                        type="date"
                        required
                        className="px-3 py-2 w-full border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-800"
                        value={editingRecord.tarikh}
                        onChange={(e) => setEditingRecord({ ...editingRecord, tarikh: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wider">
                        Total Fee (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="px-3 py-2 w-full border border-zinc-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-800"
                        value={editingRecord.totalFee}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEditingRecord({ 
                            ...editingRecord, 
                            totalFee: val,
                            bakiSebelum: val,
                            bakiFeeTerkini: val - editingRecord.bayaranTerakhir 
                          })
                        }}
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">Baki fee akan dikira semula secara automatik</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wider">
                        Baki Mileage (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="px-3 py-2 w-full border border-zinc-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-800"
                        value={editingRecord.bakiMileage}
                        onChange={(e) => setEditingRecord({ ...editingRecord, bakiMileage: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 mt-6">
                    <button 
                      type="button"
                      onClick={() => setEditingRecord(null)}
                      className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800 font-medium transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl border border-zinc-200 w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="font-bold text-zinc-800 text-lg mb-2">Padam Rekod Kes</h3>
                <p className="text-zinc-500 text-sm mb-6">
                  Adakah anda pasti untuk memadam rekod kes <strong className="text-zinc-800">{deletingRecord.nama}</strong>? Tindakan ini tidak boleh dikembalikan.
                </p>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => setDeletingRecord(null)}
                    className="px-4 py-2 text-sm border border-zinc-300 rounded hover:bg-zinc-50 text-zinc-700 font-medium transition-colors cursor-pointer flex-1"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleDeleteRecord}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors cursor-pointer flex-1"
                  >
                    Ya, Padam
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNewRecordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl border border-zinc-200 w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50">
                <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  Rekod Pelanggan Baru
                </h3>
                <button onClick={() => setIsNewRecordModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleAddNewRecord} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wider">
                      Nama Pelanggan / Entiti
                    </label>
                    <input
                      type="text"
                      required
                      className="px-3 py-2 w-full border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-800"
                      placeholder="Contoh: Ali bin Abu"
                      value={newRecordData.nama}
                      onChange={(e) => setNewRecordData({ ...newRecordData, nama: e.target.value })}
                      autoFocus
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wider">
                        Kategori Kes
                      </label>
                      <input
                        type="text"
                        required
                        className="px-3 py-2 w-full border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-800"
                        placeholder="Contoh: Saman Sivil"
                        value={newRecordData.kes}
                        onChange={(e) => setNewRecordData({ ...newRecordData, kes: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wider">
                        Tarikh
                      </label>
                      <input
                        type="date"
                        required
                        className="px-3 py-2 w-full border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-800"
                        value={newRecordData.tarikh}
                        onChange={(e) => setNewRecordData({ ...newRecordData, tarikh: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wider">
                        Total Fee (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="px-3 py-2 w-full border border-zinc-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-800"
                        placeholder="0.00"
                        value={newRecordData.totalFee}
                        onChange={(e) => setNewRecordData({ ...newRecordData, totalFee: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wider">
                        Baki Mileage (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="px-3 py-2 w-full border border-zinc-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-800"
                        placeholder="0.00"
                        value={newRecordData.bakiMileage}
                        onChange={(e) => setNewRecordData({ ...newRecordData, bakiMileage: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 mt-6">
                    <button 
                      type="button"
                      onClick={() => setIsNewRecordModalOpen(false)}
                      className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800 font-medium transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors cursor-pointer"
                    >
                      Simpan Rekod
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {paymentRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl border border-zinc-200 w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50">
                <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-600" />
                  Kemaskini Bayaran
                </h3>
                <button onClick={() => setPaymentRecord(null)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6 p-4 rounded-md bg-blue-50/50 border border-blue-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Pelanggan:</span>
                    <span className="font-semibold text-zinc-800">{paymentRecord.nama}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Baki Semasa:</span>
                    <span className="font-mono font-bold text-red-600">{formatRM(paymentRecord.bakiFeeTerkini)}</span>
                  </div>
                </div>
                
                <form onSubmit={handleUpdatePayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wider">
                      Jumlah Bayaran (RM)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-zinc-500 font-mono text-sm">RM</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={paymentRecord.bakiFeeTerkini}
                        required
                        className={`pl-10 pr-4 py-2.5 w-full border ${paymentError ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-zinc-300 focus:ring-blue-500/20 focus:border-blue-500'} rounded font-mono text-lg focus:outline-none focus:ring-2 transition-all font-medium text-zinc-800`}
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={(e) => {
                          setPaymentAmount(e.target.value);
                          if (paymentError) setPaymentError('');
                        }}
                        autoFocus
                      />
                    </div>
                    {paymentError && (
                      <p className="mt-1.5 text-xs text-red-500 font-medium">{paymentError}</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 mt-6">
                    <button 
                      type="button" 
                      onClick={() => setPaymentRecord(null)}
                      className="px-4 py-2 text-sm border border-zinc-300 rounded bg-white hover:bg-zinc-50 text-zinc-700 font-medium"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Sahkan Bayaran
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Statement Modal & Print Layout */}
      <AnimatePresence>
        {statementRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm print:bg-white print:p-0">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-lg shadow-xl border border-zinc-200 w-full max-w-2xl max-h-screen overflow-hidden flex flex-col print:shadow-none print:border-none print:max-h-none"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50 print:hidden">
                <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                  <Printer size={18} className="text-zinc-600" />
                  Pratinjau Penyata
                </h3>
                <button onClick={() => setStatementRecord(null)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible">
                {/* Printable Area Starts */}
                <div ref={printRef} className="max-w-xl mx-auto space-y-8 font-sans text-zinc-900">
                  <div className="text-center pb-6 border-b border-zinc-200">
                    <div className="text-2xl font-black tracking-tight flex items-center justify-center gap-2 mb-2">
                       DATAFLOW<span className="text-blue-600">PRO</span>
                    </div>
                    <h2 className="text-xl font-semibold uppercase tracking-widest text-zinc-600 mt-2">Penyata Akaun Pelanggan</h2>
                  </div>

                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-bold text-zinc-800 text-base mb-1">{statementRecord.nama}</p>
                      <p className="text-zinc-500">ID Rekod: {statementRecord.id}</p>
                      <p className="text-zinc-500">Kategori Kes: {statementRecord.kes}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-zinc-800 mb-1">Tarikh Penyata</p>
                      <p className="text-zinc-500">{new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="border border-zinc-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-50 border-b border-zinc-200">
                        <tr>
                          <th className="py-3 px-4 text-left font-semibold text-zinc-700">Perkara</th>
                          <th className="py-3 px-4 text-right font-semibold text-zinc-700">Jumlah (RM)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        <tr>
                          <td className="py-3 px-4 text-zinc-700">Jumlah Yuran Asal (Total Fee)</td>
                          <td className="py-3 px-4 text-right font-mono text-zinc-700">{formatRM(statementRecord.totalFee)}</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 text-zinc-700">Bayaran Terakhir pada {statementRecord.tarikh}</td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-600">-{formatRM(statementRecord.bayaranTerakhir)}</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 text-zinc-700">Baki Terdahulu (Selepas bayaran sebelumnya)</td>
                          <td className="py-3 px-4 text-right font-mono text-zinc-700">{formatRM(statementRecord.bakiSebelum)}</td>
                        </tr>
                        <tr className="bg-zinc-50/50">
                          <td className="py-3 px-4 font-semibold text-zinc-800">Baki Terkini Yuran</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-red-600">{formatRM(statementRecord.bakiFeeTerkini)}</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 text-zinc-700">Baki Mileage (Sekiranya Ada)</td>
                          <td className="py-3 px-4 text-right font-mono text-amber-600">{formatRM(statementRecord.bakiMileage)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-8 text-xs text-center text-zinc-500">
                    <p>Ini adalah janaan komputer dan tidak memerlukan tandatangan.</p>
                    <p className="mt-1">Sila hubungi pihak kami sekiranya terdapat sebarang percanggahan.</p>
                  </div>
                </div>
                {/* Printable Area Ends */}
              </div>

              <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-2 print:hidden">
                <button 
                  onClick={() => setStatementRecord(null)}
                  className="px-4 py-2 text-sm border border-zinc-300 rounded bg-white hover:bg-zinc-50 text-zinc-700 font-medium"
                >
                  Tutup
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 text-sm border border-zinc-300 rounded bg-white hover:bg-zinc-50 text-zinc-700 font-medium flex items-center gap-2"
                >
                  <Printer size={16} />
                  Cetak
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sedang Menjana...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Muat Turun PDF
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
