/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import StandaloneReceipts from './components/StandaloneReceipts';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Settings, Menu, Car, Users, FileText, CreditCard, Wallet, MapPin, ChevronDown, Filter, ChevronRight, X, Printer, CheckCircle, Download, Loader2, PieChart, Edit, Trash2, AlertTriangle, ArrowUp, ArrowDown, ArrowUpDown, Upload, LogOut, LogIn, CloudUpload, Moon, Sun, Home, Clock, Zap, Plus, History, ToggleLeft, ToggleRight, Cloud, RefreshCw, Calendar, AlertCircle, Info, Folder, Edit2, Save, Monitor, Smartphone, Columns, Briefcase, TrendingUp, ChevronLeft, Database, MoreVertical } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { records as initialRecords, CaseRecord, PaymentEntry } from './data';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, writeBatch, getDocs, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

const parseDateObj = (dateInput: string | Date | any): Date => {
  if (!dateInput && dateInput !== 0) return new Date();
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? new Date() : dateInput;

  // Support Excel serial number dates (e.g. 45432)
  if (typeof dateInput === 'number' || (!isNaN(Number(dateInput)) && Number(dateInput) > 20000 && Number(dateInput) < 90000)) {
    const serial = Number(dateInput);
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const ms = excelEpoch.getTime() + Math.round(serial * 86400000);
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d;
  }

  const str = String(dateInput).trim();
  if (!str) return new Date();

  // If DD/MM/YYYY or D/M/YYYY
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        year += year < 100 ? (year < 50 ? 2000 : 1900) : 0;
        const d = new Date(year, month, day, 0, 0, 0, 0);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  // If YYYY-MM-DD or DD-MM-YYYY
  if (str.includes('-')) {
    const cleanStr = str.split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const d = new Date(year, month, day, 0, 0, 0, 0);
          if (!isNaN(d.getTime())) return d;
        }
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const d = new Date(year, month, day, 0, 0, 0, 0);
          if (!isNaN(d.getTime())) return d;
        }
      }
    }
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

const parseDateString = (dateStr: string) => {
  return parseDateObj(dateStr).getTime();
};

const formatDateDMY = (dateStr: string | Date | any): string => {
  if (!dateStr) return '';
  const d = parseDateObj(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateISO = (dateStr: string | Date | any): string => {
  if (!dateStr) return '';
  const d = parseDateObj(dateStr);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};


class ErrorBoundary extends React.Component<{children: React.ReactNode}, any> {
  constructor(props: any) {
    super(props);
    // @ts-ignore
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    // @ts-ignore
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (// @ts-ignore
    this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg m-4">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-sm opacity-80 mb-4">{// @ts-ignore
    this.state.error?.toString()}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded-md">Reload Page</button>
        </div>
      );
    }
    return (this as any).props.children as React.ReactNode;
  }
}


function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'standalone' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const [toast, setToast] = useState<{ id: string; type: 'success' | 'error' | 'info'; message: string; details?: string } | null>(null);
  const toastTimerRef = useRef<any>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string, details?: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    const id = String(Date.now());
    setToast({ id, type, message, details });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 6000);
  };

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
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hma_case_records');
      if (saved !== null) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing saved records from localStorage:", e);
        }
      }
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


  const [overdueDays, setOverdueDays] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('overdueDays');
      return stored ? parseInt(stored, 10) : 30;
    }
    return 30;
  });

  useEffect(() => {
    localStorage.setItem('overdueDays', overdueDays.toString());
  }, [overdueDays]);

  const [autoBackupEnabled, setAutoBackupEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('autoBackupEnabled') === 'true';
    }
    return false;
  });
  const [autoSyncSheetsEnabled, setAutoSyncSheetsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('autoSyncSheetsEnabled') === 'true';
    }
    return false;
  });
  const skipNextBackupRef = useRef(false);
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
  const [quickPrintData, setQuickPrintData] = useState<{record: CaseRecord, payment: import('./data').PaymentEntry} | null>(null);
  const [isGeneratingQuickPrint, setIsGeneratingQuickPrint] = useState(false);
  const [quickPrintId, setQuickPrintId] = useState<string | null>(null);
  const [isGeneratingCombinedPDF, setIsGeneratingCombinedPDF] = useState(false);
  const [combinedPdfQueue, setCombinedPdfQueue] = useState<import('./data').CaseRecord[]>([]);
  const [combinedPdfCurrentIndex, setCombinedPdfCurrentIndex] = useState(0);
  const combinedPdfInstanceRef = useRef<any>(null);
  const hiddenCombinedPdfPrintRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal States
  const [invoiceRecord, setInvoiceRecord] = useState<CaseRecord | null>(null);
  const [invoiceType, setInvoiceType] = useState<'INVOIS' | 'SEBUT HARGA'>('INVOIS');
  const [isGeneratingInvoicePDF, setIsGeneratingInvoicePDF] = useState(false);
  const invoicePrintRef = useRef<HTMLDivElement>(null);
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
  const [editingPaymentDetails, setEditingPaymentDetails] = useState<{record: CaseRecord, payment: any} | null>(null);
  const [editingPaymentAmount, setEditingPaymentAmount] = useState<string>('');
  const [editingPaymentMileage, setEditingPaymentMileage] = useState<string>('');
  const [editingPaymentDate, setEditingPaymentDate] = useState<string>('');
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<string>('Cash');
  const [editingPaymentNote, setEditingPaymentNote] = useState<string>('');
  const [mileageAdjustmentRecord, setMileageAdjustmentRecord] = useState<CaseRecord | null>(null);
  const [mileageAdjustmentAmount, setMileageAdjustmentAmount] = useState<string>('');
  const [mileageAdjustmentType, setMileageAdjustmentType] = useState<'tambah' | 'tolak'>('tambah');
  const [deletingRecord, setDeletingRecord] = useState<CaseRecord | null>(null);
  const [settlingRecord, setSettlingRecord] = useState<CaseRecord | null>(null);
  const [isDeletingSelected, setIsDeletingSelected] = useState<boolean>(false);

  const [standaloneInitialRecord, setStandaloneInitialRecord] = useState<CaseRecord | null>(null);
  const [clientProfileName, setClientProfileName] = useState<string | null>(null);
  
  const handleUpdateClientProfile = async (e: React.FormEvent, nama: string) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const telefon = (formData.get('telefon') as string || '').trim();
    const emel = (formData.get('emel') as string || '').trim();
    const alamat = (formData.get('alamat') as string || '').trim();
    
    const updatedRecords = records.map(r => {
      if (r.nama === nama) {
        return { ...r, telefon, emel, alamat };
      }
      return r;
    });
    
    setRecords(updatedRecords);
    localStorage.setItem('hma_case_records', JSON.stringify(updatedRecords));
    
    if (user) {
      try {
        const updates = updatedRecords.filter(r => r.nama === nama);
        for (const rec of updates) {
          const targetPath = `users/${user.uid}/records/${rec.id}`;
          await setDoc(doc(db, 'users', user.uid, 'records', rec.id), { ...rec, userId: user.uid }, { merge: true });
        }
      } catch (err) {
        console.error("Gagal mengemaskini di awan", err);
      }
    }
    
    showToast('success', 'Profil Pelanggan Berjaya Dikemaskini');
  };
  const [paymentSortColumn, setPaymentSortColumn] = useState<'date' | 'amount' | null>(null);
  const [paymentSortDirection, setPaymentSortDirection] = useState<'asc' | 'desc'>('desc');
  const [dateSortOrder, setDateSortOrder] = useState<'asc' | 'desc' | null>('desc');
  const [nameSortOrder, setNameSortOrder] = useState<'asc' | 'desc' | null>(null);

  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  const dataMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutsideDataMenu = (event: MouseEvent) => {
      if (dataMenuRef.current && !dataMenuRef.current.contains(event.target as Node)) {
        setIsDataMenuOpen(false);
      }
    };
    if (isDataMenuOpen) {
      document.addEventListener('mousedown', handleClickOutsideDataMenu);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideDataMenu);
    };
  }, [isDataMenuOpen]);

  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isImportingContacts, setIsImportingContacts] = useState(false);
  const [cachedAccessToken, setCachedAccessToken] = useState<string | null>(null);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  const handleImportContacts = async () => {
    setIsImportingContacts(true);
    try {
        let token = cachedAccessToken;
        if (!token) {
            const provider = new GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
            provider.addScope('https://www.googleapis.com/auth/contacts.other.readonly');
            provider.addScope('https://www.googleapis.com/auth/directory.readonly');
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            token = credential?.accessToken || null;
            if (token) {
                setCachedAccessToken(token);
            }
        }
        
        if (!token) {
            throw new Error("No access token");
        }
        
        const response = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses,organizations&pageSize=1000', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                 setCachedAccessToken(null);
                 alert('Sesi tamat atau tiada kebenaran. Sila cuba lagi.');
            }
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.connections || data.connections.length === 0) {
            alert("Tiada kontak dijumpai di dalam Google Contacts anda.");
            return;
        }
        
        setAvailableContacts(data.connections);
        setIsContactPickerOpen(true);
        
    } catch (err) {
        console.error(err);
        alert("Gagal mengimport kontak.");
    } finally {
        setIsImportingContacts(false);
    }
  };

  const handleSelectContact = (contact: any) => {
    const name = contact.names?.[0]?.displayName || '';
    const phone = contact.phoneNumbers?.[0]?.value || '';
    
    setNewRecordData(prev => ({
        ...prev,
        nama: name,
        telefon: phone
    }));
    setIsContactPickerOpen(false);
  };

  const [newRecordData, setNewRecordData] = useState({
    nama: '',
    telefon: '',
    emel: '',
    alamat: '',
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
    localStorage.setItem('autoBackupEnabled', autoBackupEnabled.toString());
  }, [autoBackupEnabled]);

  useEffect(() => {
    localStorage.setItem('autoSyncSheetsEnabled', autoSyncSheetsEnabled.toString());
  }, [autoSyncSheetsEnabled]);

  useEffect(() => {
    if (skipNextBackupRef.current) {
      skipNextBackupRef.current = false;
      return;
    }
    
    let timeoutId: any;
    if ((autoBackupEnabled || autoSyncSheetsEnabled) && user && authReady) {
      timeoutId = setTimeout(() => {
        if (autoBackupEnabled) silentBackupToCloud(records);
        if (autoSyncSheetsEnabled) silentSyncToGoogleSheets(records);
      }, 1500);
    }
    return () => clearTimeout(timeoutId);
  }, [records, autoBackupEnabled, autoSyncSheetsEnabled, user, authReady]);

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
      const saved = localStorage.getItem('hma_case_records');
      if (saved !== null) {
        try {
          setRecords(JSON.parse(saved));
        } catch (e) {
          setRecords(initialRecords);
        }
      } else {
        setRecords(initialRecords);
      }
      return;
    }

    const targetPath = `users/${user.uid}/records`;
    
    const q = query(collection(db, targetPath));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedRecords: CaseRecord[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as CaseRecord;
        fetchedRecords.push({
          ...data,
          id: String(data.id || doc.id)
        });
      });
      
      if (!snapshot.empty) {
        localStorage.setItem(`cloud_initialized_${user.uid}`, 'true');
        skipNextBackupRef.current = true;
        setRecords(fetchedRecords);
        localStorage.setItem('hma_case_records', JSON.stringify(fetchedRecords));
      } else {
        const hasInitializedCloud = localStorage.getItem(`cloud_initialized_${user.uid}`);
        if (!hasInitializedCloud) {
          // First time user logs in: seed local/initial records to Firestore
          const saved = localStorage.getItem('hma_case_records');
          let recordsToSync: CaseRecord[] = [];
          if (saved !== null) {
            try {
              recordsToSync = JSON.parse(saved);
            } catch (e) {
              recordsToSync = initialRecords;
            }
          } else {
            recordsToSync = initialRecords;
          }

          if (recordsToSync && recordsToSync.length > 0) {
            const batch = writeBatch(db);
            for (const r of recordsToSync) {
              const rId = String(r.id);
              const docRef = doc(db, 'users', user.uid, 'records', rId);
              batch.set(docRef, { ...r, id: rId, userId: user.uid }, { merge: true });
            }
            try {
              await batch.commit();
              console.log("Initial records migrated to user's Firestore.");
            } catch (err) {
              console.error("Failed to seed initial records to Firestore:", err);
            }
          }
          localStorage.setItem(`cloud_initialized_${user.uid}`, 'true');
        } else {
          // Cloud was initialized and is empty (user intentionally deleted all records)
          skipNextBackupRef.current = true;
          setRecords([]);
          localStorage.setItem('hma_case_records', JSON.stringify([]));
        }
      }
    }, (error) => {
       handleFirestoreError(error, OperationType.GET, targetPath);
    });
    return () => unsubscribe();
  }, [user, authReady]);

  // Auto-load PDF data one-time
  useEffect(() => {
    if (authReady && !localStorage.getItem('pdfDataLoaded_v1')) {
      if (window.confirm("Kemas kini Sistem: Terdapat rekod data pelanggan baru (dari PDF). Adakah anda mahu memuatkan data ini ke dalam akaun anda sekarang?")) {
        // handleMuatDataPDF();
      }
      localStorage.setItem('pdfDataLoaded_v1', 'true');
    }
  }, [authReady]);

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
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [showExportReminder, setShowExportReminder] = useState(false);
  const isInitialRecordsRender = useRef(true);

  React.useEffect(() => {
    if (isInitialRecordsRender.current) {
      isInitialRecordsRender.current = false;
      return;
    }
    localStorage.setItem('lastModificationDate', Date.now().toString());
    localStorage.setItem('hma_case_records', JSON.stringify(records));
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



  const handleRenameCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    
    const previousRecords = [...records];
    const updatedRecords = records.map(r => 
      r.kes === oldName ? { ...r, kes: newName.trim() } : r
    );
    
    skipNextBackupRef.current = true;
    setRecords(updatedRecords);
    localStorage.setItem('hma_case_records', JSON.stringify(updatedRecords));
    
    if (user) {
      try {
        const batch = writeBatch(db);
        const q = query(collection(db, `users/${user.uid}/records`), where("kes", "==", oldName));
        const snapshot = await getDocs(q);
        
        snapshot.forEach(d => {
          batch.update(d.ref, { kes: newName.trim() });
        });
        
        if (!snapshot.empty) {
          await batch.commit();
        }
        showToast('success', `Kategori "${oldName}" berjaya ditukar kepada "${newName.trim()}".`);
      } catch (err: any) {
        console.error("Gagal menamakan semula kategori di awan", err);
        setRecords(previousRecords);
        localStorage.setItem('hma_case_records', JSON.stringify(previousRecords));
        showToast('error', 'Gagal menamakan semula kategori di awan.', err.message);
      }
    } else {
      showToast('success', `Kategori "${oldName}" berjaya ditukar kepada "${newName.trim()}" secara setempat.`);
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (!window.confirm(`Adakah anda pasti mahu memadam kategori "${categoryName}"? Kesemua rekod dalam kategori ini akan ditukar kepada "Tiada Kategori".`)) return;
    
    const previousRecords = [...records];
    const updatedRecords = records.map(r => 
      r.kes === categoryName ? { ...r, kes: "Tiada Kategori" } : r
    );
    
    skipNextBackupRef.current = true;
    setRecords(updatedRecords);
    localStorage.setItem('hma_case_records', JSON.stringify(updatedRecords));
    
    if (user) {
      try {
        const batch = writeBatch(db);
        const q = query(collection(db, `users/${user.uid}/records`), where("kes", "==", categoryName));
        const snapshot = await getDocs(q);
        
        snapshot.forEach(d => {
          batch.update(d.ref, { kes: "Tiada Kategori" });
        });
        
        if (!snapshot.empty) {
          await batch.commit();
        }
        showToast('success', `Kategori "${categoryName}" berjaya dipadam.`);
      } catch (err: any) {
        console.error("Gagal memadam kategori di awan", err);
        setRecords(previousRecords);
        localStorage.setItem('hma_case_records', JSON.stringify(previousRecords));
        showToast('error', 'Gagal memadam kategori di awan.', err.message);
      }
    } else {
      showToast('success', `Kategori "${categoryName}" berjaya dipadam secara setempat.`);
    }
  };

  const handleFormatData = async () => {
    if (window.confirm("AMARAN: Adakah anda pasti mahu memadam SEMUA rekod? Tindakan ini tidak boleh dipulihkan.")) {
      const previousRecords = [...records];
      skipNextBackupRef.current = true;
      setRecords([]);
      localStorage.setItem('hma_case_records', JSON.stringify([]));

      if (user) {
        try {
          const q = query(collection(db, `users/${user.uid}/records`));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const batch = writeBatch(db);
            snapshot.forEach(d => {
              batch.delete(d.ref);
            });
            await batch.commit();
            console.log("[Firestore Success] Semua rekod berjaya dipadam dari awan.");
          }
          localStorage.setItem(`cloud_initialized_${user.uid}`, 'true');
          showToast('success', 'Semua data telah berjaya dipadam dari awan.');
        } catch (err: any) {
          console.error("Gagal memadam dari awan", err);
          // Revert ONLY if Firestore delete fails
          setRecords(previousRecords);
          localStorage.setItem('hma_case_records', JSON.stringify(previousRecords));
          showToast('error', 'Gagal memadam semua data dari awan.', err.message || 'Sila cuba lagi.');
          handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/records`);
          return;
        }
      } else {
        showToast('success', 'Semua data telah berjaya dipadam secara setempat.');
      }
    }
  };

  
  const handleClearLocalStorage = () => {
    if (window.confirm("Pasti mahu kosongkan data tempatan (local storage)? Aplikasi akan dimuat semula.")) {
      localStorage.removeItem('hma_case_records');
      if (user) {
        localStorage.removeItem(`cloud_initialized_${user.uid}`);
      }
      window.location.reload();
    }
  };

  const handleExportDBToDrive = async () => {
    if (!user) {
      alert("Sila log masuk untuk mengeksport pangkalan data.");
      return;
    }
    
    const folderName = window.prompt("Sila masukkan nama folder di Google Drive (atau biarkan lalai):", "HMA_Database_Backup");
    if (folderName === null) return; // cancelled
    
    try {
      let token = cachedAccessToken;
      if (!token) {
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/drive.file');
        provider.addScope('https://www.googleapis.com/auth/spreadsheets');
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        token = credential?.accessToken || null;
        if (token) {
          setCachedAccessToken(token);
        } else {
          throw new Error("Failed to get Google access token");
        }
      }
      
      // Fetch entire database
      const [recordsSnap, receiptsSnap] = await Promise.all([
         getDocs(collection(db, `users/${user.uid}/records`)),
         getDocs(collection(db, `users/${user.uid}/receipts`))
      ]);
      
      const dbExport = {
        exportedAt: new Date().toISOString(),
        userId: user.uid,
        records: recordsSnap.docs.map(d => d.data()),
        receipts: receiptsSnap.docs.map(d => d.data())
      };
      
      const jsonContent = JSON.stringify(dbExport, null, 2);
      const fileName = `HMA_DB_Export_${new Date().toISOString().slice(0,10)}.json`;
      const metadata: any = {
        name: fileName,
        mimeType: 'application/json'
      };

      // Find or Create Folder
      let folderId = null;
      if (folderName.trim()) {
        const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder' and name='${folderName.trim()}' and trashed=false`, {
           headers: { 'Authorization': `Bearer ${token}` }
        });
        if (searchRes.ok) {
           const searchData = await searchRes.json();
           if (searchData.files && searchData.files.length > 0) {
              folderId = searchData.files[0].id;
           }
        }
        
        if (!folderId) {
           const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: folderName.trim(), mimeType: 'application/vnd.google-apps.folder' })
           });
           if (createFolderRes.ok) {
              const folderData = await createFolderRes.json();
              folderId = folderData.id;
           }
        }
      }
      
      if (folderId) {
         metadata.parents = [folderId];
      }

      // Upload file using multipart upload
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          jsonContent +
          close_delim;

      const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      });

      if (!uploadRes.ok) {
          if (uploadRes.status === 401 || uploadRes.status === 403) {
             setCachedAccessToken(null);
             throw new Error("Sesi keizinan tamat. Sila log masuk semula.");
          }
          throw new Error('Gagal memuat naik fail ke Google Drive');
      }

      alert(`Pangkalan data berjaya dieksport ke Google Drive!`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Gagal mengeksport pangkalan data.");
    }
  };

  const handleSyncGoogleSheets = async () => {
    setIsSyncingSheets(true);
    try {
        let token = cachedAccessToken;
        if (!token) {
            const provider = new GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/drive.file');
            provider.addScope('https://www.googleapis.com/auth/spreadsheets');
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            token = credential?.accessToken || null;
            if (token) {
                setCachedAccessToken(token);
            } else {
                throw new Error("Failed to get Google access token");
            }
        }
        
        // 1. Create a new Spreadsheet
        const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: {
                    title: `Data Kes HMA - ${new Date().toLocaleString()}`
                }
            })
        });
        
        if (!createRes.ok) {
            if (createRes.status === 401 || createRes.status === 403) {
                 setCachedAccessToken(null); // Invalid token, force re-auth next time
                 throw new Error("Sesi keizinan tamat. Sila klik butang sekali lagi untuk log masuk semula.");
            }
            throw new Error('Gagal mencipta lembaran Google Sheet');
        }
        
        const spreadsheet = await createRes.json();
        const spreadsheetId = spreadsheet.spreadsheetId;
        
        // 2. Prepare data
        const headers = ['ID Rekod', 'Nama Pelanggan', 'No Telefon', 'Emel', 'Alamat', 'Kategori Kes', 'Nota Kes', 'Tarikh', 'Total Fee (RM)', 'Bayaran Terakhir (RM)', 'Baki Sebelum (RM)', 'Baki Fee Terkini (RM)', 'Baki Mileage (RM)'];
        const rows = filteredRecords.map(r => [
            r.id,
            r.nama,
            r.telefon || '',
            r.emel || '',
            r.alamat || '',
            r.kes,
            r.nota || '',
            formatDateDMY(r.tarikh),
            (Number(r.totalFee) || 0).toFixed(2),
            (Number(r.bayaranTerakhir) || 0).toFixed(2),
            (Number(r.bakiSebelum) || 0).toFixed(2),
            (Number(r.bakiFeeTerkini) || 0).toFixed(2),
            (Number(r.bakiMileage) || 0).toFixed(2)
        ]);
        
        // 3. Update spreadsheet
        const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:M${rows.length + 1}?valueInputOption=USER_ENTERED`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: [headers, ...rows]
            })
        });
        
        if (!updateRes.ok) {
            throw new Error('Gagal mengemas kini data ke Google Sheet');
        }
        
        window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`, '_blank');
        
    } catch (e: any) {
        console.error(e);
        alert('Ralat menyegerak ke Google Sheets: ' + e.message);
    } finally {
        setIsSyncingSheets(false);
    }
  };

  const handleExportData = () => {
    const headers = [
      'ID Rekod',
      'Nama Pelanggan',
      'No Telefon',
      'Emel',
      'Alamat',
      'Kategori Kes',
      'Nota Kes',
      'Tarikh',
      'Total Fee',
      'Bayaran Terakhir',
      'Baki Sebelum',
      'Baki Fee Terkini',
      'Baki Mileage'
    ];
    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...filteredRecords.map(r => 
        [
          escapeCsv(r.id || ''),
          escapeCsv(r.nama || ''),
          escapeCsv(r.telefon || ''),
          escapeCsv(r.emel || ''),
          escapeCsv(r.alamat || ''),
          escapeCsv(r.kes || ''),
          escapeCsv(r.nota || ''),
          escapeCsv(formatDateDMY(r.tarikh)),
          (Number(r.totalFee) || 0).toFixed(2),
          (Number(r.bayaranTerakhir) || 0).toFixed(2),
          (Number(r.bakiSebelum) || 0).toFixed(2),
          (Number(r.bakiFeeTerkini) || 0).toFixed(2),
          (Number(r.bakiMileage) || 0).toFixed(2)
        ].join(',')
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

  const handleExportDataLengkapExcel = () => {
    // 1. Data Rekod Utama
    const recordsData = filteredRecords.map(r => ({
      'ID Rekod': r.id,
      'Nama Pelanggan': r.nama,
      'No Telefon': r.telefon || '',
      'Emel': r.emel || '',
      'Alamat': r.alamat || '',
      'Kategori Kes': r.kes,
      'Nota Kes': r.nota || '',
      'Tarikh': formatDateDMY(r.tarikh),
      'Total Fee (RM)': Number(r.totalFee) || 0,
      'Bayaran Terakhir (RM)': Number(r.bayaranTerakhir) || 0,
      'Baki Sebelum (RM)': Number(r.bakiSebelum) || 0,
      'Baki Fee Terkini (RM)': Number(r.bakiFeeTerkini) || 0,
      'Baki Mileage (RM)': Number(r.bakiMileage) || 0,
      'URL Penyata': r.statementUrl || ''
    }));

    // 2. Data Sejarah Pembayaran
    const paymentsData: any[] = [];
    filteredRecords.forEach(r => {
      if (r.paymentHistory && r.paymentHistory.length > 0) {
        r.paymentHistory.forEach(p => {
          paymentsData.push({
            'ID Rekod': r.id,
            'Nama Pelanggan': r.nama,
            'No. Resit / ID Bayaran': p.id,
            'Tarikh Bayaran': formatDateDMY(p.date),
            'Bayaran Fee (RM)': Number(p.amount) || 0,
            'Bayaran Mileage (RM)': Number(p.mileageAmount) || 0,
            'Kaedah Bayaran': p.method,
            'Nota': p.nota || ''
          });
        });
      }
    });

    const wb = XLSX.utils.book_new();
    const wsRecords = XLSX.utils.json_to_sheet(recordsData);
    const wsPayments = XLSX.utils.json_to_sheet(paymentsData);

    // Format neat column widths (kemas dan teratur)
    wsRecords['!cols'] = [
      { wch: 14 }, // ID Rekod
      { wch: 30 }, // Nama Pelanggan
      { wch: 16 }, // No Telefon
      { wch: 24 }, // Emel
      { wch: 35 }, // Alamat
      { wch: 20 }, // Kategori Kes
      { wch: 30 }, // Nota Kes
      { wch: 14 }, // Tarikh
      { wch: 16 }, // Total Fee (RM)
      { wch: 20 }, // Bayaran Terakhir (RM)
      { wch: 16 }, // Baki Sebelum (RM)
      { wch: 20 }, // Baki Fee Terkini (RM)
      { wch: 16 }, // Baki Mileage (RM)
      { wch: 30 }  // URL Penyata
    ];

    wsPayments['!cols'] = [
      { wch: 14 }, // ID Rekod
      { wch: 30 }, // Nama Pelanggan
      { wch: 22 }, // No. Resit / ID Bayaran
      { wch: 14 }, // Tarikh Bayaran
      { wch: 18 }, // Bayaran Fee (RM)
      { wch: 22 }, // Bayaran Mileage (RM)
      { wch: 24 }, // Kaedah Bayaran
      { wch: 30 }  // Nota
    ];

    XLSX.utils.book_append_sheet(wb, wsRecords, "Rekod Pelanggan");
    XLSX.utils.book_append_sheet(wb, wsPayments, "Sejarah Pembayaran");

    XLSX.writeFile(wb, `Data_Lengkap_Pelanggan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const silentSyncToGoogleSheets = async (currentRecords: CaseRecord[]) => {
    if (!user || !autoSyncSheetsEnabled) return;
    try {
        let token = cachedAccessToken;
        if (!token) return;

        let spreadsheetId = localStorage.getItem('autoSyncSpreadsheetId');
        
        if (!spreadsheetId) {
            const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    properties: {
                        title: `Auto-Sync Data Kes HMA`
                    }
                })
            });
            
            if (!createRes.ok) {
                if (createRes.status === 401 || createRes.status === 403) setCachedAccessToken(null);
                return;
            }
            
            const spreadsheet = await createRes.json();
            spreadsheetId = spreadsheet.spreadsheetId;
            if (spreadsheetId) {
                localStorage.setItem('autoSyncSpreadsheetId', spreadsheetId);
            } else {
                return;
            }
        }
        
        const headers = ['ID Rekod', 'Nama Pelanggan', 'No Telefon', 'Emel', 'Alamat', 'Kategori Kes', 'Nota Kes', 'Tarikh', 'Total Fee (RM)', 'Bayaran Terakhir (RM)', 'Baki Sebelum (RM)', 'Baki Fee Terkini (RM)', 'Baki Mileage (RM)'];
        const rows = currentRecords.map(r => [
            r.id,
            r.nama,
            r.telefon || '',
            r.emel || '',
            r.alamat || '',
            r.kes,
            r.nota || '',
            formatDateDMY(r.tarikh),
            (Number(r.totalFee) || 0).toFixed(2),
            (Number(r.bayaranTerakhir) || 0).toFixed(2),
            (Number(r.bakiSebelum) || 0).toFixed(2),
            (Number(r.bakiFeeTerkini) || 0).toFixed(2),
            (Number(r.bakiMileage) || 0).toFixed(2)
        ]);
        
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:Z:clear`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:M${rows.length + 1}?valueInputOption=USER_ENTERED`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: [headers, ...rows]
            })
        });
        
        if (!updateRes.ok && (updateRes.status === 401 || updateRes.status === 403)) {
            setCachedAccessToken(null);
        } else {
            console.log("Silent Sync to Google Sheets successful");
        }
    } catch (e: any) {
        console.error("Silent Sync to Google Sheets Failed:", e);
    }
  };

  const handleToggleAutoSyncSheets = async () => {
    if (!autoSyncSheetsEnabled) {
       try {
          let token = cachedAccessToken;
          if (!token) {
             const provider = new GoogleAuthProvider();
             provider.addScope('https://www.googleapis.com/auth/drive.file');
             provider.addScope('https://www.googleapis.com/auth/spreadsheets');
             const result = await signInWithPopup(auth, provider);
             const credential = GoogleAuthProvider.credentialFromResult(result);
             token = credential?.accessToken || null;
             if (token) {
                 setCachedAccessToken(token);
             } else {
                 throw new Error("Tiada token akses Google.");
             }
          }
          setAutoSyncSheetsEnabled(true);
          localStorage.setItem('autoSyncSheetsEnabled', 'true');
       } catch (e: any) {
          alert('Gagal mengaktifkan Auto-Sync Google Sheets: ' + e.message);
       }
    } else {
       setAutoSyncSheetsEnabled(false);
       localStorage.setItem('autoSyncSheetsEnabled', 'false');
    }
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

  const handleRefreshData = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const q = query(collection(db, `users/${user.uid}/records`));
      const snapshot = await getDocs(q);
      const fetchedRecords: CaseRecord[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as CaseRecord;
        fetchedRecords.push({
          ...data,
          id: String(data.id || doc.id)
        });
      });
      skipNextBackupRef.current = true;
      setRecords(fetchedRecords);
      localStorage.setItem('hma_case_records', JSON.stringify(fetchedRecords));
      localStorage.setItem(`cloud_initialized_${user.uid}`, 'true');
    } catch (error) {
      console.error("Failed to refresh data:", error);
      alert("Gagal memuat semula data.");
    } finally {
      setIsRefreshing(false);
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
  const paymentsFileInputRef = useRef<HTMLInputElement>(null);
  const clientPaymentsFileInputRef = useRef<HTMLInputElement>(null);
  const [importPaymentsClientId, setImportPaymentsClientId] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const headers = [
      'ID Rekod',
      'Nama Pelanggan',
      'No Telefon',
      'Emel',
      'Alamat',
      'Kategori Kes',
      'Nota Kes',
      'Tarikh',
      'Total Fee',
      'Bayaran Terakhir',
      'Baki Sebelum',
      'Baki Fee Terkini',
      'Baki Mileage'
    ];
    const example1 = [
      'CS001',
      'Ali Bin Abu',
      '012-3456789',
      'ali.abu@example.com',
      'No 12 Jalan Ampang, 50450 Kuala Lumpur',
      'Faraid',
      'Perbincangan pembahagian harta pusaka',
      '20/05/2024',
      '5000.00',
      '1000.00',
      '5000.00',
      '4000.00',
      '200.00'
    ];
    const example2 = [
      'CS002',
      'Siti Aminah binti Omar',
      '019-8765432',
      'siti.aminah@example.com',
      'Bandar Baru Bangi, Selangor',
      'Takliq',
      'Tuntutan fasakh & nafkah anak',
      '15/06/2024',
      '3500.00',
      '1500.00',
      '3500.00',
      '2000.00',
      '0.00'
    ];
    const escapeCsvField = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    const csvContent = '\uFEFF' + [
      headers.map(escapeCsvField).join(','),
      example1.map(escapeCsvField).join(','),
      example2.map(escapeCsvField).join(',')
    ].join('\n') + '\n';

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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

    const parseNumeric = (val: any): number => {
      if (val === undefined || val === null) return 0;
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      const str = String(val).replace(/RM/gi, '').replace(/\s+/g, '').replace(/,/g, '').trim();
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    const processImportedRows = async (rawRows: any[][], paymentsList?: any[]) => {
      if (!rawRows || rawRows.length < 2) {
        showToast('error', 'Fail tidak mengandungi data yang mencukupi.');
        return;
      }

      const rawHeaders = rawRows[0].map((h: any) => String(h || '').trim());
      const headers = rawHeaders.map(h => h.toLowerCase().replace(/^"|"$/g, '').trim());

      const findCol = (keywords: string[]) => {
        return headers.findIndex(h => keywords.some(k => h === k || h.includes(k)));
      };

      const colIndex = {
        id: findCol(['id rekod', 'id', 'no rujukan', 'rujukan', 'no kes', 'no. kes', 'no']),
        nama: findCol(['nama pelanggan', 'nama klien', 'nama']),
        telefon: findCol(['no telefon', 'no. telefon', 'telefon', 'phone', 'tel', 'hp', 'no hp']),
        emel: findCol(['emel', 'email', 'e-mel', 'surat elektronik']),
        alamat: findCol(['alamat', 'address', 'lokasi']),
        kes: findCol(['kategori kes', 'jenis kes', 'kes', 'category']),
        nota: findCol(['nota kes', 'nota', 'catatan', 'keterangan', 'remarks', 'note', 'notes']),
        tarikh: findCol(['tarikh', 'tarikh kemaskini', 'tarikh akhir', 'tarikh daftar', 'tarikh kes', 'date']),
        totalFee: findCol(['total fee', 'total fee (rm)', 'jumlah fee', 'fee keseluruhan', 'fee guaman', 'fee', 'totalfee', 'jumlahkeseluruhan']),
        bayaranTerakhir: findCol(['bayaran terakhir', 'bayaran terakhir (rm)', 'jumlah bayaran (fee)', 'bayaran fee', 'jumlah bayaran', 'bayaran', 'terakhir', 'paid', 'last payment']),
        bakiSebelum: findCol(['baki sebelum', 'baki sebelum (rm)', 'bakisebelum', 'previous balance']),
        bakiFeeTerkini: findCol(['baki fee terkini', 'baki fee terkini (rm)', 'baki fee (rm)', 'baki fee', 'baki terkini', 'bakifeeterkini', 'balance']),
        bakiMileage: findCol(['baki mileage', 'baki mileage (rm)', 'bakimileage', 'mileage', 'elaun perjalanan', 'baki elaun']),
        statementUrl: findCol(['url penyata', 'statement url', 'penyata url'])
      };

      // Map payments by ID Rekod if provided from Excel sheet
      const paymentsByRecordId: { [recordId: string]: PaymentEntry[] } = {};
      if (paymentsList && paymentsList.length > 1) {
        const pHeaders = paymentsList[0].map((h: any) => String(h || '').toLowerCase().trim());
        const pFindCol = (keywords: string[]) => pHeaders.findIndex((h: string) => keywords.some(k => h === k || h.includes(k)));
        const pCol = {
          recordId: pFindCol(['id rekod', 'id', 'record id']),
          paymentId: pFindCol(['no. resit', 'id bayaran', 'no resit', 'resit']),
          date: pFindCol(['tarikh bayaran', 'tarikh', 'date']),
          amount: pFindCol(['bayaran fee', 'fee', 'amount']),
          mileageAmount: pFindCol(['bayaran mileage', 'mileage']),
          method: pFindCol(['kaedah bayaran', 'kaedah', 'method']),
          nota: pFindCol(['nota', 'catatan', 'remarks'])
        };

        for (let j = 1; j < paymentsList.length; j++) {
          const prow = paymentsList[j];
          if (!prow || prow.length === 0) continue;
          const recId = String(pCol.recordId !== -1 ? prow[pCol.recordId] : '').trim();
          if (!recId) continue;
          if (!paymentsByRecordId[recId]) paymentsByRecordId[recId] = [];
          
          paymentsByRecordId[recId].push({
            id: String(pCol.paymentId !== -1 && prow[pCol.paymentId] ? prow[pCol.paymentId] : `P-${Date.now()}-${j}`),
            date: formatDateDMY(pCol.date !== -1 ? prow[pCol.date] : new Date()),
            amount: parseNumeric(pCol.amount !== -1 ? prow[pCol.amount] : 0),
            mileageAmount: parseNumeric(pCol.mileageAmount !== -1 ? prow[pCol.mileageAmount] : 0),
            method: String(pCol.method !== -1 && prow[pCol.method] ? prow[pCol.method] : 'Pindahan Bank / Tunai'),
            nota: String(pCol.nota !== -1 && prow[pCol.nota] ? prow[pCol.nota] : '')
          });
        }
      }

      const importedRecords: CaseRecord[] = [];
      const currentRecordsMap = new Map<string, CaseRecord>(records.map(r => [String(r.id), r]));

      for (let i = 1; i < rawRows.length; i++) {
        const values = rawRows[i];
        if (!values || values.length === 0) continue;

        const getValue = (idx: number) => (idx !== -1 && idx < values.length && values[idx] !== undefined) ? String(values[idx]).trim() : '';

        const rawNama = getValue(colIndex.nama) || (colIndex.nama === -1 && values[1] ? String(values[1]).trim() : String(values[0] || '').trim());
        if (!rawNama) continue;

        let rawId = getValue(colIndex.id);
        if (rawId && rawId.includes('/')) {
          rawId = rawId.replace(/\//g, '-');
        }
        const id = (rawId && rawId.trim()) ? rawId.trim() : `C-${Date.now().toString().slice(-4)}${i}`;

        const existing = currentRecordsMap.get(id);

        const rawTelefon = getValue(colIndex.telefon);
        const rawEmel = getValue(colIndex.emel);
        const rawAlamat = getValue(colIndex.alamat);
        const rawKes = getValue(colIndex.kes) || 'Umum';
        const rawNota = getValue(colIndex.nota);
        const rawTarikh = getValue(colIndex.tarikh) || (existing ? existing.tarikh : new Date().toISOString().split('T')[0]);

        const rawTotalFee = colIndex.totalFee !== -1 && getValue(colIndex.totalFee) !== '' ? parseNumeric(getValue(colIndex.totalFee)) : (existing ? existing.totalFee : 0);
        const rawBayaranTerakhir = colIndex.bayaranTerakhir !== -1 && getValue(colIndex.bayaranTerakhir) !== '' ? parseNumeric(getValue(colIndex.bayaranTerakhir)) : (existing ? existing.bayaranTerakhir : 0);
        let rawBakiSebelum = colIndex.bakiSebelum !== -1 && getValue(colIndex.bakiSebelum) !== '' ? parseNumeric(getValue(colIndex.bakiSebelum)) : (existing ? existing.bakiSebelum : rawTotalFee);

        let rawBakiFeeTerkini = 0;
        if (colIndex.bakiFeeTerkini !== -1 && getValue(colIndex.bakiFeeTerkini) !== '') {
          rawBakiFeeTerkini = parseNumeric(getValue(colIndex.bakiFeeTerkini));
        } else if (existing) {
          rawBakiFeeTerkini = existing.bakiFeeTerkini;
        } else if (rawTotalFee > 0) {
          rawBakiFeeTerkini = Math.max(0, rawTotalFee - rawBayaranTerakhir);
        }

        if (rawBakiSebelum === 0 && rawTotalFee > 0) {
          rawBakiSebelum = rawTotalFee;
        }

        const rawBakiMileage = colIndex.bakiMileage !== -1 && getValue(colIndex.bakiMileage) !== '' ? parseNumeric(getValue(colIndex.bakiMileage)) : (existing ? existing.bakiMileage : 0);

        let paymentHistory: PaymentEntry[] = [];
        if (paymentsByRecordId[id] && paymentsByRecordId[id].length > 0) {
          paymentHistory = paymentsByRecordId[id];
        } else if (existing && existing.paymentHistory && existing.paymentHistory.length > 0) {
          paymentHistory = existing.paymentHistory;
        } else if (rawBayaranTerakhir > 0) {
          paymentHistory = [{
            id: `PAY-${id}-1`,
            date: formatDateDMY(rawTarikh),
            amount: rawBayaranTerakhir,
            mileageAmount: 0,
            method: 'Pindahan Bank / Tunai',
            nota: 'Bayaran Terakhir (Diimport)'
          }];
        }

        const newRecord: CaseRecord & { userId?: string } = {
          id,
          nama: rawNama,
          telefon: rawTelefon || (existing?.telefon || ''),
          emel: rawEmel || (existing?.emel || ''),
          alamat: rawAlamat || (existing?.alamat || ''),
          kes: rawKes,
          nota: rawNota || (existing?.nota || ''),
          totalFee: rawTotalFee,
          bayaranTerakhir: rawBayaranTerakhir,
          tarikh: formatDateDMY(rawTarikh),
          bakiSebelum: rawBakiSebelum,
          bakiFeeTerkini: rawBakiFeeTerkini,
          bakiMileage: rawBakiMileage,
          paymentHistory,
          statementUrl: getValue(colIndex.statementUrl) || existing?.statementUrl || '',
          userId: user ? user.uid : ""
        };

        importedRecords.push(newRecord);
      }

      if (importedRecords.length === 0) {
        showToast('error', 'Tiada data yang sah dijumpai dalam fail. Sila pastikan format mengikut Templat.');
        return;
      }

      // Upsert into state neatly
      const updatedMap = new Map(records.map(r => [r.id, r]));
      importedRecords.forEach(r => updatedMap.set(r.id, r));
      const updatedList = Array.from(updatedMap.values());

      setRecords(updatedList);
      localStorage.setItem('hma_case_records', JSON.stringify(updatedList));

      // Sync to Firestore
      if (user) {
        try {
          const batch = writeBatch(db);
          for (const r of importedRecords) {
            const docRef = doc(db, 'users', user.uid, 'records', r.id);
            batch.set(docRef, r, { merge: true });
          }
          await batch.commit();
        } catch (err) {
          console.error("Ralat simpan ke Firestore:", err);
        }
      }

      showToast('success', `${importedRecords.length} rekod pelanggan berjaya diimport!`, 'Semua maklumat telah disusun kemas dan disegerakkan.');
    };

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const recordsSheet = workbook.Sheets["Rekod Pelanggan"] || workbook.Sheets[firstSheetName];
          const rawRows: any[][] = XLSX.utils.sheet_to_json(recordsSheet, { header: 1, defval: '' });

          let paymentsRows: any[][] | undefined = undefined;
          if (workbook.Sheets["Sejarah Pembayaran"]) {
            paymentsRows = XLSX.utils.sheet_to_json(workbook.Sheets["Sejarah Pembayaran"], { header: 1, defval: '' });
          }

          await processImportedRows(rawRows, paymentsRows);
        } catch (err: any) {
          console.error("Gagal membaca fail Excel:", err);
          showToast('error', 'Gagal memproses fail Excel: ' + (err.message || 'Format fail tidak sah.'));
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          if (!text) return;

          // Parse CSV lines cleanly
          const parseCSVLine = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                  current += '"';
                  i++;
                } else {
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          };

          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
          const rawRows = lines.map(line => parseCSVLine(line));

          await processImportedRows(rawRows);
        } catch (err: any) {
          console.error("Gagal membaca fail CSV:", err);
          showToast('error', 'Gagal memproses fail CSV: ' + (err.message || 'Format fail tidak sah.'));
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const handleExportPaymentsCSV = (clientId?: string) => {
    let dataToExport = [];
    
    const recordsToExport = clientId ? records.filter(r => r.id === clientId) : records;
    
    for (const record of recordsToExport) {
      if (record.paymentHistory && record.paymentHistory.length > 0) {
        for (const payment of record.paymentHistory) {
          dataToExport.push({
            'ID Pelanggan': record.id,
            'Nama Pelanggan': record.nama,
            'ID Bayaran': payment.id,
            'Tarikh': payment.date,
            'Kaedah': payment.method,
            'Jumlah': payment.amount,
            'Nota': payment.notes || ''
          });
        }
      }
    }
    
    if (dataToExport.length === 0) {
      showToast('error', 'Tiada rekod bayaran dijumpai.');
      return;
    }
    
    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => headers.map(header => `"${String(row[header as keyof typeof row]).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', clientId ? `bayaran_${clientId}_${new Date().toISOString().split('T')[0]}.csv` : `semua_bayaran_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportPaymentsCSV = async (event: React.ChangeEvent<HTMLInputElement>, targetClientId?: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const parseNumeric = (val: any): number => {
      if (val === undefined || val === null) return 0;
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      const str = String(val).replace(/RM/gi, '').replace(/\s+/g, '').replace(/,/g, '').trim();
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };

    try {
      const text = await file.text();
      let rawRows = [];
      if (file.name.endsWith('.csv')) {
        rawRows = text.split('\n').map(row => {
          const match = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          return match ? match.map(item => item.replace(/^"|"$/g, '').trim()) : row.split(',').map(v => v.trim());
        }).filter(row => row.length > 0 && row.some(cell => cell !== ''));
      } else {
        showToast('error', 'Sila muat naik fail CSV sahaja.');
        return;
      }

      if (rawRows.length < 2) {
        showToast('error', 'Fail tidak mengandungi data bayaran.');
        return;
      }

      const headers = rawRows[0].map((h: string) => h.toLowerCase().trim());
      
      const idPelangganIdx = headers.findIndex(h => h.includes('id pelanggan') || h === 'id');
      const tarikhIdx = headers.findIndex(h => h.includes('tarikh') || h === 'date');
      const kaedahIdx = headers.findIndex(h => h.includes('kaedah') || h === 'method');
      const jumlahIdx = headers.findIndex(h => h.includes('jumlah') || h === 'amount');
      const notaIdx = headers.findIndex(h => h.includes('nota') || h === 'notes');

      if (tarikhIdx === -1 || jumlahIdx === -1) {
        showToast('error', 'Fail CSV mesti mengandungi lajur Tarikh dan Jumlah.');
        return;
      }

      const paymentsToAdd: { [clientId: string]: PaymentEntry[] } = {};
      let updatedCount = 0;

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        const rowClientId = idPelangganIdx !== -1 ? row[idPelangganIdx] : targetClientId;
        
        if (!rowClientId) continue;

        if (targetClientId && idPelangganIdx !== -1 && rowClientId !== targetClientId) {
          continue;
        }

        const amount = parseNumeric(row[jumlahIdx]);
        if (amount <= 0) continue;

        if (!paymentsToAdd[rowClientId]) {
          paymentsToAdd[rowClientId] = [];
        }

        paymentsToAdd[rowClientId].push({
          id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          date: row[tarikhIdx] || new Date().toISOString().split('T')[0],
          amount: amount,
          method: kaedahIdx !== -1 ? row[kaedahIdx] : 'Tunai',
          nota: notaIdx !== -1 ? row[notaIdx] : ''
        });
        updatedCount++;
      }

      if (updatedCount === 0) {
        showToast('error', 'Tiada data bayaran yang sah dijumpai dalam fail.');
        return;
      }

      const updatedRecords = records.map(record => {
        if (paymentsToAdd[record.id]) {
          const newPayments = [...(record.paymentHistory || []), ...paymentsToAdd[record.id]];
          let currentBalance = record.totalFee;
          let latestPaymentDate = '';
          newPayments.sort((a, b) => {
            const dateA = a.date.includes('/') ? parseDateObj(a.date).getTime() : new Date(a.date).getTime();
            const dateB = b.date.includes('/') ? parseDateObj(b.date).getTime() : new Date(b.date).getTime();
            return dateA - dateB;
          });
          
          for (let p of newPayments) {
            currentBalance -= p.amount;
            latestPaymentDate = p.date;
          }
          
          let updatedRecord = {
            ...record,
            paymentHistory: newPayments,
            bakiFeeTerkini: currentBalance,
            bakiSebelum: currentBalance + (newPayments.length > 0 ? newPayments[newPayments.length - 1].amount : 0)
          };
          if (latestPaymentDate) {
            updatedRecord.bayaranTerakhir = newPayments[newPayments.length - 1].amount;
            updatedRecord.tarikh = latestPaymentDate;
          }
          return updatedRecord;
        }
        return record;
      });

      if (db && user) {
        const batch = writeBatch(db);
        for (const clientId of Object.keys(paymentsToAdd)) {
          const record = updatedRecords.find(r => r.id === clientId);
          if (record) {
            const docRef = doc(db, `users/${user.uid}/records`, clientId);
            batch.update(docRef, {
              paymentHistory: record.paymentHistory,
              bakiFeeTerkini: record.bakiFeeTerkini,
              bakiSebelum: record.bakiSebelum,
              bayaranTerakhir: record.bayaranTerakhir,
              tarikh: record.tarikh
            });
          }
        }
        await batch.commit();
      }

      setRecords(updatedRecords);
      showToast('success', `${updatedCount} rekod bayaran berjaya diimport!`);
      
    } catch (error) {
      console.error("Error importing payments:", error);
      showToast('error', 'Gagal memproses fail CSV.');
    } finally {
      if (event.target) event.target.value = '';
      if (paymentsFileInputRef.current) paymentsFileInputRef.current.value = '';
      if (clientPaymentsFileInputRef.current) clientPaymentsFileInputRef.current.value = '';
      setImportPaymentsClientId(null);
    }
  };

  const handleAddNewRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordData.nama || !newRecordData.totalFee) return;
    const totalFee = parseFloat(newRecordData.totalFee);
    const bakiMileage = parseFloat(newRecordData.bakiMileage) || 0;
    const id = `C-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    const newRecord: CaseRecord & { userId?: string } = {
      id,
      nama: newRecordData.nama.trim(),
      kes: newRecordData.kes || 'Umum',
      totalFee: totalFee,
      bayaranTerakhir: 0,
      tarikh: formatDateDMY(newRecordData.tarikh),
      bakiSebelum: totalFee,
      bakiFeeTerkini: totalFee,
      bakiMileage: bakiMileage,
      paymentHistory: []
    };
    if (newRecordData.telefon) newRecord.telefon = newRecordData.telefon.trim();
    if (newRecordData.emel) newRecord.emel = newRecordData.emel.trim();
    if (newRecordData.alamat) newRecord.alamat = newRecordData.alamat.trim();
    if (newRecordData.nota) newRecord.nota = newRecordData.nota.trim();
    if (user) newRecord.userId = user.uid;

    setRecords(prev => [newRecord, ...prev]);
    localStorage.setItem('hma_case_records', JSON.stringify([newRecord, ...records]));
    if (user) {
      const targetPath = `users/${user.uid}/records/${id}`;
      try {
          await setDoc(doc(db, 'users', user.uid, 'records', id), newRecord);
      } catch(err) {
          handleFirestoreError(err, OperationType.WRITE, targetPath);
      }
    }

    setIsNewRecordModalOpen(false);
    setNewRecordData({
      nama: '',
      telefon: '',
      emel: '',
      alamat: '',
      kes: '',
      tarikh: new Date().toISOString().split('T')[0],
      totalFee: '',
      bakiMileage: '0',
      nota: ''
    });
    showToast('success', 'Rekod Klien Berjaya Didaftarkan');
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

    setRecords(prev => prev.map(rec => rec.id === mileageAdjustmentRecord.id ? updatedRecord : rec));
    if (user) {
      const targetPath = `users/${user.uid}/records/${mileageAdjustmentRecord.id}`;
      try {
          await setDoc(doc(db, 'users', user.uid, 'records', mileageAdjustmentRecord.id), { ...updatedRecord, userId: user.uid });
      } catch(err) {
          handleFirestoreError(err, OperationType.WRITE, targetPath);
      }
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
    
    setRecords(prev => prev.map(rec => rec.id === editingRecord.id ? editingRecord : rec));
    if (user) {
      const targetPath = `users/${user.uid}/records/${editingRecord.id}`;
      try {
          await setDoc(doc(db, 'users', user.uid, 'records', editingRecord.id), { ...editingRecord, userId: user.uid });
      } catch(err) {
          handleFirestoreError(err, OperationType.WRITE, targetPath);
      }
    }
    setEditingRecord(null);
  };

  const handleDeleteRecord = async () => {
    if (!deletingRecord) return;
    const targetId = String(deletingRecord.id);
    const targetRecord = deletingRecord;
    const previousRecords = [...records];

    setDeletingRecord(null);
    setExpandedRowId(null);

    // 1. Immediate optimistic UI update (removes item immediately from state and cache)
    setRecords(prev => {
      const remaining = prev.filter(rec => String(rec.id) !== targetId);
      localStorage.setItem('hma_case_records', JSON.stringify(remaining));
      return remaining;
    });

    if (user) {
      const targetPath = `users/${user.uid}/records/${targetId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'records', targetId));
        console.log(`[Firestore Success] Rekod ${targetId} berjaya dipadam dari awan.`);
        localStorage.setItem(`cloud_initialized_${user.uid}`, 'true');
        showToast('success', `Rekod "${targetRecord.nama || targetId}" berjaya dipadam dari awan.`);
      } catch(err: any) {
        console.error(`[Firestore Delete Error] Ralat memadam rekod:`, {
          recordId: targetId,
          userId: user.uid,
          errorMessage: err.message,
          errorCode: err.code,
          timestamp: new Date().toISOString()
        });

        // 2. REVERT ONLY IF FIRESTORE DELETE FAILS
        setRecords(previousRecords);
        localStorage.setItem('hma_case_records', JSON.stringify(previousRecords));

        let userMsg = `Gagal memadam rekod "${targetRecord.nama || targetId}" dari awan.`;
        let userDetail = 'Rekod telah dipulihkan semula ke dalam senarai anda.';
        if (err.code === 'permission-denied') {
          userMsg = 'Kebenaran ditolak oleh Firestore (Permission Denied). Rekod telah dipulihkan.';
          userDetail = 'Akaun anda tidak mempunyai kebenaran untuk memadam rekod ini.';
        } else if (err.code === 'unavailable') {
          userMsg = 'Tiada sambungan internet atau perkhidmatan Firestore tidak dapat dihubungi.';
          userDetail = 'Rekod telah dipulihkan semula. Sila semak sambungan anda.';
        } else if (err.message) {
          userDetail = `${err.message}. Rekod telah dipulihkan semula.`;
        }

        showToast('error', userMsg, userDetail);
        handleFirestoreError(err, OperationType.DELETE, targetPath);
      }
    } else {
      showToast('success', `Rekod "${targetRecord.nama || targetId}" dipadam secara setempat.`);
    }
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
      userId: user ? user.uid : ""
    };

    setRecords(prev => prev.map(rec => rec.id === settlingRecord.id ? updatedRecord : rec));
    if (user) {
      const targetPath = `users/${user.uid}/records/${settlingRecord.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'records', settlingRecord.id), updatedRecord);
        silentBackupToCloud(records.map(rec => rec.id === settlingRecord.id ? updatedRecord : rec));
      } catch(err) {
        handleFirestoreError(err, OperationType.WRITE, targetPath);
      }
    }

    setSettlingRecord(null);
  };

  const handleDeleteSelected = async () => {
    if (!selectedRecords.length) {
      setIsDeletingSelected(false);
      return;
    }
    const idsToDelete = new Set<string>(selectedRecords.map(id => String(id)));
    const targetIds: string[] = Array.from(idsToDelete);
    const count = targetIds.length;
    const previousRecords = [...records];
    const previousSelected = [...selectedRecords];

    setSelectedRecords([]);
    setIsDeletingSelected(false);

    // 1. Immediate optimistic UI update (removes selected items immediately)
    setRecords(prev => {
      const remaining = prev.filter(rec => !idsToDelete.has(String(rec.id)));
      localStorage.setItem('hma_case_records', JSON.stringify(remaining));
      return remaining;
    });

    if (user) {
      try {
        const batch = writeBatch(db);
        for (const id of targetIds) {
          batch.delete(doc(db, 'users', user.uid, 'records', String(id)));
        }
        await batch.commit();
        console.log(`[Firestore Success] ${targetIds.length} rekod berjaya dipadam dari awan (Kumpulan).`);
        localStorage.setItem(`cloud_initialized_${user.uid}`, 'true');
        showToast('success', `${count} rekod terpilih berjaya dipadam sepenuhnya dari awan.`);
      } catch(err: any) {
        console.error(`[Firestore Delete Error] Ralat memadam rekod (Kumpulan):`, {
          recordIds: targetIds,
          userId: user.uid,
          errorMessage: err.message,
          errorCode: err.code,
          timestamp: new Date().toISOString()
        });

        // 2. REVERT ONLY IF FIRESTORE DELETE FAILS
        setRecords(previousRecords);
        setSelectedRecords(previousSelected);
        localStorage.setItem('hma_case_records', JSON.stringify(previousRecords));

        let userMsg = `Gagal memadam ${count} rekod dari pangkalan data awan.`;
        let userDetail = 'Semua rekod terpilih telah dipulihkan semula.';
        if (err.code === 'permission-denied') {
          userMsg = 'Kebenaran ditolak oleh Firestore (Permission Denied). Rekod telah dipulihkan.';
          userDetail = 'Akaun anda tidak mempunyai akses memadam bagi rekod yang dipilih.';
        } else if (err.code === 'unavailable') {
          userMsg = 'Sambungan internet atau awan terputus. Semua rekod telah dipulihkan.';
          userDetail = 'Sila semak sambungan internet anda dan cuba lagi.';
        } else if (err.message) {
          userDetail = `${err.message}. Rekod telah dipulihkan semula.`;
        }

        showToast('error', userMsg, userDetail);
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/records`);
      }
    } else {
      showToast('success', `${count} rekod dipadam secara setempat.`);
    }
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
        userId: user ? user.uid : ""
    };

    setRecords(prev => prev.map(rec => rec.id === paymentRecord.id ? updatedRecord : rec));
    if (user) {
      const targetPath = `users/${user.uid}/records/${paymentRecord.id}`;
      try {
          await setDoc(doc(db, 'users', user.uid, 'records', paymentRecord.id), updatedRecord);
          // Trigger Auto-Save to Cloud
          silentBackupToCloud(records.map(rec => rec.id === paymentRecord.id ? updatedRecord : rec));
      } catch(err) {
          handleFirestoreError(err, OperationType.WRITE, targetPath);
      }
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

  const handlePrintAllSelected = () => {
    const queue = selectedRecords.map(id => records.find(r => r.id === id)).filter(Boolean) as import('./data').CaseRecord[];
    
    if (queue.length === 0) {
      alert("Tiada rekod pelanggan dipilih.");
      return;
    }
    
    combinedPdfInstanceRef.current = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    setIsGeneratingCombinedPDF(true);
    setCombinedPdfQueue(queue);
    setCombinedPdfCurrentIndex(0);
  };

  useEffect(() => {
    const processNextCombinedItem = async () => {
      if (combinedPdfQueue && combinedPdfInstanceRef.current && hiddenCombinedPdfPrintRef.current) {
        if (combinedPdfCurrentIndex < combinedPdfQueue.length) {
          // Allow DOM to update and images to load
          await new Promise(resolve => setTimeout(resolve, 300));
          
          try {
            const canvas = await html2canvas(hiddenCombinedPdfPrintRef.current, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = combinedPdfInstanceRef.current;
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgPropsHeight = (canvas.height * pdfWidth) / canvas.width;
            
            let heightLeft = imgPropsHeight;
            let position = 0;
            
            if (combinedPdfCurrentIndex > 0) {
               pdf.addPage();
            }
            
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
              position = heightLeft - imgPropsHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
              heightLeft -= pageHeight;
            }
            
            setCombinedPdfCurrentIndex(prev => prev + 1);
          } catch (err) {
            console.error("Failed to generate PDF for combined item", err);
            setCombinedPdfCurrentIndex(prev => prev + 1);
          }
        } else {
          // Finished all queue items
          const pdf = combinedPdfInstanceRef.current;
          pdf.save('Penyata_Ringkas_Keseluruhan.pdf');
          setIsGeneratingCombinedPDF(false);
          setCombinedPdfQueue([]);
          combinedPdfInstanceRef.current = null;
        }
      }
    };
    
    if (isGeneratingCombinedPDF && combinedPdfQueue.length > 0) {
      processNextCombinedItem();
    }
  }, [combinedPdfCurrentIndex, isGeneratingCombinedPDF, combinedPdfQueue]);

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
            const finalHeight = Math.min(imgPropsHeight, pageHeight);
            const finalWidth = (canvas.width * finalHeight) / canvas.height;
            const xOffset = (pdfWidth - finalWidth) / 2;
            pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);
            
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


  useEffect(() => {
    const processQuickPrint = async () => {
      if (quickPrintData && hiddenReceiptPrintRef.current) {
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
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
          const finalHeight = Math.min(imgPropsHeight, pageHeight);
          const finalWidth = (canvas.width * finalHeight) / canvas.height;
          const xOffset = (pdfWidth - finalWidth) / 2;
          
          pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);
          
          pdf.save(`Resit_${quickPrintData.record.nama.replace(/\s+/g, '_')}_${quickPrintData.payment.id}.pdf`);
        } catch (err) {
          console.error("Failed to generate PDF for quick print", err);
          alert("Ralat semasa menjana resit pantas.");
        } finally {
          setIsGeneratingQuickPrint(false);
          setQuickPrintId(null);
          setQuickPrintData(null);
        }
      }
    };

    if (isGeneratingQuickPrint && quickPrintData) {
      processQuickPrint();
    }
  }, [quickPrintData, isGeneratingQuickPrint]);

  const handleExportCSV = () => {
    const headers = [
      'ID Rekod',
      'Nama Pelanggan',
      'No Telefon',
      'Emel',
      'Alamat',
      'Kategori Kes',
      'Nota Kes',
      'Tarikh',
      'Total Fee',
      'Bayaran Terakhir',
      'Baki Sebelum',
      'Baki Fee Terkini',
      'Baki Mileage'
    ];
    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvData = '\uFEFF' + [
      headers.join(','),
      ...filteredRecords.map(r => 
        [
          escapeCsv(r.id || ''),
          escapeCsv(r.nama || ''),
          escapeCsv(r.telefon || ''),
          escapeCsv(r.emel || ''),
          escapeCsv(r.alamat || ''),
          escapeCsv(r.kes || ''),
          escapeCsv(r.nota || ''),
          escapeCsv(formatDateDMY(r.tarikh)),
          (Number(r.totalFee) || 0).toFixed(2),
          (Number(r.bayaranTerakhir) || 0).toFixed(2),
          (Number(r.bakiSebelum) || 0).toFixed(2),
          (Number(r.bakiFeeTerkini) || 0).toFixed(2),
          (Number(r.bakiMileage) || 0).toFixed(2)
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Senarai_Pelanggan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      const finalHeight = Math.min(imgPropsHeight, pageHeight);
      const finalWidth = (canvas.width * finalHeight) / canvas.height;
      const xOffset = (pdfWidth - finalWidth) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);

      pdf.save(`Penyata_Ringkas_${simpleStatementRecord.nama.replace(/\s+/g, '_')}_${simpleStatementRecord.id}.pdf`);
      const pdfBlob = pdf.output('blob');
      if (user) {
        try {
          const storageRef = ref(storage, `statements/${user.uid}/${simpleStatementRecord.id}_ringkas.pdf`);
          await uploadBytes(storageRef, pdfBlob);
          const url = await getDownloadURL(storageRef);
          await setDoc(doc(db, 'users', user.uid, 'records', simpleStatementRecord.id), { statementUrl: url }, { merge: true });
          setRecords(prev => prev.map(r => r.id === simpleStatementRecord.id ? { ...r, statementUrl: url } : r));
        } catch (err) {
          console.error('Failed to upload PDF', err);
        }
      }
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
      const pdfBlob = pdf.output('blob');
      if (user) {
        try {
          const storageRef = ref(storage, `statements/${user.uid}/${statementRecord.id}.pdf`);
          await uploadBytes(storageRef, pdfBlob);
          const url = await getDownloadURL(storageRef);
          await setDoc(doc(db, 'users', user.uid, 'records', statementRecord.id), { statementUrl: url }, { merge: true });
          setRecords(prev => prev.map(r => r.id === statementRecord.id ? { ...r, statementUrl: url } : r));
        } catch (err) {
          console.error('Failed to upload PDF', err);
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadInvoicePDF = async () => {
    if (!invoicePrintRef.current || !invoiceRecord) return;
    
    setIsGeneratingInvoicePDF(true);
    try {
      const canvas = await html2canvas(invoicePrintRef.current, {
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
      const finalHeight = Math.min(imgPropsHeight, pageHeight);
      const finalWidth = (canvas.width * finalHeight) / canvas.height;
      const xOffset = (pdfWidth - finalWidth) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);
      
      const safeName = invoiceRecord.nama.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${invoiceType === 'INVOIS' ? 'Invois' : 'Sebut_Harga'}_${safeName}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
    } finally {
      setIsGeneratingInvoicePDF(false);
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

  
  
  // Filter records
  const filteredRecords = useMemo(() => {
    const list = records.filter(record => {
      const matchesSearch = record.nama.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesKes = filterKes === 'Semua' || record.kes.toLowerCase() === filterKes.toLowerCase();
      
      let matchesDate = true;
      if (filterStartDate || filterEndDate) {
        const recordDate = parseDateObj(record.tarikh).getTime();
        
        if (filterStartDate && filterEndDate) {
            const sDate = parseDateObj(filterStartDate);
            sDate.setHours(0, 0, 0, 0);
            const eDate = parseDateObj(filterEndDate);
            eDate.setHours(23, 59, 59, 999);
            matchesDate = recordDate >= sDate.getTime() && recordDate <= eDate.getTime();
        } else if (filterStartDate) {
            const sDate = parseDateObj(filterStartDate);
            sDate.setHours(0, 0, 0, 0);
            matchesDate = recordDate >= sDate.getTime();
        } else if (filterEndDate) {
            const eDate = parseDateObj(filterEndDate);
            eDate.setHours(23, 59, 59, 999);
            matchesDate = recordDate <= eDate.getTime();
        }
      }

      return matchesSearch && matchesKes && matchesDate;
    });

    if (nameSortOrder) {
      list.sort((a, b) => {
        const nameA = (a.nama || '').toLowerCase();
        const nameB = (b.nama || '').toLowerCase();
        return nameSortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    } else if (dateSortOrder === 'asc') {
      list.sort((a, b) => {
        const timeA = parseDateObj(a.tarikh).getTime();
        const timeB = parseDateObj(b.tarikh).getTime();
        return timeA - timeB;
      });
    } else {
      // Tetapan Lalai: Susun mengikut tarikh terkini (newest first)
      list.sort((a, b) => {
        const timeA = parseDateObj(a.tarikh).getTime();
        const timeB = parseDateObj(b.tarikh).getTime();
        return timeB - timeA;
      });
    }

    return list;
  }, [searchTerm, filterKes, filterStartDate, filterEndDate, records, dateSortOrder, nameSortOrder]);

// Derive summary statistics
  const stats = useMemo(() => {
    const now = new Date().getTime();
    const overdueMs = overdueDays * 24 * 60 * 60 * 1000;
    
    return filteredRecords.reduce((acc, curr) => {
      acc.totalFee += curr.totalFee;
      acc.totalBakiTerkini += curr.bakiFeeTerkini;
      acc.totalMileage += curr.bakiMileage;
      
      if (curr.bakiFeeTerkini > 0) {
        let lastDateStr = curr.tarikh;
        if (curr.paymentHistory && curr.paymentHistory.length > 0) {
          const sortedHistory = [...curr.paymentHistory].sort((a: any, b: any) => parseDateObj(b.date).getTime() - parseDateObj(a.date).getTime());
          lastDateStr = sortedHistory[0].date;
        }
        const lastDate = parseDateObj(lastDateStr).getTime();
        if ((now - lastDate) >= overdueMs) {
          acc.totalOverdueCases++;
          acc.totalOverdueAmount += curr.bakiFeeTerkini;
        }
      }
      
      return acc;
    }, { totalFee: 0, totalBakiTerkini: 0, totalMileage: 0, totalKes: filteredRecords.length, totalOverdueCases: 0, totalOverdueAmount: 0 });
  }, [filteredRecords, overdueDays]);

// Compute chart data for balances by category
  const chartData = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredRecords.forEach(record => {
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
  }, [filteredRecords]);

// Extract unique cases for the dropdown
  const uniqueKes = useMemo(() => {
    const list = new Set(records.map(r => r.kes));
    return ['Semua', ...Array.from(list)];
  }, []);

  // Visual badges with distinctive harmonious tints for case categories
  const getKesBadge = (kes: string) => {
    const raw = (kes || '').trim();
    const upper = raw.toUpperCase();
    
    let style = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700/80";
    if (upper.includes('TAAT') || upper.includes('K.TAAT') || upper.includes('NUSYUZ')) {
      style = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/50";
    } else if (upper.includes('RAYUAN')) {
      style = "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/50";
    } else if (upper.includes('PUSAKA') || upper.includes('FARAID') || upper.includes('WASIAT')) {
      style = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50";
    } else if (upper.includes('CERAI') || upper.includes('FASAKH') || upper.includes('KHULU') || upper.includes('TAALIK')) {
      style = "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/50";
    } else if (upper.includes('HADHANAH') || upper.includes('ANAK') || upper.includes('NAFKAH') || upper.includes('JAGAAN')) {
      style = "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/50";
    } else if (upper.includes('POLIGAMI') || upper.includes('NIKAH') || upper.includes('WALI')) {
      style = "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/50";
    } else if (upper.includes('HARTA') || upper.includes('SEPENCARIAN')) {
      style = "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800/50";
    } else if (upper.includes('JENAYAH')) {
      style = "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200/80 dark:border-red-800/50";
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${style} shrink-0 tracking-tight`}>
        {raw || 'Umum'}
      </span>
    );
  };

  
  // Export functions removed


    const renderExpandedDetails = (record: any) => (
<div className="p-4 sm:p-6 m-2 sm:m-4 bg-[#ffffff] dark:bg-zinc-900 border border-[#e4e4e7]  rounded-xl shadow-sm">
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
    <div>
      <h4 className="text-sm font-semibold text-[#18181b] dark:text-white  mb-4 flex items-center gap-2">
        <FileText size={16} className="text-blue-500"/> Maklumat Kes
      </h4>
      <div className="space-y-3 text-sm">
        <p className="flex justify-between items-center"><span className="text-[#71717a] dark:text-[#a1a1aa]">ID Rekod</span> <span className="font-mono text-[#18181b] dark:text-white  bg-zinc-100 darkdark:bg-zinc-800 px-2 py-0.5 rounded">{record.id}</span></p>
        <p className="flex justify-between items-center"><span className="text-[#71717a] dark:text-[#a1a1aa]">Kategori</span> <span className="font-medium text-[#18181b] dark:text-white ">{record.kes}</span></p>
        <p className="flex justify-between items-center"><span className="text-[#71717a] dark:text-[#a1a1aa]">Dikemaskini</span> <span className="text-[#18181b] dark:text-white ">{formatDateDMY(record.tarikh)}</span></p>
        {record.nota && (
          <div className="pt-2 mt-2 border-t border-[#f4f4f5] ">
            <p className="text-[#71717a] dark:text-[#a1a1aa] mb-1">Nota / Ringkasan</p>
            <p className="text-[#18181b] dark:text-white  whitespace-pre-line">{record.nota}</p>
          </div>
        )}
      </div>
    </div>
    <div>
      <h4 className="text-sm font-semibold text-[#18181b] dark:text-white  mb-4 flex items-center gap-2">
        <Wallet size={16} className="text-blue-500"/> Pecahan Kewangan
      </h4>
      <div className="space-y-3 text-sm">
        <p className="flex justify-between items-center"><span className="text-[#71717a] dark:text-[#a1a1aa]">Jumlah Fee</span> <span className="font-mono text-[#18181b] dark:text-white ">{formatRM(record.totalFee)}</span></p>
        <p className="flex justify-between items-center"><span className="text-[#71717a] dark:text-[#a1a1aa]">Baki Terdahulu</span> <span className="font-mono text-[#18181b] dark:text-white ">{formatRM(record.bakiSebelum)}</span></p>
        <p className="flex justify-between items-center"><span className="text-[#71717a] dark:text-[#a1a1aa]">Bayaran Terakhir</span> <span className="font-mono font-medium text-[#059669] dark:text-emerald-500">{record.bayaranTerakhir > 0 ? '+' : ''}{formatRM(record.bayaranTerakhir)}</span></p>
        <div className="flex justify-between items-center">
          <span className="text-[#71717a] dark:text-[#a1a1aa]">Baki Terkini</span>
          <div className="flex items-center gap-1.5">
            <span className={`font-mono font-bold ${record.bakiFeeTerkini > 2000 ? 'text-red-600 dark:text-red-400' : 'text-[#18181b] dark:text-white '}`}>
              {formatRM(record.bakiFeeTerkini)}
            </span>
              <button 
                onClick={() => setPaymentRecord(record)}
                className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline flex items-center cursor-pointer"
                title="Buat Bayaran"
              >
                (Bayar)
              </button>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 mt-2 border-t border-[#f4f4f5] ">
          <span className="text-[#71717a] dark:text-[#a1a1aa]">Baki Mileage</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-medium text-[#d97706] dark:text-amber-500">
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
        <h4 className="text-sm font-semibold text-[#18181b] dark:text-white  flex items-center gap-2">
          <History size={16} className="text-blue-500"/> Rekod Bayaran
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => handleExportPaymentsCSV(record.id)}
            className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 dark:text-teal-400 px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-sm border border-teal-200 dark:border-teal-800/50"
            title="Eksport Bayaran (CSV)"
          >
            <Download size={12} />
            <span className="hidden lg:inline">Eksport</span>
          </button>
          <button 
            onClick={() => { setImportPaymentsClientId(record.id); clientPaymentsFileInputRef.current?.click(); }}
            className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-400 px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-sm border border-purple-200 dark:border-purple-800/50"
            title="Import Bayaran (CSV)"
          >
            <Upload size={12} />
            <span className="hidden lg:inline">Import</span>
          </button>
          <button 
            onClick={() => setStatementRecord(record)}
            className="text-xs bg-zinc-100 hover:bg-zinc-200 text-[#3f3f46] dark:text-zinc-200 darkdark:bg-zinc-800 dark:hover:bg-zinc-700  px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-sm border border-[#e4e4e7] "
            title="Cetak Penyata Akaun Penuh"
          >
            <Printer size={12} />
            <span>Penyata Penuh</span>
          </button>
          <button 
            onClick={() => setSimpleStatementRecord(record)}
            className="text-xs bg-zinc-100 hover:bg-zinc-200 text-[#3f3f46] dark:text-zinc-200 darkdark:bg-zinc-800 dark:hover:bg-zinc-700  px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-sm border border-[#e4e4e7] "
            title="Cetak Penyata Ringkas"
          >
            <Printer size={12} />
            <span>Penyata Ringkas</span>
          </button>
          <button 
            onClick={() => { setInvoiceType('INVOIS'); setInvoiceRecord(record); }}
            className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-sm border border-emerald-200 dark:border-emerald-800/50"
            title="Cetak Invois / Sebut Harga"
          >
            <FileText size={12} />
            <span>Invois</span>
          </button>
            <button 
              onClick={() => setPaymentRecord(record)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 shadow-sm hover:shadow-md hover:-translate-y-0.5 animate-subtle-pulse"
              title="Tambah Bayaran"
            >
              <Plus size={12} />
              <span>+ Bayaran</span>
            </button>
        </div>
      </div>
      {record.paymentHistory && record.paymentHistory.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-[#e4e4e7] ">
          <table className="w-full text-left text-[13px] md:whitespace-nowrap">
            <thead className="bg-[#fafafa] dark:bg-zinc-900 text-[#71717a] dark:text-[#a1a1aa] uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3 border-r border-[#f4f4f5] /50">ID</th>
                <th 
                  className="px-4 py-3 border-r border-[#f4f4f5] /50 cursor-pointer hover:bg-zinc-100 dark:hoverdark:bg-zinc-800 transition-colors group"
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
                    <span className="text-[#a1a1aa]">
                      {paymentSortColumn === 'date' ? (paymentSortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUp size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3 border-r border-[#f4f4f5] /50">Kaedah</th>
                <th className="px-4 py-3 border-r border-[#f4f4f5] /50">Nota</th>
                <th 
                  className="px-4 py-3 border-r border-[#f4f4f5] /50 cursor-pointer hover:bg-zinc-100 dark:hoverdark:bg-zinc-800 transition-colors group text-right"
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
                    <span className="text-[#a1a1aa]">
                      {paymentSortColumn === 'amount' ? (paymentSortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUp size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
                    </span>
                    Fee (RM)
                  </div>
                </th>
                <th className="px-4 py-3 border-r border-[#f4f4f5] /50 text-right">Mileage (RM)</th>
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
                <tr key={payment.id} className="border-b border-[#f4f4f5] /50 last:border-0 hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-2 border-r border-[#f4f4f5] /50 text-[#71717a] dark:text-[#a1a1aa] font-mono text-xs">{payment.id}</td>
                  <td className="px-4 py-2 border-r border-[#f4f4f5] /50 text-[#3f3f46] dark:text-zinc-200  font-mono text-[11px]">{formatDateDMY(payment.date)}</td>
                  <td className="px-4 py-2 border-r border-[#f4f4f5] /50 text-[#3f3f46] dark:text-zinc-200  text-xs">{payment.method}</td>
                  <td className="px-4 py-2 border-r border-[#f4f4f5] /50 text-[#52525b] dark:text-[#a1a1aa] text-xs max-w-[160px] truncate" title={payment.nota || ''}>
                    {payment.nota || <span className="text-[#a1a1aa] dark:text-[#52525b] dark:text-zinc-300 italic">-</span>}
                  </td>
                  <td className="px-4 py-2 border-r border-[#f4f4f5] /50 text-right text-[#059669] dark:text-emerald-500 font-medium font-mono text-sm">
                    {payment.amount ? '+' + formatRM(payment.amount) : '-'}
                  </td>
                  <td className="px-4 py-2 border-r border-[#f4f4f5] /50 text-right text-[#d97706] dark:text-amber-500 font-medium font-mono text-sm">
                    {payment.mileageAmount ? '+' + formatRM(payment.mileageAmount) : '-'}
                  </td>
                  <td className="px-4 py-2 text-center flex justify-center gap-2">
                    <button 
                      title="Papar Resit"
                      onClick={() => setReceiptData({record, payment})}
                      className="p-1 text-blue-500 hover:text-blue-700 transition-colors rounded hover:bg-blue-50"
                    >
                      <FileText size={14} />
                    </button>
                    <button 
                      title="Cetak Pantas (Muat Turun PDF)"
                      onClick={() => {
                        setQuickPrintData({record, payment});
                        setQuickPrintId(payment.id);
                        setIsGeneratingQuickPrint(true);
                      }}
                      disabled={quickPrintId === payment.id}
                      className="p-1 text-[#059669] hover:text-emerald-700 transition-colors rounded hover:bg-emerald-50 disabled:opacity-50"
                    >
                      {quickPrintId === payment.id ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                    </button>
                    <button 
                      title="Kemaskini Bayaran"
                      onClick={() => {
                        setEditingPaymentDetails({record, payment});
                        setEditingPaymentAmount((payment.amount || 0).toString());
                        setEditingPaymentMileage((payment.mileageAmount || 0).toString());
                        setEditingPaymentDate(formatDateISO(payment.date));
                        setEditingPaymentMethod(payment.method || 'Cash');
                        setEditingPaymentNote(payment.nota || '');
                      }}
                      className="p-1 text-amber-500 hover:text-amber-700 transition-colors rounded hover:bg-amber-50"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      title="Padam Bayaran"
                      onClick={async () => {
                        if (window.confirm('Padam rekod bayaran ini?')) {
                          const previousRecords = [...records];
                          const newHistory = record.paymentHistory.filter((p: any) => p.id !== payment.id);
                          const updatedRecord = {
                            ...record,
                            paymentHistory: newHistory,
                            bakiFeeTerkini: record.bakiFeeTerkini + payment.amount,
                            bakiMileage: record.bakiMileage + (payment.mileageAmount || 0),
                            bayaranTerakhir: newHistory.length > 0 ? newHistory[0].amount : 0
                          };
                          
                          // Immediate optimistic UI update
                          setRecords((prev: any) => {
                            const updated = prev.map((r: any) => r.id === record.id ? updatedRecord : r);
                            localStorage.setItem('hma_case_records', JSON.stringify(updated));
                            return updated;
                          });

                          if (user) {
                            const targetPath = `users/${user.uid}/records/${record.id}`;
                            try {
                              await setDoc(doc(db, 'users', user.uid, 'records', record.id), updatedRecord);
                              showToast('success', 'Rekod bayaran berjaya dipadam dari awan.');
                            } catch (err: any) {
                              // Revert ONLY if Firestore update fails
                              setRecords(previousRecords);
                              localStorage.setItem('hma_case_records', JSON.stringify(previousRecords));
                              showToast('error', 'Gagal memadam rekod bayaran dari awan. Rekod dipulihkan.', err.message);
                              handleFirestoreError(err, OperationType.WRITE, targetPath);
                            }
                          } else {
                            showToast('success', 'Rekod bayaran dipadam secara setempat.');
                          }
                        }
                      }}
                      className="text-[#a1a1aa] dark:text-[#71717a] dark:text-[#a1a1aa] hover:text-red-600 p-1 rounded transition-colors"
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
        <div className="text-center p-4 bg-[#fafafa] dark:bg-zinc-900 border border-[#e4e4e7]  rounded-sm text-[#71717a] dark:text-[#a1a1aa] text-sm">
          Tiada rekod bayaran buat masa ini.
        </div>
      )}
    </div>
  </div>
</div>
  );

  if (!authReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#fafafa] dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 size={36} className="text-blue-600 animate-spin" />
          <p className="text-[#71717a] dark:text-[#a1a1aa] text-sm font-medium">Sila tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#fafafa] dark:bg-zinc-950 px-4">
        <div className="w-full max-w-md bg-[#ffffff] dark:bg-zinc-900 rounded-2xl shadow-xl border border-[#f4f4f5]  p-8 flex flex-col items-center animate-fade-in">
          <div className="flex flex-col items-center gap-3 mb-8">
            <img src="https://arleta.site/interactivelink/2510/logo.png" className="h-16 w-auto" alt="Logo" />
            <div className="text-center">
              <span className="font-bold text-lg tracking-tight text-[#18181b] dark:text-white uppercase leading-tight block">HAIRI MUSTAFA</span>
              <span className="font-bold text-[12px] tracking-widest text-blue-600 dark:text-blue-400 uppercase leading-none block mt-1">ASSOCIATES</span>
            </div>
            <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] text-center mt-3 max-w-[280px]">
              Sistem Pengurusan Rekod Pelanggan & Penerbitan Resit Peguam Syarie
            </p>
          </div>

          <div className="w-full space-y-4">
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#e4e4e7]  rounded-xl bg-[#ffffff] dark:bg-zinc-950 hover:bg-[#fafafa] dark:hover:bg-zinc-900 text-[#3f3f46] dark:text-zinc-200  font-medium transition-all shadow-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
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
            <p className="text-[10px] text-[#a1a1aa] dark:text-[#71717a] dark:text-[#a1a1aa] font-medium">
              Sila log masuk untuk mengakses data dan resit syarikat.
            </p>
            <p className="text-[10px] text-[#a1a1aa] dark:text-[#71717a] dark:text-[#a1a1aa] mt-2">
              Hak Cipta Terpelihara &copy; {new Date().getFullYear()} Hairi Mustafa Associates
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#fafafa] dark:bg-black font-sans overflow-hidden text-[#18181b] dark:text-white ">
      
      {/* Sidebar for Desktop */}

      <aside className="w-64 bg-[#ffffff] dark:bg-zinc-950 border-r border-[#f4f4f5] dark:border-[#18181b] hidden md:flex flex-col z-30 shrink-0 print:hidden relative">
        <div className="h-16 flex items-center px-6 border-b border-[#f4f4f5] dark:border-[#18181b] shrink-0">
          <div className="flex items-center gap-2">
            <img src="https://arleta.site/interactivelink/2510/logo.png" className="h-8 w-auto" alt="Logo" />
            <span className="font-bold text-[12px] tracking-tight text-[#18181b] dark:text-white uppercase leading-tight">HAIRI MUSTAFA <span className="text-blue-600 block">ASSOCIATES</span></span>
          </div>
        </div>
        
        <div className="px-6 py-5 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar mask-edges">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0 border border-[#e4e4e7] ">
              <span className="font-bold text-[#52525b] dark:text-[#a1a1aa]">HM</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-[#18181b] dark:text-white ">Hairi Mustafa</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 truncate">Peguam Syarie</p>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#a1a1aa] dark:text-[#71717a] dark:text-[#a1a1aa] mt-4 font-medium">Pengurusan Kes</div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-zinc-100 dark:bg-zinc-900 text-[#18181b] dark:text-white' : 'text-[#71717a] dark:text-[#a1a1aa] hover:text-[#18181b] dark:text-white dark:hover:text-white hover:bg-[#fafafa] dark:hover:bg-zinc-900/50'}`}
          >
            Papan Pemuka
          </button>
          <button 
            onClick={() => { setActiveTab('records'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'records' ? 'bg-zinc-100 dark:bg-zinc-900 text-[#18181b] dark:text-white' : 'text-[#71717a] dark:text-[#a1a1aa] hover:text-[#18181b] dark:text-white dark:hover:text-white hover:bg-[#fafafa] dark:hover:bg-zinc-900/50'}`}
          >
            Rekod Pelanggan
          </button>

          <button 
            onClick={() => { { setActiveTab('standalone'); setIsMobileMenuOpen(false); }; setStandaloneInitialRecord(null); }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'standalone' ? 'bg-zinc-100 dark:bg-zinc-900 text-[#18181b] dark:text-white' : 'text-[#71717a] dark:text-[#a1a1aa] hover:text-[#18181b] dark:text-white dark:hover:text-white hover:bg-[#fafafa] dark:hover:bg-zinc-900/50'}`}
          >
            Paparan Resit
          </button>
          
          <button 
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-zinc-100 dark:bg-zinc-900 text-[#18181b] dark:text-white' : 'text-[#71717a] dark:text-[#a1a1aa] hover:text-[#18181b] dark:text-white dark:hover:text-white hover:bg-[#fafafa] dark:hover:bg-zinc-900/50'}`}
          >
            Tetapan
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#ffffff] dark:bg-zinc-950 pb-[64px] md:pb-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-[#f4f4f5] dark:border-[#18181b] flex items-center justify-between px-3 sm:px-6 lg:px-8 shrink-0 print:hidden z-10 bg-[#ffffff] dark:bg-zinc-950">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile Logo & Drawer Trigger */}
            <div className="flex items-center gap-2 md:hidden shrink-0">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 -ml-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                title="Buka Menu"
                aria-label="Menu"
              >
                <Menu size={20} />
              </button>
              <img src="https://arleta.site/interactivelink/2510/logo.png" className="h-7 w-auto" alt="Logo" />
            </div>
            <h1 className="text-sm sm:text-base md:text-lg font-semibold text-[#18181b] dark:text-white tracking-tight truncate">
              {activeTab === 'dashboard' ? 'Papan Pemuka' : activeTab === 'records' ? 'Rekod Pelanggan' : activeTab === 'settings' ? 'Tetapan' : 'Paparan Resit'}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Tindakan Utama: Tambah Klien Baharu */}
            <button 
              onClick={() => setIsNewRecordModalOpen(true)}
              className="p-2 sm:px-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-xs active:scale-95"
              title="Tambah Klien Baharu"
              aria-label="Tambah Klien Baharu"
            >
              <Plus size={18} className="stroke-[2.5]" />
              <span className="hidden sm:inline text-xs font-semibold">+ Klien</span>
            </button>

            {/* Input fail tersembunyi untuk Import CSV */}
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={handleImportCSV} 
              className="hidden" 
            />
            <input 
              type="file" 
              accept=".csv" 
              ref={paymentsFileInputRef} 
              onChange={(e) => handleImportPaymentsCSV(e)} 
              className="hidden" 
            />
            <input 
              type="file" 
              accept=".csv" 
              ref={clientPaymentsFileInputRef} 
              onChange={(e) => handleImportPaymentsCSV(e, importPaymentsClientId || undefined)} 
              className="hidden" 
            />

            {/* Kelompok Fungsi Harian & Pengurusan */}
            <div className="flex items-center bg-zinc-100/80 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 gap-0.5">
              {/* Status Online / Offline */}
              {user && (
                <div 
                  className={`p-1.5 flex items-center justify-center rounded-lg ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}
                  title={isOnline ? "Auto-Sync Aktif" : "Mod Luar Talian (Offline)"}
                >
                  <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                </div>
              )}

              {/* Butang Refresh */}
              {user && (
                <button 
                  onClick={handleRefreshData}
                  disabled={isRefreshing}
                  className="p-1.5 text-zinc-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  title="Muat Semula Data dari Cloud"
                  aria-label="Refresh Data"
                >
                  {isRefreshing ? <Loader2 size={17} className="animate-spin text-emerald-600" /> : <RefreshCw size={17} />}
                </button>
              )}

              {/* Butang Sync Google Sheets */}
              <button 
                onClick={handleSyncGoogleSheets}
                disabled={isSyncingSheets}
                className="p-1.5 text-zinc-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                title="Segerakkan dengan Google Sheets"
                aria-label="Sync Sheets"
              >
                {isSyncingSheets ? <Loader2 size={17} className="animate-spin text-emerald-600" /> : <Cloud size={17} />}
              </button>

              {/* MENU LUNGSUR: PENGURUSAN DATA (Backup, Eksport, Import, CSV, Format) */}
              <div className="relative" ref={dataMenuRef}>
                <button 
                  onClick={() => setIsDataMenuOpen(!isDataMenuOpen)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isDataMenuOpen
                      ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800'
                  }`}
                  title="Pengurusan Data (Backup, Eksport, Import, CSV, Format)"
                  aria-label="Pengurusan Data"
                >
                  <Database size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="hidden md:inline font-semibold">Pengurusan Data</span>
                  <ChevronDown size={13} className={`hidden md:inline transition-transform duration-200 ${isDataMenuOpen ? 'rotate-180' : ''}`} />
                  <MoreVertical size={16} className="md:hidden" />
                </button>

                {/* Dropdown Menu Modal */}
                <AnimatePresence>
                  {isDataMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xl p-1.5 z-50 overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/80 mb-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          Pengurusan Data &amp; Fail
                        </p>
                      </div>

                      {/* 1. Backup Cloud */}
                      {user && (
                        <button
                          onClick={() => { setIsDataMenuOpen(false); handleBackupToCloud(); }}
                          disabled={isBackingUp}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            {isBackingUp ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <CloudUpload size={16} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Simpan Sandaran (Backup)</p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Muat naik ke Cloud Firestore</p>
                          </div>
                        </button>
                      )}

                      {/* 2. Eksport Excel */}
                      <button
                        onClick={() => { setIsDataMenuOpen(false); handleExportDataLengkapExcel(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Download size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Eksport Penuh ke Excel</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Fail hamparan .xlsx lengkap</p>
                        </div>
                      </button>

                      {/* Eksport Bayaran (CSV) */}
                      <button
                        onClick={() => { setIsDataMenuOpen(false); handleExportPaymentsCSV(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                          <Download size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Eksport Bayaran (CSV)</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Hanya rekod bayaran klien</p>
                        </div>
                      </button>

                      {/* 3. Import CSV */}
                      <button
                        onClick={() => { setIsDataMenuOpen(false); fileInputRef.current?.click(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Upload size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Import Fail CSV</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Masukkan rekod klien CSV</p>
                        </div>
                      </button>

                      {/* Import Bayaran (CSV) */}
                      <button
                        onClick={() => { setIsDataMenuOpen(false); setImportPaymentsClientId(null); paymentsFileInputRef.current?.click(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Upload size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Import Bayaran (CSV)</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Masukkan rekod bayaran</p>
                        </div>
                      </button>

                      {/* 4. Templat CSV */}
                      <button
                        onClick={() => { setIsDataMenuOpen(false); handleDownloadTemplate(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Muat Turun Templat CSV</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Format lajur piawai</p>
                        </div>
                      </button>

                      {/* 5. Sandaran JSON Fail */}
                      <button
                        onClick={() => { setIsDataMenuOpen(false); handleExportDBToDrive(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Save size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Sandaran Fail JSON</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Muat turun fail JSON</p>
                        </div>
                      </button>

                      {/* Divider */}
                      <div className="my-1.5 border-t border-zinc-100 dark:border-zinc-800" />

                      {/* 6. Kosongkan / Format Data */}
                      <button
                        onClick={() => { setIsDataMenuOpen(false); handleFormatData(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-100/70 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                          <Trash2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-red-600 dark:text-red-400">Kosongkan / Format Data</p>
                          <p className="text-[10px] text-red-500/80 truncate">Padam semua rekod sistem</p>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Ikon Tetapan Pantas */}
              <button 
                onClick={() => setActiveTab('settings')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800'
                }`}
                title="Tetapan Sistem"
                aria-label="Tetapan"
              >
                <Settings size={17} />
              </button>

              {/* Tukar Tema (Siang / Gelap) */}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title={darkMode ? "Tukar ke Mod Siang" : "Tukar ke Mod Gelap"}
                aria-label="Tukar Tema"
              >
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              {/* PWA Pasang */}
              {isInstallable && (
                <button 
                  onClick={handleInstallApp}
                  className="p-1.5 text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Pasang Aplikasi (PWA)"
                  aria-label="Pasang Aplikasi"
                >
                  <Smartphone size={17} />
                </button>
              )}

              {/* Profil Pengguna / Log Masuk / Log Keluar */}
              {!user ? (
                <button 
                  onClick={handleLogin}
                  className="p-1.5 text-zinc-700 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Log Masuk Akaun Google"
                  aria-label="Log Masuk"
                >
                  <LogIn size={17} />
                  <span className="hidden sm:inline text-xs font-semibold">Log Masuk</span>
                </button>
              ) : (
                <button 
                  onClick={handleLogout}
                  className="p-1.5 text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title={`Log Keluar (${user.email || 'Akaun'})`}
                  aria-label="Log Keluar"
                >
                  <LogOut size={17} />
                </button>
              )}
            </div>
          </div>
        </header>


        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <AnimatePresence mode="wait">
            {/* Settings Tab Content */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col overflow-hidden min-h-0"
              >
                <div className={`flex-1 px-4 sm:px-6 md:px-8 pb-20 sm:pb-6 md:pb-8 min-h-0 flex flex-col gap-6 print:hidden overflow-y-auto`}>
              <div className="flex flex-col gap-6 pb-10 max-w-2xl">
                <div className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-sm border border-[#f4f4f5]  overflow-hidden">
                  <div className="p-4 border-b border-[#f4f4f5] ">
                    <h2 className="text-sm font-bold text-[#18181b] dark:text-white ">Tetapan & Tindakan</h2>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 darkdark:bg-zinc-800 rounded-lg text-[#52525b] dark:text-[#a1a1aa]">
                          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </div>
                        <span className="text-sm font-medium text-[#27272a] dark:text-[#e4e4e7]">{darkMode ? "Mod Siang" : "Mod Gelap"}</span>
                      </div>
                      <ChevronRight size={18} className="text-[#a1a1aa]" />
                    </button>
                    <button onClick={() => setAutoBackupEnabled(!autoBackupEnabled)} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                          <Cloud size={18} />
                        </div>
                        <span className="text-sm font-medium text-[#27272a] dark:text-[#e4e4e7]">Auto-Backup (Setiap Perubahan)</span>
                      </div>
                      <div className="text-[#a1a1aa]">
                        {autoBackupEnabled ? <ToggleRight size={24} className="text-blue-500" /> : <ToggleLeft size={24} />}
                      </div>
                    </button>
                    <button onClick={handleToggleAutoSyncSheets} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                          <RefreshCw size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#27272a] dark:text-[#e4e4e7]">Auto-Sync ke Google Sheets</span>
                          {autoSyncSheetsEnabled && !cachedAccessToken && <span className="text-xs text-red-500">Klik semula untuk sahkan sambungan</span>}
                        </div>
                      </div>
                      <div className="text-[#a1a1aa]">
                        {autoSyncSheetsEnabled ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} />}
                      </div>
                    </button>
                    {!user ? (
                      <button onClick={handleLogin} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-100 darkdark:bg-zinc-800 rounded-lg text-[#52525b] dark:text-[#a1a1aa]">
                            <LogIn size={18} />
                          </div>
                          <span className="text-sm font-medium text-[#27272a] dark:text-[#e4e4e7]">Log Masuk</span>
                        </div>
                        <ChevronRight size={18} className="text-[#a1a1aa]" />
                      </button>
                    ) : (
                      <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg text-red-600 dark:text-red-400">
                            <LogOut size={18} />
                          </div>
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">Log Keluar</span>
                        </div>
                      </button>
                    )}
                    {isInstallable && (
                      <button onClick={handleInstallApp} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-100 darkdark:bg-zinc-800 rounded-lg text-[#52525b] dark:text-[#a1a1aa]">
                            <Download size={18} />
                          </div>
                          <span className="text-sm font-medium text-[#27272a] dark:text-[#e4e4e7]">Pasang Aplikasi</span>
                        </div>
                        <ChevronRight size={18} className="text-[#a1a1aa]" />
                      </button>
                    )}
                    {user && (
                      <button onClick={handleRefreshData} disabled={isRefreshing} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors disabled:opacity-50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-[#059669] dark:text-emerald-400">
                            {isRefreshing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                          </div>
                          <span className="text-sm font-medium text-[#059669] dark:text-emerald-400">Refresh Data</span>
                        </div>
                        <ChevronRight size={18} className="text-[#a1a1aa]" />
                      </button>
                    )}
                    <button onClick={() => setIsCategoryManagerOpen(true)} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
                          <Folder size={18} />
                        </div>
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Urus Kategori Kes</span>
                      </div>
                      <ChevronRight size={18} className="text-purple-400" />
                    </button>
                    {user && (
                      <button onClick={handleBackupToCloud} disabled={isBackingUp} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors disabled:opacity-50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                            {isBackingUp ? <Loader2 size={18} className="animate-spin" /> : <CloudUpload size={18} />}
                          </div>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Cloud Backup</span>
                        </div>
                        <ChevronRight size={18} className="text-[#a1a1aa]" />
                      </button>
                    )}
                    <button onClick={handleExportData} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 darkdark:bg-zinc-800 rounded-lg text-[#52525b] dark:text-[#a1a1aa]">
                          <Download size={18} />
                        </div>
                        <span className="text-sm font-medium text-[#27272a] dark:text-[#e4e4e7]">Eksport Data CSV (Ringkas)</span>
                      </div>
                      <ChevronRight size={18} className="text-[#a1a1aa]" />
                    </button>
                    <button onClick={handleExportDataLengkapExcel} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                          <Download size={18} />
                        </div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Eksport Data Lengkap (Excel)</span>
                      </div>
                      <ChevronRight size={18} className="text-blue-400" />
                    </button>
                    <button onClick={handleExportPaymentsCSV} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-50 dark:bg-teal-500/10 rounded-lg text-teal-600 dark:text-teal-400">
                          <Download size={18} />
                        </div>
                        <span className="text-sm font-medium text-teal-700 dark:text-teal-400">Eksport Bayaran (CSV)</span>
                      </div>
                      <ChevronRight size={18} className="text-teal-400" />
                    </button>
                    <button onClick={handleDownloadTemplate} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                          <FileText size={18} />
                        </div>
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Muat Turun Templat (CSV)</span>
                      </div>
                      <ChevronRight size={18} className="text-emerald-400" />
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                          <Upload size={18} />
                        </div>
                        <span className="text-sm font-medium text-[#27272a] dark:text-[#e4e4e7]">Import Data (CSV / Excel)</span>
                      </div>
                      <ChevronRight size={18} className="text-[#a1a1aa]" />
                    </button>
                    <button onClick={() => { setImportPaymentsClientId(null); paymentsFileInputRef.current?.click(); }} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                          <Upload size={18} />
                        </div>
                        <span className="text-sm font-medium text-[#27272a] dark:text-[#e4e4e7]">Import Bayaran (CSV)</span>
                      </div>
                      <ChevronRight size={18} className="text-[#a1a1aa]" />
                    </button>
                    <button onClick={handleFormatData} className="w-full flex items-center justify-between p-4 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                          <Trash2 size={18} />
                        </div>
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">Format Semua Data</span>
                      </div>
                      <ChevronRight size={18} className="text-red-400" />
                    </button>
                    <button onClick={handleClearLocalStorage} className="w-full flex items-center justify-between p-4 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                          <Trash2 size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Kosongkan Data Tempatan</span>
                          <span className="text-[10px] text-orange-500/80 dark:text-orange-400/80">Padam cache pelayar (tidak padam awan)</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-orange-400" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-sm border border-[#f4f4f5]  overflow-hidden">
                  <div className="p-4 border-b border-[#f4f4f5] ">
                    <h2 className="text-sm font-bold text-[#18181b] dark:text-white ">Tetapan Penjejak Tunggakan</h2>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <label className="text-xs font-semibold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Tempoh Tunggakan (Hari)</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      className="w-full sm:w-32 px-3 py-2 border border-[#e4e4e7]  rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-[#18181b] dark:text-white "
                      value={overdueDays}
                      onChange={(e) => setOverdueDays(parseInt(e.target.value) || 30)}
                    />
                    <p className="text-[11px] text-[#71717a] dark:text-[#a1a1aa]">
                      Rekod pelanggan akan ditanda sebagai "Tunggakan" (Overdue) jika baki tertunggak melebihi RM 0 dan tiada bayaran dibuat melepasi tempoh hari yang ditetapkan ini.
                    </p>
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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col overflow-hidden min-h-0"
              >
                {/* Dashboard Header Bar & Device Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-3 shrink-0 print:hidden border-b border-zinc-100 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                        Papan Pemuka Kes
                      </h2>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50">
                        HAIRI MUSTAFA ASSOCIATES
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Susunan responsif serentak untuk paparan Windows (Desktop) dan Android (Mudah Alih)
                    </p>
                  </div>

                  {/* Device Mode Switcher - Removed */}
                </div>

                {/* Dashboard Body Scroll Area */}
                <div className="flex-1 px-2 sm:px-6 md:px-8 py-3 sm:py-5 min-h-0 flex flex-col gap-6 print:hidden overflow-y-auto">
                  {/* MAIN RESPONSIVE CONTAINER (WINDOWS Desktop / ANDROID Mobile) */}
                  <div className="w-full">
                    
                    {/* ========================================================
                        BAHAGIAN KIRI: PAPARAN WINDOWS (GRID 3-LAJUR)
                        - Panel sisi kiri yang ringkas
                        - Grid 2x2 untuk empat kad data utama (tunggakan di bawah)
                        - Lajur kanan yang menggabungkan senarai kes terkini & carta bar
                       ======================================================== */}
                    <div className="hidden xl:flex w-full flex-col gap-4">

                        {/* WINDOWS 3-COLUMN GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4.5 items-start">
                          
                          {/* LAJUR 1: PANEL SISI KIRI YANG RINGKAS (col-span-12 md:col-span-3) */}
                          <div className="md:col-span-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 p-4 shadow-xs flex flex-col gap-4">
                            {/* Firm Identity & Logo */}
                            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100 dark:border-blue-900/40 shadow-xs">
                                HM
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate uppercase tracking-tight">
                                  HAIRI MUSTAFA
                                </p>
                                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate uppercase">
                                  ASSOCIATES
                                </p>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                  Peguam Syarie
                                </p>
                              </div>
                            </div>

                            {/* Compact Navigation Items */}
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500 px-2 block mb-1">
                                Navigasi Pantas
                              </span>
                              <button 
                                onClick={() => setActiveTab('dashboard')}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 transition-colors"
                              >
                                <PieChart size={17} />
                                <span>Papan Pemuka</span>
                              </button>
                              <button 
                                onClick={() => setActiveTab('records')}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 truncate">
                                  <Users size={17} />
                                  <span className="truncate">Rekod Pelanggan</span>
                                </div>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                  {filteredRecords.length}
                                </span>
                              </button>
                              <button 
                                onClick={() => { setActiveTab('standalone'); setStandaloneInitialRecord(null); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-colors"
                              >
                                <FileText size={17} />
                                <span>Paparan Resit</span>
                              </button>
                              <button 
                                onClick={() => setActiveTab('settings')}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-colors"
                              >
                                <Settings size={17} />
                                <span>Tetapan</span>
                              </button>
                            </div>

                              {/* Ringkasan Mileage & Status */}
                            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/60 space-y-2">
                              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-800/60 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Car size={16} className="text-zinc-500 dark:text-zinc-400" />
                                  <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">Baki Mileage</span>
                                </div>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white tabular-nums">{formatRM(stats.totalMileage)}</span>
                              </div>

                              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Status Sistem</span>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Aktif</span>
                              </div>
                            </div>
                          </div>

                          {/* LAJUR 2: GRID 2x2 EMPAT KAD DATA UTAMA (TUNGGAKAN DI BAWAH) (col-span-12 md:col-span-5) */}
                          <div className="md:col-span-5 flex flex-col gap-4">
                            {/* Grid 2x2 for Four Main Data Cards */}
                            <div className="grid grid-cols-2 gap-3.5">
                              {/* 1. Jumlah Kes (Atas Kiri) */}
                              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs hover:shadow transition-all flex flex-col justify-between h-[118px]">
                                <div>
                                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Jumlah Kes
                                  </span>
                                </div>
                                <div>
                                  <p className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">
                                    {stats.totalKes}
                                  </p>
                                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                    Kes Berdaftar
                                  </p>
                                </div>
                              </div>

                              {/* 2. Total Fee (Atas Kanan) */}
                              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs hover:shadow transition-all flex flex-col justify-between h-[118px]">
                                <div>
                                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Total Fee
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">
                                    {formatRM(stats.totalFee)}
                                  </p>
                                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                    Nilai Keseluruhan
                                  </p>
                                </div>
                              </div>

                              {/* 3. Baki Fee Terkini (Bawah Kiri) */}
                              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs hover:shadow transition-all flex flex-col justify-between h-[118px]">
                                <div>
                                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Baki Terkini
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">
                                    {formatRM(stats.totalBakiTerkini)}
                                  </p>
                                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                    Belum Selesai
                                  </p>
                                </div>
                              </div>

                              {/* 4. Tunggakan - DIPINDAHKAN KE BAWAH! (Bawah Kanan) - MERAH SAHAJA */}
                              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-red-200/90 dark:border-red-900/60 shadow-xs hover:shadow transition-all flex flex-col justify-between h-[118px]">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                                    Tunggakan
                                  </span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                                    {stats.totalOverdueCases} Kes
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-red-600 dark:text-red-400 tabular-nums">
                                    {formatRM(stats.totalOverdueAmount)}
                                  </p>
                                  <p className="text-[10px] text-red-500/80 dark:text-red-400/80 mt-0.5">
                                    &gt;{overdueDays} Hari Tanpa Bayaran
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Tindakan Segera & Bayaran Pantas */}
                            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                  <Zap size={16} className="text-blue-500" />
                                  Tindakan Segera
                                </h3>
                              </div>
                              <div className="grid grid-cols-2 gap-2.5">
                                <button
                                  onClick={() => setIsNewRecordModalOpen(true)}
                                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-900/40 border border-zinc-200/50 dark:border-zinc-800/60 transition-all text-left flex items-center gap-3 cursor-pointer group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <Plus size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">+ Klien Baharu</p>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Daftar rekod</p>
                                  </div>
                                </button>

                                <button
                                  onClick={() => { setActiveTab('standalone'); setStandaloneInitialRecord(null); }}
                                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-200 dark:hover:border-emerald-900/40 border border-zinc-200/50 dark:border-zinc-800/60 transition-all text-left flex items-center gap-3 cursor-pointer group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <CreditCard size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">Paparan Resit</p>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Resit am</p>
                                  </div>
                                </button>
                              </div>

                              {/* Bayaran Segera Quick Buttons */}
                              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                                <p className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500 mb-2">
                                  Bayaran Pantas (Pelanggan Aktif Terkini)
                                </p>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {['50', '100', '200', '500'].map(amount => (
                                    <button
                                      key={amount}
                                      onClick={() => handleDirectPay(amount)}
                                      className="py-1.5 bg-zinc-100 hover:bg-emerald-50 dark:bg-zinc-800/70 dark:hover:bg-emerald-950/30 text-zinc-700 hover:text-emerald-700 dark:text-zinc-300 dark:hover:text-emerald-400 rounded-lg text-xs font-bold transition-all text-center"
                                    >
                                      RM{amount}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* LAJUR 3: LAJUR KANAN MENGGABUNGKAN SENARAI KES TERKINI & CARTA BAR (col-span-12 md:col-span-4) */}
                          <div className="md:col-span-4 flex flex-col gap-4">
                            {/* Senarai Kes Terkini */}
                            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs flex flex-col">
                              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                                  <Clock size={16} className="text-blue-500" />
                                  Kes Terkini
                                </h3>
                                <button 
                                  onClick={() => setActiveTab('records')}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                >
                                  Lihat Semua
                                </button>
                              </div>

                              <div className="space-y-2.5">
                                {filteredRecords.slice(0, 4).map(record => (
                                  <div 
                                    key={record.id} 
                                    onClick={() => setStatementRecord(record)}
                                    className="p-2.5 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all flex items-center justify-between cursor-pointer group"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                        {record.nama}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        {getKesBadge(record.kes)}
                                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                          &middot; {formatDateDMY(record.tarikh)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                                        {formatRM(record.bakiFeeTerkini)}
                                      </p>
                                      <p className="text-[9px] uppercase tracking-wider text-zinc-400">
                                        Baki
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                {filteredRecords.length === 0 && (
                                  <p className="text-xs text-zinc-400 text-center py-4">Tiada rekod kes ditemui.</p>
                                )}
                              </div>
                            </div>

                            {/* Carta Bar (Baki Fee Mengikut Kes) */}
                            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs flex flex-col">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                                  <PieChart size={16} className="text-blue-500" />
                                  Baki Fee Mengikut Kes
                                </h3>
                              </div>
                              <div className="h-44 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={chartData.slice(0, 5)} margin={{ top: 10, right: 5, left: -15, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" strokeOpacity={0.4} />
                                    <XAxis 
                                      dataKey="name" 
                                      axisLine={false}
                                      tickLine={false}
                                      tick={{ fontSize: 9, fill: '#71717a' }}
                                      dy={8}
                                      interval={0}
                                      angle={-25}
                                      textAnchor="end"
                                    />
                                    <YAxis 
                                      axisLine={false}
                                      tickLine={false}
                                      tick={{ fontSize: 9, fill: '#71717a' }}
                                      tickFormatter={(val) => `${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                                    />
                                    <Tooltip 
                                      cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                      contentStyle={{ borderRadius: '10px', fontSize: '11px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                      formatter={(value: number) => [`RM ${value}`, 'Baki Fee']}
                                    />
                                    <Bar dataKey="baki" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    {/* ========================================================
                        BAHAGIAN KANAN: PAPARAN ANDROID (LINEAR & TUMPUK)
                        - Panel sisi yang boleh diruntuhkan (collapsible sidebar)
                        - Barisan kad data tunggal yang boleh dileret secara mendatar
                        - Senarai kes terkini di bawahnya secara linear dan tumpuk
                       ======================================================== */}
                    <div className="flex xl:hidden w-full max-w-lg mx-auto flex-col gap-4 pb-16">
                      {/* Android Main Container */}
                      <div className="bg-transparent overflow-hidden flex flex-col relative w-full">
                          {/* Android Content: Linear & Stacked */}
                          <div className="p-4 flex flex-col gap-4">
                            {/* 1. BARISAN KAD DATA TUNGGAL YANG BOLEH DILERET SECARA MENDATAR */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                                  Kad Data Utama (Leret Mendatar)
                                </span>
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                  &larr; Leret &rarr;
                                </span>
                              </div>

                              {/* Single Horizontal Swipeable Row */}
                              <div className="flex overflow-x-auto gap-3 pb-2 pt-0.5 no-scrollbar snap-x scroll-smooth">
                                {/* Kad 1: Jumlah Kes */}
                                <div className="min-w-[160px] h-[105px] p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800/70 shrink-0 snap-start flex flex-col justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Jumlah Kes</span>
                                  <div>
                                    <p className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">{stats.totalKes}</p>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Kes Berdaftar</p>
                                  </div>
                                </div>

                                {/* Kad 2: Total Fee */}
                                <div className="min-w-[160px] h-[105px] p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800/70 shrink-0 snap-start flex flex-col justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Fee</span>
                                  <div>
                                    <p className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">{formatRM(stats.totalFee)}</p>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Nilai Keseluruhan</p>
                                  </div>
                                </div>

                                {/* Kad 3: Baki Terkini */}
                                <div className="min-w-[160px] h-[105px] p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800/70 shrink-0 snap-start flex flex-col justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Baki Terkini</span>
                                  <div>
                                    <p className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">{formatRM(stats.totalBakiTerkini)}</p>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Belum Selesai</p>
                                  </div>
                                </div>

                                {/* Kad 4: Tunggakan - MERAH SAHAJA */}
                                <div className="min-w-[165px] h-[105px] p-3.5 rounded-2xl bg-red-50/40 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/50 shrink-0 snap-start flex flex-col justify-between">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Tunggakan</span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
                                      {stats.totalOverdueCases} Kes
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-lg font-bold tracking-tight text-red-600 dark:text-red-400 tabular-nums">{formatRM(stats.totalOverdueAmount)}</p>
                                    <p className="text-[10px] text-red-500/80 dark:text-red-400/80 mt-0.5">&gt;{overdueDays} Hari</p>
                                  </div>
                                </div>

                                {/* Kad 5: Mileage */}
                                <div className="min-w-[160px] h-[105px] p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800/70 shrink-0 snap-start flex flex-col justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Baki Mileage</span>
                                  <div>
                                    <p className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">{formatRM(stats.totalMileage)}</p>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Tuntutan</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 2. SENARAI KES TERKINI DI BAWAH KAD (LINEAR & TUMPUK) */}
                            <div className="rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/60 p-3.5">
                              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-zinc-200/40 dark:border-zinc-800/40">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                                  <Clock size={15} className="text-blue-500" />
                                  Senarai Kes Terkini
                                </h4>
                                <button
                                  onClick={() => setActiveTab('records')}
                                  className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold"
                                >
                                  Semua ({filteredRecords.length})
                                </button>
                              </div>

                              <div className="space-y-2">
                                {filteredRecords.slice(0, 5).map(record => (
                                  <div
                                    key={record.id}
                                    onClick={() => setStatementRecord(record)}
                                    className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/50 flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{record.nama}</p>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        {getKesBadge(record.kes)}
                                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">&middot; {formatDateDMY(record.tarikh)}</span>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{formatRM(record.bakiFeeTerkini)}</p>
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${record.bakiFeeTerkini <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {record.bakiFeeTerkini <= 0 ? 'Selesai' : 'Baki'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {filteredRecords.length === 0 && (
                                  <p className="text-xs text-zinc-400 text-center py-4">Tiada rekod terkini.</p>
                                )}
                              </div>
                            </div>

                            {/* 3. TINDAKAN PANTAS & BAYARAN PANTAS MOBILE */}
                            <div className="rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/60 p-3.5 space-y-2.5">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 block">
                                Bayaran Pantas Android
                              </span>
                              <div className="grid grid-cols-4 gap-1.5">
                                {['50', '100', '200', '500'].map(amount => (
                                  <button
                                    key={amount}
                                    onClick={() => handleDirectPay(amount)}
                                    className="py-1.5 bg-white dark:bg-zinc-900 hover:bg-emerald-50 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-bold border border-zinc-200/40 dark:border-zinc-800/40 text-center"
                                  >
                                    RM{amount}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                  </div>

                  {/* SISTEM PERINGATAN BAKI TERTUNGGAK (FULL WIDTH TABLE) */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-xs p-5 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                          <AlertTriangle size={18} className="text-amber-500" />
                          Sistem Peringatan Baki Tertunggak
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Pelanggan dengan baki tertunggak melebihi {overdueDays} hari
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Had Tempoh:</span>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          className="w-18 px-2 py-1 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={overdueDays}
                          onChange={(e) => setOverdueDays(parseInt(e.target.value) || 30)}
                        />
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Hari</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px] whitespace-nowrap">
                        <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                          <tr>
                            <th className="px-4 py-3 rounded-tl-xl">Nama Pelanggan</th>
                            <th className="px-4 py-3">No. Telefon</th>
                            <th className="px-4 py-3">Kategori Kes</th>
                            <th className="px-4 py-3">Tarikh Terakhir Bayaran</th>
                            <th className="px-4 py-3 text-right">Baki Fee</th>
                            <th className="px-4 py-3 text-center rounded-tr-xl">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                          {(() => {
                            const now = new Date().getTime();
                            const overdueMs = overdueDays * 24 * 60 * 60 * 1000;
                            const overdueRecords = filteredRecords
                              .filter(r => {
                                if (r.bakiFeeTerkini <= 0) return false;
                                let lastDateStr = r.tarikh;
                                if (r.paymentHistory && r.paymentHistory.length > 0) {
                                  const sortedHistory = [...r.paymentHistory].sort((a: any, b: any) => parseDateObj(b.date).getTime() - parseDateObj(a.date).getTime());
                                  lastDateStr = sortedHistory[0].date;
                                }
                                const lastDate = parseDateObj(lastDateStr).getTime();
                                return (now - lastDate) >= overdueMs;
                              })
                              .sort((a, b) => b.bakiFeeTerkini - a.bakiFeeTerkini);
                              
                            if (overdueRecords.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                                    Tiada tunggakan melepasi {overdueDays} hari direkodkan.
                                  </td>
                                </tr>
                              );
                            }
                            
                            return overdueRecords.map(r => {
                              let lastPaymentDate = '-';
                              if (r.paymentHistory && r.paymentHistory.length > 0) {
                                const sortedHistory = [...r.paymentHistory].sort((a: any, b: any) => parseDateObj(b.date).getTime() - parseDateObj(a.date).getTime());
                                lastPaymentDate = formatDateDMY(sortedHistory[0].date);
                              }
                              return (
                                <tr key={r.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                                    <div className="flex items-center justify-between group">
                                      <span>{r.nama}</span>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setClientProfileName(r.nama); }}
                                        className="text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Profil Pelanggan"
                                      >
                                        <Users size={14} />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{r.telefon || '-'}</td>
                                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{r.kes}</td>
                                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{lastPaymentDate}</td>
                                  <td className="px-4 py-3 text-right font-mono font-bold text-red-600 dark:text-red-400">{formatRM(r.bakiFeeTerkini)}</td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => setStatementRecord(r)}
                                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-lg transition-colors"
                                    >
                                      Perincian
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Main Data Table Area */}
            {activeTab === 'records' && (
              <motion.div
                key="records"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col overflow-hidden min-h-0"
              >
                <div className={`flex-1 px-4 sm:px-6 md:px-8 pb-20 sm:pb-6 md:pb-8 pt-4 sm:pt-6 min-h-0 flex flex-col gap-6 print:hidden overflow-y-auto`}>
                  <div className="flex-1 bg-[#ffffff] dark:bg-zinc-900 border border-[#f4f4f5]  rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
              <div className="p-4 bg-[#fafafa] dark:bg-zinc-900/50 border-b border-[#f4f4f5] dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                  <span className="text-sm font-semibold text-[#27272a] dark:text-[#e4e4e7] tracking-tight flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" />
                    Senarai Rekod Kes
                  </span>
                  <button
                    onClick={() => setIsNewRecordModalOpen(true)}
                    className="sm:hidden px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                  >
                    <Plus size={14} className="stroke-[2.5]" />
                    <span>+ Klien</span>
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto">
                  <button
                    onClick={() => setIsNewRecordModalOpen(true)}
                    className="hidden sm:flex px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg items-center gap-1.5 shadow-sm hover:shadow active:scale-95 transition-all shrink-0"
                    title="Daftar Klien Baharu (New Client)"
                  >
                    <Plus size={15} className="stroke-[2.5]" />
                    <span>+ Klien Baharu</span>
                  </button>
                  {selectedRecords.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrintAllSelected}
                        disabled={isGeneratingCombinedPDF}
                        className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 font-medium cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingCombinedPDF ? <Loader2 size={12} className="animate-spin" /> : <Printer size={12} />}
                        {isGeneratingCombinedPDF ? `Mencetak (${combinedPdfCurrentIndex + 1}/${combinedPdfQueue.length})...` : `Cetak Semua (${selectedRecords.length})`}
                      </button>
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
                      <Search size={14} className="text-[#a1a1aa]" />
                    </div>
                    <input
                      type="text"
                      className="pl-9 pr-3 py-2 text-sm border border-[#e4e4e7]  rounded-lg w-full sm:w-56 bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-[#a1a1aa]"
                      placeholder="Cari nama pelanggan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-40">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter size={14} className="text-[#a1a1aa]" />
                      </div>
                      <select
                        className="pl-9 pr-8 py-2 appearance-none text-sm border border-[#e4e4e7] rounded-lg w-full bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-[#3f3f46] dark:text-zinc-200 transition-all cursor-pointer"
                        value={filterKes}
                        onChange={(e) => setFilterKes(e.target.value)}
                      >
                        {uniqueKes.map(kes => (
                          <option key={kes} value={kes}>{kes}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={14} className="text-[#a1a1aa]" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCategoryManagerOpen(true)}
                      title="Urus Kategori Kes (Tukar Nama / Padam)"
                      className="p-2 border border-[#e4e4e7] dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Folder size={16} />
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ArrowUpDown size={14} className="text-[#a1a1aa]" />
                    </div>
                    <select
                      className="pl-9 pr-8 py-2 appearance-none text-sm border border-[#e4e4e7]  rounded-lg w-full sm:w-44 bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-[#3f3f46] dark:text-zinc-200  transition-all cursor-pointer"
                      value={dateSortOrder || 'desc'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'asc') {
                          setDateSortOrder('asc');
                          setNameSortOrder(null);
                        } else {
                          setDateSortOrder('desc');
                          setNameSortOrder(null);
                        }
                      }}
                      title="Susun Mengikut Tarikh"
                    >
                      <option value="desc">Tarikh: Terkini (Lalai)</option>
                      <option value="asc">Tarikh: Terlama</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown size={14} className="text-[#a1a1aa]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="date"
                      className="px-3 py-2 text-sm border border-[#e4e4e7]  rounded-lg flex-1 sm:flex-none sm:w-36 bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[#3f3f46] dark:text-zinc-200  transition-all"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      title="Tarikh Mula"
                    />
                    <span className="text-[#a1a1aa] text-sm font-medium px-1">-</span>
                    <input
                      type="date"
                      className="px-3 py-2 text-sm border border-[#e4e4e7]  rounded-lg flex-1 sm:flex-none sm:w-36 bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[#3f3f46] dark:text-zinc-200  transition-all"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      title="Tarikh Akhir"
                    />
                  </div>
                  
                  <button 
                    onClick={handleExportCSV}
                    className="px-3 py-2 text-sm bg-emerald-50 text-[#059669] dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 font-medium cursor-pointer flex items-center gap-2 transition-all shrink-0 ml-auto"
                    title="Eksport Senarai ke CSV"
                  >
                    <FileText size={14} />
                    <span className="hidden sm:inline">Eksport CSV</span>
                  </button>
                  
                </div>
              </div>

              <div className="overflow-auto flex-1 bg-[#fafafa]/50 md:bg-[#ffffff] dark:bg-zinc-950/50 md:dark:bg-zinc-950 p-3 sm:p-4 md:p-0">
                {/* Mobile View: List */}
                <div className="md:hidden bg-[#ffffff] dark:bg-zinc-900 border border-[#e4e4e7]  rounded-xl shadow-sm overflow-hidden mb-4 divide-y divide-zinc-200 dark:divide-zinc-800">
                  <AnimatePresence mode="popLayout">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, layout: { type: "spring", bounce: 0.2, duration: 0.4 } }}
                        key={record.id} 
                        className="p-3 sm:p-4 hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 cursor-pointer transition-colors relative" 
                        onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="pt-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                             <input
                                type="checkbox"
                                className="cursor-pointer rounded border-[#e4e4e7]  w-4 h-4 text-blue-600 focus:ring-blue-500 transition-colors"
                               checked={selectedRecords.includes(record.id)}
                               onChange={(e) => {
                                 if (e.target.checked) {
                                   setSelectedRecords([...selectedRecords, record.id]);
                                 } else {
                                   setSelectedRecords(selectedRecords.filter(id => id !== record.id));
                                 }
                               }}
                             />
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-start gap-2">
                               <h4 className="font-bold text-[#18181b] dark:text-white  text-[13px] sm:text-sm truncate leading-tight flex items-center gap-1">
  {record.nama}
  <button 
    onClick={(e) => { e.stopPropagation(); setClientProfileName(record.nama); }}
    className="text-[#a1a1aa] hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-md"
    title="Profil Pelanggan"
  >
    <Users size={14} />
  </button>
</h4>
                               <div className="flex items-center gap-1.5 shrink-0">
                                 <span className={`font-bold text-[13px] sm:text-sm leading-tight ${record.bakiFeeTerkini > 2000 ? 'text-red-600 dark:text-red-400' : 'text-[#27272a] dark:text-[#e4e4e7]'}`}>
                                   {formatRM(record.bakiFeeTerkini)}
                                 </span>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setPaymentRecord(record); }}
                                   className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase cursor-pointer flex items-center font-sans shadow-sm transition-colors"
                                   title="Tambah Bayaran"
                                 >
                                   Bayar
                                 </button>
                               </div>
                             </div>
                             
                             <div className="flex justify-between items-center mt-1">
                               <div className="truncate flex items-center gap-1.5">{getKesBadge(record.kes)}</div>
                               <span className="text-[#d97706] dark:text-amber-500 text-[11px] font-medium shrink-0">
                                 Mil: {formatRM(record.bakiMileage)}
                               </span>
                             </div>

                             <div className="flex justify-between items-center mt-1.5">
                               <span className="text-[#a1a1aa] text-[10px] flex items-center gap-1">
                                 {formatDateDMY(record.tarikh)}
                               </span>
                               <div className="flex items-center gap-1.5">
                                 {record.bakiFeeTerkini === 0 ? (
                                   <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 font-sans">Selesai</span>
                                 ) : (
                                   <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 font-sans">Belum</span>
                                 )}
                                 <ChevronDown size={14} className={`text-[#a1a1aa] transition-transform ${expandedRowId === record.id ? 'rotate-180' : ''}`} />
                               </div>
                             </div>
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {expandedRowId === record.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                               <div className="mt-4 pt-3 border-t border-[#f4f4f5] /50 flex flex-wrap gap-2 w-full">
                                 <button onClick={(e) => { e.stopPropagation(); setPaymentRecord(record); }} className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 rounded-lg text-[13px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 animate-subtle-pulse">
                                   <Plus size={14} /> Bayaran
                                 </button>
                                 <button onClick={(e) => { e.stopPropagation(); setMileageAdjustmentRecord(record); }} className="flex-1 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-600 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 dark:text-teal-400 rounded-lg text-[13px] font-medium flex items-center justify-center gap-1 transition-colors border border-teal-200 dark:border-teal-800/50 cursor-pointer">
                                   <Car size={14} /> ± Mil
                                 </button>
                                 {record.bakiFeeTerkini > 0 && (
                                   <button onClick={(e) => { e.stopPropagation(); setSettlingRecord(record); }} title="Set Baki Fee terus kepada RM0" className="p-1.5 px-2 text-[#059669] hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-lg transition-colors flex items-center justify-center gap-1 text-[13px] font-medium border border-emerald-200 dark:border-emerald-800/50 shrink-0">
                                     <CheckCircle size={14} /> RM0
                                   </button>
                                 )}
                                 <button onClick={(e) => { e.stopPropagation(); setEditingRecord(record); }} className="p-1.5 px-2 text-[#71717a] dark:text-[#a1a1aa] hover:text-[#3f3f46] dark:text-zinc-200 bg-[#fafafa] hover:bg-zinc-100 rounded-lg darkdark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-[#a1a1aa] transition-colors flex items-center justify-center">
                                   <Edit size={16} />
                                 </button>
                                 <button onClick={(e) => { e.stopPropagation(); setStatementRecord(record); }} className="p-1.5 px-2 text-[#71717a] dark:text-[#a1a1aa] hover:text-[#3f3f46] dark:text-zinc-200 bg-[#fafafa] hover:bg-zinc-100 rounded-lg darkdark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-[#a1a1aa] transition-colors flex items-center justify-center">
                                   <Printer size={16} />
                                 </button>
                                 <button onClick={(e) => { e.stopPropagation(); setDeletingRecord(record); }} className="p-1.5 px-2 text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-lg dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center justify-center">
                                   <Trash2 size={16} />
                                 </button>
                               </div>
                               
                               <div className="mt-3 pt-1 border-t border-[#f4f4f5]  -mx-3 sm:-mx-4">
                                 {renderExpandedDetails(record)}
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="text-center py-10 bg-[#ffffff] dark:bg-zinc-900 shadow-sm text-[#a1a1aa] dark:text-[#71717a] dark:text-[#a1a1aa] font-medium"
                    >
                      Tiada rekod dijumpai.
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>
                {/* Desktop View: Table */}
                <table className="hidden md:table w-full text-left border-collapse whitespace-nowrap">
                  <thead className="sticky top-0 bg-[#fafafa] dark:bg-zinc-900/50 z-10">
                    <tr className="text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] uppercase border-b border-[#f4f4f5]  tracking-wider">
                      <th className="px-3 sm:px-4 py-3 border-r border-[#f4f4f5]  text-center w-12 flex justify-center items-center h-full">
                        <input 
                          type="checkbox" 
                          className="cursor-pointer rounded border-[#e4e4e7]  w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 transition-colors"
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
                        className="px-3 sm:px-4 py-3 border-r border-[#f4f4f5]  cursor-pointer select-none hover:bg-zinc-100 dark:hoverdark:bg-zinc-800/80 transition-colors group"
                        onClick={() => {
                          if (nameSortOrder === 'asc') {
                            setNameSortOrder('desc');
                            setDateSortOrder(null);
                          } else if (nameSortOrder === 'desc') {
                            setNameSortOrder(null);
                            setDateSortOrder('desc');
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
                            <ArrowUpDown size={13} className="text-[#a1a1aa] opacity-50 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th className=" px-3 sm:px-4 py-3 border-r border-[#f4f4f5] ">Kategori Kes</th>
                      <th className=" px-3 sm:px-4 py-3 border-r border-[#f4f4f5] ">Nota Kes</th>
                      <th className=" px-3 sm:px-4 py-3 border-r border-[#f4f4f5]  text-right">Total Fee</th>
                      <th className=" px-3 sm:px-4 py-3 border-r border-[#f4f4f5]  text-right">Bayaran Terakhir</th>
                      <th 
                        className=" px-3 sm:px-4 py-3 border-r border-[#f4f4f5]  text-center cursor-pointer select-none hover:bg-zinc-100 dark:hoverdark:bg-zinc-800/80 transition-colors group"
                        onClick={() => {
                          if (dateSortOrder === 'desc') {
                            setDateSortOrder('asc');
                            setNameSortOrder(null);
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
                            <ArrowUpDown size={13} className="text-[#a1a1aa] opacity-50 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th className=" px-3 sm:px-4 py-3 border-r border-[#f4f4f5]  text-right">Baki Sebelum</th>
                      <th className="px-3 sm:px-4 py-3 border-r border-[#f4f4f5]  text-right">Baki Terkini</th>
                      <th className=" px-3 sm:px-4 py-3 border-r border-[#f4f4f5]  text-right">Baki Mileage</th>
                      <th className="px-3 sm:px-4 py-3 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <AnimatePresence mode="popLayout">
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((record, index) => {
                          const now = new Date().getTime();
                          const overdueMs = overdueDays * 24 * 60 * 60 * 1000;
                          let lastDateStr = record.tarikh;
                          if (record.paymentHistory && record.paymentHistory.length > 0) {
                            const sortedHistory = [...record.paymentHistory].sort((a: any, b: any) => parseDateObj(b.date).getTime() - parseDateObj(a.date).getTime());
                            lastDateStr = sortedHistory[0].date;
                          }
                          const lastDate = parseDateObj(lastDateStr).getTime();
                          const isOverdue = record.bakiFeeTerkini > 0 && (now - lastDate) >= overdueMs;
                          
                          return (
                          <motion.tbody 
                            key={record.id} 
                            className="text-[13px]"
                            layout
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, layout: { type: "spring", bounce: 0.2, duration: 0.4 } }}
                          >
                            <tr 
                              onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                              className={`border-b border-[#f4f4f5] /50 hover:bg-[#fafafa] dark:hover:bg-zinc-900 cursor-pointer transition-colors ${isOverdue ? 'bg-red-50/30 dark:bg-red-900/10 border-l-2 border-l-red-500' : (record.bakiFeeTerkini > 0 && index % 2 === 0 ? 'bg-[#fafafa]/50 dark:bg-zinc-900/30' : '')} ${record.bakiFeeTerkini > 2000 && !isOverdue ? 'bg-amber-50/10 dark:bg-amber-900/10' : ''} ${expandedRowId === record.id ? 'bg-zinc-100/50 darkdark:bg-zinc-800/30' : ''}`}
                            >
                            <td className="px-3 sm:px-4 py-3 border-r border-[#f4f4f5] /50">
                              <div className="flex items-center justify-center gap-2 font-mono text-[#a1a1aa]">
                                <input 
                                  type="checkbox" 
                                  className="cursor-pointer rounded border-[#e4e4e7]  w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 mt-0.5"
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
                                  {expandedRowId === record.id ? <ChevronDown size={14} className="text-[#52525b] dark:text-[#a1a1aa]" /> : <ChevronRight size={14} className="text-[#a1a1aa] dark:text-[#52525b] dark:text-zinc-300" />}
                                </span>
                                <span className="hidden sm:inline text-xs">{index + 1}</span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 font-medium text-[#27272a] dark:text-[#e4e4e7] border-r border-[#f4f4f5] /50 break-words md:truncate md:max-w-none max-w-[140px]">
  <div className="flex items-center justify-between group">
    <span>
      {index > 0 && filteredRecords[index - 1].nama === record.nama ? (
        <span className="text-zinc-300 dark:text-[#3f3f46] dark:text-zinc-200 font-normal select-none" title={record.nama}>"</span>
      ) : (
        record.nama
      )}
    </span>
    <button 
      onClick={(e) => { e.stopPropagation(); setClientProfileName(record.nama); }}
      className="text-[#a1a1aa] hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
      title="Profil Pelanggan"
    >
      <Users size={14} />
    </button>
  </div>
</td>
                            <td className=" px-3 sm:px-4 py-3 border-r border-[#f4f4f5] /50">
                              {getKesBadge(record.kes)}
                            </td>
                            <td className=" px-3 sm:px-4 py-1.5 border-r border-[#f4f4f5] /50" onClick={(e) => e.stopPropagation()}>
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
                                className="w-full min-w-[150px] bg-transparent border border-transparent hover:border-[#d4d4d8] dark:hover:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-[#ffffff] dark:focusdark:bg-zinc-800 rounded px-2 py-1.5 text-[12px] text-[#3f3f46] dark:text-zinc-200  transition-colors placeholder:text-[#a1a1aa] dark:placeholder:text-[#52525b] dark:text-zinc-300 outline-none"
                              />
                            </td>
                            <td className=" px-3 sm:px-4 py-3 font-mono text-[#52525b] dark:text-[#a1a1aa] border-r border-[#f4f4f5] /50 text-right">{formatRM(record.totalFee)}</td>
                            <td className=" px-3 sm:px-4 py-3 font-mono border-r border-[#f4f4f5] /50 text-[#059669] dark:text-emerald-500 text-right bg-emerald-50/50 dark:bg-emerald-900/10">
                              {record.bayaranTerakhir > 0 ? '+' : ''}{formatRM(record.bayaranTerakhir)}
                            </td>
                            <td className=" px-3 sm:px-4 py-3 border-r border-[#f4f4f5] /50 text-center text-[#71717a] dark:text-[#a1a1aa] font-mono text-[11px]">{formatDateDMY(record.tarikh)}</td>
                            <td className=" px-3 sm:px-4 py-3 font-mono border-r border-[#f4f4f5] /50 text-right text-[#a1a1aa]">{formatRM(record.bakiSebelum)}</td>
                            <td className="px-3 sm:px-4 py-3 border-r border-[#f4f4f5] /50">
                              <div className="flex items-center justify-end gap-2 font-mono font-bold">
                                {record.bakiFeeTerkini <= 0 ? (
                                  <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 font-sans">Selesai</span>
                                ) : (
                                  <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 font-sans">Belum</span>
                                )}
                                <span className={record.bakiFeeTerkini > 2000 ? 'text-red-600 dark:text-red-400' : 'text-[#27272a] dark:text-[#e4e4e7]'}>
                                  {formatRM(record.bakiFeeTerkini)}
                                </span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setPaymentRecord(record); }}
                                  className="ml-1 text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide cursor-pointer flex items-center shrink-0 font-sans transition-colors"
                                  title="Tambah Bayaran"
                                >
                                  Bayar
                                </button>
                              </div>
                            </td>
                            <td className=" px-3 sm:px-4 py-3 font-mono border-r border-[#f4f4f5] /50 text-right text-[#d97706] dark:text-amber-500">
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

                                  <button 
                                    onClick={() => setPaymentRecord(record)}
                                    className="text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 px-2 py-1.5 rounded-lg text-xs font-medium transition-all border border-blue-200 dark:border-blue-800/50 flex items-center gap-1 shrink-0 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 animate-subtle-pulse"
                                    title="Tambah Bayaran"
                                  >
                                    <Plus size={13} className="text-blue-600 dark:text-blue-400" />
                                    <span>+ Bayaran</span>
                                  </button>

                                {record.bakiFeeTerkini > 0 && (
                                  <button 
                                    onClick={() => setSettlingRecord(record)}
                                    className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1 shrink-0 shadow-sm cursor-pointer"
                                    title="Set Baki Fee terus kepada RM0"
                                  >
                                    <CheckCircle size={13} className="text-[#059669] dark:text-emerald-400" />
                                    <span>Set RM0</span>
                                  </button>
                                )}

                                <button 
                                  onClick={() => setEditingRecord(record)}
                                  className="text-[#52525b] dark:text-zinc-300  hover:text-blue-600 dark:hover:text-blue-400 bg-zinc-100 hover:bg-zinc-200 darkdark:bg-zinc-800 dark:hover:bg-zinc-700 p-1.5 rounded-lg transition-colors"
                                  title="Kemaskini Maklumat"
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                                  className="text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm whitespace-nowrap flex items-center gap-1.5"
                                  title="Urus Rekod"
                                >
                                  {expandedRowId === record.id ? 'Tutup' : 'Urus'}
                                </button>

                                <button 
                                  onClick={() => setDeletingRecord(record)}
                                  className="text-[#a1a1aa] dark:text-[#71717a] dark:text-[#a1a1aa] hover:text-red-600 dark:hover:text-red-400 transition-colors bg-zinc-100 darkdark:bg-zinc-800 p-1.5 rounded-lg"
                                  title="Padam Pelanggan"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          <AnimatePresence>
                            {expandedRowId === record.id && (
                              <motion.tr 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="border-b border-[#f4f4f5]  bg-[#fafafa] dark:bg-zinc-900/50"
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
                        </motion.tbody>
                      );
                      })
                    ) : (
                      <motion.tbody 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="text-[13px]"
                      >
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-[#a1a1aa] dark:text-[#71717a] dark:text-[#a1a1aa] font-medium">
                            Tiada rekod dijumpai.
                          </td>
                        </tr>
                      </motion.tbody>
                    )}
                  </AnimatePresence>
                </table>
              </div>
              <div className="p-4 bg-[#ffffff] dark:bg-zinc-950 border-t border-[#e4e4e7]  flex justify-between items-center text-xs text-[#71717a] dark:text-[#a1a1aa]">
                <div>Menunjukkan <span className="font-medium text-[#18181b] dark:text-white ">{filteredRecords.length}</span> daripada <span className="font-medium text-[#18181b] dark:text-white ">{records.length}</span> rekod</div>
                <div className="flex gap-2 hidden sm:flex">
                  <button className="px-3 py-1.5 border border-[#e4e4e7]  rounded-lg bg-[#ffffff] dark:bg-zinc-900 hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800 disabled:opacity-50 transition-colors" disabled>Kembali</button>
                  <button className="px-3 py-1.5 border-none rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-[#18181b] dark:text-white font-medium shadow-sm">1</button>
                  <button className="px-3 py-1.5 border border-[#e4e4e7]  rounded-lg bg-[#ffffff] dark:bg-zinc-900 hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800 disabled:opacity-50 transition-colors" disabled>Seterusnya</button>
                </div>
              </div>
            </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'standalone' && (
              <motion.div
                key="standalone"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <StandaloneReceipts initialData={standaloneInitialRecord} user={user} db={db} caseRecords={records} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] box-content pb-safe bg-[#ffffff] dark:bg-zinc-950 border-t border-[#e4e4e7] dark:border-zinc-800 flex items-center justify-around z-40 px-1 shadow-lg">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-[#71717a] dark:text-[#a1a1aa]'}`}
          >
            <Home size={19} className={activeTab === 'dashboard' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">Utama</span>
          </button>
          <button 
            onClick={() => setActiveTab('records')}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${activeTab === 'records' ? 'text-blue-600 dark:text-blue-400' : 'text-[#71717a] dark:text-[#a1a1aa]'}`}
          >
            <FileText size={19} className={activeTab === 'records' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">Rekod</span>
          </button>
          
          {/* Prominent Center "+ Klien" Button on Mobile */}
          <button 
            onClick={() => setIsNewRecordModalOpen(true)}
            className="flex flex-col items-center justify-center -mt-5 group cursor-pointer focus:outline-none flex-1"
            title="Daftar Klien Baharu (New Client)"
          >
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-active:scale-95 group-hover:bg-blue-700 transition-all border-2 border-[#ffffff] dark:border-zinc-950">
              <Plus size={22} className="stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5 whitespace-nowrap">+ Klien</span>
          </button>

          <button 
            onClick={() => { setActiveTab('standalone'); setStandaloneInitialRecord(null); }}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${activeTab === 'standalone' ? 'text-blue-600 dark:text-blue-400' : 'text-[#71717a] dark:text-[#a1a1aa]'}`}
          >
            <Printer size={19} className={activeTab === 'standalone' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">Resit</span>
          </button>
          <button 
            onClick={() => { setActiveTab('settings'); setStandaloneInitialRecord(null); }}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${activeTab === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-[#71717a] dark:text-[#a1a1aa]'}`}
          >
            <Settings size={19} className={activeTab === 'settings' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">Tetapan</span>
          </button>
        </div>
      </main>

      {/* Modals */}
      
      {/* Category Manager Modal */}
      <AnimatePresence>
        {isCategoryManagerOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-2xl border border-[#e4e4e7] dark:border-zinc-800 w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden"
            >
              <div className="p-4 border-b border-[#f4f4f5] dark:border-zinc-800 flex justify-between items-center bg-[#fafafa] dark:bg-zinc-900/50">
                <h2 className="text-lg font-bold text-[#18181b] dark:text-white flex items-center gap-2">
                  <Folder size={18} className="text-blue-500" />
                  Urus Kategori Kes
                </h2>
                <button 
                  onClick={() => setIsCategoryManagerOpen(false)}
                  className="p-1.5 text-[#71717a] dark:text-[#a1a1aa] hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {uniqueKes.filter(k => k !== 'Semua').length === 0 ? (
                  <p className="text-sm text-center text-[#71717a] dark:text-[#a1a1aa] py-8">Tiada kategori tersuai dijumpai.</p>
                ) : (
                  uniqueKes.filter(k => k !== 'Semua').map(category => (
                    <div key={category} className="flex flex-col gap-2 p-3 border border-[#f4f4f5] dark:border-zinc-800 rounded-lg bg-[#fafafa] dark:bg-zinc-900/50">
                      {editingCategory === category ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm border border-blue-500 rounded-md bg-white dark:bg-zinc-950 focus:outline-none"
                            autoFocus
                          />
                          <button 
                            onClick={() => {
                              handleRenameCategory(category, newCategoryName);
                              setEditingCategory(null);
                            }}
                            className="p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                          >
                            <Save size={14} />
                          </button>
                          <button 
                            onClick={() => setEditingCategory(null)}
                            className="p-1.5 bg-zinc-200 dark:bg-zinc-800 text-[#71717a] dark:text-[#a1a1aa] rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#18181b] dark:text-white">{category}</span>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingCategory(category);
                                setNewCategoryName(category);
                              }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                              title="Tukar Nama Kategori"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(category)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                              title="Padam Kategori"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contact Picker Modal */}
      <AnimatePresence>
        {isContactPickerOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-2xl border border-[#e4e4e7] dark:border-zinc-800 w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#f4f4f5] dark:border-zinc-800 bg-[#fafafa] dark:bg-zinc-900/50">
                <h3 className="font-semibold text-[#18181b] dark:text-white flex items-center gap-2">
                  <Users size={18} className="text-blue-500" />
                  Pilih Kontak
                </h3>
                <button onClick={() => setIsContactPickerOpen(false)} className="text-[#a1a1aa] hover:text-[#52525b] dark:text-zinc-300 dark:hover:text-zinc-300 p-1.5 rounded-md hover:bg-zinc-100 dark:hoverdark:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 border-b border-[#f4f4f5] dark:border-zinc-800">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
                  <input
                    type="text"
                    placeholder="Cari kontak..."
                    className="w-full pl-9 pr-3 py-2 bg-zinc-100 darkdark:bg-zinc-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 text-[#18181b] dark:text-white"
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                {availableContacts
                  .filter(c => {
                    const name = c.names?.[0]?.displayName || '';
                    const phone = c.phoneNumbers?.[0]?.value || '';
                    const query = contactSearchQuery.toLowerCase();
                    return name.toLowerCase().includes(query) || phone.toLowerCase().includes(query);
                  })
                  .map((contact, idx) => (
                  <button
                    key={contact.resourceName || idx}
                    onClick={() => handleSelectContact(contact)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-100 dark:hoverdark:bg-zinc-800 rounded-lg transition-colors group"
                  >
                    <div>
                      <div className="font-medium text-sm text-[#18181b] dark:text-white">
                        {contact.names?.[0]?.displayName || 'Tiada Nama'}
                      </div>
                      <div className="text-xs text-[#71717a] dark:text-[#a1a1aa] mt-0.5">
                        {contact.phoneNumbers?.[0]?.value || 'Tiada No. Telefon'}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#a1a1aa] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-2xl border border-[#e4e4e7]  w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#f4f4f5] /50 bg-[#fafafa]/50 dark:bg-zinc-900/50 shrink-0">
                <h3 className="font-semibold text-[#18181b] dark:text-white  flex items-center gap-2">
                  <Edit size={18} className="text-amber-500" />
                  Edit Rekod Pelanggan
                </h3>
                <button onClick={() => setEditingRecord(null)} className="text-[#a1a1aa] hover:text-[#52525b] dark:text-zinc-300 dark:hover:text-zinc-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hoverdark:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleEditRecordSubmit} className="space-y-5">
                  <div>
                    
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider mb-0">
                      Nama Pelanggan / Entiti
                    </label>
                    <button
                      type="button"
                      onClick={handleImportContacts}
                      disabled={isImportingContacts}
                      className="flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md transition-colors"
                      title="Import dari Google Contacts"
                    >
                      {isImportingContacts ? <Loader2 size={12} className="animate-spin" /> : <Users size={12} />}
                      Import dari Contacts
                    </button>
                  </div>

                    <input
                      type="text"
                      required
                      className={`px-3 py-2 w-full border ${editingRecord.nama && records.some(r => r.id !== editingRecord.id && r.nama.toLowerCase().trim() === editingRecord.nama.toLowerCase().trim()) ? 'border-amber-400 focus:ring-amber-500/20 focus:border-amber-500' : 'border-[#e4e4e7]  focus:ring-blue-500/20 focus:border-blue-500'} rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 transition-all font-medium text-[#18181b] dark:text-white `}
                      value={editingRecord.nama || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, nama: e.target.value })}
                      autoFocus
                    />
                    {editingRecord.nama && records.some(r => r.id !== editingRecord.id && r.nama.toLowerCase().trim() === editingRecord.nama.toLowerCase().trim()) && (
                      <p className="text-xs text-[#d97706] dark:text-amber-500 mt-1.5 flex items-center gap-1.5">
                        <AlertTriangle size={12} />
                        Nama pelanggan sudah wujud dalam sistem.
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">No. Telefon</label>
                      <input
                        type="text"
                        className="px-3 py-2 w-full border border-[#e4e4e7] rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#18181b] dark:text-white"
                        placeholder="Contoh: 0123456789"
                        value={editingRecord.telefon || ''}
                        onChange={(e) => setEditingRecord({ ...editingRecord, telefon: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">Emel</label>
                      <input
                        type="email"
                        className="px-3 py-2 w-full border border-[#e4e4e7] rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#18181b] dark:text-white"
                        placeholder="Contoh: pelanggan@gmail.com"
                        value={editingRecord.emel || ''}
                        onChange={(e) => setEditingRecord({ ...editingRecord, emel: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">Alamat</label>
                    <textarea
                      rows={2}
                      className="px-3 py-2 w-full border border-[#e4e4e7]  rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#18181b] dark:text-white "
                      placeholder="Alamat penuh..."
                      value={editingRecord.alamat || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, alamat: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">
                        Kategori Kes
                      </label>
                      <input
                        type="text"
                        required
                        className="px-3 py-2 w-full border border-[#e4e4e7]  rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-[#18181b] dark:text-white "
                        value={editingRecord.kes}
                        onChange={(e) => setEditingRecord({ ...editingRecord, kes: e.target.value })}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider m-0">
                          Tarikh Kes (DD/MM/YYYY)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              const d = parseDateObj(editingRecord.tarikh);
                              const year = d.getFullYear().toString();
                              const month = (d.getMonth() + 1).toString().padStart(2, '0');
                              const day = d.getDate().toString().padStart(2, '0');
                              const dateParam = `${year}${month}${day}/${year}${month}${day}`;
                              const title = encodeURIComponent(`Tarikh: ${editingRecord.nama}`);
                              const details = encodeURIComponent(`Kes: ${editingRecord.kes}\nNo. Telefon: ${editingRecord.telefon || 'Tiada'}\nNota: ${editingRecord.nota || 'Tiada'}`);
                              const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateParam}&details=${details}`;
                              window.open(url, '_blank');
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md transition-colors"
                          title="Simpan Tarikh ini ke Google Calendar"
                        >
                          <Calendar size={12} />
                          Simpan ke Kalendar
                        </button>
                      </div>
                      <input
                        type="date"
                        required
                        className="px-3 py-2 w-full border border-[#e4e4e7] dark:border-zinc-800 rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-[#18181b] dark:text-white"
                        value={formatDateISO(editingRecord.tarikh)}
                        onChange={(e) => setEditingRecord({ ...editingRecord, tarikh: formatDateDMY(e.target.value) })}
                      />
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                        Format: {formatDateDMY(editingRecord.tarikh)} (Contoh: 13/10/2026)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">
                        Total Fee (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="px-3 py-2 w-full border border-[#e4e4e7]  rounded-lg font-mono text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#18181b] dark:text-white "
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
                      <p className="text-[10px] text-[#a1a1aa] dark:text-[#71717a] dark:text-[#a1a1aa] mt-1.5">Baki fee akan dikira semula secara automatik</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">
                        Baki Mileage (RM)
                      </label>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button" 
                          onClick={() => setEditingRecord({...editingRecord, bakiMileage: Math.max(0, (editingRecord.bakiMileage || 0) - 50)})}
                          className="px-3 py-2 bg-zinc-100 darkdark:bg-zinc-800 rounded-lg font-bold text-[#52525b] dark:text-[#a1a1aa] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                          title="Tolak RM50"
                        >
                          -50
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          className="px-3 py-2 w-full border border-[#e4e4e7]  rounded-lg font-mono text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#18181b] dark:text-white  text-center"
                          value={editingRecord.bakiMileage}
                          onChange={(e) => setEditingRecord({ ...editingRecord, bakiMileage: parseFloat(e.target.value) || 0 })}
                        />
                        <button 
                          type="button" 
                          onClick={() => setEditingRecord({...editingRecord, bakiMileage: (editingRecord.bakiMileage || 0) + 50})}
                          className="px-3 py-2 bg-zinc-100 darkdark:bg-zinc-800 rounded-lg font-bold text-[#52525b] dark:text-[#a1a1aa] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                          title="Tambah RM50"
                        >
                          +50
                        </button>
                      </div>
                      <p className="text-[10px] text-[#71717a] dark:text-[#a1a1aa] mt-1.5">Gunakan butang untuk tambah/tolak, atau taip jumlah terus.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">
                      Nota / Ringkasan Kes
                    </label>
                    <textarea
                      className="px-3 py-2 w-full border border-[#e4e4e7]  rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-[#18181b] dark:text-white  resize-y min-h-[80px]"
                      placeholder="Masukkan nota tambahan (pilihan)"
                      value={editingRecord.nota || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, nota: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-[#f4f4f5] /50 mt-6">
                    <button 
                      type="button"
                      onClick={() => setEditingRecord(null)}
                      className="px-5 py-2.5 text-sm text-[#52525b] dark:text-[#a1a1aa] hover:text-[#18181b] dark:text-white dark:hover:text-zinc-100 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer rounded-lg hover:bg-zinc-100/50 dark:hoverdark:bg-zinc-800/50"
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
              className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-2xl border border-[#e4e4e7]  w-full max-w-sm overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={28} className="text-red-500 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-[#18181b] dark:text-white  text-lg mb-3">Padam Rekod Terpilih</h3>
                <p className="text-[#71717a] dark:text-[#a1a1aa] text-sm mb-8 leading-relaxed">
                  Adakah anda pasti untuk memadam <strong className="text-[#18181b] dark:text-white ">{selectedRecords.length}</strong> rekod yang terpilih? Tindakan ini tidak boleh dikembalikan.
                </p>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => setIsDeletingSelected(false)}
                    className="px-5 py-2.5 text-sm border border-[#e4e4e7]  rounded-lg hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800 text-[#52525b] dark:text-zinc-300  font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex-1"
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
              className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-2xl border border-[#e4e4e7]  w-full max-w-sm overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={28} className="text-red-500 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-[#18181b] dark:text-white  text-lg mb-3">Padam Rekod Kes</h3>
                <p className="text-[#71717a] dark:text-[#a1a1aa] text-sm mb-8 leading-relaxed">
                  Adakah anda pasti untuk memadam rekod kes <strong className="text-[#18181b] dark:text-white ">{deletingRecord.nama}</strong>? Tindakan ini tidak boleh dikembalikan.
                </p>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => setDeletingRecord(null)}
                    className="px-5 py-2.5 text-sm border border-[#e4e4e7]  rounded-lg hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800 text-[#52525b] dark:text-zinc-300  font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex-1"
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
              className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-2xl border border-[#e4e4e7]  w-full max-w-md overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-900/30">
                  <CheckCircle size={30} className="text-[#059669] dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-[#18181b] dark:text-white  text-lg mb-2">Pengesahan Set Baki Fee RM0</h3>
                <p className="text-[#52525b] dark:text-[#a1a1aa] text-sm mb-6 leading-relaxed">
                  Adakah anda pasti untuk menetapkan baki fee bagi pelanggan <strong className="text-[#18181b] dark:text-white ">{settlingRecord.nama}</strong> ({settlingRecord.kes}) daripada <span className="font-mono font-bold text-[#d97706] dark:text-amber-400">{formatRM(settlingRecord.bakiFeeTerkini)}</span> terus kepada <span className="font-mono font-bold text-[#059669] dark:text-emerald-400">RM0.00</span>?
                </p>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => setSettlingRecord(null)}
                    className="px-5 py-2.5 text-sm border border-[#e4e4e7]  rounded-lg hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800 text-[#52525b] dark:text-zinc-300  font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex-1"
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
              className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-2xl border border-[#e4e4e7]  w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#f4f4f5] /50 bg-[#fafafa]/50 dark:bg-zinc-900/50 shrink-0">
                <h3 className="font-semibold text-[#18181b] dark:text-white flex items-center gap-2">
                  <Users size={18} className="text-blue-500" />
                  Daftar Klien Baharu (New Client)
                </h3>
                <button onClick={() => setIsNewRecordModalOpen(false)} className="text-[#a1a1aa] hover:text-[#52525b] dark:text-zinc-300 dark:hover:text-zinc-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hoverdark:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleAddNewRecord} className="space-y-5">
                  <div>
                    
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider mb-0">
                      Nama Pelanggan / Entiti
                    </label>
                    <button
                      type="button"
                      onClick={handleImportContacts}
                      disabled={isImportingContacts}
                      className="flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md transition-colors"
                      title="Import dari Google Contacts"
                    >
                      {isImportingContacts ? <Loader2 size={12} className="animate-spin" /> : <Users size={12} />}
                      Import dari Contacts
                    </button>
                  </div>

                    <input
                      type="text"
                      required
                      className={`px-3 py-2 w-full border ${newRecordData.nama && records.some(r => r.nama.toLowerCase().trim() === newRecordData.nama.toLowerCase().trim()) ? 'border-amber-400 focus:ring-amber-500/20 focus:border-amber-500' : 'border-[#e4e4e7]  focus:ring-blue-500/20 focus:border-blue-500'} rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 transition-all font-medium text-[#18181b] dark:text-white `}
                      placeholder="Contoh: Ali bin Abu"
                      value={newRecordData.nama || ''}
                      onChange={(e) => setNewRecordData({ ...newRecordData, nama: e.target.value })}
                      autoFocus
                    />
                    {newRecordData.nama && records.some(r => r.nama.toLowerCase().trim() === newRecordData.nama.toLowerCase().trim()) && (
                      <p className="text-xs text-[#d97706] dark:text-amber-500 mt-1.5 flex items-center gap-1.5">
                        <AlertTriangle size={12} />
                        Nama pelanggan sudah wujud dalam sistem.
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">No. Telefon</label>
                      <input
                        type="text"
                        className="px-3 py-2 w-full border border-[#e4e4e7] rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#18181b] dark:text-white"
                        placeholder="Contoh: 0123456789"
                        value={newRecordData.telefon || ''}
                        onChange={(e) => setNewRecordData({ ...newRecordData, telefon: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">Emel</label>
                      <input
                        type="email"
                        className="px-3 py-2 w-full border border-[#e4e4e7] rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#18181b] dark:text-white"
                        placeholder="Contoh: pelanggan@gmail.com"
                        value={newRecordData.emel || ''}
                        onChange={(e) => setNewRecordData({ ...newRecordData, emel: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">Alamat</label>
                    <textarea
                      rows={2}
                      className="px-3 py-2 w-full border border-[#e4e4e7]  rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#18181b] dark:text-white "
                      placeholder="Alamat penuh..."
                      value={newRecordData.alamat || ''}
                      onChange={(e) => setNewRecordData({ ...newRecordData, alamat: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">
                        Kategori Kes
                      </label>
                      <input
                        type="text"
                        required
                        className="px-3 py-2 w-full border border-[#e4e4e7]  rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-[#18181b] dark:text-white "
                        placeholder="Contoh: Saman Sivil"
                        value={newRecordData.kes}
                        onChange={(e) => setNewRecordData({ ...newRecordData, kes: e.target.value })}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">
                          Tarikh Kes (DD/MM/YYYY)
                        </label>
                        <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                          {formatDateDMY(newRecordData.tarikh)}
                        </span>
                      </div>
                      <input
                        type="date"
                        required
                        className="px-3 py-2 w-full border border-[#e4e4e7] dark:border-zinc-800 rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-[#18181b] dark:text-white"
                        value={newRecordData.tarikh}
                        onChange={(e) => setNewRecordData({ ...newRecordData, tarikh: e.target.value })}
                      />
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                        Contoh format: 13/10/2026
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">
                        Total Fee (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="px-3 py-2 w-full border border-[#e4e4e7]  rounded-lg font-mono text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#18181b] dark:text-white "
                        placeholder="0.00"
                        value={newRecordData.totalFee}
                        onChange={(e) => setNewRecordData({ ...newRecordData, totalFee: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">
                        Baki Mileage (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="px-3 py-2 w-full border border-[#e4e4e7]  rounded-lg font-mono text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#18181b] dark:text-white "
                        placeholder="0.00"
                        value={newRecordData.bakiMileage}
                        onChange={(e) => setNewRecordData({ ...newRecordData, bakiMileage: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">
                      Nota / Ringkasan Kes
                    </label>
                    <textarea
                      className="px-3 py-2 w-full border border-[#e4e4e7]  rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-[#18181b] dark:text-white  resize-y min-h-[60px]"
                      placeholder="Masukkan nota tambahan (pilihan)"
                      value={newRecordData.nota || ''}
                      onChange={(e) => setNewRecordData({ ...newRecordData, nota: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-[#f4f4f5] /50 mt-6">
                    <button 
                      type="button"
                      onClick={() => setIsNewRecordModalOpen(false)}
                      className="px-5 py-2.5 text-sm text-[#52525b] dark:text-[#a1a1aa] hover:text-[#18181b] dark:text-white dark:hover:text-zinc-100 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer rounded-lg hover:bg-zinc-100/50 dark:hoverdark:bg-zinc-800/50"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md cursor-pointer shadow-sm"
                    >
                      Daftar Klien Baharu
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
              className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-2xl border border-[#e4e4e7]  w-full max-w-sm flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#f4f4f5] /50 bg-[#fafafa]/50 dark:bg-zinc-900/50 shrink-0">
                <h3 className="font-semibold text-[#18181b] dark:text-white  flex items-center gap-2">
                  <Car size={18} className="text-teal-500" />
                  Pelarasan Mileage
                </h3>
                <button onClick={() => setMileageAdjustmentRecord(null)} className="text-[#a1a1aa] hover:text-[#52525b] dark:text-zinc-300 dark:hover:text-zinc-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hoverdark:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-5 p-4 rounded-lg bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#71717a] dark:text-[#a1a1aa]">Baki Semasa (Mileage):</span>
                    <span className="font-mono font-bold text-teal-700 dark:text-teal-400">{formatRM(mileageAdjustmentRecord.bakiMileage || 0)}</span>
                  </div>
                </div>
                
                <form onSubmit={handleMileageAdjustmentSubmit} className="space-y-5">
                  <div className="flex rounded-lg overflow-hidden border border-[#e4e4e7] ">
                    <button 
                      type="button" 
                      onClick={() => setMileageAdjustmentType('tambah')}
                      className={`flex-1 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${mileageAdjustmentType === 'tambah' ? 'bg-teal-500 text-white shadow-sm' : 'bg-[#fafafa] dark:bg-zinc-900 text-[#52525b] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hoverdark:bg-zinc-800'}`}
                    >
                      Tambah (+)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setMileageAdjustmentType('tolak')}
                      className={`flex-1 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-l border-[#e4e4e7]  ${mileageAdjustmentType === 'tolak' ? 'bg-teal-500 text-white border-transparent shadow-sm' : 'bg-[#fafafa] dark:bg-zinc-900 text-[#52525b] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hoverdark:bg-zinc-800'}`}
                    >
                      Tolak (-)
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">
                      Jumlah Pelarasan (RM)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-[#71717a] dark:text-[#a1a1aa] font-mono text-sm">RM</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        className="pl-10 pr-4 py-2.5 w-full border border-[#e4e4e7]  focus:ring-teal-500/20 focus:border-teal-500 rounded-lg font-mono text-lg focus:outline-none focus:ring-2 transition-all font-medium text-[#18181b] dark:text-white  bg-[#ffffff] dark:bg-zinc-950"
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
                      className="px-5 py-2.5 text-sm text-[#52525b] dark:text-[#a1a1aa] hover:text-[#18181b] dark:text-white dark:hover:text-zinc-100 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer rounded-lg hover:bg-zinc-100/50 dark:hoverdark:bg-zinc-800/50"
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
              className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-2xl border border-[#e4e4e7]  w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#f4f4f5] /50 bg-[#fafafa]/50 dark:bg-zinc-900/50 shrink-0">
                <h3 className="font-semibold text-[#18181b] dark:text-white  flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-500" />
                  Kemaskini Bayaran
                </h3>
                <button onClick={() => setPaymentRecord(null)} className="text-[#a1a1aa] hover:text-[#52525b] dark:text-zinc-300 dark:hover:text-zinc-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hoverdark:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#71717a] dark:text-[#a1a1aa]">Pelanggan:</span>
                    <span className="font-semibold text-[#27272a] dark:text-[#e4e4e7]">{paymentRecord.nama}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#71717a] dark:text-[#a1a1aa]">Baki Semasa (Fee):</span>
                    <span className="font-mono font-bold text-red-600">{formatRM(paymentRecord.bakiFeeTerkini)}</span>
                  </div>
                  {(paymentRecord.bakiMileage || 0) > 0 && (
                    <div className="flex justify-between text-sm pt-2 mt-2 border-t border-blue-100 italic">
                      <span className="text-[#71717a] dark:text-[#a1a1aa]">Baki Semasa (Mileage):</span>
                      <span className="font-mono font-bold text-red-600">{formatRM(paymentRecord.bakiMileage || 0)}</span>
                    </div>
                  )}
                </div>
                
                <form onSubmit={handleUpdatePayment} className="space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">
                        Jumlah Bayaran Fee (RM)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentAmount(paymentRecord.bakiFeeTerkini.toString());
                          if (paymentError) setPaymentError('');
                        }}
                        className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 px-2 py-1 rounded transition-colors font-medium cursor-pointer"
                      >
                        Penuh ({formatRM(paymentRecord.bakiFeeTerkini)})
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-[#71717a] dark:text-[#a1a1aa] font-mono text-sm">RM</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={paymentRecord.bakiFeeTerkini}
                        className={`pl-10 pr-4 py-2.5 w-full border ${paymentError ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-[#e4e4e7]  focus:ring-blue-500/20 focus:border-blue-500'} rounded-lg font-mono text-lg focus:outline-none focus:ring-2 transition-all font-medium text-[#18181b] dark:text-white  bg-[#ffffff] dark:bg-zinc-950`}
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={(e) => {
                          setPaymentAmount(e.target.value);
                          if (paymentError) setPaymentError('');
                        }}
                        autoFocus
                      />
                    </div>
                    {paymentAmount && !isNaN(parseFloat(paymentAmount)) && (
                      <div className="mt-2 text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] flex items-center justify-between bg-[#fafafa] dark:bg-zinc-900 px-3 py-2 rounded-md">
                        <span>Baki Selepas Bayaran (Fee):</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          RM {Math.max(0, paymentRecord.bakiFeeTerkini - parseFloat(paymentAmount)).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {(paymentRecord.bakiMileage || 0) > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                      <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">
                        Jumlah Bayaran Mileage (RM)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMileageAmount((paymentRecord.bakiMileage || 0).toString());
                          if (paymentError) setPaymentError('');
                        }}
                        className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 px-2 py-1 rounded transition-colors font-medium cursor-pointer"
                      >
                        Penuh ({formatRM(paymentRecord.bakiMileage || 0)})
                      </button>
                    </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-[#71717a] dark:text-[#a1a1aa] font-mono text-sm">RM</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={paymentRecord.bakiMileage}
                          className={`pl-10 pr-4 py-2.5 w-full border ${paymentError ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-[#e4e4e7]  focus:ring-blue-500/20 focus:border-blue-500'} rounded-lg font-mono text-lg focus:outline-none focus:ring-2 transition-all font-medium text-[#18181b] dark:text-white  bg-[#ffffff] dark:bg-zinc-950`}
                          placeholder="0.00"
                          value={paymentMileageAmount}
                          onChange={(e) => {
                            setPaymentMileageAmount(e.target.value);
                            if (paymentError) setPaymentError('');
                          }}
                        />
                      </div>
                      {paymentMileageAmount && !isNaN(parseFloat(paymentMileageAmount)) && (
                        <div className="mt-2 text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] flex items-center justify-between bg-[#fafafa] dark:bg-zinc-900 px-3 py-2 rounded-md">
                          <span>Baki Selepas Bayaran (Mileage):</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            RM {Math.max(0, paymentRecord.bakiMileage - parseFloat(paymentMileageAmount)).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentError && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium">{paymentError}</p>
                  )}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">
                        Tarikh Bayaran (DD/MM/YYYY)
                      </label>
                      <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                        {formatDateDMY(paymentDate)}
                      </span>
                    </div>
                    <input
                      type="date"
                      required
                      className="pl-3 pr-4 py-2.5 w-full border border-[#e4e4e7] dark:border-zinc-800 rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-[#18181b] dark:text-white"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Contoh format: 13/10/2026
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">
                      Kaedah Bayaran
                    </label>
                    <div className="relative">
                      <select
                        required
                        className="pl-3 pr-8 py-2.5 w-full border border-[#e4e4e7]  rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-[#18181b] dark:text-white  appearance-none"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Transfer">Transfer</option>
                        <option value="QR">QR</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={14} className="text-[#a1a1aa]" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">
                      Nota Bayaran
                    </label>
                    <input
                      type="text"
                      className="pl-3 pr-4 py-2.5 w-full border border-[#e4e4e7]  rounded-lg text-sm bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-[#18181b] dark:text-white "
                      placeholder="Contoh: Bayaran pendahuluan, ansuran ke-2, dll."
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t border-[#f4f4f5] /50 mt-6">
                    <button 
                      type="button" 
                      onClick={() => setPaymentRecord(null)}
                      className="px-5 py-2.5 text-sm text-[#52525b] dark:text-[#a1a1aa] hover:text-[#18181b] dark:text-white dark:hover:text-zinc-100 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer rounded-lg hover:bg-zinc-100/50 dark:hoverdark:bg-zinc-800/50"
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


      {/* Edit Payment Modal */}
      <AnimatePresence>
        {editingPaymentDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#18181b]/20 dark:bg-[#000000]/60 backdrop-blur-sm"
              onClick={() => setEditingPaymentDetails(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#ffffff] dark:bg-[#18181b] rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-[#e4e4e7] dark:border-zinc-800"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#f4f4f5] dark:border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                    <Edit size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#18181b] dark:text-white">Kemaskini Bayaran</h2>
                    <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] font-medium">{editingPaymentDetails.record.nama}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingPaymentDetails(null)}
                  className="p-2 text-[#a1a1aa] hover:text-[#18181b] dark:hover:text-white transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    
                    const newAmount = parseFloat(editingPaymentAmount) || 0;
                    const newMileage = parseFloat(editingPaymentMileage) || 0;
                    
                    const record = editingPaymentDetails.record;
                    const oldPayment = editingPaymentDetails.payment;
                    
                    const oldAmount = oldPayment.amount || 0;
                    const oldMileage = oldPayment.mileageAmount || 0;
                    
                    // Revert old payment, then apply new payment
                    const tempFeeBalance = record.bakiFeeTerkini + oldAmount;
                    const tempMileageBalance = (record.bakiMileage || 0) + oldMileage;
                    
                    if (newAmount > tempFeeBalance) {
                       alert("Jumlah bayaran Fee melebihi baki terkini.");
                       return;
                    }
                    if (newMileage > tempMileageBalance) {
                       alert("Jumlah bayaran Mileage melebihi baki terkini.");
                       return;
                    }
                    
                    const updatedPayment = {
                      ...oldPayment,
                      amount: newAmount,
                      mileageAmount: newMileage,
                      date: formatDateDMY(editingPaymentDate),
                      method: editingPaymentMethod,
                      nota: editingPaymentNote
                    };
                    
                    const newHistory = record.paymentHistory.map((p: any) => p.id === oldPayment.id ? updatedPayment : p);
                    
                    const updatedRecord = {
                      ...record,
                      paymentHistory: newHistory,
                      bakiFeeTerkini: tempFeeBalance - newAmount,
                      bakiMileage: tempMileageBalance - newMileage,
                      bayaranTerakhir: newHistory.length > 0 ? newHistory[0].amount : 0
                    };
                    
                    setRecords((prev: any) => prev.map((r: any) => r.id === record.id ? updatedRecord : r));
                    
                    if (user) {
                      try {
                        await setDoc(doc(db, 'users', user.uid, 'records', record.id), updatedRecord);
                      } catch(err) {
                        console.error("Gagal update bayaran:", err);
                      }
                    }
                    
                    setEditingPaymentDetails(null);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">
                      Jumlah Bayaran (Fee) - RM
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-3 pr-4 py-2.5 w-full border border-[#e4e4e7] dark:border-zinc-800 rounded-lg font-mono focus:ring-amber-500/20 focus:border-amber-500 text-lg bg-[#ffffff] dark:bg-zinc-950 text-[#18181b] dark:text-white"
                      value={editingPaymentAmount}
                      onChange={(e) => setEditingPaymentAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">
                      Jumlah Bayaran (Mileage) - RM
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-3 pr-4 py-2.5 w-full border border-[#e4e4e7] dark:border-zinc-800 rounded-lg font-mono focus:ring-amber-500/20 focus:border-amber-500 text-lg bg-[#ffffff] dark:bg-zinc-950 text-[#18181b] dark:text-white"
                      value={editingPaymentMileage}
                      onChange={(e) => setEditingPaymentMileage(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">Tarikh</label>
                    <input
                      type="date"
                      required
                      className="pl-3 pr-4 py-2.5 w-full border border-[#e4e4e7] dark:border-zinc-800 rounded-lg bg-[#ffffff] dark:bg-zinc-950 text-[#18181b] dark:text-white focus:ring-amber-500/20 focus:border-amber-500"
                      value={editingPaymentDate}
                      onChange={(e) => setEditingPaymentDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">Kaedah</label>
                    <select
                      required
                      className="pl-3 pr-4 py-2.5 w-full border border-[#e4e4e7] dark:border-zinc-800 rounded-lg bg-[#ffffff] dark:bg-zinc-950 text-[#18181b] dark:text-white focus:ring-amber-500/20 focus:border-amber-500"
                      value={editingPaymentMethod}
                      onChange={(e) => setEditingPaymentMethod(e.target.value)}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Transfer">Transfer</option>
                      <option value="QR">QR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">Nota</label>
                    <input
                      type="text"
                      className="pl-3 pr-4 py-2.5 w-full border border-[#e4e4e7] dark:border-zinc-800 rounded-lg bg-[#ffffff] dark:bg-zinc-950 text-[#18181b] dark:text-white focus:ring-amber-500/20 focus:border-amber-500"
                      value={editingPaymentNote}
                      onChange={(e) => setEditingPaymentNote(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-6 mt-6">
                    <button 
                      type="button" 
                      onClick={() => setEditingPaymentDetails(null)}
                      className="px-5 py-2.5 text-sm text-[#52525b] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                    >Batal</button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium flex items-center gap-2"
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

      {/* Invoice / Quotation Modal & Print Layout */}
      <AnimatePresence>
        {invoiceRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:static print:bg-[#ffffff] print:p-0 print:block">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-2xl border border-[#e4e4e7]  w-full max-w-3xl max-h-screen overflow-hidden flex flex-col print:shadow-none print:border-none print:max-h-none print:w-full print:max-w-none print:overflow-visible print:block"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#f4f4f5] /50 bg-[#fafafa]/50 dark:bg-zinc-900/50 print:hidden">
                <h3 className="font-semibold text-[#18181b] dark:text-white  flex items-center gap-2">
                  <FileText size={18} className="text-[#52525b] dark:text-[#a1a1aa]" />
                  Pratinjau: {invoiceType === 'INVOIS' ? 'Invois (Bil Tuntutan)' : 'Sebut Harga'}
                </h3>
                <button onClick={() => setInvoiceRecord(null)} className="text-[#a1a1aa] hover:text-[#52525b] dark:text-zinc-300 dark:hover:text-zinc-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hoverdark:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-[#f4f4f5]  bg-[#ffffff] dark:bg-zinc-900 print:hidden shrink-0">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setInvoiceType('INVOIS')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${invoiceType === 'INVOIS' ? 'bg-blue-600 text-white shadow-sm' : 'bg-zinc-100 text-[#3f3f46] dark:text-zinc-200 hover:bg-zinc-200 darkdark:bg-zinc-800  dark:hover:bg-zinc-700'}`}
                  >
                    Invois
                  </button>
                  <button
                    onClick={() => setInvoiceType('SEBUT HARGA')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${invoiceType === 'SEBUT HARGA' ? 'bg-blue-600 text-white shadow-sm' : 'bg-zinc-100 text-[#3f3f46] dark:text-zinc-200 hover:bg-zinc-200 darkdark:bg-zinc-800  dark:hover:bg-zinc-700'}`}
                  >
                    Sebut Harga
                  </button>
                </div>
                
                <button
                  onClick={handleDownloadInvoicePDF}
                  disabled={isGeneratingInvoicePDF}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isGeneratingInvoicePDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  <span>{isGeneratingInvoicePDF ? 'Menjana PDF...' : 'Muat Turun PDF'}</span>
                </button>
              </div>

              <div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-zinc-100 dark:bg-zinc-950 flex items-start justify-center print:bg-[#ffffff] print:p-0 print:overflow-visible print:block">
                {(() => {
                  const totalFeePayments = invoiceRecord.paymentHistory?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
                  const totalMileagePayments = invoiceRecord.paymentHistory?.reduce((sum, p) => sum + (p.mileageAmount || 0), 0) || 0;
                  const originalFee = invoiceRecord.bakiFeeTerkini + totalFeePayments;
                  const originalMileage = invoiceRecord.bakiMileage !== undefined ? (invoiceRecord.bakiMileage + totalMileagePayments) : 0;
                  const totalAgreed = originalFee + originalMileage;
                  const totalPaid = totalFeePayments + totalMileagePayments;
                  const currentBalance = invoiceRecord.bakiFeeTerkini + (invoiceRecord.bakiMileage || 0);

                  return (
                    <div ref={invoicePrintRef} className="w-[794px] h-[1122px] mx-auto font-sans text-[#000000] bg-[#ffffff] flex flex-col p-10 shrink-0 shadow-xl print:shadow-none print:p-0 relative">
                      {/* Header */}
                      <div className="flex items-center pb-6 border-b-2 border-[#000000] mb-8 gap-6">
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
                          <h2 className="text-2xl font-bold tracking-tight uppercase mb-1">{invoiceType === 'INVOIS' ? 'INVOIS' : 'SEBUT HARGA'}</h2>
                          <p className="text-[13px] font-mono mt-1">No: {invoiceType === 'INVOIS' ? 'INV' : 'QT'}-{invoiceRecord.id.substring(0, 6).toUpperCase()}</p>
                          <p className="text-[13px] font-mono">Tarikh: {formatDateDMY(new Date().toISOString().split('T')[0])}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-start mb-8 text-sm">
                        <div>
                          <p className="font-bold uppercase tracking-wider text-[#000000] mb-1">Kepada:</p>
                          <p className="font-bold text-[16px] text-[#000000] uppercase mb-1">{invoiceRecord.nama}</p>
                          {invoiceRecord.phone && <p className="text-[#000000]">No. Tel: {invoiceRecord.phone}</p>}
                          {invoiceRecord.alamat && <p className="text-[#000000] max-w-xs">{invoiceRecord.alamat}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold uppercase tracking-wider text-[#000000] mb-1">Maklumat Kes:</p>
                          <p className="text-[#000000] font-medium">{invoiceRecord.kes}</p>
                        </div>
                      </div>

                      <div className="border-t-[3px] border-b-[3px] border-[#d1d5db] mb-8 flex-1">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-[#d1d5db]">
                              <th className="py-3 px-4 font-bold text-left uppercase">Perkara / Butiran</th>
                              <th className="py-3 px-4 font-bold text-right uppercase w-[200px] border-l-2 border-[#d1d5db]">Jumlah (RM)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="py-4 px-4 font-medium text-[#000000] uppercase">Yuran Guaman (Fee)</td>
                              <td className="py-4 px-4 font-mono font-medium text-right border-l-2 border-[#d1d5db]">{originalFee.toFixed(2)}</td>
                            </tr>
                            {originalMileage > 0 && (
                              <tr>
                                <td className="py-4 px-4 font-medium text-[#000000] uppercase">Tuntutan Perjalanan (Mileage)</td>
                                <td className="py-4 px-4 font-mono font-medium text-right border-l-2 border-[#d1d5db]">{originalMileage.toFixed(2)}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="text-right space-y-4 mb-12">
                        <div className="text-sm font-bold text-[#000000] flex justify-end gap-12">
                          <span>JUMLAH KESELURUHAN:</span>
                          <span className="w-32">RM {totalAgreed.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        {invoiceType === 'INVOIS' && totalPaid > 0 && (
                          <div className="text-sm font-bold text-[#000000] flex justify-end gap-12">
                            <span>TOLAK BAYARAN DITERIMA:</span>
                            <span className="w-32">- RM {totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                        )}
                        <div className="text-sm font-bold text-[#000000] flex justify-end gap-12 pt-3 border-t border-[#d1d5db]">
                          <span>{invoiceType === 'INVOIS' ? 'BAKI PERLU DIBAYAR:' : 'JUMLAH SEBUT HARGA:'}</span>
                          <span className="w-32 text-lg">RM {(invoiceType === 'INVOIS' ? currentBalance : totalAgreed).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                      </div>

                      <div className="flex justify-end pt-12">
                        <div className="text-center">
                          <div className="h-[85px]"></div>
                          <p className="font-bold text-sm text-[#18181b] dark:text-white uppercase">Hairi Mustafa & Associates</p>
                          <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] mt-1">Peguam Syarie & Pesuruhjaya Sumpah</p>
                        </div>
                      </div>
                      <div className="mt-12 pt-6 border-t border-dashed border-[#d4d4d8] text-center text-[10px] text-[#71717a] dark:text-[#a1a1aa] italic">
                        Dokumen ini dijana oleh komputer. Tandatangan tidak diperlukan.
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Statement Modal & Print Layout */}
      <AnimatePresence>
        {statementRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 /60 backdrop-blur-sm print:static print:bg-[#ffffff] print:p-0 print:block">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-[#ffffff]  rounded-xl shadow-2xl border border-[#e4e4e7]  w-full max-w-3xl max-h-screen overflow-hidden flex flex-col print:shadow-none print:border-none print:max-h-none print:w-full print:max-w-none print:overflow-visible print:block"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#f4f4f5] /50 bg-[#fafafa]/50 /50 print:hidden">
                <h3 className="font-semibold text-[#18181b] dark:text-white  flex items-center gap-2">
                  <Printer size={18} className="text-[#52525b] dark:text-zinc-300 " />
                  Pratinjau Penyata Penuh
                </h3>
                <button onClick={() => setStatementRecord(null)} className="text-[#a1a1aa] hover:text-[#52525b] dark:text-zinc-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>
 
 <div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-zinc-100  flex items-start justify-center print:bg-[#ffffff] print:p-0 print:overflow-visible print:block">
 {/* Printable Area Starts */}
 <div ref={printRef} className="w-full min-w-[700px] mx-auto font-sans text-[#000000] bg-[#ffffff] print:min-w-0 print:w-full print:p-0">
 {/* Header */}
 <div className="flex items-center pb-6 border-b-2 border-[#000000] mb-8 gap-6">
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
 <h2 className="text-2xl font-bold tracking-tight uppercase mb-1">Penyata Akaun Penuh</h2>
 <p className="text-[13px] font-mono mt-1">Ref: {statementRecord.id}</p>
 <p className="text-[13px] font-mono">Tarikh: {formatDateDMY(new Date().toISOString().split('T')[0])}</p>
 </div>
 </div>

 {/* Client Info */}
 <div className="flex justify-between items-start text-sm mb-10 bg-[#ffffff] p-6  border border-[#d1d5db] ">
 <div>
 <p className="text-xs font-bold text-[#000000] uppercase tracking-wider mb-2">Kepada</p>
 <p className="font-bold text-[#000000] text-lg mb-1">{statementRecord.nama}</p>
 <p className="text-[#000000] font-medium">Kategori Kes: {statementRecord.kes}</p>
 </div>
 <div className="text-right">
 <p className="text-xs font-bold text-[#000000] uppercase tracking-wider mb-2">Ringkasan Baki</p>
 <p className="text-3xl font-bold font-mono text-[#000000] ">{formatRM(statementRecord.bakiFeeTerkini)}</p>
 <p className="text-[#000000] font-medium text-xs mt-1">Jumlah Perlu Dibayar</p>
 </div>
 </div>

 {/* Cost Breakdown */}
 <div className="mb-10">
 <h3 className="text-sm font-bold text-[#000000] uppercase tracking-wider mb-4 border-b border-[#d1d5db] pb-2">Perincian Kos & Tuntutan</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="p-5 border border-[#d1d5db]  bg-[#ffffff] ">
 <p className="text-xs font-bold text-[#000000] uppercase tracking-wider mb-3 border-b border-[#d1d5db] pb-2">Yuran Profesional</p>
 <div className="flex justify-between items-center space-y-2">
 <span className="text-sm font-medium text-[#000000] ">Jumlah Yuran Keseluruhan</span>
 <span className="font-mono font-bold text-[#000000] ">{formatRM(statementRecord.totalFee)}</span>
 </div>
 </div>
 <div className="p-5 border border-[#d1d5db]  bg-[#ffffff] ">
 <p className="text-xs font-bold text-[#000000] uppercase tracking-wider mb-3 border-b border-[#d1d5db] pb-2">Tuntutan Perjalanan</p>
 <div className="flex justify-between items-center space-y-2">
 <span className="text-sm font-medium text-[#000000] ">Tuntutan Mileage</span>
 <span className="font-mono font-bold text-[#d97706]">{formatRM(statementRecord.bakiMileage)}</span>
 </div>
 </div>
 </div>
 </div>

 {/* Summary Table */}
 <div className="mb-10">
 <h3 className="text-sm font-bold text-[#000000] uppercase tracking-wider mb-4 border-b border-[#d1d5db] pb-2">Ringkasan Yuran</h3>
 <div className="border border-[#d1d5db]  overflow-x-auto print:overflow-visible">
 <table className="w-full text-sm min-w-[300px]">
 <tbody className="divide-y divide-[#d1d5db] ">
 <tr className="hover:bg-[#ffffff] transition-colors">
 <td className="py-4 px-5 text-[#000000] font-medium whitespace-nowrap w-2/3">Jumlah Yuran Keseluruhan</td>
 <td className="py-4 px-5 text-right font-mono font-bold text-[#000000] ">{formatRM(statementRecord.totalFee)}</td>
 </tr>
 <tr className="hover:bg-[#ffffff] transition-colors bg-[#f3f4f6] ">
 <td className="py-4 px-5 text-[#000000] font-medium">Baki Mileage / Tuntutan Perjalanan</td>
 <td className="py-4 px-5 text-right font-mono text-[#d97706] font-medium">{formatRM(statementRecord.bakiMileage)}</td>
 </tr>
 {statementRecord.paymentHistory && statementRecord.paymentHistory.length > 0 && (
 <>
 <tr className="hover:bg-[#ffffff] transition-colors bg-[#f3f4f6] ">
 <td className="py-4 px-5 text-[#000000] font-medium">Jumlah Pembayaran Diterima (Fee)</td>
 <td className="py-4 px-5 text-right font-mono text-[#059669] font-medium">
 -{formatRM(statementRecord.paymentHistory.reduce((acc, curr) => acc + (curr.amount || 0), 0))}
 </td>
 </tr>
 {statementRecord.paymentHistory.some(p => (p.mileageAmount || 0) > 0) && (
 <tr className="hover:bg-[#ffffff] transition-colors bg-[#f3f4f6] border-t border-[#d1d5db] ">
 <td className="py-4 px-5 text-[#000000] font-medium">Jumlah Pembayaran Diterima (Mileage)</td>
 <td className="py-4 px-5 text-right font-mono text-[#059669] font-medium">
 -{formatRM(statementRecord.paymentHistory.reduce((acc, curr) => acc + (curr.mileageAmount || 0), 0))}
 </td>
 </tr>
 )}
 </>
 )}
 <tr className="bg-[#e5e7eb] text-[#000000]">
 <td className="py-3 px-5 font-bold text-sm tracking-wide">BAKI TERKINI (FEE)</td>
 <td className="py-3 px-5 text-right font-mono font-bold text-lg">{formatRM(statementRecord.bakiFeeTerkini)}</td>
 </tr>
 <tr className="bg-[#e5e7eb] text-[#000000] border-t border-[#d1d5db]">
 <td className="py-3 px-5 font-bold text-sm tracking-wide">BAKI TERKINI (MILEAGE)</td>
 <td className="py-3 px-5 text-right font-mono font-bold text-lg">{formatRM(statementRecord.bakiMileage || 0)}</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 {/* Payment History */}
 <div>
 <h3 className="text-sm font-bold text-[#000000] uppercase tracking-wider mb-4 border-b border-[#d1d5db] pb-2">Rekod Pembayaran</h3>
 {statementRecord.paymentHistory && statementRecord.paymentHistory.length > 0 ? (
 <div className="border border-[#d1d5db]  overflow-x-auto print:overflow-visible">
 <table className="w-full text-sm text-left min-w-[500px]">
 <thead className="bg-[#ffffff] border-b border-[#d1d5db] ">
 <tr>
 <th className="py-3 px-5 font-semibold text-[#000000] ">Tarikh</th>
 <th className="py-3 px-5 font-semibold text-[#000000] ">No. Rujukan</th>
 <th className="py-3 px-5 font-semibold text-[#000000] ">Kaedah</th>
 <th className="py-3 px-5 font-semibold text-[#000000] text-right">Fee (RM)</th>
 <th className="py-3 px-5 font-semibold text-[#000000] text-right">Mileage (RM)</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#d1d5db] ">
 {statementRecord.paymentHistory.map((payment) => (
 <tr key={payment.id} className="hover:bg-[#ffffff] transition-colors">
 <td className="py-3 px-5 text-[#000000] ">{formatDateDMY(payment.date)}</td>
 <td className="py-3 px-5 text-[#000000] font-mono text-xs">{payment.id}</td>
 <td className="py-3 px-5 text-[#000000] ">{payment.method}</td>
 <td className="py-3 px-5 text-right font-mono font-medium text-[#059669]">{formatRM(payment.amount || 0)}</td>
 <td className="py-3 px-5 text-right font-mono font-medium text-[#059669]">{formatRM(payment.mileageAmount || 0)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="text-center p-8 border border-dashed border-[#d1d5db]  bg-[#ffffff] text-[#000000] text-sm">
 Tiada rekod pembayaran didapati untuk akaun ini.
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="pt-16 mt-16 text-xs text-center text-[#000000] border-t border-[#d1d5db] ">
 <p className="font-medium text-[#000000] text-sm mb-2">Terima kasih atas urusan bersama kami.</p>
                    <p>Penyata rasmi ini merupakan janaan komputer dan sah tanpa tandatangan fizikal.</p>
                    <p>Sila kemukakan sebarang pertanyaan mengenai penyata ini dalam tempoh 14 hari dari tarikh dikeluarkan.</p>
                  </div>
                </div>
                {/* Printable Area Ends */}
              </div>

              <div className="p-5 border-t border-[#f4f4f5] /50 bg-[#fafafa]/50 dark:bg-zinc-900/50 flex justify-end gap-3 print:hidden">
                <button 
                  onClick={() => setStatementRecord(null)}
                  className="px-5 py-2.5 text-sm border border-[#e4e4e7]  rounded-lg hover:bg-zinc-100/50 dark:hoverdark:bg-zinc-800 text-[#52525b] dark:text-zinc-300  font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Tutup
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-5 py-2.5 text-sm border border-[#e4e4e7]  rounded-lg bg-[#ffffff] dark:bg-zinc-950 hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800 text-[#3f3f46] dark:text-[#e4e4e7] font-medium flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  <Printer size={16} className="text-[#71717a] dark:text-[#a1a1aa]" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:static print:bg-[#ffffff] print:p-0 print:block">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-2xl border border-[#e4e4e7]  w-full max-w-3xl max-h-screen overflow-hidden flex flex-col print:shadow-none print:border-none print:max-h-none print:w-full print:max-w-none print:overflow-visible print:block"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#f4f4f5] /50 bg-[#fafafa]/50 dark:bg-zinc-900/50 print:hidden">
                <h3 className="font-semibold text-[#18181b] dark:text-white  flex items-center gap-2">
                  <Printer size={18} className="text-[#52525b] dark:text-[#a1a1aa]" />
                  Pratinjau Penyata Ringkas
                </h3>
                <button onClick={() => setSimpleStatementRecord(null)} className="text-[#a1a1aa] hover:text-[#52525b] dark:text-zinc-300 dark:hover:text-zinc-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hoverdark:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-[#ffffff] print:p-0 print:overflow-visible print:block">
                {/* Printable Area Starts */}
                <div ref={simplePrintRef} className="w-full min-w-[700px] mx-auto font-sans text-[#000000] bg-[#ffffff] print:min-w-0 print:w-full print:p-0">
                  
                  {/* Header */}
                  <div className="flex items-center pb-6 border-b-2 border-[#000000] mb-8 gap-6">
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
                  <div className="flex justify-between items-start text-sm mb-10 bg-[#ffffff] p-6 border border-[#d1d5db]">
                    <div>
                      <p className="text-xs font-bold text-[#000000] uppercase tracking-wider mb-2">Kepada</p>
                      <p className="font-bold text-[#000000] text-lg mb-1">{simpleStatementRecord.nama}</p>
                      <p className="text-[#000000] font-medium">Kategori Kes: {simpleStatementRecord.kes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#000000] uppercase tracking-wider mb-2">Baki Terkini</p>
                      <p className="text-3xl font-bold font-mono text-[#000000]">{formatRM(simpleStatementRecord.bakiFeeTerkini)}</p>
                      <p className="text-[#000000] font-medium text-xs mt-1">
                        Tarikh Terakhir Bayaran: {simpleStatementRecord.paymentHistory && simpleStatementRecord.paymentHistory.length > 0 
                          ? formatDateDMY([...simpleStatementRecord.paymentHistory].sort((a: any, b: any) => parseDateObj(b.date).getTime() - parseDateObj(a.date).getTime())[0].date)
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Payment History */}
                  <div>
                    <h3 className="text-sm font-bold text-[#000000] uppercase tracking-wider mb-4 border-b border-[#d1d5db] pb-2">Senarai Sejarah Bayaran</h3>
                    {simpleStatementRecord.paymentHistory && simpleStatementRecord.paymentHistory.length > 0 ? (
                      <div className="border border-[#d1d5db] overflow-x-auto print:overflow-visible">
                        <table className="w-full text-sm text-left min-w-[500px]">
                          <thead className="bg-[#ffffff] border-b border-[#d1d5db]">
                            <tr>
                              <th className="py-3 px-5 font-semibold text-[#000000]">Tarikh</th>
                              <th className="py-3 px-5 font-semibold text-[#000000]">No. Rujukan</th>
                              <th className="py-3 px-5 font-semibold text-[#000000]">Kaedah</th>
                              <th className="py-3 px-5 font-semibold text-[#000000] text-right">Fee (RM)</th>
                              <th className="py-3 px-5 font-semibold text-[#000000] text-right">Mileage (RM)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#d1d5db]">
                            {[...simpleStatementRecord.paymentHistory]
                              .sort((a: any, b: any) => parseDateObj(a.date).getTime() - parseDateObj(b.date).getTime())
                              .map((payment) => (
                              <tr key={payment.id} className="hover:bg-[#ffffff] transition-colors">
                                <td className="py-3 px-5 text-[#000000]">{formatDateDMY(payment.date)}</td>
                                <td className="py-3 px-5 text-[#000000] font-mono text-xs">{payment.id}</td>
                                <td className="py-3 px-5 text-[#000000]">{payment.method}</td>
                                <td className="py-3 px-5 text-right font-mono font-medium text-[#059669]">
                                  {formatRM(payment.amount || 0)}
                                </td>
                                <td className="py-3 px-5 text-right font-mono font-medium text-[#d97706]">
                                  {formatRM(payment.mileageAmount || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500 border border-[#d1d5db] bg-[#f9fafb]">
                        Tiada rekod bayaran buat masa ini.
                      </div>
                    )}
                  </div>
                  
                </div>
                {/* Printable Area Ends */}
              </div>

              <div className="p-5 border-t border-[#f4f4f5] /50 bg-[#fafafa]/50 /50 flex justify-end gap-3 print:hidden">
                <button 
                  onClick={() => setSimpleStatementRecord(null)}
                  className="px-5 py-2.5 text-sm border border-[#e4e4e7]  rounded-lg hover:bg-zinc-100/50 dark:bg-zinc-800 text-[#52525b] dark:text-zinc-300  font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Tutup
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-5 py-2.5 text-sm border border-[#e4e4e7]  rounded-lg bg-[#ffffff]  hover:bg-[#fafafa] dark:bg-zinc-800 text-[#3f3f46] dark:text-zinc-200  font-medium flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  <Printer size={16} className="text-[#71717a] dark:text-[#a1a1aa]" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:static print:bg-[#ffffff] print:p-0 print:block">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:max-h-none print:w-full print:max-w-none print:overflow-visible print:block"
            >
              <div className="p-5 border-b border-[#f4f4f5] /50 flex justify-between items-center bg-[#fafafa]/50 dark:bg-zinc-900/50 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8  bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                    <Printer size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#18181b] dark:text-white ">Cetak Resit</h3>
                    <p className="text-[11px] text-[#71717a] dark:text-[#a1a1aa] font-mono tracking-wider">REF: {receiptData.payment.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setReceiptData(null)}
                  className="p-1.5 text-[#a1a1aa] hover:text-[#52525b] dark:text-zinc-300 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hoverdark:bg-zinc-800 rounded-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
 
 <div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-[#ffffff] print:p-0 print:overflow-visible print:block">
 {/* Printable Area Starts */}
                <div ref={receiptPrintRef} className="w-[794px] h-[1122px] mx-auto font-sans text-[#000000] bg-[#ffffff] flex flex-col p-10 shrink-0 shadow-xl print:shadow-none print:p-0 relative">
                  {/* Header */}
                  <div className="flex items-center pb-6 border-b-2 border-[#000000] mb-8 gap-6">
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
                      <p className="font-bold uppercase tracking-wider text-[#000000] mb-1">Diterima Daripada:</p>
                      <p className="font-bold text-[16px] text-[#000000] uppercase mb-1">{receiptData.record.nama}</p>
                      <p className="text-[#000000] font-medium">Kategori Kes: {receiptData.record.kes}</p>
                    </div>
                  </div>

                  <div className="border-t-[3px] border-b-[3px] border-[#d1d5db] mb-8">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b-2 border-[#d1d5db] ">
 <th className="py-3 px-4 font-bold text-left uppercase">Item / Perkara</th>
 <th className="py-3 px-4 font-bold text-right uppercase w-[200px] border-l-2 border-[#d1d5db] ">Jumlah (RM)</th>
 </tr>
 </thead>
 <tbody>
 {(receiptData.payment.amount > 0 || (receiptData.payment.amount === 0 && !receiptData.payment.mileageAmount)) && (
 <tr>
 <td className="py-4 px-4 font-medium text-[#000000] uppercase">FEE {formatDateDMY(receiptData.payment.date)}</td>
 <td className="py-4 px-4 font-mono font-medium text-right border-l-2 border-[#d1d5db] ">{receiptData.payment.amount.toFixed(2)}</td>
 </tr>
 )}
 {!!receiptData.payment.mileageAmount && receiptData.payment.mileageAmount > 0 && (
 <tr>
 <td className="py-4 px-4 font-medium text-[#000000] uppercase">MILEAGE {formatDateDMY(receiptData.payment.date)}</td>
 <td className="py-4 px-4 font-mono font-medium text-right border-l-2 border-[#d1d5db] ">{receiptData.payment.mileageAmount.toFixed(2)}</td>
 </tr>
 )}
 {(receiptData.payment.amount > 0 && !!receiptData.payment.mileageAmount && receiptData.payment.mileageAmount > 0) && (
 <tr className="border-t-2 border-[#d1d5db] bg-[#ffffff] ">
 <td className="py-4 px-4 font-bold text-[#000000] text-right uppercase">JUMLAH KESELURUHAN (RM)</td>
 <td className="py-4 px-4 font-mono font-bold text-right border-l-2 border-[#d1d5db] ">{(receiptData.payment.amount + receiptData.payment.mileageAmount).toFixed(2)}</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 <div className="flex justify-between items-start border-b border-[#d1d5db] pb-12 mb-12">
 <div className="text-sm font-bold text-[#000000] uppercase flex flex-col gap-2 text-left">
   <div>Butiran Kes: <span className="underline underline-offset-4">{receiptData.record.kes}</span></div>
   {receiptData.payment.nota && (
     <div className="mt-2 normal-case font-normal text-[#52525b] dark:text-zinc-300 text-[13px] text-left">
       <span className="font-bold uppercase text-[#000000] text-[11px] block mb-0.5">Nota Bayaran:</span>
       <span className="italic bg-[#fafafa] border border-[#e4e4e7] rounded px-2.5 py-1.5 inline-block text-[#3f3f46] dark:text-zinc-200 font-mono">{receiptData.payment.nota}</span>
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
 <div className="text-sm font-bold text-[#000000] flex justify-end gap-12">
 <span>JUMLAH BAYARAN (FEE):</span>
 <span className="w-32">RM {receiptData.payment.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
 </div>
 <div className="text-sm font-bold text-[#000000] flex justify-end gap-12">
 <span>BAKI TERDAHULU (FEE):</span>
 <span className="w-32">RM {bakiTerdahuluFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
 </div>
 <div className="text-sm font-bold text-[#000000] flex justify-end gap-12 pt-3 border-t border-[#d1d5db] mb-4">
 <span>BAKI TERKINI (FEE):</span>
 <span className="w-32">RM {bakiTerkiniFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                     </div>
                                   </>
                               )}

                               {hasMileageReceipt && (
                                   <>
                                     <div className="text-sm font-bold text-[#27272a] dark:text-zinc-100  flex justify-end gap-12">
                                         <span>JUMLAH BAYARAN (MILEAGE):</span>
                                         <span className="w-32">RM {receiptData.payment.mileageAmount!.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                     </div>
                                     <div className="text-sm font-bold text-[#27272a] dark:text-zinc-100  flex justify-end gap-12">
                                         <span>BAKI TERDAHULU (MILEAGE):</span>
                                         <span className="w-32">RM {bakiTerdahuluMileage.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                     </div>
                                     <div className="text-sm font-bold text-[#27272a] dark:text-zinc-100  flex justify-end gap-12 pt-3 border-t border-[#18181b] ">
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
                      <p className="font-bold text-sm text-[#18181b] dark:text-white  uppercase">Hairi Mustafa & Associates</p>
                      <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] mt-1">Peguam Syarie & Pesuruhjaya Sumpah</p>
                    </div>
                  </div>

                  <div className="mt-12 pt-6 border-t border-dashed border-[#d4d4d8]  text-center text-[10px] text-[#a1a1aa] dark:text-[#71717a] dark:text-[#a1a1aa] italic">
                    Resit ini dijana oleh komputer, terima kasih atas urusan anda. Ref: {receiptData.payment.id}
                  </div>
                </div>
                {/* Printable Area Ends */}
              </div>

              <div className="p-5 border-t border-[#f4f4f5] /50 bg-[#fafafa]/50 dark:bg-zinc-900/50 flex justify-end gap-3 print:hidden">
                <button 
                  onClick={() => setReceiptData(null)}
                  className="px-5 py-2.5 text-sm border border-[#e4e4e7]  rounded-lg hover:bg-zinc-100/50 dark:hoverdark:bg-zinc-800 text-[#52525b] dark:text-zinc-300  font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Tutup
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-5 py-2.5 text-sm border border-[#e4e4e7]  rounded-lg bg-[#ffffff] dark:bg-zinc-950 hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800 text-[#3f3f46] dark:text-[#e4e4e7] font-medium flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  <Printer size={16} className="text-[#71717a] dark:text-[#a1a1aa]" />
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
            className="fixed bottom-4 right-4 bg-[#ffffff] dark:bg-zinc-950 border border-blue-200 shadow-xl rounded-lg p-5 max-w-sm z-50 flex items-start gap-3"
          >
            <div className="bg-blue-50 text-blue-500 rounded-full p-2 shrink-0">
              <Download size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-[#27272a] dark:text-[#e4e4e7]">Peringatan Penyimpanan (Backup)</h4>
              <p className="text-xs text-[#52525b] dark:text-[#a1a1aa] mt-1 leading-relaxed">Tiada sebarang pengemaskinian rekod selama 7 hari. Anda disarankan untuk mengeksport rekod kes anda sebagai sandaran.</p>
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
                  className="text-xs border border-[#d4d4d8]  text-[#3f3f46] dark:text-zinc-200  px-4 py-2 rounded font-medium hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800 transition-colors"
                >
                  Abaikan
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hidden PDF renderer for Combined PDF generation */}
      {combinedPdfQueue && combinedPdfCurrentIndex < combinedPdfQueue.length && combinedPdfQueue[combinedPdfCurrentIndex] && (
        <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden w-[800px]">
          <div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-[#ffffff] print:p-0 print:overflow-visible print:block">
            <div ref={hiddenCombinedPdfPrintRef} className="w-full min-w-[700px] mx-auto font-sans text-[#000000] bg-[#ffffff] print:min-w-0 print:w-full print:p-0 p-8 sm:p-12 relative overflow-hidden h-[1122px] flex flex-col justify-between">
              
              <div>
                  <div className="flex items-center pb-6 border-b border-[#d1d5db] mb-8 gap-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl overflow-hidden border border-gray-200">
                      <img src="/logo.png" alt="Hairi Mustafa & Co Logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h1 className="text-[1.35rem] sm:text-2xl font-black text-[#000000] tracking-tight leading-tight uppercase">Tetuan Hairi Mustafa & Co</h1>
                      <div className="flex flex-col gap-0.5 mt-2 text-xs sm:text-[13px] font-medium text-[#000000] uppercase tracking-wide">
                        <p className="m-0">PEGUAM SYARIE & PERUNDING CARA ISLAM</p>
                        <p className="m-0 text-[#000000] font-semibold">NO. 19-1 (TINGKAT 1), JALAN SAUJANA INDAH 4, TAMAN SAUJANA INDAH, 75450 BUKIT KATIL, MELAKA</p>
                        <p className="m-0">TEL: 010-2434143 / 011-56531310 | EMAIL: tetuanhairi@gmail.com</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-start mb-8 text-sm">
                    <div>
                      <p className="text-[13px] font-mono mt-1">Ref: {combinedPdfQueue[combinedPdfCurrentIndex].id}</p>
                      <p className="font-bold text-[#000000] text-lg mb-1">{combinedPdfQueue[combinedPdfCurrentIndex].nama}</p>
                      <p className="text-[#000000] font-medium">Kategori Kes: {combinedPdfQueue[combinedPdfCurrentIndex].kes}</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-bold tracking-tight uppercase mb-1">Penyata Ringkas</h2>
                      <p className="text-[13px] font-mono">Tarikh: {formatDateDMY(new Date().toISOString().split('T')[0])}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-[#f3f4f6] p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                      <span className="text-[#000000] font-semibold uppercase tracking-wider text-xs mb-2">Baki Fee Semasa</span>
                      <p className="text-3xl font-bold font-mono text-[#000000]">{formatRM(combinedPdfQueue[combinedPdfCurrentIndex].bakiFeeTerkini)}</p>
                    </div>
                    <div className="bg-[#f9fafb] p-6 rounded-xl border border-gray-200 flex flex-col justify-between">
                      <div>
                        <span className="text-[#000000] font-medium text-sm mb-1 block">Bayaran Terakhir: <span className="font-bold">{formatRM(combinedPdfQueue[combinedPdfCurrentIndex].bayaranTerakhir)}</span></span>
                        <span className="text-[#000000] text-xs block">
                          Tarikh Terakhir Bayaran: {combinedPdfQueue[combinedPdfCurrentIndex].paymentHistory && combinedPdfQueue[combinedPdfCurrentIndex].paymentHistory.length > 0 
                          ? formatDateDMY([...combinedPdfQueue[combinedPdfCurrentIndex].paymentHistory].sort((a: any, b: any) => parseDateObj(b.date).getTime() - parseDateObj(a.date).getTime())[0].date)
                          : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t-[3px] border-b-[3px] border-[#d1d5db] mb-8 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#ffffff] border-b border-[#d1d5db]">
                        <tr>
                          <th className="py-3 px-5 font-semibold text-[#000000] uppercase tracking-wider text-xs">Perkara</th>
                          <th className="py-3 px-5 font-semibold text-[#000000] text-right uppercase tracking-wider text-xs">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d1d5db] bg-[#ffffff]">
                        <tr className="hover:bg-[#ffffff] transition-colors">
                          <td className="py-4 px-5 text-[#000000] font-medium">Jumlah Bayaran Penuh (Fee)</td>
                          <td className="py-4 px-5 text-right font-mono font-bold text-[#000000]">{formatRM(combinedPdfQueue[combinedPdfCurrentIndex].totalFee)}</td>
                        </tr>
                        <tr className="hover:bg-[#ffffff] transition-colors bg-[#f9fafb] border-t border-[#d1d5db]">
                          <td className="py-4 px-5 text-[#000000] font-medium">Jumlah Bayaran Terkumpul (Fee)</td>
                          <td className="py-4 px-5 text-right font-mono font-medium text-[#059669]">
                            -{formatRM((combinedPdfQueue[combinedPdfCurrentIndex].paymentHistory || []).reduce((acc, curr) => acc + (curr.amount || 0), 0))}
                          </td>
                        </tr>
                        {combinedPdfQueue[combinedPdfCurrentIndex].bakiMileage !== undefined && combinedPdfQueue[combinedPdfCurrentIndex].bakiMileage > 0 && (
                          <tr className="hover:bg-[#ffffff] transition-colors border-t border-[#d1d5db]">
                            <td className="py-4 px-5 text-[#000000] font-medium">Baki Terkini (Mileage)</td>
                            <td className="py-4 px-5 text-right font-mono text-[#d97706] font-medium">
                              {formatRM(combinedPdfQueue[combinedPdfCurrentIndex].bakiMileage || 0)}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-[#e5e7eb] text-[#000000] border-t-2 border-[#d1d5db]">
                          <td className="py-4 px-5 font-bold text-sm tracking-wide">BAKI TERKINI (FEE)</td>
                          <td className="py-4 px-5 text-right font-mono font-bold text-lg">{formatRM(combinedPdfQueue[combinedPdfCurrentIndex].bakiFeeTerkini)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

              </div>

              <div>
                  <div className="flex justify-between items-start border-t border-[#d1d5db] pt-6">
                    <div className="text-sm font-bold text-[#000000] uppercase flex flex-col gap-2 text-left w-2/3">
                      <div>Terma & Syarat:</div>
                      <p className="normal-case font-normal text-[#52525b] dark:text-zinc-300 text-[11px] leading-relaxed text-left text-justify">
                        Penyata ringkas ini dikeluarkan sebagai rujukan status akaun pelanggan. Sila pastikan semua baki tertunggak (sekiranya ada) dijelaskan mengikut jadual yang telah dipersetujui. Untuk sebarang pertanyaan atau percanggahan maklumat, sila hubungi pihak kami dengan segera.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-dashed border-[#d4d4d8]  text-center text-[10px] text-[#a1a1aa]  italic">
                    Penyata ini dijana oleh komputer, tiada tandatangan diperlukan.
                  </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF renderer for ZIP generation */}
      {/* Hidden PDF renderer for ZIP and Quick Print generation */}
      {(() => {
        let currentRenderData = quickPrintData || (zipQueue && zipQueue[zipCurrentIndex]);
        return currentRenderData && (
        <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden w-[800px]">
          <div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-[#ffffff] print:p-0 print:overflow-visible print:block">
            <div ref={hiddenReceiptPrintRef} className="w-[794px] h-[1122px] mx-auto font-sans text-[#000000] bg-[#ffffff] flex flex-col p-10 shrink-0 relative">
                  {/* Header */}
                  <div className="flex items-center pb-6 border-b-2 border-[#000000] mb-8 gap-6">
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
                      <p className="text-[13px] font-mono mt-1">Ref: {currentRenderData.payment.id}</p>
                      <p className="text-[13px] font-mono">Tarikh: {formatDateDMY(currentRenderData.payment.date)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-start mb-8 text-sm">
                    <div>
                      <p className="font-bold uppercase tracking-wider text-[#000000] mb-1">Diterima Daripada:</p>
                      <p className="font-bold text-[16px] text-[#000000] uppercase mb-1">{currentRenderData.record.nama}</p>
                      <p className="text-[#000000] font-medium">Kategori Kes: {currentRenderData.record.kes}</p>
                    </div>
                  </div>

                  <div className="border-t-[3px] border-b-[3px] border-[#d1d5db] mb-8">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b-2 border-[#d1d5db] ">
 <th className="py-3 px-4 font-bold text-left uppercase">Item / Perkara</th>
 <th className="py-3 px-4 font-bold text-right uppercase w-[200px] border-l-2 border-[#d1d5db] ">Jumlah (RM)</th>
 </tr>
 </thead>
 <tbody>
 {(currentRenderData.payment.amount > 0 || (currentRenderData.payment.amount === 0 && !currentRenderData.payment.mileageAmount)) && (
 <tr>
 <td className="py-4 px-4 font-medium text-[#000000] uppercase">FEE {formatDateDMY(currentRenderData.payment.date)}</td>
 <td className="py-4 px-4 font-mono font-medium text-right border-l-2 border-[#d1d5db] ">{currentRenderData.payment.amount.toFixed(2)}</td>
 </tr>
 )}
 {!!currentRenderData.payment.mileageAmount && currentRenderData.payment.mileageAmount > 0 && (
 <tr>
 <td className="py-4 px-4 font-medium text-[#000000] uppercase">MILEAGE {formatDateDMY(currentRenderData.payment.date)}</td>
 <td className="py-4 px-4 font-mono font-medium text-right border-l-2 border-[#d1d5db] ">{currentRenderData.payment.mileageAmount.toFixed(2)}</td>
 </tr>
 )}
 {(currentRenderData.payment.amount > 0 && !!currentRenderData.payment.mileageAmount && currentRenderData.payment.mileageAmount > 0) && (
 <tr className="border-t-2 border-[#d1d5db] bg-[#ffffff] ">
 <td className="py-4 px-4 font-bold text-[#000000] text-right uppercase">JUMLAH KESELURUHAN (RM)</td>
 <td className="py-4 px-4 font-mono font-bold text-right border-l-2 border-[#d1d5db] ">{(currentRenderData.payment.amount + currentRenderData.payment.mileageAmount).toFixed(2)}</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 <div className="flex justify-between items-start border-b border-[#d1d5db] pb-12 mb-12">
 <div className="text-sm font-bold text-[#000000] uppercase flex flex-col gap-2 text-left">
   <div>Butiran Kes: <span className="underline underline-offset-4">{currentRenderData.record.kes}</span></div>
   {currentRenderData.payment.nota && (
     <div className="mt-2 normal-case font-normal text-[#52525b] dark:text-zinc-300 text-[13px] text-left">
       <span className="font-bold uppercase text-[#000000] text-[11px] block mb-0.5">Nota Bayaran:</span>
       <span className="italic bg-[#fafafa] border border-[#e4e4e7] rounded px-2.5 py-1.5 inline-block text-[#3f3f46] dark:text-zinc-200 font-mono">{currentRenderData.payment.nota}</span>
     </div>
   )}
 </div>
 {(()=>{
 const sortedPayments = [...(currentRenderData.record.paymentHistory || [])].sort((a, b) => parseDateString(a.date) - parseDateString(b.date));
 const paymentIndex = sortedPayments.findIndex(p => p.id === currentRenderData.payment.id);
 const paymentsAfter = sortedPayments.slice(paymentIndex + 1);

 const sumAfterFee = paymentsAfter.reduce((sum, p) => sum + (p.amount || 0), 0);
 const bakiTerkiniFee = currentRenderData.record.bakiFeeTerkini + sumAfterFee;
 const bakiTerdahuluFee = bakiTerkiniFee + (currentRenderData.payment.amount || 0);

 const hasMileageReceipt = !!currentRenderData.payment.mileageAmount && currentRenderData.payment.mileageAmount > 0;
 const sumAfterMileage = paymentsAfter.reduce((sum, p) => sum + (p.mileageAmount || 0), 0);
 const bakiTerkiniMileage = currentRenderData.record.bakiMileage !== undefined ? currentRenderData.record.bakiMileage + sumAfterMileage : 0;
 const bakiTerdahuluMileage = bakiTerkiniMileage + (currentRenderData.payment.mileageAmount || 0);
 
 return (
 <div className="text-right space-y-4">
 {currentRenderData.payment.amount > 0 && (
 <>
 <div className="text-sm font-bold text-[#000000] flex justify-end gap-12">
 <span>JUMLAH BAYARAN (FEE):</span>
 <span className="w-32">RM {currentRenderData.payment.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
 </div>
 <div className="text-sm font-bold text-[#000000] flex justify-end gap-12">
 <span>BAKI TERDAHULU (FEE):</span>
 <span className="w-32">RM {bakiTerdahuluFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
 </div>
 <div className="text-sm font-bold text-[#000000] flex justify-end gap-12 pt-3 border-t border-[#d1d5db] mb-4">
 <span>BAKI TERKINI (FEE):</span>
 <span className="w-32">RM {bakiTerkiniFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                     </div>
                                   </>
                               )}

                               {hasMileageReceipt && (
                                   <>
                                     <div className="text-sm font-bold text-[#27272a] dark:text-zinc-100  flex justify-end gap-12">
                                         <span>JUMLAH BAYARAN (MILEAGE):</span>
                                         <span className="w-32">RM {currentRenderData.payment.mileageAmount!.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                     </div>
                                     <div className="text-sm font-bold text-[#27272a] dark:text-zinc-100  flex justify-end gap-12">
                                         <span>BAKI TERDAHULU (MILEAGE):</span>
                                         <span className="w-32">RM {bakiTerdahuluMileage.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                     </div>
                                     <div className="text-sm font-bold text-[#27272a] dark:text-zinc-100  flex justify-end gap-12 pt-3 border-t border-[#18181b] ">
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
                      <p className="font-bold text-sm text-[#18181b] dark:text-white  uppercase">Hairi Mustafa & Associates</p>
                      <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] mt-1">Peguam Syarie & Pesuruhjaya Sumpah</p>
                    </div>
                  </div>

                  <div className="mt-12 pt-6 border-t border-dashed border-[#d4d4d8]  text-center text-[10px] text-[#a1a1aa] dark:text-[#71717a] dark:text-[#a1a1aa] italic">
                    Resit ini dijana oleh komputer, terima kasih atas urusan anda. Ref: {currentRenderData.payment.id}
                  </div>
                </div>
                {/* Printable Area Ends */}
          </div>
        </div>
      );
      })()}
      {/* Client Profile Modal */}
      <AnimatePresence>
        {clientProfileName && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-2xl border border-[#e4e4e7]  w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#f4f4f5] /50 bg-[#fafafa]/50 dark:bg-zinc-900/50">
                <h3 className="font-semibold text-[#18181b] dark:text-white  flex items-center gap-2">
                  <Users size={18} className="text-[#52525b] dark:text-[#a1a1aa]" />
                  Profil Pelanggan: {clientProfileName}
                </h3>
                <button onClick={() => setClientProfileName(null)} className="text-[#a1a1aa] hover:text-[#52525b] dark:text-zinc-300 dark:hover:text-zinc-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hoverdark:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                {(() => {
                  const clientCases = records.filter(r => r.nama === clientProfileName);
                  const firstCase = clientCases[0] || {};
                  const totalClientFee = clientCases.reduce((sum, r) => sum + r.totalFee, 0);
                  const totalClientBaki = clientCases.reduce((sum, r) => sum + r.bakiFeeTerkini, 0);
                  
                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">Jumlah Keseluruhan Kes</p>
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{clientCases.length} Kes</p>
                        </div>
                        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                          <p className="text-xs font-semibold text-[#d97706] dark:text-amber-400 uppercase mb-1">Jumlah Tunggakan (Baki)</p>
                          <p className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">{formatRM(totalClientBaki)}</p>
                        </div>
                      </div>
                      
                      <form onSubmit={(e) => handleUpdateClientProfile(e, clientProfileName)} className="space-y-4 border border-[#e4e4e7]  rounded-xl p-5 bg-[#fafafa]/30 dark:bg-zinc-900/30">
                        <h4 className="font-semibold text-sm mb-3">Maklumat Perhubungan</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-1 uppercase">No. Telefon</label>
                            <input name="telefon" type="text" defaultValue={firstCase.telefon || ''} className="w-full px-3 py-2 text-sm border border-[#e4e4e7] rounded-lg bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="01X-XXXXXXX" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-1 uppercase">Emel</label>
                            <input name="emel" type="email" defaultValue={firstCase.emel || ''} className="w-full px-3 py-2 text-sm border border-[#e4e4e7] rounded-lg bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="pelanggan@gmail.com" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-1 uppercase">Alamat</label>
                          <textarea name="alamat" defaultValue={firstCase.alamat || ''} rows={2} className="w-full px-3 py-2 text-sm border border-[#e4e4e7]  rounded-lg bg-[#ffffff] dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Alamat penuh..." />
                        </div>
                        <div className="flex justify-end pt-2">
                          <button type="submit" className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">Simpan Maklumat</button>
                        </div>
                      </form>
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-3">Senarai Kes</h4>
                        <div className="border border-[#e4e4e7]  rounded-xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
                          {clientCases.map(c => (
                            <div key={c.id} className="p-3 sm:p-4 bg-[#ffffff] dark:bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-sm">{c.kes}</p>
                                <p className="text-xs text-[#71717a] dark:text-[#a1a1aa]">Ruj: {c.id} &bull; Tarikh: {formatDateDMY(c.tarikh)}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-mono text-sm font-semibold">{formatRM(c.bakiFeeTerkini)}</p>
                                <p className="text-[10px] text-[#71717a] dark:text-[#a1a1aa] uppercase">Baki Fee</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-6 right-6 z-[9999] max-w-md w-[calc(100vw-3rem)] sm:w-auto p-4 rounded-xl shadow-2xl border flex items-start gap-3 print:hidden backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-red-950/95 border-red-800 text-red-100 shadow-red-950/40'
                : toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-800 text-emerald-100 shadow-emerald-950/40'
                : 'bg-zinc-900/95 border-zinc-700 text-zinc-100 shadow-zinc-950/40'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <Info className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div className="flex-1 text-sm pr-1">
              <p className="font-semibold text-white leading-snug">{toast.message}</p>
              {toast.details && (
                <p className="mt-1 text-xs opacity-90 text-zinc-300 font-normal leading-relaxed">{toast.details}</p>
              )}
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-zinc-400 hover:text-white p-1 rounded transition-colors shrink-0"
              aria-label="Tutup notifikasi"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
