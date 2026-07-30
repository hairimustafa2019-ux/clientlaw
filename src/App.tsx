/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import StandaloneReceipts from './components/StandaloneReceipts';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Settings, Menu, Car, Users, FileText, CreditCard, Wallet, MapPin, ChevronDown, Filter, ChevronRight, X, Printer, CheckCircle, Download, Loader2, PieChart, Edit, Trash2, AlertTriangle, ArrowUp, ArrowDown, ArrowUpDown, Upload, LogOut, LogIn, CloudUpload, Moon, Sun, Home, Clock, Zap, Plus, History } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { records as initialRecords, CaseRecord } from './data';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, writeBatch } from 'firebase/firestore';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'standalone' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  
  // ZIP Download States
  const [zipQueue, setZipQueue] = useState<{record: CaseRecord, payment: import('./data').PaymentEntry}[] | null>(null);
  const [zipCurrentIndex, setZipCurrentIndex] = useState<number>(0);
  const zipInstanceRef = useRef<JSZip | null>(null);
  const hiddenReceiptPrintRef = useRef<HTMLDivElement>(null);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);

  // Modal States
  const [paymentRecord, setPaymentRecord] = useState<CaseRecord | null>(null);
  const [statementRecord, setStatementRecord] = useState<CaseRecord | null>(null);
  const [simpleStatementRecord, setSimpleStatementRecord] = useState<CaseRecord | null>(null);
  const [receiptData, setReceiptData] = useState<{record: CaseRecord, payment: import('./data').PaymentEntry} | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMileageAmount, setPaymentMileageAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('Transfer');
  const [paymentError, setPaymentError] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState<string>('');
  
  const [editingRecord, setEditingRecord] = useState<CaseRecord | null>(null);
  const [mileageAdjustmentRecord, setMileageAdjustmentRecord] = useState<CaseRecord | null>(null);
  const [mileageAdjustmentAmount, setMileageAdjustmentAmount] = useState<string>('');
  const [mileageAdjustmentType, setMileageAdjustmentType] = useState<'tambah' | 'tolak'>('tambah');
  const [deletingRecord, setDeletingRecord] = useState<CaseRecord | null>(null);
  const [settlingRecord, setSettlingRecord] = useState<CaseRecord | null>(null);
  const [isDeletingSelected, setIsDeletingSelected] = useState<boolean>(false);

  const [standaloneInitialRecord, setStandaloneInitialRecord] = useState<CaseRecord | null>(null);
  
  const [paymentSortColumn, setPaymentSortColumn] = useState<'date' | 'amount' | null>(null);
  const [paymentSortDirection, setPaymentSortDirection] = useState<'asc' | 'desc'>('desc');
  const [dateSortOrder, setDateSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [nameSortOrder, setNameSortOrder] = useState<'asc' | 'desc' | null>(null);

  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [newRecordData, setNewRecordData] = useState({
    nama: '',
    kes: '',
    tarikh: new Date().toISOString().split('T')[0],
    totalFee: '',
    bakiMileage: '0',
    nota: ''
  });

  // Printing Reference
  const printRef = useRef<HTMLDivElement>(null);
  const simplePrintRef = useRef<HTMLDivElement>(null);
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
    
    // Auto sync local offline records when user logs in
    const savedLocal = localStorage.getItem('localOfflineRecords');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (parsed && parsed.length > 0) {
          const batch = writeBatch(db);
          for (const rec of parsed) {
            const docRef = doc(db, 'users', user.uid, 'records', rec.id);
            batch.set(docRef, { ...rec, userId: user.uid }, { merge: true });
          }
          batch.commit().then(() => {
            localStorage.removeItem('localOfflineRecords');
            console.log('Local records auto-synced to cloud.');
          });
        }
      } catch (e) {}
    }

    const q = query(collection(db, targetPath));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // If Firestore is empty, populate it with initial data file
        try {
          const batch = writeBatch(db);
          for (const rec of initialRecords) {
            const docRef = doc(db, 'users', user.uid, 'records', rec.id);
            batch.set(docRef, { ...rec, userId: user.uid });
          }
          await batch.commit();
          return; // The snapshot listener will re-fire with the new data
        } catch (error) {
          console.error("Failed to seed initial data:", error);
        }
      }
      
      const fetchedRecords: CaseRecord[] = [];
      snapshot.forEach(doc => {
        fetchedRecords.push(doc.data() as CaseRecord);
      });
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
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/operation-not-allowed') {
        alert('Log masuk gagal: Sila pastikan "Google" log masuk diaktifkan dalam Firebase Console (Authentication -> Sign-in method).');
      } else if (e.code === 'auth/popup-blocked') {
        alert('Log masuk gagal: Popup disekat oleh pelayar. Sila benarkan popup atau buka aplikasi ini di tab baru.');
      } else if (e.code === 'auth/popup-closed-by-user') {
        alert('Log masuk dibatalkan: Anda telah menutup tetingkap popup sebelum log masuk selesai.');
      } else if (e.code === 'auth/unauthorized-domain') {
        alert(`Log masuk gagal: Domain ini tidak dibenarkan. Sila tambah domain ini ke dalam senarai "Authorized domains" di Firebase Console.`);
      } else {
        alert(`Log masuk gagal: ${e.message}`);
      }
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
      setPaymentNote('');
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

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
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
    const blob = new Blob([headers + example], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template_rekod_kes.csv";
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
      nota: newRecordData.nota,
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
    setNewRecordData({ nama: '', kes: '', tarikh: new Date().toISOString().split('T')[0], totalFee: '', bakiMileage: '0',
    nota: '' });
  };

  const handleMileageAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mileageAdjustmentRecord || !mileageAdjustmentAmount) return;
    
    const amount = parseFloat(mileageAdjustmentAmount);
    if (isNaN(amount) || amount <= 0) return;

    let newBakiMileage = mileageAdjustmentRecord.bakiMileage || 0;
    if (mileageAdjustmentType === 'tambah') {
        newBakiMileage += amount;
    } else {
        newBakiMileage -= amount;
        if (newBakiMileage < 0) newBakiMileage = 0;
    }

    const updatedRecord = {
        ...mileageAdjustmentRecord,
        bakiMileage: newBakiMileage
    };

    if (user) {
      const targetPath = `users/${user.uid}/records/${mileageAdjustmentRecord.id}`;
      try {
          await setDoc(doc(db, 'users', user.uid, 'records', mileageAdjustmentRecord.id), { ...updatedRecord, userId: user.uid });
      } catch(err) {
          handleFirestoreError(err, OperationType.WRITE, targetPath);
      }
    } else {
      setRecords(prev => prev.map(rec => rec.id === mileageAdjustmentRecord.id ? updatedRecord : rec));
    }
    setMileageAdjustmentRecord(null);
    setMileageAdjustmentAmount('');
  };

  const handleInlineNoteUpdate = async (id: string, newNote: string) => {
    const recordToUpdate = records.find(r => r.id === id);
    if (!recordToUpdate) return;
    
    if (recordToUpdate.nota === newNote) return;

    const updatedRecord = { ...recordToUpdate, nota: newNote };
    
    setRecords(prev => prev.map(rec => rec.id === id ? updatedRecord : rec));

    if (user) {
      const targetPath = `users/${user.uid}/records/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'records', id), { ...updatedRecord, userId: user.uid });
      } catch(err) {
        handleFirestoreError(err, OperationType.WRITE, targetPath);
      }
    }
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

  const handleSettleBakiFeeToZero = async () => {
    if (!settlingRecord) return;
    const currentBaki = settlingRecord.bakiFeeTerkini;
    if (currentBaki <= 0) {
      setSettlingRecord(null);
      return;
    }

    const dateStr = formatDateDMY(new Date().toISOString().split('T')[0]);
    const newPaymentEntry = {
      id: `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: dateStr,
      amount: currentBaki,
      mileageAmount: 0,
      method: 'Pelarasan (Set RM0)'
    };

    const updatedRecord: CaseRecord = {
      ...settlingRecord,
      bayaranTerakhir: currentBaki,
      bakiSebelum: currentBaki,
      bakiFeeTerkini: 0,
      tarikh: dateStr,
      paymentHistory: [newPaymentEntry, ...(settlingRecord.paymentHistory || [])],
      userId: user ? user.uid : undefined
    };

    if (user) {
      const targetPath = `users/${user.uid}/records/${settlingRecord.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'records', settlingRecord.id), updatedRecord);
        silentBackupToCloud(records.map(rec => rec.id === settlingRecord.id ? updatedRecord : rec));
      } catch(err) {
        handleFirestoreError(err, OperationType.WRITE, targetPath);
      }
    } else {
      setRecords(prev => prev.map(rec => rec.id === settlingRecord.id ? updatedRecord : rec));
    }

    setSettlingRecord(null);
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
        method: paymentMethod,
        nota: paymentNote
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
    setPaymentNote('');
  };

  const handleDirectPay = (amount: string) => {
    // Find most recent active customer (has baki)
    const activeRecords = [...records].reverse().filter(r => (r.bakiFeeTerkini > 0 || (r.bakiMileage && r.bakiMileage > 0)));
    if (activeRecords.length > 0) {
      const recentCustomer = activeRecords[0];
      setPaymentRecord(recentCustomer);
      setPaymentAmount(amount);
      setPaymentMileageAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Transfer');
      setPaymentNote('Bayaran Segera');
    } else {
      alert("Tiada pelanggan aktif yang mempunyai baki untuk dibayar.");
    }
  };

  const handleDownloadSelectedReceiptsZIP = () => {
    const queue: {record: CaseRecord, payment: import('./data').PaymentEntry}[] = [];
    selectedRecords.forEach(recordId => {
       const record = records.find(r => r.id === recordId);
       if (record && record.paymentHistory) {
           record.paymentHistory.forEach(payment => {
               queue.push({ record, payment });
           });
       }
    });
    
    if (queue.length === 0) {
        alert("Tiada resit (sejarah bayaran) dijumpai untuk rekod yang dipilih.");
        return;
    }
    
    zipInstanceRef.current = new JSZip();
    setIsGeneratingZip(true);
    setZipQueue(queue);
    setZipCurrentIndex(0);
  };

  useEffect(() => {
    const processNextZipItem = async () => {
      if (zipQueue && zipInstanceRef.current && hiddenReceiptPrintRef.current) {
        if (zipCurrentIndex < zipQueue.length) {
          // Allow DOM to update and images to load
          await new Promise(resolve => setTimeout(resolve, 300));
          
          try {
            const canvas = await html2canvas(hiddenReceiptPrintRef.current, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgPropsHeight = (canvas.height * pdfWidth) / canvas.width;
            
            let heightLeft = imgPropsHeight;
            let position = 0;
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
            heightLeft -= pageHeight;
            while (heightLeft >= 0) {
              position = heightLeft - imgPropsHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
              heightLeft -= pageHeight;
            }
            
            const pdfBlob = pdf.output('blob');
            const currentItem = zipQueue[zipCurrentIndex];
            const cleanName = currentItem.record.nama.replace(/[^a-zA-Z0-9_-]/g, '_');
            zipInstanceRef.current.file(`Resit_${cleanName}_${currentItem.payment.id}.pdf`, pdfBlob);
            
            // Advance to next
            setZipCurrentIndex(prev => prev + 1);
          } catch (err) {
            console.error("Failed to generate PDF for zip item", err);
            // Skip this one and continue
            setZipCurrentIndex(prev => prev + 1);
          }
        } else {
          // Done processing all items, generate zip
          try {
            const zipBlob = await zipInstanceRef.current.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Resit_Pilihan_${new Date().getTime()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } catch (err) {
            console.error("Failed to generate ZIP", err);
            alert("Ralat semasa menjana fail ZIP.");
          } finally {
            setIsGeneratingZip(false);
            setZipQueue(null);
            setZipCurrentIndex(0);
            zipInstanceRef.current = null;
          }
        }
      }
    };

    if (isGeneratingZip && zipQueue) {
      processNextZipItem();
    }
  }, [zipCurrentIndex, zipQueue, isGeneratingZip]);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingSimplePDF, setIsGeneratingSimplePDF] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSimplePDF = async () => {
    if (!simplePrintRef.current || !simpleStatementRecord) return;
    
    setIsGeneratingSimplePDF(true);
    try {
      const canvas = await html2canvas(simplePrintRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgPropsHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgPropsHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgPropsHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Penyata_Ringkas_${simpleStatementRecord.nama.replace(/\s+/g, '_')}_${simpleStatementRecord.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingSimplePDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current || !statementRecord) return;
    
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgPropsHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgPropsHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgPropsHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
        heightLeft -= pageHeight;
      }

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
      const canvas = await html2canvas(receiptPrintRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgPropsHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgPropsHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgPropsHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
        heightLeft -= pageHeight;
      }
      
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
    const list = records.filter(record => {
      const matchesSearch = record.nama.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesKes = filterKes === 'Semua' || record.kes.toLowerCase() === filterKes.toLowerCase();
      
      let matchesDate = true;
      if (filterStartDate || filterEndDate) {
        const recordDate = parseDateObj(record.tarikh).getTime();
        
        if (filterStartDate && filterEndDate) {
            const sDate = new Date(filterStartDate).getTime();
            const eDate = new Date(filterEndDate);
            eDate.setHours(23, 59, 59, 999);
            const eDateTime = eDate.getTime();
            matchesDate = recordDate >= sDate && recordDate <= eDateTime;
        } else if (filterStartDate) {
            const sDate = new Date(filterStartDate).getTime();
            matchesDate = recordDate >= sDate;
        } else if (filterEndDate) {
            const eDate = new Date(filterEndDate);
            eDate.setHours(23, 59, 59, 999);
            const eDateTime = eDate.getTime();
            matchesDate = recordDate <= eDateTime;
        }
      }

      return matchesSearch && matchesKes && matchesDate;
    });

    if (nameSortOrder) {
      list.sort((a, b) => {
        const nameA = (a.namaPelanggan || '').toLowerCase();
        const nameB = (b.namaPelanggan || '').toLowerCase();
        return nameSortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    } else if (dateSortOrder) {
      list.sort((a, b) => {
        const timeA = parseDateObj(a.tarikh).getTime();
        const timeB = parseDateObj(b.tarikh).getTime();
        return dateSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      });
    }

    return list;
  }, [searchTerm, filterKes, filterStartDate, filterEndDate, records, dateSortOrder, nameSortOrder]);

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

  // Export functions removed


    const renderExpandedDetails = (record: any) => (
<div className="p-4 sm:p-6 m-2 sm:m-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
    <div>
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
        <FileText size={16} className="text-blue-500"/> Maklumat Kes
      </h4>
      <div className="space-y-3 text-sm">
        <p className="flex justify-between items-center"><span className="text-zinc-500">ID Rekod</span> <span className="font-mono text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{record.id}</span></p>
        <p className="flex justify-between items-center"><span className="text-zinc-500">Kategori</span> <span className="font-medium text-zinc-900 dark:text-zinc-100">{record.kes}</span></p>
        <p className="flex justify-between items-center"><span className="text-zinc-500">Dikemaskini</span> <span className="text-zinc-900 dark:text-zinc-100">{formatDateDMY(record.tarikh)}</span></p>
        {record.nota && (
          <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-zinc-500 mb-1">Nota / Ringkasan</p>
            <p className="text-zinc-900 dark:text-zinc-100 whitespace-pre-line">{record.nota}</p>
          </div>
        )}
      </div>
    </div>
    <div>
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
        <Wallet size={16} className="text-blue-500"/> Pecahan Kewangan
      </h4>
      <div className="space-y-3 text-sm">
        <p className="flex justify-between items-center"><span className="text-zinc-500">Jumlah Fee</span> <span className="font-mono text-zinc-900 dark:text-zinc-100">{formatRM(record.totalFee)}</span></p>
        <p className="flex justify-between items-center"><span className="text-zinc-500">Baki Terdahulu</span> <span className="font-mono text-zinc-900 dark:text-zinc-100">{formatRM(record.bakiSebelum)}</span></p>
        <p className="flex justify-between items-center"><span className="text-zinc-500">Bayaran Terakhir</span> <span className="font-mono font-medium text-emerald-600 dark:text-emerald-500">{record.bayaranTerakhir > 0 ? '+' : ''}{formatRM(record.bayaranTerakhir)}</span></p>
        <div className="flex justify-between items-center">
          <span className="text-zinc-500">Baki Terkini</span>
          <div className="flex items-center gap-1.5">
            <span className={`font-mono font-bold ${record.bakiFeeTerkini > 2000 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
              {formatRM(record.bakiFeeTerkini)}
            </span>
            {record.bakiFeeTerkini > 0 && (
              <button 
                onClick={() => setPaymentRecord(record)}
                className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline flex items-center cursor-pointer"
                title="Buat Bayaran"
              >
                (Bayar)
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-zinc-500">Baki Mileage</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-medium text-amber-600 dark:text-amber-500">
              {formatRM(record.bakiMileage)}
            </span>
            <button 
              onClick={() => setMileageAdjustmentRecord(record)}
              className="text-[11px] text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium underline flex items-center cursor-pointer"
              title="Kemaskini baki mileage"
            >
              (Kemaskini)
            </button>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <History size={16} className="text-blue-500"/> Rekod Bayaran
        </h4>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSimpleStatementRecord(record)}
            className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-sm border border-zinc-200 dark:border-zinc-700"
            title="Cetak Penyata Ringkas"
          >
            <Printer size={12} />
            <span>Penyata Ringkas</span>
          </button>
          {record.bakiFeeTerkini > 0 && (
            <button 
              onClick={() => setPaymentRecord(record)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-sm"
              title="Tambah Bayaran"
            >
              <Plus size={12} />
              <span>+ Bayaran</span>
            </button>
          )}
        </div>
      </div>
      {record.paymentHistory && record.paymentHistory.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-[13px] md:whitespace-nowrap">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3 border-r border-zinc-100 dark:border-zinc-800/50">ID</th>
                <th 
                  className="px-4 py-3 border-r border-zinc-100 dark:border-zinc-800/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
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
                    <span className="text-zinc-400">
                      {paymentSortColumn === 'date' ? (paymentSortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUp size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3 border-r border-zinc-100 dark:border-zinc-800/50">Kaedah</th>
                <th className="px-4 py-3 border-r border-zinc-100 dark:border-zinc-800/50">Nota</th>
                <th 
                  className="px-4 py-3 border-r border-zinc-100 dark:border-zinc-800/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group text-right"
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
                    <span className="text-zinc-400">
                      {paymentSortColumn === 'amount' ? (paymentSortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUp size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
                    </span>
                    Fee (RM)
                  </div>
                </th>
                <th className="px-4 py-3 border-r border-zinc-100 dark:border-zinc-800/50 text-right">Mileage (RM)</th>
                <th className="px-4 py-3 text-center w-12">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {[...record.paymentHistory].sort((a, b) => {
                if (!paymentSortColumn) return 0;
                let comparison = 0;
                if (paymentSortColumn === 'date') comparison = parseDateString(a.date) - parseDateString(b.date);
                else if (paymentSortColumn === 'amount') comparison = (a.amount || 0) - (b.amount || 0);
                return paymentSortDirection === 'asc' ? comparison : -comparison;
              }).map((payment: any) => (
                <tr key={payment.id} className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-2 border-r border-zinc-100 dark:border-zinc-800/50 text-zinc-500 font-mono text-xs">{payment.id}</td>
                  <td className="px-4 py-2 border-r border-zinc-100 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">{formatDateDMY(payment.date)}</td>
                  <td className="px-4 py-2 border-r border-zinc-100 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-300 text-xs">{payment.method}</td>
                  <td className="px-4 py-2 border-r border-zinc-100 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-400 text-xs max-w-[160px] truncate" title={payment.nota || ''}>
                    {payment.nota || <span className="text-zinc-400 dark:text-zinc-600 italic">-</span>}
                  </td>
                  <td className="px-4 py-2 border-r border-zinc-100 dark:border-zinc-800/50 text-right text-emerald-600 dark:text-emerald-500 font-medium font-mono text-sm">
                    {payment.amount ? '+' + formatRM(payment.amount) : '-'}
                  </td>
                  <td className="px-4 py-2 border-r border-zinc-100 dark:border-zinc-800/50 text-right text-amber-600 dark:text-amber-500 font-medium font-mono text-sm">
                    {payment.mileageAmount ? '+' + formatRM(payment.mileageAmount) : '-'}
                  </td>
                  <td className="px-4 py-2 text-center flex justify-center gap-2">
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
                          const newHistory = record.paymentHistory.filter((p: any) => p.id !== payment.id);
                          const updatedRecord = {
                            ...record,
                            paymentHistory: newHistory,
                            bakiFeeTerkini: record.bakiFeeTerkini + payment.amount,
                            bakiMileage: record.bakiMileage + (payment.mileageAmount || 0),
                            bayaranTerakhir: newHistory.length > 0 ? newHistory[0].amount : 0
                          };
                          if (user) {
                            const targetPath = `users/${user.uid}/records/${record.id}`;
                            try {
                              await setDoc(doc(db, 'users', user.uid, 'records', record.id), updatedRecord);
                            } catch (err: any) {
                              handleFirestoreError(err, OperationType.WRITE, targetPath);
                            }
                          } else {
                            setRecords((prev: any) => prev.map((r: any) => r.id === record.id ? updatedRecord : r));
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
</div>
  );

  if (!authReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 size={36} className="text-blue-600 animate-spin" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Sila tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 p-8 flex flex-col items-center animate-fade-in">
          <div className="flex flex-col items-center gap-3 mb-8">
            <img src="https://arleta.site/interactivelink/2510/logo.png" className="h-16 w-auto" alt="Logo" />
            <div className="text-center">
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white uppercase leading-tight block">HAIRI MUSTAFA</span>
              <span className="font-bold text-[12px] tracking-widest text-blue-600 dark:text-blue-400 uppercase leading-none block mt-1">ASSOCIATES</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-3 max-w-[280px]">
              Sistem Pengurusan Rekod Pelanggan & Penerbitan Resit Peguam Syarie
            </p>
          </div>

          <div className="w-full space-y-4">
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium transition-all shadow-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.56,11.43 21.35,11.1z" fill="#4285F4" />
                  <path d="M12,20.58c2.43,0 4.47,-0.8 5.96,-2.2l-2.58,-2.02c-0.72,0.48 -1.64,0.77 -2.66,0.77 -2.05,0 -3.79,-1.38 -4.41,-3.24H2.43v2.66C3.91,19.22 7.71,20.58 12,20.58z" fill="#34A853" />
                  <path d="M7.59,13.89C7.43,13.4 7.34,12.88 7.34,12.34s0.09,-1.06 0.25,-1.55V8.13H2.43c-0.53,1.06 -0.83,2.25 -0.83,3.52s0.3,2.46 0.83,3.52l5.16,-4.28z" fill="#FBBC05" />
                  <path d="M12,6.72c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.47,4.09 14.43,3.3 12,3.3c-4.29,0 -8.09,1.36 -9.57,4.83l5.16,4.21c0.62,-1.86 2.36,-3.24 4.41,-3.24z" fill="#EA4335" />
                </g>
              </svg>
              <span>Log Masuk dengan Google</span>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
              Sila log masuk untuk mengakses data dan resit syarikat.
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">
              Hak Cipta Terpelihara &copy; {new Date().getFullYear()} Hairi Mustafa Associates
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-black font-sans overflow-hidden text-zinc-900 dark:text-zinc-100">
      
      {/* Sidebar for Desktop */}

      <aside className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-900 hidden md:flex flex-col z-30 shrink-0 print:hidden relative">
        <div className="h-16 flex items-center px-6 border-b border-zinc-100 dark:border-zinc-900 shrink-0">
          <div className="flex items-center gap-2">
            <img src="https://arleta.site/interactivelink/2510/logo.png" className="h-8 w-auto" alt="Logo" />
            <span className="font-bold text-[12px] tracking-tight text-zinc-900 dark:text-white uppercase leading-tight">HAIRI MUSTAFA <span className="text-blue-600 block">ASSOCIATES</span></span>
          </div>
        </div>
        
        <div className="px-6 py-5 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar mask-edges">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-800">
              <span className="font-bold text-zinc-600 dark:text-zinc-400">HM</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">Hairi Mustafa</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">Peguam Syarie</p>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mt-4 font-medium">Pengurusan Kes</div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}
          >
            Papan Pemuka
          </button>
          <button 
            onClick={() => { setActiveTab('records'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'records' ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}
          >
            Rekod Pelanggan
          </button>

          <button 
            onClick={() => { { setActiveTab('standalone'); setIsMobileMenuOpen(false); }; setStandaloneInitialRecord(null); }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'standalone' ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}
          >
            Paparan Resit
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-white dark:bg-zinc-950">
        {/* Top Bar */}
        <header className="h-16 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between px-4 sm:px-8 shrink-0 print:hidden z-10 bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">
              {activeTab === 'dashboard' ? 'Papan Pemuka' : activeTab === 'records' ? 'Rekod Pelanggan' : activeTab === 'settings' ? 'Tetapan' : 'Paparan Resit'}
            </h1>
          </div>
          <div className="flex items-center gap-3">

            {user && (
              <div className={"hidden md:flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border transition-colors " + (isOnline ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50" : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50")}>
                <div className={"w-1.5 h-1.5 rounded-full " + (isOnline ? "bg-emerald-500" : "bg-amber-500 animate-pulse")}></div>
                {isOnline ? 'Auto-Sync' : 'Offline'}
              </div>
            )}
            <button onClick={() => setDarkMode(!darkMode)}
 className="hidden sm:flex p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors" title={darkMode ? "Tukar ke Mod Siang" : "Tukar ke Mod Gelap"}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {!user ? (
              <button 
                onClick={handleLogin}
                className="hidden sm:flex p-2 sm:px-4 sm:py-2 text-sm bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 font-medium cursor-pointer flex items-center gap-2 shrink-0 transition-all">
                <LogIn size={14} />
                <span className="hidden sm:inline">Log Masuk</span>
              </button>
            ) : (
              <button 
                onClick={handleLogout}
                className="hidden sm:flex p-2 sm:px-4 sm:py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium cursor-pointer flex items-center gap-2 shrink-0 transition-all">
                <LogOut size={14} />
                <span className="hidden sm:inline">Log Keluar</span>
              </button>
            )}
            {isInstallable && (
              <button 
                onClick={handleInstallApp}
                className="hidden sm:flex p-2 sm:px-4 sm:py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium cursor-pointer flex items-center gap-2 shrink-0 transition-all">
                <Download size={14} />
                <span className="hidden sm:inline">Pasang</span>
              </button>
            )}
            {user && (
              <button 
                onClick={handleBackupToCloud}
                disabled={isBackingUp}
                className="hidden lg:flex p-2 sm:px-4 sm:py-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg font-medium cursor-pointer flex items-center gap-2 disabled:opacity-50 shrink-0 transition-all"
              >
                {isBackingUp ? <Loader2 size={14} className="animate-spin" /> : <CloudUpload size={14} />}
                <span className="hidden sm:inline">Cloud Backup</span>
              </button>
            )}
            <button 
              onClick={handleExportData}
              className="hidden lg:flex p-2 sm:px-4 sm:py-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium cursor-pointer shrink-0 transition-all">
              <Download size={14} />
              <span className="hidden sm:inline">Eksport</span>
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
              className="hidden lg:flex p-2 sm:px-4 sm:py-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium cursor-pointer shrink-0 transition-all">
              <Upload size={14} />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button 
              onClick={() => setIsNewRecordModalOpen(true)}
              className="p-2 sm:px-4 sm:py-2 text-sm bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 font-medium cursor-pointer flex items-center justify-center shrink-0 transition-all"
            >
              <Plus size={16} className="sm:hidden" />
              <span className="hidden sm:inline">+ Rekod Baru</span>
            </button>
          </div>
        </header>


        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <AnimatePresence mode="wait">
            {/* Settings Tab Content */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden min-h-0"
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-2 shrink-0 print:hidden">
                  <div className="flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Jumlah Kes</div>
                    <div className="text-3xl font-light tracking-tight text-zinc-800 dark:text-zinc-200">{stats.totalKes}</div>
                  </div>
                  
                  <div className="flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Total Fee</div>
                    <div className="text-3xl font-light tracking-tight text-zinc-800 dark:text-zinc-200">{formatRM(stats.totalFee)}</div>
                  </div>

                  <div className="flex flex-col gap-1 border-l-2 border-red-500 dark:border-red-500 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-red-500 dark:text-red-400">Baki Fee Terkini</div>
                    <div className="text-3xl font-light tracking-tight text-red-600 dark:text-red-500">{formatRM(stats.totalBakiTerkini)}</div>
                  </div>

                  <div className="flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Baki Mileage</div>
                    <div className="text-3xl font-light tracking-tight text-zinc-800 dark:text-zinc-200">{formatRM(stats.totalMileage)}</div>
                  </div>
                </div>
                <div className={`flex-1 px-4 sm:px-6 md:px-8 pb-20 sm:pb-6 md:pb-8 min-h-0 flex flex-col gap-6 print:hidden overflow-y-auto`}>
              <div className="flex flex-col gap-6 sm:hidden pb-10">
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                  <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Tetapan & Tindakan</h2>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">
                          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </div>
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{darkMode ? "Mod Siang" : "Mod Gelap"}</span>
                      </div>
                      <ChevronRight size={18} className="text-zinc-400" />
                    </button>
                    {!user ? (
                      <button onClick={handleLogin} className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">
                            <LogIn size={18} />
                          </div>
                          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Log Masuk</span>
                        </div>
                        <ChevronRight size={18} className="text-zinc-400" />
                      </button>
                    ) : (
                      <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg text-red-600 dark:text-red-400">
                            <LogOut size={18} />
                          </div>
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">Log Keluar</span>
                        </div>
                      </button>
                    )}
                    {isInstallable && (
                      <button onClick={handleInstallApp} className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">
                            <Download size={18} />
                          </div>
                          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Pasang Aplikasi</span>
                        </div>
                        <ChevronRight size={18} className="text-zinc-400" />
                      </button>
                    )}
                    {user && (
                      <button onClick={handleBackupToCloud} disabled={isBackingUp} className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors disabled:opacity-50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                            {isBackingUp ? <Loader2 size={18} className="animate-spin" /> : <CloudUpload size={18} />}
                          </div>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Cloud Backup</span>
                        </div>
                        <ChevronRight size={18} className="text-zinc-400" />
                      </button>
                    )}
                    <button onClick={handleExportData} className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">
                          <Download size={18} />
                        </div>
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Eksport Data CSV</span>
                      </div>
                      <ChevronRight size={18} className="text-zinc-400" />
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">
                          <Upload size={18} />
                        </div>
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Import Data CSV</span>
                      </div>
                      <ChevronRight size={18} className="text-zinc-400" />
                    </button>
                  </div>
                </div>
              </div>
                </div>
              </motion.div>
            )}
            {/* Main Dashboard Content */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden min-h-0"
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-2 shrink-0 print:hidden">
                  <div className="flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Jumlah Kes</div>
                    <div className="text-3xl font-light tracking-tight text-zinc-800 dark:text-zinc-200">{stats.totalKes}</div>
                  </div>
                  
                  <div className="flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Total Fee</div>
                    <div className="text-3xl font-light tracking-tight text-zinc-800 dark:text-zinc-200">{formatRM(stats.totalFee)}</div>
                  </div>

                  <div className="flex flex-col gap-1 border-l-2 border-red-500 dark:border-red-500 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-red-500 dark:text-red-400">Baki Fee Terkini</div>
                    <div className="text-3xl font-light tracking-tight text-red-600 dark:text-red-500">{formatRM(stats.totalBakiTerkini)}</div>
                  </div>

                  <div className="flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Baki Mileage</div>
                    <div className="text-3xl font-light tracking-tight text-zinc-800 dark:text-zinc-200">{formatRM(stats.totalMileage)}</div>
                  </div>
                </div>
                <div className={`flex-1 px-4 sm:px-6 md:px-8 pb-20 sm:pb-6 md:pb-8 min-h-0 flex flex-col gap-6 print:hidden overflow-y-auto`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0 w-full">
                {/* Recent Cases */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm p-6 overflow-hidden">
                   <div className="flex justify-between items-center mb-6">
                     <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight flex items-center gap-2">
                       <Clock size={16} className="text-blue-500" />
                       Kes Terkini
                     </h3>
                     <button 
                       onClick={() => { setActiveTab('records'); setIsMobileMenuOpen(false); }}
                       className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                     >
                       Lihat Semua
                     </button>
                   </div>
                   <div className="space-y-4">
                     {records.slice(-5).reverse().map(record => (
                       <div key={record.id} className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                         <div>
                           <p className="font-medium text-sm text-zinc-800 dark:text-zinc-200">{record.nama}</p>
                           <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{record.kes} &middot; {formatDateDMY(record.tarikh)}</p>
                         </div>
                         <div className="text-right">
                           <p className="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">{formatRM(record.bakiFeeTerkini)}</p>
                           <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Baki Fee</p>
                         </div>
                       </div>
                     ))}
                     {records.length === 0 && (
                       <p className="text-sm text-zinc-500 text-center py-4">Tiada rekod buat masa ini.</p>
                     )}
                   </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm p-6 overflow-hidden flex flex-col">
                   <div className="flex justify-between items-center mb-6">
                     <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight flex items-center gap-2">
                       <Zap size={16} className="text-blue-500" />
                       Tindakan Pantas
                     </h3>
                   </div>
                   <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1">
                     <button
                       onClick={() => setIsNewRecordModalOpen(true)}
                       className="p-5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left flex flex-col gap-4 group cursor-pointer h-full"
                     >
                       <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                         <Plus size={20} />
                       </div>
                       <div>
                         <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Rekod Baru</p>
                         <p className="hidden sm:block text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">Daftar pelanggan dan butiran kes baru ke dalam sistem.</p>
                       </div>
                     </button>
                     <button
                       onClick={() => { { setActiveTab('standalone'); setIsMobileMenuOpen(false); }; setStandaloneInitialRecord(null); }}
                       className="p-5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left flex flex-col gap-4 group cursor-pointer h-full"
                     >
                       <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                         <CreditCard size={20} />
                       </div>
                       <div>
                         <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Paparan Resit</p>
                         <p className="hidden sm:block text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">Jana resit pembayaran am tanpa memaut ke rekod kes sedia ada.</p>
                       </div>
                     </button>
                   </div>
                   
                   <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                     <div className="flex items-center justify-between mb-3">
                       <h4 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Bayaran Segera (Pelanggan Aktif Terkini)</h4>
                     </div>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['50', '100', '200', '500'].map(amount => (
                          <button
                            key={amount}
                            onClick={() => handleDirectPay(amount)}
                            className="py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-colors shadow-sm"
                          >
                            RM{amount}
                          </button>
                        ))}
                     </div>
                   </div>
                </div>
              </div>
                </div>
              </motion.div>
            )}

            {/* Main Data Table Area */}
            {activeTab === 'records' && (
              <motion.div
                key="records"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden min-h-0"
              >
                <div className={`flex-1 px-4 sm:px-6 md:px-8 pb-20 sm:pb-6 md:pb-8 pt-4 sm:pt-6 min-h-0 flex flex-col gap-6 print:hidden overflow-y-auto`}>
                  <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" />
                  Senarai Rekod Kes
                </span>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto">
                  {selectedRecords.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadSelectedReceiptsZIP}
                        disabled={isGeneratingZip}
                        className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 font-medium cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingZip ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                        {isGeneratingZip ? `Menjana ZIP...` : `Muat Turun Resit (${selectedRecords.length})`}
                      </button>
                      <button
                        onClick={() => setIsDeletingSelected(true)}
                        className="px-3 py-1.5 text-xs bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 font-medium cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        <Trash2 size={12} />
                        Padam Terpilih ({selectedRecords.length})
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={14} className="text-zinc-400" />
                    </div>
                    <input
                      type="text"
                      className="pl-9 pr-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg w-full sm:w-56 bg-white dark:bg-zinc-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-400"
                      placeholder="Cari nama pelanggan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Filter size={14} className="text-zinc-400" />
                    </div>
                    <select
                      className="pl-9 pr-8 py-2 appearance-none text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg w-full sm:w-40 bg-white dark:bg-zinc-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                      value={filterKes}
                      onChange={(e) => setFilterKes(e.target.value)}
                    >
                      {uniqueKes.map(kes => (
                        <option key={kes} value={kes}>{kes}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown size={14} className="text-zinc-400" />
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ArrowUpDown size={14} className="text-zinc-400" />
                    </div>
                    <select
                      className="pl-9 pr-8 py-2 appearance-none text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg w-full sm:w-44 bg-white dark:bg-zinc-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                      value={dateSortOrder || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'desc') setDateSortOrder('desc');
                        else if (val === 'asc') setDateSortOrder('asc');
                        else setDateSortOrder(null);
                      }}
                      title="Susun Mengikut Tarikh"
                    >
                      <option value="">Susunan Tarikh Asal</option>
                      <option value="desc">Tarikh: Terkini</option>
                      <option value="asc">Tarikh: Terlama</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown size={14} className="text-zinc-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="date"
                      className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg flex-1 sm:flex-none sm:w-36 bg-white dark:bg-zinc-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-zinc-700 dark:text-zinc-300 transition-all"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      title="Tarikh Mula"
                    />
                    <span className="text-zinc-400 text-sm font-medium px-1">-</span>
                    <input
                      type="date"
                      className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg flex-1 sm:flex-none sm:w-36 bg-white dark:bg-zinc-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-zinc-700 dark:text-zinc-300 transition-all"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      title="Tarikh Akhir"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-auto flex-1 bg-zinc-50/50 md:bg-white dark:bg-zinc-950/50 md:dark:bg-zinc-950 p-3 sm:p-4 md:p-0">
                {/* Mobile View: Cards */}
                <div className="md:hidden flex flex-col gap-3 pb-4">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <div key={record.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm relative flex flex-col transition-shadow hover:shadow-md cursor-pointer" onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}>
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex-1 pr-8">
                             <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{record.nama}</h4>
                             <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">{record.kes}</p>
                           </div>
                           <div className="absolute top-4 right-4 z-10">
                             <input 
                               type="checkbox" 
                               className="cursor-pointer rounded border-zinc-200 dark:border-zinc-700 w-4 h-4 text-blue-600 focus:ring-blue-500 transition-colors"
                               checked={selectedRecords.includes(record.id)}
                               onChange={(e) => {
                                 e.stopPropagation();
                                 if (e.target.checked) {
                                   setSelectedRecords([...selectedRecords, record.id]);
                                 } else {
                                   setSelectedRecords(selectedRecords.filter(id => id !== record.id));
                                 }
                               }}
                             />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-3 mt-3 mb-1 text-sm border-t border-zinc-100 dark:border-zinc-800/50 pt-3">
                           <div>
                             <span className="block text-zinc-400 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Baki Terkini</span>
                             <span className={`font-semibold ${record.bakiFeeTerkini > 2000 ? 'text-red-600 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                               {formatRM(record.bakiFeeTerkini)}
                             </span>
                           </div>
                           <div>
                             <span className="block text-zinc-400 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Mileage</span>
                             <span className="font-semibold text-amber-600 dark:text-amber-500">
                               {formatRM(record.bakiMileage)}
                             </span>
                           </div>
                           <div className="col-span-2 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800/50 pt-2">
                             <div>
                               <span className="block text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">Dikemaskini</span>
                               <span className="font-medium text-zinc-700 dark:text-zinc-300 text-xs">
                                 {formatDateDMY(record.tarikh)}
                               </span>
                             </div>
                             <div className="flex gap-1.5">
                               {record.bakiFeeTerkini === 0 ? (
                                 <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 font-sans">Selesai</span>
                               ) : (
                                 <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 font-sans">Belum</span>
                               )}
                             </div>
                           </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-wrap gap-2 w-full">
                           <button onClick={(e) => { e.stopPropagation(); setPaymentRecord(record); }} className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                             <Plus size={14} /> Bayaran
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); setMileageAdjustmentRecord(record); }} className="flex-1 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-600 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 dark:text-teal-400 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors border border-teal-200 dark:border-teal-800/50 cursor-pointer">
                             <Car size={14} /> ± Mileage
                           </button>
                           {record.bakiFeeTerkini > 0 && (
                             <button onClick={(e) => { e.stopPropagation(); setSettlingRecord(record); }} title="Set Baki Fee terus kepada RM0" className="p-1.5 px-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs font-medium border border-emerald-200 dark:border-emerald-800/50 shrink-0">
                               <CheckCircle size={14} /> Set RM0
                             </button>
                           )}
                           <button onClick={(e) => { e.stopPropagation(); setEditingRecord(record); }} className="p-1.5 px-2 text-zinc-500 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-lg dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400 transition-colors flex items-center justify-center">
                             <Edit size={16} />
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); setStatementRecord(record); }} className="p-1.5 px-2 text-zinc-500 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-lg dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400 transition-colors flex items-center justify-center">
                             <Printer size={16} />
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); setDeletingRecord(record); }} className="p-1.5 px-2 text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-lg dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center justify-center">
                             <Trash2 size={16} />
                           </button>
                        </div>
                        
                        <AnimatePresence>
                          {expandedRowId === record.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                               <div className="mt-4 pt-1 border-t border-zinc-100 dark:border-zinc-800 -mx-2 sm:-mx-4">
                                 {renderExpandedDetails(record)}
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm text-zinc-400 dark:text-zinc-500 font-medium">
                      Tiada rekod dijumpai.
                    </div>
                  )}
                </div>

                {/* Desktop View: Table */}
                <table className="hidden md:table w-full text-left border-collapse whitespace-nowrap">
                  <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900/50 z-10">
                    <tr className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-100 dark:border-zinc-800 tracking-wider">
                      <th className="px-3 sm:px-4 py-3 border-r border-zinc-100 dark:border-zinc-800 text-center w-12 flex justify-center items-center h-full">
                        <input 
                          type="checkbox" 
                          className="cursor-pointer rounded border-zinc-200 dark:border-zinc-700 w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 transition-colors"
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
                      <th 
                        className="px-3 sm:px-4 py-3 border-r border-zinc-100 dark:border-zinc-800 cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors group"
                        onClick={() => {
                          if (nameSortOrder === 'asc') {
                            setNameSortOrder('desc');
                          } else if (nameSortOrder === 'desc') {
                            setNameSortOrder(null);
                          } else {
                            setNameSortOrder('asc');
                            setDateSortOrder(null);
                          }
                        }}
                        title="Klik untuk susun mengikut nama (A-Z / Z-A)"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Nama Pelanggan</span>
                          {nameSortOrder === 'asc' ? (
                            <ArrowUp size={13} className="text-blue-600 dark:text-blue-400" />
                          ) : nameSortOrder === 'desc' ? (
                            <ArrowDown size={13} className="text-blue-600 dark:text-blue-400" />
                          ) : (
                            <ArrowUpDown size={13} className="text-zinc-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th className=" px-3 sm:px-4 py-3 border-r border-zinc-100 dark:border-zinc-800">Kategori Kes</th>
                      <th className=" px-3 sm:px-4 py-3 border-r border-zinc-100 dark:border-zinc-800">Nota Kes</th>
                      <th className=" px-3 sm:px-4 py-3 border-r border-zinc-100 dark:border-zinc-800 text-right">Total Fee</th>
                      <th className=" px-3 sm:px-4 py-3 border-r border-zinc-100 dark:border-zinc-800 text-right">Bayaran Terakhir</th>
                      <th 
                        className=" px-3 sm:px-4 py-3 border-r border-zinc-100 dark:border-zinc-800 text-center cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors group"
                        onClick={() => {
                          if (dateSortOrder === 'desc') {
                            setDateSortOrder('asc');
                          } else if (dateSortOrder === 'asc') {
                            setDateSortOrder(null);
                          } else {
                            setDateSortOrder('desc');
                            setNameSortOrder(null);
                          }
                        }}
                        title="Klik untuk susun mengikut tarikh (Terkini / Terlama)"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Tarikh</span>
                          {dateSortOrder === 'desc' ? (
                            <ArrowDown size={13} className="text-blue-600 dark:text-blue-400" />
                          ) : dateSortOrder === 'asc' ? (
                            <ArrowUp size={13} className="text-blue-600 dark:text-blue-400" />
                          ) : (
                            <ArrowUpDown size={13} className="text-zinc-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th className=" px-3 sm:px-4 py-3 border-r border-zinc-100 dark:border-zinc-800 text-right">Baki Sebelum</th>
                      <th className="px-3 sm:px-4 py-3 border-r border-zinc-100 dark:border-zinc-800 text-right">Baki Terkini</th>
                      <th className=" px-3 sm:px-4 py-3 border-r border-zinc-100 dark:border-zinc-800 text-right">Baki Mileage</th>
                      <th className="px-3 sm:px-4 py-3 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px]">
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
                              className={`border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors ${record.bakiFeeTerkini > 0 && index % 2 === 0 ? 'bg-zinc-50/50 dark:bg-zinc-900/30' : ''} ${record.bakiFeeTerkini > 2000 ? 'bg-amber-50/10 dark:bg-amber-900/10' : ''} ${expandedRowId === record.id ? 'bg-zinc-100/50 dark:bg-zinc-800/30' : ''}`}
                            >
                            <td className="px-3 sm:px-4 py-3 border-r border-zinc-100 dark:border-zinc-800/50">
                              <div className="flex items-center justify-center gap-2 font-mono text-zinc-400">
                                <input 
                                  type="checkbox" 
                                  className="cursor-pointer rounded border-zinc-200 dark:border-zinc-700 w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 mt-0.5"
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
                                  {expandedRowId === record.id ? <ChevronDown size={14} className="text-zinc-600 dark:text-zinc-400" /> : <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-600" />}
                                </span>
                                <span className="hidden sm:inline text-xs">{index + 1}</span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200 border-r border-zinc-100 dark:border-zinc-800/50 break-words md:truncate md:max-w-none max-w-[140px]">{record.nama}</td>
                            <td className=" px-3 sm:px-4 py-3 border-r border-zinc-100 dark:border-zinc-800/50">
                              <span className="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                {record.kes}
                              </span>
                            </td>
                            <td className=" px-3 sm:px-4 py-1.5 border-r border-zinc-100 dark:border-zinc-800/50" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="text" 
                                defaultValue={record.nota || ''}
                                placeholder="Catat nota..."
                                onBlur={(e) => handleInlineNoteUpdate(record.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="w-full min-w-[150px] bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-800 rounded px-2 py-1.5 text-[12px] text-zinc-700 dark:text-zinc-300 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none"
                              />
                            </td>
                            <td className=" px-3 sm:px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800/50 text-right">{formatRM(record.totalFee)}</td>
                            <td className=" px-3 sm:px-4 py-3 font-mono border-r border-zinc-100 dark:border-zinc-800/50 text-emerald-600 dark:text-emerald-500 text-right bg-emerald-50/50 dark:bg-emerald-900/10">
                              {record.bayaranTerakhir > 0 ? '+' : ''}{formatRM(record.bayaranTerakhir)}
                            </td>
                            <td className=" px-3 sm:px-4 py-3 border-r border-zinc-100 dark:border-zinc-800/50 text-center text-zinc-500 font-mono text-[11px]">{formatDateDMY(record.tarikh)}</td>
                            <td className=" px-3 sm:px-4 py-3 font-mono border-r border-zinc-100 dark:border-zinc-800/50 text-right text-zinc-400">{formatRM(record.bakiSebelum)}</td>
                            <td className="px-3 sm:px-4 py-3 border-r border-zinc-100 dark:border-zinc-800/50">
                              <div className="flex items-center justify-end gap-2 font-mono font-bold">
                                {record.bakiFeeTerkini <= 0 ? (
                                  <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 font-sans">Selesai</span>
                                ) : (
                                  <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 font-sans">Belum</span>
                                )}
                                <span className={record.bakiFeeTerkini > 2000 ? 'text-red-600 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-200'}>
                                  {formatRM(record.bakiFeeTerkini)}
                                </span>
                              </div>
                            </td>
                            <td className=" px-3 sm:px-4 py-3 font-mono border-r border-zinc-100 dark:border-zinc-800/50 text-right text-amber-600 dark:text-amber-500">
                              {formatRM(record.bakiMileage)}
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => setMileageAdjustmentRecord(record)}
                                  className="text-teal-700 dark:text-teal-300 bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border border-teal-200 dark:border-teal-800/50 flex items-center gap-1 shrink-0 shadow-sm cursor-pointer"
                                  title="Pelarasan Mileage (Kredit/Debit)"
                                >
                                  <Car size={13} className="text-teal-600 dark:text-teal-400" />
                                  <span>± Mileage</span>
                                </button>

                                {record.bakiFeeTerkini > 0 && (
                                  <button 
                                    onClick={() => setPaymentRecord(record)}
                                    className="text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border border-blue-200 dark:border-blue-800/50 flex items-center gap-1 shrink-0 shadow-sm cursor-pointer"
                                    title="Tambah Bayaran"
                                  >
                                    <Plus size={13} className="text-blue-600 dark:text-blue-400" />
                                    <span>+ Bayaran</span>
                                  </button>
                                )}

                                {record.bakiFeeTerkini > 0 && (
                                  <button 
                                    onClick={() => setSettlingRecord(record)}
                                    className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1 shrink-0 shadow-sm cursor-pointer"
                                    title="Set Baki Fee terus kepada RM0"
                                  >
                                    <CheckCircle size={13} className="text-emerald-600 dark:text-emerald-400" />
                                    <span>Set RM0</span>
                                  </button>
                                )}

                                <button 
                                  onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                                  className="text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm whitespace-nowrap flex items-center gap-1.5"
                                  title="Urus Rekod"
                                >
                                  {expandedRowId === record.id ? 'Tutup' : 'Urus'}
                                </button>

                                <button 
                                  onClick={() => setDeletingRecord(record)}
                                  className="text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg"
                                  title="Padam Pelanggan"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                          <AnimatePresence>
                            {expandedRowId === record.id && (
                              <motion.tr 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
                              >
                                <td colSpan={10} className="p-0 whitespace-normal">
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                      {renderExpandedDetails(record)}
                                  </motion.div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
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
              <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
                <div>Menunjukkan <span className="font-medium text-zinc-900 dark:text-zinc-100">{filteredRecords.length}</span> daripada <span className="font-medium text-zinc-900 dark:text-zinc-100">{records.length}</span> rekod</div>
                <div className="flex gap-2 hidden sm:flex">
                  <button className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors" disabled>Kembali</button>
                  <button className="px-3 py-1.5 border-none rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium shadow-sm">1</button>
                  <button className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors" disabled>Seterusnya</button>
                </div>
              </div>
            </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'standalone' && (
              <motion.div
                key="standalone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <StandaloneReceipts initialData={standaloneInitialRecord} user={user} db={db} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] box-content pb-safe bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around z-40">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}
          >
            <Home size={20} className={activeTab === 'dashboard' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">Utama</span>
          </button>
          <button 
            onClick={() => setActiveTab('records')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'records' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}
          >
            <FileText size={20} className={activeTab === 'records' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">Rekod</span>
          </button>
          <button 
            onClick={() => { setActiveTab('standalone'); setStandaloneInitialRecord(null); }}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'standalone' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}
          >
            <Printer size={20} className={activeTab === 'standalone' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">Resit</span>
          </button>
          <button 
            onClick={() => { setActiveTab('settings'); setStandaloneInitialRecord(null); }}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}
          >
            <Settings size={20} className={activeTab === 'settings' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">Tetapan</span>
          </button>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Edit size={18} className="text-amber-500" />
                  Edit Rekod Pelanggan
                </h3>
                <button onClick={() => setEditingRecord(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleEditRecordSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                      Nama Pelanggan / Entiti
                    </label>
                    <input
                      type="text"
                      required
                      className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100"
                      value={editingRecord.nama}
                      onChange={(e) => setEditingRecord({ ...editingRecord, nama: e.target.value })}
                      autoFocus
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                        Kategori Kes
                      </label>
                      <input
                        type="text"
                        required
                        className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100"
                        value={editingRecord.kes}
                        onChange={(e) => setEditingRecord({ ...editingRecord, kes: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                        Tarikh
                      </label>
                      <input
                        type="date"
                        required
                        className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100"
                        value={formatDateISO(editingRecord.tarikh)}
                        onChange={(e) => setEditingRecord({ ...editingRecord, tarikh: formatDateDMY(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                        Total Fee (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg font-mono text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100"
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
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">Baki fee akan dikira semula secara automatik</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                        Baki Mileage (RM)
                      </label>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button" 
                          onClick={() => setEditingRecord({...editingRecord, bakiMileage: Math.max(0, (editingRecord.bakiMileage || 0) - 50)})}
                          className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                          title="Tolak RM50"
                        >
                          -50
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg font-mono text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100 text-center"
                          value={editingRecord.bakiMileage}
                          onChange={(e) => setEditingRecord({ ...editingRecord, bakiMileage: parseFloat(e.target.value) || 0 })}
                        />
                        <button 
                          type="button" 
                          onClick={() => setEditingRecord({...editingRecord, bakiMileage: (editingRecord.bakiMileage || 0) + 50})}
                          className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                          title="Tambah RM50"
                        >
                          +50
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1.5">Gunakan butang untuk tambah/tolak, atau taip jumlah terus.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                      Nota / Ringkasan Kes
                    </label>
                    <textarea
                      className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100 resize-y min-h-[80px]"
                      placeholder="Masukkan nota tambahan (pilihan)"
                      value={editingRecord.nota || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, nota: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800/50 mt-6">
                    <button 
                      type="button"
                      onClick={() => setEditingRecord(null)}
                      className="px-5 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer rounded-lg hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md cursor-pointer shadow-sm"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={28} className="text-red-500 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg mb-3">Padam Rekod Terpilih</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed">
                  Adakah anda pasti untuk memadam <strong className="text-zinc-900 dark:text-zinc-100">{selectedRecords.length}</strong> rekod yang terpilih? Tindakan ini tidak boleh dikembalikan.
                </p>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => setIsDeletingSelected(false)}
                    className="px-5 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex-1"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleDeleteSelected}
                    className="px-5 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md cursor-pointer flex-1 shadow-sm"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={28} className="text-red-500 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg mb-3">Padam Rekod Kes</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed">
                  Adakah anda pasti untuk memadam rekod kes <strong className="text-zinc-900 dark:text-zinc-100">{deletingRecord.nama}</strong>? Tindakan ini tidak boleh dikembalikan.
                </p>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => setDeletingRecord(null)}
                    className="px-5 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex-1"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleDeleteRecord}
                    className="px-5 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md cursor-pointer flex-1 shadow-sm"
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
        {settlingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-900/30">
                  <CheckCircle size={30} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg mb-2">Pengesahan Set Baki Fee RM0</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
                  Adakah anda pasti untuk menetapkan baki fee bagi pelanggan <strong className="text-zinc-900 dark:text-zinc-100">{settlingRecord.nama}</strong> ({settlingRecord.kes}) daripada <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatRM(settlingRecord.bakiFeeTerkini)}</span> terus kepada <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">RM0.00</span>?
                </p>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => setSettlingRecord(null)}
                    className="px-5 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex-1"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSettleBakiFeeToZero}
                    className="px-5 py-2.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md cursor-pointer flex-1 shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={16} />
                    Ya, Set RM0
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNewRecordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Users size={18} className="text-blue-500" />
                  Rekod Pelanggan Baru
                </h3>
                <button onClick={() => setIsNewRecordModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleAddNewRecord} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                      Nama Pelanggan / Entiti
                    </label>
                    <input
                      type="text"
                      required
                      className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100"
                      placeholder="Contoh: Ali bin Abu"
                      value={newRecordData.nama}
                      onChange={(e) => setNewRecordData({ ...newRecordData, nama: e.target.value })}
                      autoFocus
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                        Kategori Kes
                      </label>
                      <input
                        type="text"
                        required
                        className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100"
                        placeholder="Contoh: Saman Sivil"
                        value={newRecordData.kes}
                        onChange={(e) => setNewRecordData({ ...newRecordData, kes: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                        Tarikh
                      </label>
                      <input
                        type="date"
                        required
                        className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100"
                        value={newRecordData.tarikh}
                        onChange={(e) => setNewRecordData({ ...newRecordData, tarikh: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                        Total Fee (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg font-mono text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100"
                        placeholder="0.00"
                        value={newRecordData.totalFee}
                        onChange={(e) => setNewRecordData({ ...newRecordData, totalFee: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                        Baki Mileage (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg font-mono text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100"
                        placeholder="0.00"
                        value={newRecordData.bakiMileage}
                        onChange={(e) => setNewRecordData({ ...newRecordData, bakiMileage: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                      Nota / Ringkasan Kes
                    </label>
                    <textarea
                      className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100 resize-y min-h-[60px]"
                      placeholder="Masukkan nota tambahan (pilihan)"
                      value={newRecordData.nota || ''}
                      onChange={(e) => setNewRecordData({ ...newRecordData, nota: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800/50 mt-6">
                    <button 
                      type="button"
                      onClick={() => setIsNewRecordModalOpen(false)}
                      className="px-5 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer rounded-lg hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md cursor-pointer shadow-sm"
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
        {mileageAdjustmentRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Car size={18} className="text-teal-500" />
                  Pelarasan Mileage
                </h3>
                <button onClick={() => setMileageAdjustmentRecord(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-5 p-4 rounded-lg bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Baki Semasa (Mileage):</span>
                    <span className="font-mono font-bold text-teal-700 dark:text-teal-400">{formatRM(mileageAdjustmentRecord.bakiMileage || 0)}</span>
                  </div>
                </div>
                
                <form onSubmit={handleMileageAdjustmentSubmit} className="space-y-5">
                  <div className="flex rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                    <button 
                      type="button" 
                      onClick={() => setMileageAdjustmentType('tambah')}
                      className={`flex-1 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${mileageAdjustmentType === 'tambah' ? 'bg-teal-500 text-white shadow-sm' : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                      Tambah (+)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setMileageAdjustmentType('tolak')}
                      className={`flex-1 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-l border-zinc-200 dark:border-zinc-800 ${mileageAdjustmentType === 'tolak' ? 'bg-teal-500 text-white border-transparent shadow-sm' : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                      Tolak (-)
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                      Jumlah Pelarasan (RM)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-zinc-500 dark:text-zinc-400 font-mono text-sm">RM</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        className="pl-10 pr-4 py-2.5 w-full border border-zinc-200 dark:border-zinc-800 focus:ring-teal-500/20 focus:border-teal-500 rounded-lg font-mono text-lg focus:outline-none focus:ring-2 transition-all font-medium text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950"
                        placeholder="0.00"
                        value={mileageAdjustmentAmount}
                        onChange={(e) => setMileageAdjustmentAmount(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setMileageAdjustmentRecord(null)}
                      className="px-5 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer rounded-lg hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md cursor-pointer shadow-sm"
                    >
                      Simpan
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {paymentRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-500" />
                  Kemaskini Bayaran
                </h3>
                <button onClick={() => setPaymentRecord(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 space-y-2">
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
                
                <form onSubmit={handleUpdatePayment} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
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
                        className={`pl-10 pr-4 py-2.5 w-full border ${paymentError ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:ring-blue-500/20 focus:border-blue-500'} rounded-lg font-mono text-lg focus:outline-none focus:ring-2 transition-all font-medium text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950`}
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
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
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
                          className={`pl-10 pr-4 py-2.5 w-full border ${paymentError ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:ring-blue-500/20 focus:border-blue-500'} rounded-lg font-mono text-lg focus:outline-none focus:ring-2 transition-all font-medium text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950`}
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
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                      Tarikh Bayaran
                    </label>
                    <input
                      type="date"
                      required
                      className="pl-3 pr-4 py-2.5 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                      Kaedah Bayaran
                    </label>
                    <div className="relative">
                      <select
                        required
                        className="pl-3 pr-8 py-2.5 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100 appearance-none"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Transfer">Transfer</option>
                        <option value="QR">QR</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={14} className="text-zinc-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                      Nota Bayaran
                    </label>
                    <input
                      type="text"
                      className="pl-3 pr-4 py-2.5 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100"
                      placeholder="Contoh: Bayaran pendahuluan, ansuran ke-2, dll."
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800/50 mt-6">
                    <button 
                      type="button" 
                      onClick={() => setPaymentRecord(null)}
                      className="px-5 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer rounded-lg hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:static print:bg-white print:p-0 print:block">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-3xl max-h-screen overflow-hidden flex flex-col print:shadow-none print:border-none print:max-h-none print:w-full print:max-w-none print:overflow-visible print:block"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 print:hidden">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Printer size={18} className="text-zinc-600 dark:text-zinc-400" />
                  Pratinjau Penyata
                </h3>
                <button onClick={() => setStatementRecord(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>
 
 <div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-white print:p-0 print:overflow-visible print:block">
 {/* Printable Area Starts */}
 <div ref={printRef} className="w-full min-w-[700px] mx-auto font-sans text-black bg-white print:min-w-0 print:w-full print:p-0">
 {/* Header */}
 <div className="flex items-center pb-6 border-b-2 border-black mb-8 gap-6">
 <img src="https://arleta.site/interactivelink/2510/logo.png" className="h-[75px] w-auto" alt="Logo" />
 <div className="flex-1">
 <h1 className="text-[18px] font-bold uppercase m-0 leading-tight">TETUAN HAIRI MUSTAFA & ASSOCIATES</h1>
 <p className="text-[11px] font-bold italic m-0 mt-0.5 text-[#222]">PEGUAM SYARIE * PESURUHJAYA SUMPAH</p>
 <div className="text-[11px] mt-1 leading-[1.3]">
 <p className="m-0">LOT 02, BANGUNAN ARKED MARA, 09100 BALING, KEDAH</p>
 <p className="m-0">TEL: 010-2434143 / 011-56531310 | EMAIL: tetuanhairi@gmail.com</p>
 </div>
 </div>
 <div className="text-right whitespace-nowrap">
 <h2 className="text-2xl font-bold tracking-tight uppercase mb-1">Penyata Akaun</h2>
 <p className="text-[13px] font-mono mt-1">Ref: {statementRecord.id}</p>
 <p className="text-[13px] font-mono">Tarikh: {formatDateDMY(new Date().toISOString().split('T')[0])}</p>
 </div>
 </div>

 {/* Client Info */}
 <div className="flex justify-between items-start text-sm mb-10 bg-white p-6  border border-gray-300 ">
 <div>
 <p className="text-xs font-bold text-black uppercase tracking-wider mb-2">Kepada</p>
 <p className="font-bold text-black text-lg mb-1">{statementRecord.nama}</p>
 <p className="text-black font-medium">Kategori Kes: {statementRecord.kes}</p>
 </div>
 <div className="text-right">
 <p className="text-xs font-bold text-black uppercase tracking-wider mb-2">Ringkasan Baki</p>
 <p className="text-3xl font-bold font-mono text-black ">{formatRM(statementRecord.bakiFeeTerkini)}</p>
 <p className="text-black font-medium text-xs mt-1">Jumlah Perlu Dibayar</p>
 </div>
 </div>

 {/* Cost Breakdown */}
 <div className="mb-10">
 <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-4 border-b border-gray-300 pb-2">Perincian Kos & Tuntutan</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="p-5 border border-gray-300  bg-white ">
 <p className="text-xs font-bold text-black uppercase tracking-wider mb-3 border-b border-gray-300 pb-2">Yuran Profesional</p>
 <div className="flex justify-between items-center space-y-2">
 <span className="text-sm font-medium text-black ">Jumlah Yuran Keseluruhan</span>
 <span className="font-mono font-bold text-black ">{formatRM(statementRecord.totalFee)}</span>
 </div>
 </div>
 <div className="p-5 border border-gray-300  bg-white ">
 <p className="text-xs font-bold text-black uppercase tracking-wider mb-3 border-b border-gray-300 pb-2">Tuntutan Perjalanan</p>
 <div className="flex justify-between items-center space-y-2">
 <span className="text-sm font-medium text-black ">Tuntutan Mileage</span>
 <span className="font-mono font-bold text-amber-600">{formatRM(statementRecord.bakiMileage)}</span>
 </div>
 </div>
 </div>
 </div>

 {/* Summary Table */}
 <div className="mb-10">
 <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-4 border-b border-gray-300 pb-2">Ringkasan Yuran</h3>
 <div className="border border-gray-300  overflow-x-auto print:overflow-visible">
 <table className="w-full text-sm min-w-[300px]">
 <tbody className="divide-y divide-gray-300 ">
 <tr className="hover:bg-white transition-colors">
 <td className="py-4 px-5 text-black font-medium whitespace-nowrap w-2/3">Jumlah Yuran Keseluruhan</td>
 <td className="py-4 px-5 text-right font-mono font-bold text-black ">{formatRM(statementRecord.totalFee)}</td>
 </tr>
 <tr className="hover:bg-white transition-colors bg-gray-100 ">
 <td className="py-4 px-5 text-black font-medium">Baki Mileage / Tuntutan Perjalanan</td>
 <td className="py-4 px-5 text-right font-mono text-amber-600 font-medium">{formatRM(statementRecord.bakiMileage)}</td>
 </tr>
 {statementRecord.paymentHistory && statementRecord.paymentHistory.length > 0 && (
 <>
 <tr className="hover:bg-white transition-colors bg-gray-100 ">
 <td className="py-4 px-5 text-black font-medium">Jumlah Pembayaran Diterima (Fee)</td>
 <td className="py-4 px-5 text-right font-mono text-emerald-600 font-medium">
 -{formatRM(statementRecord.paymentHistory.reduce((acc, curr) => acc + (curr.amount || 0), 0))}
 </td>
 </tr>
 {statementRecord.paymentHistory.some(p => (p.mileageAmount || 0) > 0) && (
 <tr className="hover:bg-white transition-colors bg-gray-100 border-t border-gray-300 ">
 <td className="py-4 px-5 text-black font-medium">Jumlah Pembayaran Diterima (Mileage)</td>
 <td className="py-4 px-5 text-right font-mono text-emerald-600 font-medium">
 -{formatRM(statementRecord.paymentHistory.reduce((acc, curr) => acc + (curr.mileageAmount || 0), 0))}
 </td>
 </tr>
 )}
 </>
 )}
 <tr className="bg-gray-200 text-black">
 <td className="py-3 px-5 font-bold text-sm tracking-wide">BAKI TERKINI (FEE)</td>
 <td className="py-3 px-5 text-right font-mono font-bold text-lg">{formatRM(statementRecord.bakiFeeTerkini)}</td>
 </tr>
 <tr className="bg-gray-200 text-black border-t border-gray-300">
 <td className="py-3 px-5 font-bold text-sm tracking-wide">BAKI TERKINI (MILEAGE)</td>
 <td className="py-3 px-5 text-right font-mono font-bold text-lg">{formatRM(statementRecord.bakiMileage || 0)}</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 {/* Payment History */}
 <div>
 <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-4 border-b border-gray-300 pb-2">Rekod Pembayaran</h3>
 {statementRecord.paymentHistory && statementRecord.paymentHistory.length > 0 ? (
 <div className="border border-gray-300  overflow-x-auto print:overflow-visible">
 <table className="w-full text-sm text-left min-w-[500px]">
 <thead className="bg-white border-b border-gray-300 ">
 <tr>
 <th className="py-3 px-5 font-semibold text-black ">Tarikh</th>
 <th className="py-3 px-5 font-semibold text-black ">No. Rujukan</th>
 <th className="py-3 px-5 font-semibold text-black ">Kaedah</th>
 <th className="py-3 px-5 font-semibold text-black text-right">Fee (RM)</th>
 <th className="py-3 px-5 font-semibold text-black text-right">Mileage (RM)</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-300 ">
 {statementRecord.paymentHistory.map((payment) => (
 <tr key={payment.id} className="hover:bg-white transition-colors">
 <td className="py-3 px-5 text-black ">{formatDateDMY(payment.date)}</td>
 <td className="py-3 px-5 text-black font-mono text-xs">{payment.id}</td>
 <td className="py-3 px-5 text-black ">{payment.method}</td>
 <td className="py-3 px-5 text-right font-mono font-medium text-emerald-600">{formatRM(payment.amount || 0)}</td>
 <td className="py-3 px-5 text-right font-mono font-medium text-emerald-600">{formatRM(payment.mileageAmount || 0)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="text-center p-8 border border-dashed border-gray-300  bg-white text-black text-sm">
 Tiada rekod pembayaran didapati untuk akaun ini.
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="pt-16 mt-16 text-xs text-center text-black border-t border-gray-300 ">
 <p className="font-medium text-black text-sm mb-2">Terima kasih atas urusan bersama kami.</p>
                    <p>Penyata rasmi ini merupakan janaan komputer dan sah tanpa tandatangan fizikal.</p>
                    <p>Sila kemukakan sebarang pertanyaan mengenai penyata ini dalam tempoh 14 hari dari tarikh dikeluarkan.</p>
                  </div>
                </div>
                {/* Printable Area Ends */}
              </div>

              <div className="p-5 border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3 print:hidden">
                <button 
                  onClick={() => setStatementRecord(null)}
                  className="px-5 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100/50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Tutup
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-5 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  <Printer size={16} className="text-zinc-500" />
                  Cetak
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md cursor-pointer shadow-sm"
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

      {/* Simple Statement Modal & Print Layout */}
      <AnimatePresence>
        {simpleStatementRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:static print:bg-white print:p-0 print:block">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-3xl max-h-screen overflow-hidden flex flex-col print:shadow-none print:border-none print:max-h-none print:w-full print:max-w-none print:overflow-visible print:block"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 print:hidden">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Printer size={18} className="text-zinc-600 dark:text-zinc-400" />
                  Pratinjau Penyata Ringkas
                </h3>
                <button onClick={() => setSimpleStatementRecord(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-white print:p-0 print:overflow-visible print:block">
                {/* Printable Area Starts */}
                <div ref={simplePrintRef} className="w-full min-w-[700px] mx-auto font-sans text-black bg-white print:min-w-0 print:w-full print:p-0">
                  
                  {/* Header */}
                  <div className="flex items-center pb-6 border-b-2 border-black mb-8 gap-6">
                    <img src="https://arleta.site/interactivelink/2510/logo.png" className="h-[75px] w-auto" alt="Logo" />
                    <div className="flex-1">
                      <h1 className="text-[18px] font-bold uppercase m-0 leading-tight">TETUAN HAIRI MUSTAFA & ASSOCIATES</h1>
                      <p className="text-[11px] font-bold italic m-0 mt-0.5 text-[#222]">PEGUAM SYARIE * PESURUHJAYA SUMPAH</p>
                      <div className="text-[11px] mt-1 leading-[1.3]">
                        <p className="m-0">LOT 02, BANGUNAN ARKED MARA, 09100 BALING, KEDAH</p>
                        <p className="m-0">TEL: 010-2434143 / 011-56531310 | EMAIL: tetuanhairi@gmail.com</p>
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <h2 className="text-2xl font-bold tracking-tight uppercase mb-1">Penyata Ringkas</h2>
                      <p className="text-[13px] font-mono mt-1">Ref: {simpleStatementRecord.id}</p>
                      <p className="text-[13px] font-mono">Tarikh: {formatDateDMY(new Date().toISOString().split('T')[0])}</p>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="flex justify-between items-start text-sm mb-10 bg-white p-6 border border-gray-300">
                    <div>
                      <p className="text-xs font-bold text-black uppercase tracking-wider mb-2">Kepada</p>
                      <p className="font-bold text-black text-lg mb-1">{simpleStatementRecord.nama}</p>
                      <p className="text-black font-medium">Kategori Kes: {simpleStatementRecord.kes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-black uppercase tracking-wider mb-2">Baki Terkini</p>
                      <p className="text-3xl font-bold font-mono text-black">{formatRM(simpleStatementRecord.bakiFeeTerkini)}</p>
                      <p className="text-black font-medium text-xs mt-1">
                        Tarikh Terakhir Bayaran: {simpleStatementRecord.paymentHistory && simpleStatementRecord.paymentHistory.length > 0 
                          ? formatDateDMY([...simpleStatementRecord.paymentHistory].sort((a: any, b: any) => parseDateObj(b.date).getTime() - parseDateObj(a.date).getTime())[0].date)
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Payment History */}
                  <div>
                    <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-4 border-b border-gray-300 pb-2">Senarai Sejarah Bayaran</h3>
                    {simpleStatementRecord.paymentHistory && simpleStatementRecord.paymentHistory.length > 0 ? (
                      <div className="border border-gray-300 overflow-x-auto print:overflow-visible">
                        <table className="w-full text-sm text-left min-w-[500px]">
                          <thead className="bg-white border-b border-gray-300">
                            <tr>
                              <th className="py-3 px-5 font-semibold text-black">Tarikh</th>
                              <th className="py-3 px-5 font-semibold text-black">No. Rujukan</th>
                              <th className="py-3 px-5 font-semibold text-black">Kaedah</th>
                              <th className="py-3 px-5 font-semibold text-black text-right">Fee (RM)</th>
                              <th className="py-3 px-5 font-semibold text-black text-right">Mileage (RM)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-300">
                            {[...simpleStatementRecord.paymentHistory]
                              .sort((a: any, b: any) => parseDateObj(a.date).getTime() - parseDateObj(b.date).getTime())
                              .map((payment) => (
                              <tr key={payment.id} className="hover:bg-white transition-colors">
                                <td className="py-3 px-5 text-black">{formatDateDMY(payment.date)}</td>
                                <td className="py-3 px-5 text-black font-mono text-xs">{payment.id}</td>
                                <td className="py-3 px-5 text-black">{payment.method}</td>
                                <td className="py-3 px-5 text-right font-mono font-medium text-emerald-600">
                                  {formatRM(payment.amount || 0)}
                                </td>
                                <td className="py-3 px-5 text-right font-mono font-medium text-amber-600">
                                  {formatRM(payment.mileageAmount || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500 border border-gray-300 bg-gray-50">
                        Tiada rekod bayaran buat masa ini.
                      </div>
                    )}
                  </div>
                  
                </div>
                {/* Printable Area Ends */}
              </div>

              <div className="p-5 border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3 print:hidden">
                <button 
                  onClick={() => setSimpleStatementRecord(null)}
                  className="px-5 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100/50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Tutup
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-5 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  <Printer size={16} className="text-zinc-500" />
                  Cetak
                </button>
                <button 
                  onClick={handleDownloadSimplePDF}
                  disabled={isGeneratingSimplePDF}
                  className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md cursor-pointer shadow-sm"
                >
                  {isGeneratingSimplePDF ? (
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:static print:bg-white print:p-0 print:block">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:max-h-none print:w-full print:max-w-none print:overflow-visible print:block"
            >
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/50 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8  bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                    <Printer size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Cetak Resit</h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono tracking-wider">REF: {receiptData.payment.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setReceiptData(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
 
 <div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-white print:p-0 print:overflow-visible print:block">
 {/* Printable Area Starts */}
                <div ref={receiptPrintRef} className="w-full min-w-[700px] mx-auto font-sans text-black bg-white print:min-w-0 print:w-full print:p-0">
                  {/* Header */}
                  <div className="flex items-center pb-6 border-b-2 border-black mb-8 gap-6">
                    <img src="https://arleta.site/interactivelink/2510/logo.png" className="h-[75px] w-auto" alt="Logo" />
                    <div className="flex-1">
                      <h1 className="text-[18px] font-bold uppercase m-0 leading-tight">TETUAN HAIRI MUSTAFA & ASSOCIATES</h1>
                      <p className="text-[11px] font-bold italic m-0 mt-0.5 text-[#222]">PEGUAM SYARIE * PESURUHJAYA SUMPAH</p>
                      <div className="text-[11px] mt-1 leading-[1.3]">
                        <p className="m-0">LOT 02, BANGUNAN ARKED MARA, 09100 BALING, KEDAH</p>
                        <p className="m-0">TEL: 010-2434143 / 011-56531310 | EMAIL: tetuanhairi@gmail.com</p>
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <h2 className="text-2xl font-bold tracking-tight uppercase mb-1">Resit Rasmi</h2>
                      <p className="text-[13px] font-mono mt-1">Ref: {receiptData.payment.id}</p>
                      <p className="text-[13px] font-mono">Tarikh: {formatDateDMY(receiptData.payment.date)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-start mb-8 text-sm">
                    <div>
                      <p className="font-bold uppercase tracking-wider text-black mb-1">Diterima Daripada:</p>
                      <p className="font-bold text-[16px] text-black uppercase mb-1">{receiptData.record.nama}</p>
                      <p className="text-black font-medium">Kategori Kes: {receiptData.record.kes}</p>
                    </div>
                  </div>

                  <div className="border-t-[3px] border-b-[3px] border-gray-300 mb-8">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b-2 border-gray-300 ">
 <th className="py-3 px-4 font-bold text-left uppercase">Item / Perkara</th>
 <th className="py-3 px-4 font-bold text-right uppercase w-[200px] border-l-2 border-gray-300 ">Jumlah (RM)</th>
 </tr>
 </thead>
 <tbody>
 {(receiptData.payment.amount > 0 || (receiptData.payment.amount === 0 && !receiptData.payment.mileageAmount)) && (
 <tr>
 <td className="py-4 px-4 font-medium text-black uppercase">FEE {formatDateDMY(receiptData.payment.date)}</td>
 <td className="py-4 px-4 font-mono font-medium text-right border-l-2 border-gray-300 ">{receiptData.payment.amount.toFixed(2)}</td>
 </tr>
 )}
 {!!receiptData.payment.mileageAmount && receiptData.payment.mileageAmount > 0 && (
 <tr>
 <td className="py-4 px-4 font-medium text-black uppercase">MILEAGE {formatDateDMY(receiptData.payment.date)}</td>
 <td className="py-4 px-4 font-mono font-medium text-right border-l-2 border-gray-300 ">{receiptData.payment.mileageAmount.toFixed(2)}</td>
 </tr>
 )}
 {(receiptData.payment.amount > 0 && !!receiptData.payment.mileageAmount && receiptData.payment.mileageAmount > 0) && (
 <tr className="border-t-2 border-gray-300 bg-white ">
 <td className="py-4 px-4 font-bold text-black text-right uppercase">JUMLAH KESELURUHAN (RM)</td>
 <td className="py-4 px-4 font-mono font-bold text-right border-l-2 border-gray-300 ">{(receiptData.payment.amount + receiptData.payment.mileageAmount).toFixed(2)}</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 <div className="flex justify-between items-start border-b border-gray-300 pb-12 mb-12">
 <div className="text-sm font-bold text-black uppercase flex flex-col gap-2 text-left">
   <div>Butiran Kes: <span className="underline underline-offset-4">{receiptData.record.kes}</span></div>
   {receiptData.payment.nota && (
     <div className="mt-2 normal-case font-normal text-zinc-600 text-[13px] text-left">
       <span className="font-bold uppercase text-black text-[11px] block mb-0.5">Nota Bayaran:</span>
       <span className="italic bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 inline-block text-zinc-700 font-mono">{receiptData.payment.nota}</span>
     </div>
   )}
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
 <div className="text-sm font-bold text-black flex justify-end gap-12">
 <span>JUMLAH BAYARAN (FEE):</span>
 <span className="w-32">RM {receiptData.payment.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
 </div>
 <div className="text-sm font-bold text-black flex justify-end gap-12">
 <span>BAKI TERDAHULU (FEE):</span>
 <span className="w-32">RM {bakiTerdahuluFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
 </div>
 <div className="text-sm font-bold text-black flex justify-end gap-12 pt-3 border-t border-gray-300 mb-4">
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

              <div className="p-5 border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3 print:hidden">
                <button 
                  onClick={() => setReceiptData(null)}
                  className="px-5 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100/50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Tutup
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-5 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  <Printer size={16} className="text-zinc-500" />
                  Cetak
                </button>
                <button 
                  onClick={handleDownloadReceiptPDF}
                  disabled={isGeneratingReceiptPDF}
                  className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md cursor-pointer"
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
      {/* Hidden PDF renderer for ZIP generation */}
      {zipQueue && zipCurrentIndex < zipQueue.length && zipQueue[zipCurrentIndex] && (
        <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden w-[800px]">
          <div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-white print:p-0 print:overflow-visible print:block">
            <div ref={hiddenReceiptPrintRef} className="w-full min-w-[700px] mx-auto font-sans text-black bg-white print:min-w-0 print:w-full print:p-0">
                  {/* Header */}
                  <div className="flex items-center pb-6 border-b-2 border-black mb-8 gap-6">
                    <img src="https://arleta.site/interactivelink/2510/logo.png" className="h-[75px] w-auto" alt="Logo" />
                    <div className="flex-1">
                      <h1 className="text-[18px] font-bold uppercase m-0 leading-tight">TETUAN HAIRI MUSTAFA & ASSOCIATES</h1>
                      <p className="text-[11px] font-bold italic m-0 mt-0.5 text-[#222]">PEGUAM SYARIE * PESURUHJAYA SUMPAH</p>
                      <div className="text-[11px] mt-1 leading-[1.3]">
                        <p className="m-0">LOT 02, BANGUNAN ARKED MARA, 09100 BALING, KEDAH</p>
                        <p className="m-0">TEL: 010-2434143 / 011-56531310 | EMAIL: tetuanhairi@gmail.com</p>
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <h2 className="text-2xl font-bold tracking-tight uppercase mb-1">Resit Rasmi</h2>
                      <p className="text-[13px] font-mono mt-1">Ref: {zipQueue[zipCurrentIndex].payment.id}</p>
                      <p className="text-[13px] font-mono">Tarikh: {formatDateDMY(zipQueue[zipCurrentIndex].payment.date)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-start mb-8 text-sm">
                    <div>
                      <p className="font-bold uppercase tracking-wider text-black mb-1">Diterima Daripada:</p>
                      <p className="font-bold text-[16px] text-black uppercase mb-1">{zipQueue[zipCurrentIndex].record.nama}</p>
                      <p className="text-black font-medium">Kategori Kes: {zipQueue[zipCurrentIndex].record.kes}</p>
                    </div>
                  </div>

                  <div className="border-t-[3px] border-b-[3px] border-gray-300 mb-8">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b-2 border-gray-300 ">
 <th className="py-3 px-4 font-bold text-left uppercase">Item / Perkara</th>
 <th className="py-3 px-4 font-bold text-right uppercase w-[200px] border-l-2 border-gray-300 ">Jumlah (RM)</th>
 </tr>
 </thead>
 <tbody>
 {(zipQueue[zipCurrentIndex].payment.amount > 0 || (zipQueue[zipCurrentIndex].payment.amount === 0 && !zipQueue[zipCurrentIndex].payment.mileageAmount)) && (
 <tr>
 <td className="py-4 px-4 font-medium text-black uppercase">FEE {formatDateDMY(zipQueue[zipCurrentIndex].payment.date)}</td>
 <td className="py-4 px-4 font-mono font-medium text-right border-l-2 border-gray-300 ">{zipQueue[zipCurrentIndex].payment.amount.toFixed(2)}</td>
 </tr>
 )}
 {!!zipQueue[zipCurrentIndex].payment.mileageAmount && zipQueue[zipCurrentIndex].payment.mileageAmount > 0 && (
 <tr>
 <td className="py-4 px-4 font-medium text-black uppercase">MILEAGE {formatDateDMY(zipQueue[zipCurrentIndex].payment.date)}</td>
 <td className="py-4 px-4 font-mono font-medium text-right border-l-2 border-gray-300 ">{zipQueue[zipCurrentIndex].payment.mileageAmount.toFixed(2)}</td>
 </tr>
 )}
 {(zipQueue[zipCurrentIndex].payment.amount > 0 && !!zipQueue[zipCurrentIndex].payment.mileageAmount && zipQueue[zipCurrentIndex].payment.mileageAmount > 0) && (
 <tr className="border-t-2 border-gray-300 bg-white ">
 <td className="py-4 px-4 font-bold text-black text-right uppercase">JUMLAH KESELURUHAN (RM)</td>
 <td className="py-4 px-4 font-mono font-bold text-right border-l-2 border-gray-300 ">{(zipQueue[zipCurrentIndex].payment.amount + zipQueue[zipCurrentIndex].payment.mileageAmount).toFixed(2)}</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 <div className="flex justify-between items-start border-b border-gray-300 pb-12 mb-12">
 <div className="text-sm font-bold text-black uppercase flex flex-col gap-2 text-left">
   <div>Butiran Kes: <span className="underline underline-offset-4">{zipQueue[zipCurrentIndex].record.kes}</span></div>
   {zipQueue[zipCurrentIndex].payment.nota && (
     <div className="mt-2 normal-case font-normal text-zinc-600 text-[13px] text-left">
       <span className="font-bold uppercase text-black text-[11px] block mb-0.5">Nota Bayaran:</span>
       <span className="italic bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 inline-block text-zinc-700 font-mono">{zipQueue[zipCurrentIndex].payment.nota}</span>
     </div>
   )}
 </div>
 {(()=>{
 const sortedPayments = [...(zipQueue[zipCurrentIndex].record.paymentHistory || [])].sort((a, b) => parseDateString(a.date) - parseDateString(b.date));
 const paymentIndex = sortedPayments.findIndex(p => p.id === zipQueue[zipCurrentIndex].payment.id);
 const paymentsAfter = sortedPayments.slice(paymentIndex + 1);

 const sumAfterFee = paymentsAfter.reduce((sum, p) => sum + (p.amount || 0), 0);
 const bakiTerkiniFee = zipQueue[zipCurrentIndex].record.bakiFeeTerkini + sumAfterFee;
 const bakiTerdahuluFee = bakiTerkiniFee + (zipQueue[zipCurrentIndex].payment.amount || 0);

 const hasMileageReceipt = !!zipQueue[zipCurrentIndex].payment.mileageAmount && zipQueue[zipCurrentIndex].payment.mileageAmount > 0;
 const sumAfterMileage = paymentsAfter.reduce((sum, p) => sum + (p.mileageAmount || 0), 0);
 const bakiTerkiniMileage = zipQueue[zipCurrentIndex].record.bakiMileage !== undefined ? zipQueue[zipCurrentIndex].record.bakiMileage + sumAfterMileage : 0;
 const bakiTerdahuluMileage = bakiTerkiniMileage + (zipQueue[zipCurrentIndex].payment.mileageAmount || 0);
 
 return (
 <div className="text-right space-y-4">
 {zipQueue[zipCurrentIndex].payment.amount > 0 && (
 <>
 <div className="text-sm font-bold text-black flex justify-end gap-12">
 <span>JUMLAH BAYARAN (FEE):</span>
 <span className="w-32">RM {zipQueue[zipCurrentIndex].payment.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
 </div>
 <div className="text-sm font-bold text-black flex justify-end gap-12">
 <span>BAKI TERDAHULU (FEE):</span>
 <span className="w-32">RM {bakiTerdahuluFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
 </div>
 <div className="text-sm font-bold text-black flex justify-end gap-12 pt-3 border-t border-gray-300 mb-4">
 <span>BAKI TERKINI (FEE):</span>
 <span className="w-32">RM {bakiTerkiniFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                     </div>
                                   </>
                               )}

                               {hasMileageReceipt && (
                                   <>
                                     <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex justify-end gap-12">
                                         <span>JUMLAH BAYARAN (MILEAGE):</span>
                                         <span className="w-32">RM {zipQueue[zipCurrentIndex].payment.mileageAmount!.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
                    Resit ini dijana oleh komputer, terima kasih atas urusan anda. Ref: {zipQueue[zipCurrentIndex].payment.id}
                  </div>
                </div>
                {/* Printable Area Ends */}
          </div>
        </div>
      )}
    </div>
  );
}
