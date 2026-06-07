/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import StandaloneReceipts from './components/StandaloneReceipts';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Users, FileText, CreditCard, Wallet, MapPin, ChevronDown, Filter, ChevronRight, X, Printer, CheckCircle, Download, Loader2, PieChart, Edit, Trash2, AlertTriangle, ArrowUp, ArrowDown, Upload, LogOut, LogIn, CloudUpload, Moon, Sun, Home, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { records as initialRecords, CaseRecord } from './data';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query } from 'firebase/firestore';
import { ref, uploadString } from 'firebase/storage';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Formatting currency in Ringgit Malaysia
const formatRM = (amount: number) => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2
  }).format(amount);
};

const parseDateObj = (dateStr: string) => {
  if (!dateStr) return new Date();
  const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
  if (parts.length === 3) {
    if (dateStr.includes('/')) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);
        year += year < 100 ? (year < 50 ? 2000 : 1900) : 0;
        return new Date(year, month, day);
    } else {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }
  }
  return new Date(); // Fallback
};

const parseDateString = (dateStr: string) => {
  return parseDateObj(dateStr).getTime();
};

const formatDateDMY = (dateStr: string) => {
  if (!dateStr) return '';
  const d = parseDateObj(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

const formatDateISO = (dateStr: string) => {
  if (!dateStr) return '';
  const d = parseDateObj(dateStr);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'reports' | 'standalone'>('dashboard');
  const [records, setRecords] = useState<CaseRecord[]>(() => {
    const saved = localStorage.getItem('localOfflineRecords');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return initialRecords;
  });
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKes, setFilterKes] = useState<string>('Semua');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  // Modal States
  const [paymentRecord, setPaymentRecord] = useState<CaseRecord | null>(null);
  const [statementRecord, setStatementRecord] = useState<CaseRecord | null>(null);
  const [receiptData, setReceiptData] = useState<{record: CaseRecord, payment: import('./data').PaymentEntry} | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMileageAmount, setPaymentMileageAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('Transfer');
  const [paymentError, setPaymentError] = useState<string>('');
  
  const [editingRecord, setEditingRecord] = useState<CaseRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<CaseRecord | null>(null);
  const [isDeletingSelected, setIsDeletingSelected] = useState<boolean>(false);

  const [standaloneInitialRecord, setStandaloneInitialRecord] = useState<CaseRecord | null>(null);
  
  const [paymentSortColumn, setPaymentSortColumn] = useState<'date' | 'amount' | null>(null);
  const [paymentSortDirection, setPaymentSortDirection] = useState<'asc' | 'desc'>('desc');

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
  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const [isGeneratingReceiptPDF, setIsGeneratingReceiptPDF] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      const saved = localStorage.getItem('localOfflineRecords');
      if (saved) {
        try {
          setRecords(JSON.parse(saved));
        } catch(e) {}
      } else {
        setRecords(initialRecords);
      }
      return;
    }
    const targetPath = `users/${user.uid}/records`;
    const q = query(collection(db, targetPath));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecords: CaseRecord[] = [];
      snapshot.forEach(doc => {
        fetchedRecords.push(doc.data() as CaseRecord);
      });
      // Fallback: If completely empty, we can just leave it as empty (no initialRecords logic to sync to Firebase unless user imports)
      setRecords(fetchedRecords);
    }, (error) => {
       handleFirestoreError(error, OperationType.GET, targetPath);
    });
    return () => unsubscribe();
  }, [user, authReady]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('localOfflineRecords', JSON.stringify(records));
    }
  }, [records, user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    if (paymentRecord) {
      setPaymentAmount('');
      setPaymentError('');
    }
  }, [paymentRecord]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showExportReminder, setShowExportReminder] = useState(false);
  const isInitialRecordsRender = useRef(true);

  React.useEffect(() => {
    if (isInitialRecordsRender.current) {
      isInitialRecordsRender.current = false;
      return;
    }
    localStorage.setItem('lastModificationDate', Date.now().toString());
  }, [records]);

  React.useEffect(() => {
    const lastMod = localStorage.getItem('lastModificationDate');
    const lastReminder = localStorage.getItem('lastExportReminderDate');
    const now = Date.now();
    
    if (lastMod) {
      const daysSinceMod = (now - parseInt(lastMod, 10)) / (1000 * 60 * 60 * 24);
      const daysSinceReminder = lastReminder ? (now - parseInt(lastReminder, 10)) / (1000 * 60 * 60 * 24) : Infinity;
      
      if (daysSinceMod >= 7 && daysSinceReminder >= 1) {
        setShowExportReminder(true);
        localStorage.setItem('lastExportReminderDate', now.toString());
      }
    } else {
      localStorage.setItem('lastModificationDate', now.toString());
    }
  }, []);

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
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('SW registered successfully'))
        .catch(err => console.error('SW registration failed', err));
    }
  }, []);

  const handleExportData = () => {
    const headers = ['Nama', 'Kes', 'Total Fee', 'Bayaran Terakhir', 'Tarikh Akhir', 'Baki Sebelum', 'Baki Fee Terkini', 'Baki Mileage'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(r => 
        [`"${r.nama}"`, `"${r.kes}"`, r.totalFee, r.bayaranTerakhir, r.tarikh, r.bakiSebelum, r.bakiFeeTerkini, r.bakiMileage].join(',')
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

  const silentBackupToCloud = async (currentRecords: CaseRecord[]) => {
    if (!user) return;
    try {
      const backupData = JSON.stringify(currentRecords);
      const backupId = `autobackup-${Date.now()}`;
      await setDoc(doc(db, `users/${user.uid}/backups`, backupId), {
        data: backupData,
        createdAt: Date.now()
      });
      console.log("Auto-save to cloud successful");
    } catch (error) {
      console.error("Auto backup failed", error);
    }
  };

  const handleBackupToCloud = async () => {
    if (!user) {
      alert("Sila log masuk untuk membuat sandaran.");
      return;
    }
    setIsBackingUp(true);
    try {
      const backupData = JSON.stringify(records);
      const backupId = `backup-${Date.now()}`;
      await setDoc(doc(db, `users/${user.uid}/backups`, backupId), {
        data: backupData,
        createdAt: Date.now()
      });
      alert("Sandaran telah berjaya disimpan di awan (Cloud Backup)!");
    } catch (error) {
      console.error("Backup failed", error);
      alert("Gagal membuat sandaran. Sila cuba lagi.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const headers = "id,nama,kes,jumlahKeseluruhan,bakiSebelum,bayaranTerakhir,bakiFeeTerkini,bakiMileage,tarikh,stat,alamat,telefon,email,totalFee\n";
    const example = "R001,Ali Bin Abu,Faraid,5000,2000,1000,1000,500,20/05/2024,Aktif,123 Jalan Ampang,012-3456789,ali@example.com,5000\n";
    const blob = new Blob([headers + example], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template_rekod_kes.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLaporanCSV = () => {
    const headers = [
      'ID Rekod',
      'Nama Pelanggan',
      'Kategori Kes',
      'Jumlah Fee (RM)',
      'Baki Fee Sebelum (RM)',
      'Jumlah Bayaran Fee Terkumpul (RM)',
      'Baki Fee Terkini (RM)',
      'Jumlah Bayaran Mileage Terkumpul (RM)',
      'Baki Mileage Terkini (RM)'
    ];

    const rows = records.map(record => {
      const totalFeePayments = record.paymentHistory?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const totalMileagePayments = record.paymentHistory?.reduce((sum, p) => sum + (p.mileageAmount || 0), 0) || 0;

      return [
        `"${record.id}"`,
        `"${record.nama}"`,
        `"${record.kes}"`,
        record.totalFee || 0,
        record.bakiSebelum || 0,
        totalFeePayments,
        record.bakiFeeTerkini || 0,
        totalMileagePayments,
        record.bakiMileage || 0
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_kewangan_${formatDateISO(new Date().toISOString())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) return;
      
      const newRecordsFromCsv: CaseRecord[] = [];
      const headers = lines[0].toLowerCase().split(',').map(h => h.replace(/^"|"$/g, '').trim());
      
      const colIndex = {
        id: headers.findIndex(h => h === 'id' || h.includes('id rekod')),
        nama: headers.findIndex(h => h.includes('nama')),
        kes: headers.findIndex(h => h.includes('kes')),
        totalFee: headers.findIndex(h => h.includes('total fee') || h.includes('jumlah fee')),
        bayaranTerakhir: headers.findIndex(h => h.includes('bayaran terakhir')),
        tarikh: headers.findIndex(h => h.includes('tarikh')),
        bakiSebelum: headers.findIndex(h => h.includes('baki sebelum')),
        bakiTerkini: headers.findIndex(h => h.includes('baki') && h.includes('terkini') && !h.includes('mileage')),
        bakiMileage: headers.findIndex(h => h.includes('mileage'))
      };

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(/(?!\B"[^"]*),(?![^"]*"\B)/).map(v => v.replace(/^"|"$/g, '').trim());
        if (values.length < 4) continue;
        
        try {
          const getValue = (idx: number) => idx !== -1 ? values[idx] : undefined;
          
          let rawId = getValue(colIndex.id);
          
          const rawNama = getValue(colIndex.nama) || '';
          const rawKes = getValue(colIndex.kes) || 'Umum';
          
          // Special fallback for older legacy schemas if columns are completely unmatched
          const fallbackTotalFeeStr = colIndex.totalFee !== -1 ? getValue(colIndex.totalFee) : values[3];
          const fallbackTarikh = colIndex.tarikh !== -1 ? getValue(colIndex.tarikh) : (values[8] || values[5]);
          
          const rawTotalFee = parseFloat(fallbackTotalFeeStr || '') || parseFloat(values[13] || '') || 0;
          const rawBayaranTerakhir = parseFloat(getValue(colIndex.bayaranTerakhir) || '') || 0;
          const rawTarikh = fallbackTarikh || new Date().toISOString().split('T')[0];
          const rawBakiSebelum = parseFloat(getValue(colIndex.bakiSebelum) || '') || 0;
          const rawBakiTerkini = parseFloat(getValue(colIndex.bakiTerkini) || '') || 0;
          const rawBakiMileage = parseFloat(getValue(colIndex.bakiMileage) || '') || 0;
          
          // Ensure valid ID for Firestore
          if (rawId && rawId.includes('/')) {
             rawId = rawId.replace(/\//g, '-');
          }
          
          const id = rawId || `CSV${Date.now()}${Math.floor(Math.random() * 1000)}`;
          
          const newRecord: CaseRecord & { userId?: string } = {
            id,
            nama: rawNama,
            kes: rawKes,
            totalFee: rawTotalFee,
            bayaranTerakhir: rawBayaranTerakhir,
            tarikh: formatDateDMY(rawTarikh),
            bakiSebelum: rawBakiSebelum,
            bakiFeeTerkini: rawBakiTerkini,
            bakiMileage: rawBakiMileage,
            paymentHistory: [],
            userId: user ? user.uid : undefined
          };
          newRecordsFromCsv.push(newRecord);
          
          if (user) {
            const targetPath = `users/${user.uid}/records/${id}`;
            await setDoc(doc(db, 'users', user.uid, 'records', id), newRecord).catch(err => {
              handleFirestoreError(err, OperationType.WRITE, targetPath);
            });
          }
        } catch (e) {
          console.error("Failed to parse row", values, e);
        }
      }
      
      if (newRecordsFromCsv.length > 0) {
        if (!user) {
          setRecords(prev => [...newRecordsFromCsv, ...prev]);
        }
        alert(`${newRecordsFromCsv.length} rekod telah berjaya diimport!`);
      } else {
        alert("Gagal memuatnaik. Sila pastikan format menepati templat.");
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleAddNewRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordData.nama || !newRecordData.totalFee) return;

    const totalFee = parseFloat(newRecordData.totalFee);
    const bakiMileage = parseFloat(newRecordData.bakiMileage) || 0;
    const id = `C-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const newRecord: CaseRecord & { userId?: string } = {
      id,
      nama: newRecordData.nama,
      kes: newRecordData.kes || 'Umum',
      totalFee: totalFee,
      bayaranTerakhir: 0,
      tarikh: formatDateDMY(newRecordData.tarikh),
      bakiSebelum: totalFee,
      bakiFeeTerkini: totalFee,
      bakiMileage: bakiMileage,
      userId: user ? user.uid : undefined,
      paymentHistory: []
    };

    if (user) {
      const targetPath = `users/${user.uid}/records/${id}`;
      try {
          await setDoc(doc(db, 'users', user.uid, 'records', id), newRecord);
      } catch(err) {
          handleFirestoreError(err, OperationType.WRITE, targetPath);
      }
    } else {
      setRecords(prev => [newRecord, ...prev]);
    }

    setIsNewRecordModalOpen(false);
    setNewRecordData({ nama: '', kes: '', tarikh: new Date().toISOString().split('T')[0], totalFee: '', bakiMileage: '0' });
  };

  const handleEditRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    
    if (user) {
      const targetPath = `users/${user.uid}/records/${editingRecord.id}`;
      try {
          await setDoc(doc(db, 'users', user.uid, 'records', editingRecord.id), { ...editingRecord, userId: user.uid });
      } catch(err) {
          handleFirestoreError(err, OperationType.WRITE, targetPath);
      }
    } else {
      setRecords(prev => prev.map(rec => rec.id === editingRecord.id ? editingRecord : rec));
    }
    setEditingRecord(null);
  };

  const handleDeleteRecord = async () => {
    if (!deletingRecord) return;
    if (user) {
      const targetPath = `users/${user.uid}/records/${deletingRecord.id}`;
      try {
          await deleteDoc(doc(db, 'users', user.uid, 'records', deletingRecord.id));
      } catch(err) {
          handleFirestoreError(err, OperationType.DELETE, targetPath);
      }
    } else {
      setRecords(prev => prev.filter(rec => rec.id !== deletingRecord.id));
    }
    setDeletingRecord(null);
    setExpandedRowId(null);
  };

  const handleDeleteSelected = async () => {
    if (user) {
      for (const id of selectedRecords) {
          const targetPath = `users/${user.uid}/records/${id}`;
          try {
              await deleteDoc(doc(db, 'users', user.uid, 'records', id));
          } catch(err) {
              handleFirestoreError(err, OperationType.DELETE, targetPath);
          }
      }
    } else {
      setRecords(prev => prev.filter(rec => !selectedRecords.includes(rec.id)));
    }
    setSelectedRecords([]);
    setIsDeletingSelected(false);
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRecord) return;

    const feeAmt = parseFloat(paymentAmount || '0');
    const mileageAmt = parseFloat(paymentMileageAmount || '0');

    if ((isNaN(feeAmt) || feeAmt <= 0) && (isNaN(mileageAmt) || mileageAmt <= 0)) {
      setPaymentError('Sila masukkan sekurang-kurangnya satu jumlah bayaran yang sah (Fee atau Mileage).');
      return;
    }

    if (feeAmt > paymentRecord.bakiFeeTerkini) {
      setPaymentError('Jumlah bayaran fee tidak boleh melebihi baki fee semasa');
      return;
    }

    if (paymentRecord.bakiMileage !== undefined && mileageAmt > paymentRecord.bakiMileage) {
      setPaymentError('Jumlah bayaran mileage tidak boleh melebihi baki mileage semasa');
      return;
    }

    setPaymentError('');

    const dateStr = paymentDate ? formatDateDMY(paymentDate) : formatDateDMY(new Date().toISOString().split('T')[0]);

    const newPaymentEntry = {
        id: `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: dateStr,
        amount: feeAmt,
        mileageAmount: mileageAmt,
        method: paymentMethod
    };

    const updatedRecord = {
        ...paymentRecord,
        bayaranTerakhir: feeAmt || mileageAmt, 
        bakiSebelum: paymentRecord.bakiFeeTerkini,
        bakiFeeTerkini: Math.max(0, paymentRecord.bakiFeeTerkini - feeAmt),
        bakiMileage: Math.max(0, (paymentRecord.bakiMileage || 0) - mileageAmt),
        tarikh: dateStr,
        paymentHistory: [newPaymentEntry, ...(paymentRecord.paymentHistory || [])],
        userId: user ? user.uid : undefined
    };

    if (user) {
      const targetPath = `users/${user.uid}/records/${paymentRecord.id}`;
      try {
          await setDoc(doc(db, 'users', user.uid, 'records', paymentRecord.id), updatedRecord);
          // Trigger Auto-Save to Cloud
          silentBackupToCloud(records.map(rec => rec.id === paymentRecord.id ? updatedRecord : rec));
      } catch(err) {
          handleFirestoreError(err, OperationType.WRITE, targetPath);
      }
    } else {
      setRecords(prev => prev.map(rec => rec.id === paymentRecord.id ? updatedRecord : rec));
    }

    setPaymentRecord(null);
    setPaymentAmount('');
    setPaymentMileageAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Transfer');
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

  const handleDownloadReceiptPDF = async () => {
    if (!receiptPrintRef.current || !receiptData) return;
    
    setIsGeneratingReceiptPDF(true);
    try {
      const imgData = await toPng(receiptPrintRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Resit_${receiptData.record.nama.replace(/\s+/g, '_')}_${receiptData.payment.id}.pdf`);
    } catch (error) {
      console.error('Error generating receipt PDF:', error);
    } finally {
      setIsGeneratingReceiptPDF(false);
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
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans fixed inset-0 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Nav */}
      <aside className="w-56 bg-zinc-900 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-500 hidden md:flex flex-col border-r border-zinc-800 dark:border-zinc-800 shrink-0 print:hidden">
        <div className="p-6 border-b border-zinc-800 dark:border-zinc-800">
          <img src="/logo.png" alt="HM Lawyer Logo" className="h-16 w-auto object-contain mx-auto" onError={(e) => {
            (e.target as HTMLImageElement).src = ''; 
            (e.target as HTMLImageElement).alt = 'HM Client Lawyer';
          }} />
          <div className="text-[10px] uppercase tracking-widest opacity-50 text-center mt-2">Sistem Pengurusan</div>
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
          <div 
            onClick={() => { setActiveTab('standalone'); setStandaloneInitialRecord(null); }}
            className={`px-3 py-2 rounded text-sm flex items-center gap-3 cursor-pointer transition-colors ${activeTab === 'standalone' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            {activeTab === 'standalone' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
            Resit Bebas
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
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top Bar */}
        <header className="h-auto md:h-14 py-3 md:py-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between px-4 sm:px-6 shrink-0 gap-3 md:gap-4 print:hidden">
          <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto overflow-hidden">
            <h1 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">
              Papan Pemuka: <span className="font-mono text-blue-600 hidden sm:inline">
                {activeTab === 'dashboard' ? 'Sistem Pengurusan Kes & Bayaran' : activeTab === 'records' ? 'Senarai Rekod' : activeTab === 'reports' ? 'Analisis & Laporan' : 'Jana Resit'}
              </span>
            </h1>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase border border-blue-100 shrink-0">Aktif</span>
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap sm:overflow-x-auto w-full md:w-auto pb-1 md:pb-0 hide-scrollbar no-scrollbar items-center">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shrink-0"
              title={darkMode ? "Tukar ke Mod Siang" : "Tukar ke Mod Gelap"}
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {!user ? (
              <button 
                onClick={handleLogin}
                className="px-3 py-1.5 text-xs bg-zinc-800 text-white rounded hover:bg-zinc-700 font-medium cursor-pointer flex items-center gap-2 shrink-0"
              >
                <LogIn size={14} />
                <span className="hidden sm:inline">Log Masuk (Sync)</span>
              </button>
            ) : (
              <button 
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium cursor-pointer flex items-center gap-2 border border-red-200 shrink-0"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Log Keluar</span>
              </button>
            )}
            {isInstallable && (
              <button 
                onClick={handleInstallApp}
                className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium cursor-pointer flex items-center gap-2 shrink-0"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Muat Turun App</span>
              </button>
            )}
            {user && (
              <button 
                onClick={handleBackupToCloud}
                disabled={isBackingUp}
                className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 border border-blue-200 font-medium cursor-pointer flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                {isBackingUp ? <Loader2 size={14} className="animate-spin" /> : <CloudUpload size={14} />}
                <span className="hidden sm:inline">Cloud Backup</span>
              </button>
            )}
            <button 
              onClick={handleExportData}
              className="px-3 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium cursor-pointer shrink-0"
            >
              Eksport <span className="hidden sm:inline">Data</span>
            </button>
            <button 
              onClick={handleDownloadTemplate}
              className="hidden lg:block px-3 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium cursor-pointer shrink-0"
            >
              Templat
            </button>
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={handleImportCSV} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 flex items-center gap-1 text-xs border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium cursor-pointer shrink-0"
            >
              <Upload size={14} className="text-zinc-500 dark:text-zinc-400" />
              Import <span className="hidden sm:inline">CSV</span>
            </button>
            <button 
              onClick={() => setIsNewRecordModalOpen(true)}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium cursor-pointer shrink-0"
            >
              Rekod Baru
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {activeTab !== 'records' && activeTab !== 'standalone' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 sm:p-4 md:p-6 shrink-0 print:hidden">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 rounded-sm shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Jumlah Kes</div>
                  <Users size={14} className="text-zinc-400 dark:text-zinc-500" />
                </div>
                <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">{stats.totalKes}</div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Keseluruhan pangkalan rekod</div>
              </div>
              
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 rounded-sm shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Jumlah Total Fee</div>
                  <Wallet size={14} className="text-zinc-400 dark:text-zinc-500" />
                </div>
                <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">{formatRM(stats.totalFee)}</div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Nilai keseluruhan yuran dibenarkan</div>
              </div>

              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 rounded-sm shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Baki Fee Terkini</div>
                  <CreditCard size={14} className="text-red-400" />
                </div>
                <div className="text-2xl font-bold text-red-600">{formatRM(stats.totalBakiTerkini)}</div>
                <div className="text-[10px] text-red-500/70 mt-1">Perlu dituntut</div>
              </div>

              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 rounded-sm shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Baki Mileage</div>
                  <MapPin size={14} className="text-zinc-400 dark:text-zinc-500" />
                </div>
                <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">{formatRM(stats.totalMileage)}</div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Tuntutan perjalanan</div>
              </div>
            </div>
          )}

          {/* Dashboard Content / Record Table */}
          <div className={`flex-1 px-2 sm:px-4 md:px-6 pb-2 sm:pb-4 md:pb-6 min-h-0 flex flex-col gap-4 print:hidden`}>
            
            {/* Dashboard and Reports View: Charts */}
            {(activeTab === 'dashboard' || activeTab === 'reports') && (
              <div className={`bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-sm flex flex-col p-4 overflow-hidden shrink-0 w-full`}>
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <h3 className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <PieChart size={14} className="text-blue-500" />
                    Baki Terkini Mengikut Kategori Kes
                  </h3>
                  {activeTab === 'reports' && (
                    <button
                      onClick={handleExportLaporanCSV}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors"
                    >
                      <Download size={14} />
                      Eksport <span className="hidden sm:inline">CSV</span>
                    </button>
                  )}
                </div>
                <div className={`${activeTab === 'dashboard' ? 'h-[350px] lg:h-[450px]' : 'flex-1 min-h-[300px]'} w-full mt-0`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#71717a' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#71717a' }} 
                        tickFormatter={(value) => `RM${value}`}
                        dx={-10}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f4f4f5', opacity: 0.05 }}
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                        formatter={(value: number) => [`RM ${value.toFixed(2)}`, 'Baki Tertunggak']}
                      />
                      <Bar dataKey="baki" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={60}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Main Data Table Area */}
            {activeTab === 'records' && (
            <div className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-sm flex flex-col h-full overflow-hidden">
              <div className="p-2 sm:p-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={14} className="text-zinc-400 dark:text-zinc-500" />
                  Senarai Rekod Kes
                </span>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {selectedRecords.length > 0 && (
                    <button
                      onClick={() => setIsDeletingSelected(true)}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-medium cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      Padam Terpilih ({selectedRecords.length})
                    </button>
                  )}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Search size={12} className="text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <input
                      type="text"
                      className="pl-7 pr-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700 rounded w-full sm:w-48 bg-white dark:bg-zinc-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Cari nama pelanggan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Filter size={12} className="text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <select
                      className="pl-7 pr-6 py-1 appearance-none text-xs border border-zinc-300 dark:border-zinc-700 rounded w-full sm:w-36 bg-white dark:bg-zinc-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                      value={filterKes}
                      onChange={(e) => setFilterKes(e.target.value)}
                    >
                      {uniqueKes.map(kes => (
                        <option key={kes} value={kes}>{kes}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                      <ChevronDown size={12} className="text-zinc-400 dark:text-zinc-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 z-10 shadow-sm">
                    <tr className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-200 dark:border-zinc-800 text-center w-12 flex justify-center items-center h-full">
                        <input 
                          type="checkbox" 
                          className="cursor-pointer rounded border-zinc-300 dark:border-zinc-700 w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                          checked={filteredRecords.length > 0 && filteredRecords.every(r => selectedRecords.includes(r.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newSelected = new Set(selectedRecords);
                              filteredRecords.forEach(r => newSelected.add(r.id));
                              setSelectedRecords(Array.from(newSelected));
                            } else {
                              const filteredIds = new Set(filteredRecords.map(r => r.id));
                              setSelectedRecords(selectedRecords.filter(id => !filteredIds.has(id)));
                            }
                          }}
                        />
                      </th>
                      <th className="px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-200 dark:border-zinc-800">Nama Pelanggan</th>
                      <th className="hidden sm:table-cell px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-200 dark:border-zinc-800">Kategori Kes</th>
                      <th className="hidden lg:table-cell px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-200 dark:border-zinc-800 text-right">Total Fee</th>
                      <th className="hidden xl:table-cell px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-200 dark:border-zinc-800 text-right">Bayaran Terakhir</th>
                      <th className="hidden md:table-cell px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-200 dark:border-zinc-800 text-center">Tarikh</th>
                      <th className="hidden xl:table-cell px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-200 dark:border-zinc-800 text-right">Baki Sebelum</th>
                      <th className="px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-200 dark:border-zinc-800 text-right">Baki Terkini</th>
                      <th className="hidden lg:table-cell px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-200 dark:border-zinc-800 text-right">Baki Mileage</th>
                      <th className="px-2 sm:px-4 py-1.5 sm:py-2 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    <AnimatePresence>
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((record, index) => (
                          <React.Fragment key={record.id}>
                            <motion.tr 
                              layout="position"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                              className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors ${record.bakiFeeTerkini > 0 && index % 2 === 0 ? 'bg-zinc-50 dark:bg-zinc-900' : ''} ${record.bakiFeeTerkini > 2000 ? 'bg-amber-50/30 dark:bg-amber-900/30' : ''} ${expandedRowId === record.id ? 'bg-zinc-100 dark:bg-zinc-900/50' : ''}`}
                            >
                            <td className="px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-100 dark:border-zinc-800">
                              <div className="flex items-center justify-center gap-1 sm:gap-2 font-mono text-zinc-400 dark:text-zinc-500">
                                <input 
                                  type="checkbox" 
                                  className="cursor-pointer rounded border-zinc-300 dark:border-zinc-700 w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 mt-1 pl-1 sm:pl-2"
                                  onClick={(e) => e.stopPropagation()}
                                  checked={selectedRecords.includes(record.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedRecords(prev => [...prev, record.id]);
                                    } else {
                                      setSelectedRecords(prev => prev.filter(id => id !== record.id));
                                    }
                                  }}
                                />
                                <span className="cursor-pointer" onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}>
                                  {expandedRowId === record.id ? <ChevronDown size={14} className="text-zinc-600 dark:text-zinc-400" /> : <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-500" />}
                                </span>
                                <span className="hidden sm:inline">{index + 1}</span>
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-1.5 sm:py-2 font-medium border-r border-zinc-100 dark:border-zinc-800 truncate max-w-[120px] sm:max-w-none">{record.nama}</td>
                            <td className="hidden sm:table-cell px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-100 dark:border-zinc-800">
                              <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-blue-100/50">
                                {record.kes}
                              </span>
                            </td>
                            <td className="hidden lg:table-cell px-2 sm:px-4 py-1.5 sm:py-2 font-mono border-r border-zinc-100 dark:border-zinc-800 text-right">{formatRM(record.totalFee)}</td>
                            <td className="hidden xl:table-cell px-2 sm:px-4 py-1.5 sm:py-2 font-mono border-r border-zinc-100 dark:border-zinc-800 text-emerald-600 text-right bg-emerald-50/10 dark:bg-emerald-900/20">
                              {record.bayaranTerakhir > 0 ? '+' : ''}{formatRM(record.bayaranTerakhir)}
                            </td>
                            <td className="hidden md:table-cell px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-100 dark:border-zinc-800 text-center text-zinc-500 dark:text-zinc-400">{formatDateDMY(record.tarikh)}</td>
                            <td className="hidden xl:table-cell px-2 sm:px-4 py-1.5 sm:py-2 font-mono border-r border-zinc-100 dark:border-zinc-800 text-right text-zinc-400 dark:text-zinc-500">{formatRM(record.bakiSebelum)}</td>
                            <td className={`px-2 sm:px-4 py-1.5 sm:py-2 font-mono font-bold border-r border-zinc-100 dark:border-zinc-800 text-right ${record.bakiFeeTerkini > 2000 ? 'text-red-500 underline decoration-dotted' : 'text-zinc-700 dark:text-zinc-300'}`}>
                              {formatRM(record.bakiFeeTerkini)}
                            </td>
                            <td className="hidden lg:table-cell px-2 sm:px-4 py-1.5 sm:py-2 font-mono border-r border-zinc-100 dark:border-zinc-800 text-right text-amber-600">
                              {formatRM(record.bakiMileage)}
                            </td>
                            <td className="px-2 sm:px-4 py-1.5 sm:py-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                                  className="text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-[10px] font-bold transition-colors shadow-sm whitespace-nowrap"
                                  title="Urus Rekod"
                                >
                                  {expandedRowId === record.id ? 'Tutup' : 'Urus'}
                                </button>
                                <button 
                                  onClick={() => setDeletingRecord(record)}
                                  className="text-zinc-600 dark:text-zinc-400 hover:text-red-600 transition-colors bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-sm"
                                  title="Padam Pelanggan"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                          {expandedRowId === record.id && (
                            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                              <td colSpan={10} className="p-0 whitespace-normal">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 border-l-2 border-blue-500 m-2 bg-white dark:bg-zinc-950 shadow-sm rounded-sm">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                      <div>
                                        <h4 className="font-bold text-zinc-700 dark:text-zinc-300 mb-2 border-b border-zinc-100 dark:border-zinc-800 pb-1 flex items-center gap-2">
                                          <FileText size={14} className="text-zinc-400 dark:text-zinc-500"/> Maklumat Kes
                                        </h4>
                                        <div className="space-y-1.5">
                                          <p className="text-zinc-500 dark:text-zinc-400 flex justify-between"><span>ID Rekod:</span> <span className="font-mono text-zinc-800 dark:text-zinc-200">{record.id}</span></p>
                                          <p className="text-zinc-500 dark:text-zinc-400 flex justify-between"><span>Kategori:</span> <span className="font-medium text-zinc-800 dark:text-zinc-200">{record.kes}</span></p>
                                          <p className="text-zinc-500 dark:text-zinc-400 flex justify-between"><span>Tarikh Kemaskini:</span> <span className="text-zinc-800 dark:text-zinc-200">{formatDateDMY(record.tarikh)}</span></p>
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-zinc-700 dark:text-zinc-300 mb-2 border-b border-zinc-100 dark:border-zinc-800 pb-1 flex items-center gap-2">
                                          <Wallet size={14} className="text-zinc-400 dark:text-zinc-500"/> Pecahan Kewangan
                                        </h4>
                                        <div className="space-y-1.5">
                                          <p className="text-zinc-500 dark:text-zinc-400 flex justify-between"><span>Jumlah Fee:</span> <span className="font-mono text-zinc-800 dark:text-zinc-200">{formatRM(record.totalFee)}</span></p>
                                          <p className="text-zinc-500 dark:text-zinc-400 flex justify-between"><span>Baki Terdahulu:</span> <span className="font-mono text-zinc-800 dark:text-zinc-200">{formatRM(record.bakiSebelum)}</span></p>
                                          <p className="text-zinc-500 dark:text-zinc-400 flex justify-between"><span>Bayaran Terakhir:</span> <span className="font-mono text-emerald-600">{record.bayaranTerakhir > 0 ? '+' : ''}{formatRM(record.bayaranTerakhir)}</span></p>
                                        </div>
                                      </div>
                                      <div className="flex flex-col justify-center gap-2">
                                        <h4 className="font-bold text-zinc-700 dark:text-zinc-300 mb-2 border-b border-zinc-100 dark:border-zinc-800 pb-1 flex items-center gap-2">
                                          Tindakan
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                          <button 
                                            className="flex-1 min-w-[120px] px-2 py-1.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                            onClick={() => setPaymentRecord(record)}
                                          >
                                            <CreditCard size={12} />
                                            Kemaskini Bayaran
                                          </button>
                                          <button 
                                            className="flex-1 min-w-[120px] px-2 py-1.5 text-[11px] border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                            onClick={() => setStatementRecord(record)}
                                          >
                                            <Printer size={12} />
                                            Jana Penyata
                                          </button>
                                          <button 
                                            className="flex-1 min-w-[120px] px-2 py-1.5 text-[11px] border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                            onClick={() => {
                                              setStandaloneInitialRecord(record);
                                              setActiveTab('standalone');
                                            }}
                                          >
                                            <FileText size={12} />
                                            Resit Bebas
                                          </button>
                                          <button 
                                            className="flex-1 min-w-[120px] px-2 py-1.5 text-[11px] border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-amber-600 font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                            onClick={() => setEditingRecord({...record})}
                                          >
                                            <Edit size={12} />
                                            Edit Rekod
                                          </button>
                                          <button 
                                            className="flex-1 min-w-[120px] px-2 py-1.5 text-[11px] border border-red-200 rounded bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                            onClick={() => setDeletingRecord(record)}
                                          >
                                            <Trash2 size={12} />
                                            Padam
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Sejarah Bayaran Section */}
                                    <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                      <h4 className="font-bold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                                        <Wallet size={14} className="text-blue-500" />
                                        Sejarah Bayaran
                                      </h4>
                                      {record.paymentHistory && record.paymentHistory.length > 0 ? (
                                        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-sm">
                                          <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 font-medium text-xs border-b border-zinc-200 dark:border-zinc-800">
                                              <tr>
                                                <th className="px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-200 dark:border-zinc-800">ID Bayaran</th>
                                                <th 
                                                  className="px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors group"
                                                  onClick={() => {
                                                    if (paymentSortColumn === 'date') {
                                                      setPaymentSortDirection(paymentSortDirection === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                      setPaymentSortColumn('date');
                                                      setPaymentSortDirection('asc');
                                                    }
                                                  }}
                                                >
                                                  <div className="flex items-center gap-1">
                                                    Tarikh
                                                    <span className="text-zinc-400 dark:text-zinc-500">
                                                      {paymentSortColumn === 'date' ? (paymentSortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUp size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
                                                    </span>
                                                  </div>
                                                </th>
                                                <th className="px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-200 dark:border-zinc-800">Kaedah</th>
                                                <th 
                                                  className="px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors group"
                                                  onClick={() => {
                                                    if (paymentSortColumn === 'amount') {
                                                      setPaymentSortDirection(paymentSortDirection === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                      setPaymentSortColumn('amount');
                                                      setPaymentSortDirection('asc');
                                                    }
                                                  }}
                                                >
                                                  <div className="flex items-center justify-end gap-1">
                                                    <span className="text-zinc-400 dark:text-zinc-500">
                                                      {paymentSortColumn === 'amount' ? (paymentSortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUp size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
                                                    </span>
                                                    Fee (RM)
                                                  </div>
                                                </th>
                                                <th className="px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-200 dark:border-zinc-800 text-right">Mileage (RM)</th>
                                                <th className="px-2 sm:px-4 py-1.5 sm:py-2 text-center w-12">Tindakan</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {[...record.paymentHistory].sort((a, b) => {
                                                if (!paymentSortColumn) return 0;
                                                let comparison = 0;
                                                if (paymentSortColumn === 'date') comparison = parseDateString(a.date) - parseDateString(b.date);
                                                else if (paymentSortColumn === 'amount') comparison = (a.amount || 0) - (b.amount || 0);
                                                return paymentSortDirection === 'asc' ? comparison : -comparison;
                                              }).map((payment) => (
                                                <tr key={payment.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                                  <td className="px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-xs">{payment.id}</td>
                                                  <td className="px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{formatDateDMY(payment.date)}</td>
                                                  <td className="px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{payment.method}</td>
                                                  <td className="px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-100 dark:border-zinc-800 text-right text-emerald-600 font-medium font-mono">
                                                    {payment.amount ? '+' + formatRM(payment.amount) : '-'}
                                                  </td>
                                                  <td className="px-2 sm:px-4 py-1.5 sm:py-2 border-r border-zinc-100 dark:border-zinc-800 text-right text-emerald-600 font-medium font-mono">
                                                    {payment.mileageAmount ? '+' + formatRM(payment.mileageAmount) : '-'}
                                                  </td>
                                                  <td className="px-2 sm:px-4 py-1.5 sm:py-2 text-center flex justify-center gap-2">
                                                    <button 
                                                      title="Papar/Cetak Resit"
                                                      onClick={() => setReceiptData({record, payment})}
                                                      className="p-1 text-blue-500 hover:text-blue-700 transition-colors rounded hover:bg-blue-50"
                                                    >
                                                      <FileText size={14} />
                                                    </button>
                                                    <button 
                                                      onClick={async () => {
                                                        if (window.confirm('Padam rekod bayaran ini?')) {
                                                          const newHistory = record.paymentHistory.filter(p => p.id !== payment.id);
                                                          const updatedRecord = {
                                                            ...record,
                                                            paymentHistory: newHistory,
                                                            bakiFeeTerkini: record.bakiFeeTerkini + payment.amount,
                                                            bayaranTerakhir: newHistory.length > 0 ? newHistory[0].amount : 0
                                                          };
                                                          if (user) {
                                                            const targetPath = `users/${user.uid}/records/${record.id}`;
                                                            try {
                                                              await setDoc(doc(db, 'users', user.uid, 'records', record.id), updatedRecord);
                                                            } catch (err) {
                                                              handleFirestoreError(err, OperationType.WRITE, targetPath);
                                                            }
                                                          } else {
                                                            setRecords(prev => prev.map(r => r.id === record.id ? updatedRecord : r));
                                                          }
                                                        }
                                                      }}
                                                      className="text-zinc-400 dark:text-zinc-500 hover:text-red-600 p-1 rounded transition-colors"
                                                    >
                                                      <Trash2 size={12} />
                                                    </button>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm text-zinc-500 dark:text-zinc-400 text-sm">
                                          Tiada rekod bayaran buat masa ini.
                                        </div>
                                      )}
                                    </div>
                                    
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <motion.tr 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={10} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500 font-medium">
                          Tiada rekod dijumpai.
                        </td>
                      </motion.tr>
                    )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-[11px] text-zinc-500 dark:text-zinc-400">
                <div>Menunjukkan {filteredRecords.length} daripada {records.length} rekod entri</div>
                <div className="flex gap-1 hidden sm:flex">
                  <button className="px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950 disabled:opacity-50" disabled>Kembali</button>
                  <button className="px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-zinc-800 text-white">1</button>
                  <button className="px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950 disabled:opacity-50" disabled>Seterusnya</button>
                </div>
              </div>
            </div>
            )}
          </div>
          
          {activeTab === 'standalone' && <StandaloneReceipts initialData={standaloneInitialRecord} />}
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900 dark:bg-zinc-100 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-950 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <Edit size={18} className="text-amber-600" />
                  Edit Rekod Pelanggan
                </h3>
                <button onClick={() => setEditingRecord(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleEditRecordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Nama Pelanggan / Entiti
                    </label>
                    <input
                      type="text"
                      required
                      className="px-3 py-2 w-full border border-zinc-300 dark:border-zinc-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-800 dark:text-zinc-200"
                      value={editingRecord.nama}
                      onChange={(e) => setEditingRecord({ ...editingRecord, nama: e.target.value })}
                      autoFocus
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Kategori Kes
                      </label>
                      <input
                        type="text"
                        required
                        className="px-3 py-2 w-full border border-zinc-300 dark:border-zinc-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-800 dark:text-zinc-200"
                        value={editingRecord.kes}
                        onChange={(e) => setEditingRecord({ ...editingRecord, kes: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Tarikh
                      </label>
                      <input
                        type="date"
                        required
                        className="px-3 py-2 w-full border border-zinc-300 dark:border-zinc-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-800 dark:text-zinc-200"
                        value={formatDateISO(editingRecord.tarikh)}
                        onChange={(e) => setEditingRecord({ ...editingRecord, tarikh: formatDateDMY(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Total Fee (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="px-3 py-2 w-full border border-zinc-300 dark:border-zinc-700 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-800 dark:text-zinc-200"
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
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Baki fee akan dikira semula secara automatik</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Baki Mileage (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="px-3 py-2 w-full border border-zinc-300 dark:border-zinc-700 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-800 dark:text-zinc-200"
                        value={editingRecord.bakiMileage}
                        onChange={(e) => setEditingRecord({ ...editingRecord, bakiMileage: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-6">
                    <button 
                      type="button"
                      onClick={() => setEditingRecord(null)}
                      className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 font-medium transition-colors cursor-pointer"
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
        {isDeletingSelected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900 dark:bg-zinc-100 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-950 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-lg mb-2">Padam Rekod Terpilih</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
                  Adakah anda pasti untuk memadam <strong className="text-zinc-800 dark:text-zinc-200">{selectedRecords.length}</strong> rekod yang terpilih? Tindakan ini tidak boleh dikembalikan.
                </p>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => setIsDeletingSelected(false)}
                    className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors cursor-pointer flex-1"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleDeleteSelected}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors cursor-pointer flex-1"
                  >
                    Ya, Padam Semua
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900 dark:bg-zinc-100 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-950 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-lg mb-2">Padam Rekod Kes</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
                  Adakah anda pasti untuk memadam rekod kes <strong className="text-zinc-800 dark:text-zinc-200">{deletingRecord.nama}</strong>? Tindakan ini tidak boleh dikembalikan.
                </p>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => setDeletingRecord(null)}
                    className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors cursor-pointer flex-1"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900 dark:bg-zinc-100 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-950 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  Rekod Pelanggan Baru
                </h3>
                <button onClick={() => setIsNewRecordModalOpen(false)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleAddNewRecord} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Nama Pelanggan / Entiti
                    </label>
                    <input
                      type="text"
                      required
                      className="px-3 py-2 w-full border border-zinc-300 dark:border-zinc-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-800 dark:text-zinc-200"
                      placeholder="Contoh: Ali bin Abu"
                      value={newRecordData.nama}
                      onChange={(e) => setNewRecordData({ ...newRecordData, nama: e.target.value })}
                      autoFocus
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Kategori Kes
                      </label>
                      <input
                        type="text"
                        required
                        className="px-3 py-2 w-full border border-zinc-300 dark:border-zinc-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-800 dark:text-zinc-200"
                        placeholder="Contoh: Saman Sivil"
                        value={newRecordData.kes}
                        onChange={(e) => setNewRecordData({ ...newRecordData, kes: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Tarikh
                      </label>
                      <input
                        type="date"
                        required
                        className="px-3 py-2 w-full border border-zinc-300 dark:border-zinc-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-800 dark:text-zinc-200"
                        value={newRecordData.tarikh}
                        onChange={(e) => setNewRecordData({ ...newRecordData, tarikh: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Total Fee (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="px-3 py-2 w-full border border-zinc-300 dark:border-zinc-700 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-800 dark:text-zinc-200"
                        placeholder="0.00"
                        value={newRecordData.totalFee}
                        onChange={(e) => setNewRecordData({ ...newRecordData, totalFee: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Baki Mileage (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="px-3 py-2 w-full border border-zinc-300 dark:border-zinc-700 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-800 dark:text-zinc-200"
                        placeholder="0.00"
                        value={newRecordData.bakiMileage}
                        onChange={(e) => setNewRecordData({ ...newRecordData, bakiMileage: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-6">
                    <button 
                      type="button"
                      onClick={() => setIsNewRecordModalOpen(false)}
                      className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 font-medium transition-colors cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900 dark:bg-zinc-100 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-950 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-600" />
                  Kemaskini Bayaran
                </h3>
                <button onClick={() => setPaymentRecord(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="mb-6 p-4 rounded-md bg-blue-50/50 border border-blue-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Pelanggan:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{paymentRecord.nama}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Baki Semasa (Fee):</span>
                    <span className="font-mono font-bold text-red-600">{formatRM(paymentRecord.bakiFeeTerkini)}</span>
                  </div>
                  {(paymentRecord.bakiMileage || 0) > 0 && (
                    <div className="flex justify-between text-sm pt-2 mt-2 border-t border-blue-100 italic">
                      <span className="text-zinc-500 dark:text-zinc-400">Baki Semasa (Mileage):</span>
                      <span className="font-mono font-bold text-red-600">{formatRM(paymentRecord.bakiMileage || 0)}</span>
                    </div>
                  )}
                </div>
                
                <form onSubmit={handleUpdatePayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Jumlah Bayaran Fee (RM)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-zinc-500 dark:text-zinc-400 font-mono text-sm">RM</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={paymentRecord.bakiFeeTerkini}
                        className={`pl-10 pr-4 py-2.5 w-full border ${paymentError ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-zinc-300 dark:border-zinc-700 focus:ring-blue-500/20 focus:border-blue-500'} rounded font-mono text-lg focus:outline-none focus:ring-2 transition-all font-medium text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-950`}
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={(e) => {
                          setPaymentAmount(e.target.value);
                          if (paymentError) setPaymentError('');
                        }}
                        autoFocus
                      />
                    </div>
                  </div>

                  {(paymentRecord.bakiMileage || 0) > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Jumlah Bayaran Mileage (RM)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-zinc-500 dark:text-zinc-400 font-mono text-sm">RM</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={paymentRecord.bakiMileage}
                          className={`pl-10 pr-4 py-2.5 w-full border ${paymentError ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-zinc-300 dark:border-zinc-700 focus:ring-blue-500/20 focus:border-blue-500'} rounded font-mono text-lg focus:outline-none focus:ring-2 transition-all font-medium text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-950`}
                          placeholder="0.00"
                          value={paymentMileageAmount}
                          onChange={(e) => {
                            setPaymentMileageAmount(e.target.value);
                            if (paymentError) setPaymentError('');
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {paymentError && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium">{paymentError}</p>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Tarikh Bayaran
                    </label>
                    <input
                      type="date"
                      required
                      className="pl-3 pr-4 py-2 w-full border border-zinc-300 dark:border-zinc-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-800 dark:text-zinc-200"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Kaedah Bayaran
                    </label>
                    <div className="relative">
                      <select
                        required
                        className="pl-3 pr-8 py-2 w-full border border-zinc-300 dark:border-zinc-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-800 dark:text-zinc-200 appearance-none bg-white dark:bg-zinc-950"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Transfer">Transfer</option>
                        <option value="QR">QR</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                        <ChevronDown size={14} className="text-zinc-400 dark:text-zinc-500" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-6">
                    <button 
                      type="button" 
                      onClick={() => setPaymentRecord(null)}
                      className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900 dark:bg-zinc-100 backdrop-blur-sm print:bg-white print:p-0">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-zinc-950 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-screen overflow-hidden flex flex-col print:shadow-none print:border-none print:max-h-none"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 print:hidden">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <Printer size={18} className="text-zinc-600 dark:text-zinc-400" />
                  Pratinjau Penyata
                </h3>
                <button onClick={() => setStatementRecord(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto overflow-x-auto flex-1 bg-white dark:bg-zinc-950 print:p-0 print:overflow-visible">
                {/* Printable Area Starts */}
                <div ref={printRef} className="max-w-2xl min-w-[500px] sm:min-w-0 mx-auto font-sans text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 print:p-8">
                  {/* Header */}
                  <div className="flex justify-between items-start pb-8 border-b-2 border-zinc-900 dark:border-zinc-100 mb-8">
                    <div>
                      <div className="mb-2">
                        <img src="/logo.png" alt="HM Logo" className="h-16 w-auto object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
                      </div>
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Peguam Syarie * Pesuruhjaya Sumpah</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-200 uppercase">Penyata Akaun</h2>
                      <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400 mt-1">Ref: {statementRecord.id}</p>
                      <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">Tarikh: {formatDateDMY(new Date().toISOString().split('T')[0])}</p>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="flex justify-between items-start text-sm mb-10 bg-zinc-50 dark:bg-zinc-900 p-6 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <div>
                      <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Kepada</p>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 text-lg mb-1">{statementRecord.nama}</p>
                      <p className="text-zinc-600 dark:text-zinc-400 font-medium">Kategori Kes: {statementRecord.kes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Ringkasan Baki</p>
                      <p className="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{formatRM(statementRecord.bakiFeeTerkini)}</p>
                      <p className="text-zinc-500 dark:text-zinc-400 font-medium text-xs mt-1">Jumlah Perlu Dibayar</p>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="mb-10">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">Perincian Kos & Tuntutan</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm">
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">Yuran Profesional</p>
                        <div className="flex justify-between items-center space-y-2">
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Jumlah Yuran Keseluruhan</span>
                          <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{formatRM(statementRecord.totalFee)}</span>
                        </div>
                      </div>
                      <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm">
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">Tuntutan Perjalanan</p>
                        <div className="flex justify-between items-center space-y-2">
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tuntutan Mileage</span>
                          <span className="font-mono font-bold text-amber-600">{formatRM(statementRecord.bakiMileage)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Table */}
                  <div className="mb-10">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">Ringkasan Yuran</h3>
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
                      <table className="w-full text-sm min-w-[300px]">
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                            <td className="py-4 px-5 text-zinc-600 dark:text-zinc-400 font-medium whitespace-nowrap w-2/3">Jumlah Yuran Keseluruhan</td>
                            <td className="py-4 px-5 text-right font-mono font-bold text-zinc-800 dark:text-zinc-200">{formatRM(statementRecord.totalFee)}</td>
                          </tr>
                          <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors bg-amber-50/10 dark:bg-amber-900/20">
                            <td className="py-4 px-5 text-zinc-600 dark:text-zinc-400 font-medium">Baki Mileage / Tuntutan Perjalanan</td>
                            <td className="py-4 px-5 text-right font-mono text-amber-600 font-medium">{formatRM(statementRecord.bakiMileage)}</td>
                          </tr>
                          {statementRecord.paymentHistory && statementRecord.paymentHistory.length > 0 && (
                            <>
                              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors bg-emerald-50/10 dark:bg-emerald-900/20">
                                <td className="py-4 px-5 text-zinc-600 dark:text-zinc-400 font-medium">Jumlah Pembayaran Diterima (Fee)</td>
                                <td className="py-4 px-5 text-right font-mono text-emerald-600 font-medium">
                                  -{formatRM(statementRecord.paymentHistory.reduce((acc, curr) => acc + (curr.amount || 0), 0))}
                                </td>
                              </tr>
                              {statementRecord.paymentHistory.some(p => (p.mileageAmount || 0) > 0) && (
                                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors bg-emerald-50/10 dark:bg-emerald-900/20 border-t border-zinc-200 dark:border-zinc-800">
                                  <td className="py-4 px-5 text-zinc-600 dark:text-zinc-400 font-medium">Jumlah Pembayaran Diterima (Mileage)</td>
                                  <td className="py-4 px-5 text-right font-mono text-emerald-600 font-medium">
                                    -{formatRM(statementRecord.paymentHistory.reduce((acc, curr) => acc + (curr.mileageAmount || 0), 0))}
                                  </td>
                                </tr>
                              )}
                            </>
                          )}
                          <tr className="bg-zinc-900 dark:bg-zinc-100 text-white">
                            <td className="py-3 px-5 font-bold text-sm tracking-wide">BAKI TERKINI (FEE)</td>
                            <td className="py-3 px-5 text-right font-mono font-bold text-lg">{formatRM(statementRecord.bakiFeeTerkini)}</td>
                          </tr>
                          <tr className="bg-zinc-800 dark:bg-zinc-200 text-white border-t border-zinc-700">
                            <td className="py-3 px-5 font-bold text-sm tracking-wide">BAKI TERKINI (MILEAGE)</td>
                            <td className="py-3 px-5 text-right font-mono font-bold text-lg">{formatRM(statementRecord.bakiMileage || 0)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payment History */}
                  <div>
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">Rekod Pembayaran</h3>
                    {statementRecord.paymentHistory && statementRecord.paymentHistory.length > 0 ? (
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[500px]">
                          <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                              <th className="py-3 px-5 font-semibold text-zinc-600 dark:text-zinc-400">Tarikh</th>
                              <th className="py-3 px-5 font-semibold text-zinc-600 dark:text-zinc-400">No. Rujukan</th>
                              <th className="py-3 px-5 font-semibold text-zinc-600 dark:text-zinc-400">Kaedah</th>
                              <th className="py-3 px-5 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Fee (RM)</th>
                              <th className="py-3 px-5 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Mileage (RM)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {statementRecord.paymentHistory.map((payment) => (
                              <tr key={payment.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                <td className="py-3 px-5 text-zinc-800 dark:text-zinc-200">{formatDateDMY(payment.date)}</td>
                                <td className="py-3 px-5 text-zinc-500 dark:text-zinc-400 font-mono text-xs">{payment.id}</td>
                                <td className="py-3 px-5 text-zinc-600 dark:text-zinc-400">{payment.method}</td>
                                <td className="py-3 px-5 text-right font-mono font-medium text-emerald-600">{formatRM(payment.amount || 0)}</td>
                                <td className="py-3 px-5 text-right font-mono font-medium text-emerald-600">{formatRM(payment.mileageAmount || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center p-8 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-sm">
                        Tiada rekod pembayaran didapati untuk akaun ini.
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-16 mt-16 text-xs text-center text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="font-medium text-zinc-500 dark:text-zinc-400 text-sm mb-2">Terima kasih atas urusan bersama kami.</p>
                    <p>Penyata rasmi ini merupakan janaan komputer dan sah tanpa tandatangan fizikal.</p>
                    <p>Sila kemukakan sebarang pertanyaan mengenai penyata ini dalam tempoh 14 hari dari tarikh dikeluarkan.</p>
                  </div>
                </div>
                {/* Printable Area Ends */}
              </div>

              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-2 print:hidden">
                <button 
                  onClick={() => setStatementRecord(null)}
                  className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                >
                  Tutup
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-2"
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

      <AnimatePresence>
        {receiptData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900 dark:bg-zinc-100 backdrop-blur-sm print:bg-white print:p-0">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:max-h-none print:w-full print:max-w-none"
            >
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 print:hidden">
                <div>
                  <h3 className="font-bold text-zinc-800 dark:text-zinc-200">Cetak Resit</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Ref: {receiptData.payment.id}</p>
                </div>
                <button 
                  onClick={() => setReceiptData(null)}
                  className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto overflow-x-auto flex-1 bg-white dark:bg-zinc-950 print:p-0 print:overflow-visible">
                {/* Printable Area Starts */}
                <div ref={receiptPrintRef} className="max-w-2xl min-w-[500px] sm:min-w-0 mx-auto font-sans text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 print:p-8">
                  {/* Header */}
                  <div className="flex justify-between items-start pb-8 border-b-2 border-zinc-900 dark:border-zinc-100 mb-8">
                    <div>
                      <div className="mb-2">
                        <img src="https://arleta.site/interactivelink/2510/logo.png" className="h-[75px] w-auto mr-4" alt="Logo" />
                      </div>
                      <h1 className="text-lg font-bold tracking-tight mb-2">TETUAN HAIRI MUSTAFA & ASSOCIATES</h1>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5 leading-snug font-medium">
                        <p className="italic uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Peguam Syarie * Pesuruhjaya Sumpah</p>
                        <p>Lot 02, Bangunan Arked MARA</p>
                        <p>09100 Baling, Kedah</p>
                        <p>Tel: 010-2434143 / 011-56531310</p>
                        <p>Email: tetuanhairi@gmail.com</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-start mb-8 text-sm">
                    <div>
                      <p className="font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 mb-1">Pelanggan:</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">[KATEGORI: SYARIE / UMUM]</p>
                      <p className="font-bold text-[16px] text-zinc-800 dark:text-zinc-200 uppercase mb-1">{receiptData.record.nama}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">TARIKH: {formatDateDMY(receiptData.payment.date)}</p>
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-black tracking-widest uppercase border-b-2 border-zinc-900 dark:border-zinc-100 inline-block px-4 pb-1">Resit</h2>
                  </div>

                  <div className="border-t-[3px] border-b-[3px] border-zinc-900 dark:border-zinc-100 mb-8">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-zinc-900 dark:border-zinc-100">
                          <th className="py-3 px-4 font-bold text-left uppercase">Item / Perkara</th>
                          <th className="py-3 px-4 font-bold text-right uppercase w-[200px] border-l-2 border-zinc-900 dark:border-zinc-100">Jumlah (RM)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(receiptData.payment.amount > 0 || (receiptData.payment.amount === 0 && !receiptData.payment.mileageAmount)) && (
                          <tr>
                            <td className="py-4 px-4 font-medium text-zinc-800 dark:text-zinc-200 uppercase">FEE {formatDateDMY(receiptData.payment.date)}</td>
                            <td className="py-4 px-4 font-mono font-medium text-right border-l-2 border-zinc-900 dark:border-zinc-100">{receiptData.payment.amount.toFixed(2)}</td>
                          </tr>
                        )}
                        {!!receiptData.payment.mileageAmount && receiptData.payment.mileageAmount > 0 && (
                          <tr>
                            <td className="py-4 px-4 font-medium text-zinc-800 dark:text-zinc-200 uppercase">MILEAGE {formatDateDMY(receiptData.payment.date)}</td>
                            <td className="py-4 px-4 font-mono font-medium text-right border-l-2 border-zinc-900 dark:border-zinc-100">{receiptData.payment.mileageAmount.toFixed(2)}</td>
                          </tr>
                        )}
                        {(receiptData.payment.amount > 0 && !!receiptData.payment.mileageAmount && receiptData.payment.mileageAmount > 0) && (
                          <tr className="border-t-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                            <td className="py-4 px-4 font-bold text-zinc-800 dark:text-zinc-200 text-right uppercase">JUMLAH KESELURUHAN (RM)</td>
                            <td className="py-4 px-4 font-mono font-bold text-right border-l-2 border-zinc-900 dark:border-zinc-100">{(receiptData.payment.amount + receiptData.payment.mileageAmount).toFixed(2)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-start border-b border-zinc-300 dark:border-zinc-700 pb-12 mb-12">
                     <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase flex items-center gap-2">
                         Butiran Kes: <span className="underline underline-offset-4">{receiptData.record.kes}</span>
                     </div>
                     {(()=>{
                         const sortedPayments = [...(receiptData.record.paymentHistory || [])].sort((a, b) => parseDateString(a.date) - parseDateString(b.date));
                         const paymentIndex = sortedPayments.findIndex(p => p.id === receiptData.payment.id);
                         const paymentsAfter = sortedPayments.slice(paymentIndex + 1);

                         const sumAfterFee = paymentsAfter.reduce((sum, p) => sum + (p.amount || 0), 0);
                         const bakiTerkiniFee = receiptData.record.bakiFeeTerkini + sumAfterFee;
                         const bakiTerdahuluFee = bakiTerkiniFee + (receiptData.payment.amount || 0);

                         const hasMileageReceipt = !!receiptData.payment.mileageAmount && receiptData.payment.mileageAmount > 0;
                         const sumAfterMileage = paymentsAfter.reduce((sum, p) => sum + (p.mileageAmount || 0), 0);
                         const bakiTerkiniMileage = receiptData.record.bakiMileage !== undefined ? receiptData.record.bakiMileage + sumAfterMileage : 0;
                         const bakiTerdahuluMileage = bakiTerkiniMileage + (receiptData.payment.mileageAmount || 0);
                         
                         return (
                           <div className="text-right space-y-4">
                               {receiptData.payment.amount > 0 && (
                                   <>
                                     <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex justify-end gap-12">
                                         <span>JUMLAH BAYARAN (FEE):</span>
                                         <span className="w-32">RM {receiptData.payment.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                     </div>
                                     <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex justify-end gap-12">
                                         <span>BAKI TERDAHULU (FEE):</span>
                                         <span className="w-32">RM {bakiTerdahuluFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                     </div>
                                     <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex justify-end gap-12 pt-3 border-t border-zinc-900 dark:border-zinc-100 mb-4">
                                         <span>BAKI TERKINI (FEE):</span>
                                         <span className="w-32">RM {bakiTerkiniFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                     </div>
                                   </>
                               )}

                               {hasMileageReceipt && (
                                   <>
                                     <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex justify-end gap-12">
                                         <span>JUMLAH BAYARAN (MILEAGE):</span>
                                         <span className="w-32">RM {receiptData.payment.mileageAmount!.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                     </div>
                                     <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex justify-end gap-12">
                                         <span>BAKI TERDAHULU (MILEAGE):</span>
                                         <span className="w-32">RM {bakiTerdahuluMileage.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                     </div>
                                     <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex justify-end gap-12 pt-3 border-t border-zinc-900 dark:border-zinc-100">
                                         <span>BAKI TERKINI (MILEAGE):</span>
                                         <span className="w-32">RM {bakiTerkiniMileage.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                     </div>
                                   </>
                               )}
                           </div>
                         );
                     })()}
                  </div>

                  <div className="flex justify-end pt-12">
                    <div className="text-center">
                      <img src="https://arleta.site/interactivelink/2510/cop-bulat.png" alt="Cop Rasmi" className="block mx-auto max-h-[85px] w-auto -mb-1" />
                      <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase">Hairi Mustafa & Associates</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Peguam Syarie & Pesuruhjaya Sumpah</p>
                    </div>
                  </div>

                  <div className="mt-12 pt-6 border-t border-dashed border-zinc-300 dark:border-zinc-700 text-center text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                    Resit ini dijana oleh komputer, terima kasih atas urusan anda. Ref: {receiptData.payment.id}
                  </div>
                </div>
                {/* Printable Area Ends */}
              </div>

              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-3 print:hidden">
                <button 
                  onClick={() => setReceiptData(null)}
                  className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 font-medium"
                >
                  Tutup
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium flex items-center gap-2"
                >
                  <Printer size={16} />
                  Cetak
                </button>
                <button 
                  onClick={handleDownloadReceiptPDF}
                  disabled={isGeneratingReceiptPDF}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isGeneratingReceiptPDF ? (
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

      <AnimatePresence>
        {showExportReminder && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-4 right-4 bg-white dark:bg-zinc-950 border border-blue-200 shadow-xl rounded-lg p-5 max-w-sm z-50 flex items-start gap-3"
          >
            <div className="bg-blue-50 text-blue-500 rounded-full p-2 shrink-0">
              <Download size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Peringatan Penyimpanan (Backup)</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">Tiada sebarang pengemaskinian rekod selama 7 hari. Anda disarankan untuk mengeksport rekod kes anda sebagai sandaran.</p>
              <div className="mt-3 flex gap-2">
                <button 
                  onClick={() => {
                    handleExportData();
                    setShowExportReminder(false);
                  }}
                  className="text-xs bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors"
                >
                  Eksport Sekarang
                </button>
                <button 
                  onClick={() => setShowExportReminder(false)}
                  className="text-xs border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Abaikan
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav 
        className="md:hidden bg-zinc-900 dark:bg-zinc-950 text-zinc-400 border-t border-zinc-800 flex justify-around p-2 pt-3 shrink-0 z-40 print:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`flex flex-col items-center p-1 text-[9px] w-1/4 text-center ${activeTab === 'dashboard' ? 'text-white' : 'hover:text-white'}`}
        >
          <Home size={20} className="mb-1" /> Papan Pemuka
        </button>
        <button 
          onClick={() => setActiveTab('records')} 
          className={`flex flex-col items-center p-1 text-[9px] w-1/4 text-center ${activeTab === 'records' ? 'text-white' : 'hover:text-white'}`}
        >
          <Users size={20} className="mb-1" /> Rekod Pelanggan
        </button>
        <button 
          onClick={() => setActiveTab('reports')} 
          className={`flex flex-col items-center p-1 text-[9px] w-1/4 text-center ${activeTab === 'reports' ? 'text-white' : 'hover:text-white'}`}
        >
          <BarChart2 size={20} className="mb-1" /> Laporan Kewangan
        </button>
        <button 
          onClick={() => { setActiveTab('standalone'); setStandaloneInitialRecord(null); }} 
          className={`flex flex-col items-center p-1 text-[9px] w-1/4 text-center ${activeTab === 'standalone' ? 'text-white' : 'hover:text-white'}`}
        >
          <FileText size={20} className="mb-1" /> Resit Bebas
        </button>
      </nav>
    </div>
  );
}
