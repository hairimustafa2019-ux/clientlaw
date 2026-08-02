import React, { useState, useEffect, useRef } from 'react';
import { Printer, Edit, Trash2, Plus, Download, X, FileMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, writeBatch, Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { CaseRecord } from '../data';

type ReceiptItem = { perkara: string; harga: number };

export type StandaloneReceiptData = {
  id?: string;
  tarikh: string;
  tarikhDisplay?: string;
  kategori: string;
  nama: string;
  alamat: string;
  items: ReceiptItem[];
  jumlah: number;
  bakiTerdahulu: number;
  bakiTerkini: number;
  butiran: string;
  userId?: string;
};

export default function StandaloneReceipts({ 
  initialData, 
  user, 
  db,
  caseRecords = []
}: { 
  initialData?: CaseRecord | null; 
  user: User | null; 
  db: Firestore;
  caseRecords?: CaseRecord[];
}) {
  const [records, setRecords] = useState<StandaloneReceiptData[]>(() => {
    const saved = localStorage.getItem('hma_receipts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem('hma_receipts');
      if (saved) {
        try { setRecords(JSON.parse(saved)); } catch (e) { setRecords([]); }
      } else {
        setRecords([]);
      }
      return;
    }

    // Auto sync local offline receipts to Firestore when user logs in
    const savedLocal = localStorage.getItem('hma_receipts');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (parsed && parsed.length > 0) {
          const batch = writeBatch(db);
          for (const rec of parsed) {
            const rId = rec.id || doc(collection(db, `users/${user.uid}/receipts`)).id;
            const docRef = doc(db, 'users', user.uid, 'receipts', rId);
            batch.set(docRef, { ...rec, id: rId, userId: user.uid }, { merge: true });
          }
          batch.commit().then(() => {
            localStorage.removeItem('hma_receipts');
            console.log('Local receipts auto-synced to cloud.');
          }).catch(err => {
            console.error("Failed to commit synced receipts", err);
          });
        }
      } catch (e) {
        console.error("Error syncing local receipts", e);
      }
    }

    const q = query(collection(db, `users/${user.uid}/receipts`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReceipts: StandaloneReceiptData[] = [];
      snapshot.forEach(doc => {
        fetchedReceipts.push(doc.data() as StandaloneReceiptData);
      });
      
      // Sort receipts by tarikh descending, or fallback to id
      fetchedReceipts.sort((a, b) => b.tarikh.localeCompare(a.tarikh));
      
      setRecords(fetchedReceipts);
    }, (error) => {
      console.error("Failed to load receipts from Firestore:", error);
    });

    return () => unsubscribe();
  }, [user, db]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('hma_receipts', JSON.stringify(records));
    }
  }, [records, user]);

  const [form, setForm] = useState<StandaloneReceiptData>(() => {
    const defaultForm = {
      tarikh: new Date().toISOString().split('T')[0],
      kategori: 'Fee',
      nama: '',
      alamat: '',
      items: [{ perkara: 'Fee/Deposit', harga: 0 }],
      jumlah: 0,
      bakiTerdahulu: 0,
      bakiTerkini: 0,
      butiran: ''
    };
    const savedDraft = localStorage.getItem('hma_receipt_draft');
    if (savedDraft) {
      try {
        return { ...defaultForm, ...JSON.parse(savedDraft) };
      } catch (e) {
        return defaultForm;
      }
    }
    return defaultForm;
  });

  // Simpan draf setiap kali borang berubah
  useEffect(() => {
    localStorage.setItem('hma_receipt_draft', JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (initialData) {
      setForm(prev => ({
        ...prev,
        nama: initialData.nama,
        butiran: initialData.kes,
        bakiTerdahulu: initialData.bakiFeeTerkini,
        bakiTerkini: initialData.bakiFeeTerkini - prev.jumlah
      }));
    }
  }, [initialData]);

  const [editIndex, setEditIndex] = useState<number | null>(null);
  
  const uniqueCustomerNames = Array.from(new Set(caseRecords.map(r => r.nama).filter(Boolean)));
  const [searchTxt, setSearchTxt] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const calculateTotal = (items: ReceiptItem[]) => {
    return items.reduce((sum, item) => sum + (Number(item.harga) || 0), 0);
  };

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: string) => {
    const newItems = [...form.items];
    if (field === 'harga') {
      newItems[index].harga = parseFloat(value) || 0;
    } else {
      newItems[index].perkara = value;
    }
    const newTotal = calculateTotal(newItems);
    setForm({ ...form, items: newItems, jumlah: newTotal, bakiTerkini: form.bakiTerdahulu - newTotal });
  };

  const addItemRow = () => {
    setForm({ ...form, items: [...form.items, { perkara: '', harga: 0 }] });
  };

  const removeItemRow = (index: number) => {
    if (form.items.length > 1) {
      const newItems = form.items.filter((_, i) => i !== index);
      const newTotal = calculateTotal(newItems);
      setForm({ ...form, items: newItems, jumlah: newTotal, bakiTerkini: form.bakiTerdahulu - newTotal });
    } else {
      alert("Mesti ada sekurang-kurangnya satu perkara.");
    }
  };

  const handleBakiTerdahuluChange = (val: string) => {
    const baki = parseFloat(val) || 0;
    setForm({ ...form, bakiTerdahulu: baki, bakiTerkini: baki - form.jumlah });
  };

  const handleSubmit = async () => {
    if (!form.nama) {
      alert("Sila masukkan nama pelanggan.");
      return;
    }
    
    let d = new Date(form.tarikh);
    const tarikhDisplay = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
    
    if (user) {
      const rId = editingId || doc(collection(db, `users/${user.uid}/receipts`)).id;
      const submission = { ...form, id: rId, tarikhDisplay, userId: user.uid };
      
      try {
        await setDoc(doc(db, `users/${user.uid}/receipts`, rId), submission);
        localStorage.removeItem('hma_receipt_draft');
        setEditingId(null);
        setEditIndex(null);
        setShowPreview(true);
      } catch (err) {
        console.error("Failed to save receipt to Firestore:", err);
        alert("Gagal menyimpan resit ke cloud. Sila cuba lagi.");
      }
    } else {
      const rId = form.id || `local-${Date.now()}`;
      const submission = { ...form, id: rId, tarikhDisplay };
      
      if (editIndex !== null) {
        const newRecords = [...records];
        newRecords[editIndex] = submission;
        setRecords(newRecords);
      } else {
        setRecords([submission, ...records]);
      }
      localStorage.removeItem('hma_receipt_draft');
      setEditIndex(null);
      setEditingId(null);
      setShowPreview(true);
    }
  };

  const doPrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgPropsHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgPropsHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgPropsHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgPropsHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgPropsHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Resit_${form.nama}_${form.tarikh}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    }
  };

  const resetForm = () => {
    setForm({
      tarikh: new Date().toISOString().split('T')[0],
      kategori: 'Fee',
      nama: '',
      alamat: '',
      items: [{ perkara: 'Fee/Deposit', harga: 0 }],
      jumlah: 0,
      bakiTerdahulu: 0,
      bakiTerkini: 0,
      butiran: ''
    });
    setEditIndex(null);
    setEditingId(null);
  };

  const editRekod = (rec: StandaloneReceiptData) => {
    const idx = records.findIndex(r => r.id === rec.id || (r.nama === rec.nama && r.tarikh === rec.tarikh && r.jumlah === rec.jumlah));
    if (idx === -1) return;
    setForm({
      ...rec,
      items: rec.items && rec.items.length > 0 ? rec.items : [{ perkara: (rec as any).item || 'Fee/Deposit', harga: rec.jumlah }]
    });
    setEditIndex(idx);
    if (rec.id) {
      setEditingId(rec.id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const padamRekod = async (rec: StandaloneReceiptData) => {
    if (confirm("Adakah anda pasti untuk memadam rekod ini?")) {
      if (user && rec.id) {
        try {
          await deleteDoc(doc(db, `users/${user.uid}/receipts`, rec.id));
        } catch (err) {
          console.error("Failed to delete receipt from Firestore:", err);
          alert("Gagal memadam resit dari cloud.");
        }
      } else {
        const idx = records.findIndex(r => r.id === rec.id || (r.nama === rec.nama && r.tarikh === rec.tarikh && r.jumlah === rec.jumlah));
        if (idx !== -1) {
          const newRecords = [...records];
          newRecords.splice(idx, 1);
          setRecords(newRecords);
        }
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto space-y-8 print:hidden">
        
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
          {/* Form */}
          <div className="flex-1 p-6 border-r border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 border-b-2 border-yellow-400 pb-2 inline-block">
              {editIndex !== null ? 'Kemaskini Rekod' : 'Jana Resit Baru'}
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Tarikh:</label>
                  <input type="date" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950" 
                    value={form.tarikh} onChange={e => setForm({...form, tarikh: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Kategori:</label>
                  <select className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950" 
                    value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} required>
                    <option value="Fee">Fee</option>
                    <option value="Mileage">Mileage</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Nama Pelanggan:</label>
                <input 
                  type="text" 
                  list="customer-names"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950 uppercase" 
                  value={form.nama} 
                  onChange={e => {
                    const selectedName = e.target.value.toUpperCase();
                    const existingRecord = caseRecords.find(r => r.nama.toUpperCase() === selectedName);
                    // Automatically fill in other details if available, although Standalone receipts don't have many matching fields
                    setForm({...form, nama: selectedName});
                  }} 
                  required 
                  placeholder="Cari atau masukkan nama baru..."
                />
                <datalist id="customer-names">
                  {uniqueCustomerNames.map((name, i) => (
                    <option key={i} value={name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Alamat:</label>
                <textarea className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950 uppercase" rows={2}
                  value={form.alamat} onChange={e => setForm({...form, alamat: e.target.value.toUpperCase()})} />
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">Perkara / Item:</label>
                
                <datalist id="perkara-options">
                  <option value="FEE" />
                  <option value="MILEAGE" />
                  <option value="DEPOSIT" />
                  <option value="LAIN-LAIN" />
                </datalist>

                {form.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input type="text" list="perkara-options" className="flex-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950 uppercase" 
                      placeholder="Butiran..." value={item.perkara} onChange={e => handleItemChange(idx, 'perkara', e.target.value)} required />
                    <input type="number" className="w-32 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950" 
                      placeholder="RM" step="0.01" value={item.harga} onChange={e => handleItemChange(idx, 'harga', e.target.value)} required />
                    <button type="button" onClick={() => removeItemRow(idx)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addItemRow} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-emerald-700">
                  <Plus size={14} /> Tambah Perkara
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Baki Terdahulu (RM):</label>
                  <input type="number" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950" step="0.01"
                    value={form.bakiTerdahulu} onChange={e => handleBakiTerdahuluChange(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Jumlah Bayaran (RM):</label>
                  <input type="number" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-zinc-100 dark:bg-zinc-800 font-bold" 
                    value={form.jumlah.toFixed(2)} readOnly />
                </div>
              </div>

              <div>
                <label className="block text-sm font-[800] text-[#1e40af] dark:text-blue-400 border-b-2 border-blue-200 dark:border-blue-900/50 pb-1.5 mb-2 uppercase tracking-wider">BUTIRAN KES:</label>
                <input type="text" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950 uppercase" 
                  value={form.butiran} onChange={e => setForm({...form, butiran: e.target.value.toUpperCase()})} />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button onClick={() => setShowPreview(true)} className="flex-1 bg-blue-500 text-white py-2.5 rounded font-bold hover:bg-blue-600 transition-colors">
                  PREVIEW
                </button>
                <button onClick={handleSubmit} className="flex-1 bg-slate-800 dark:bg-slate-700 text-white py-2.5 rounded font-bold hover:bg-slate-900 transition-colors">
                  SIMPAN & CETAK
                </button>
                <button onClick={resetForm} className="sm:px-6 bg-zinc-400 text-white py-2.5 rounded font-bold hover:bg-zinc-500 transition-colors">
                  RESET
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Database Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Senarai Resit</h3>
            <div className="w-72">
              <input type="text" placeholder="Cari nama pelanggan..." className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-950"
                value={searchTxt} onChange={e => setSearchTxt(e.target.value)} />
            </div>
          </div>
          
          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-3 text-left">Tarikh</th>
                  <th className="p-3 text-left">Nama Pelanggan</th>
                  <th className="p-3 text-left">Perkara</th>
                  <th className="p-3 text-left">Bayaran (RM)</th>
                  <th className="p-3 text-left">Baki Terkini (RM)</th>
                  <th className="p-3 text-left">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {records.filter(r => r.nama.toLowerCase().includes(searchTxt.toLowerCase())).map((data, index) => {
                  let paparanItem = (data.items && data.items.length > 0) ? data.items.map(i => i.perkara).join(', ') : ((data as any).item || "-");
                  return (
                    <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="p-3">{data.tarikhDisplay || data.tarikh}</td>
                      <td className="p-3 font-medium uppercase">{data.nama}</td>
                      <td className="p-3 text-xs text-zinc-600 dark:text-zinc-400">{paparanItem}</td>
                      <td className="p-3">{data.jumlah.toFixed(2)}</td>
                      <td className="p-3">{data.bakiTerkini.toFixed(2)}</td>
                      <td className="p-3 flex gap-2">
                        <button onClick={() => editRekod(data)} className="px-2 py-1 bg-yellow-400 text-yellow-900 font-bold text-xs rounded hover:bg-yellow-500">EDIT</button>
                        <button onClick={() => padamRekod(data)} className="px-2 py-1 bg-red-500 text-white font-bold text-xs rounded hover:bg-red-600">PADAM</button>
                      </td>
                    </tr>
                  )
                })}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500">Tiada rekod.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 dark:bg-black/60 backdrop-blur-sm print:static print:bg-white print:p-0 print:block">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:max-h-none print:w-full print:max-w-none print:overflow-visible print:block"
            >
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 print:hidden">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200">Cetak Resit</h3>
                <button onClick={() => setShowPreview(false)} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full transition-colors"><X size={20} /></button>
              </div>
              
              <div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-white print:p-0 print:overflow-visible print:block">
                {/* Print Area */}
                <div ref={printRef} className="w-full min-w-[700px] mx-auto font-sans text-black bg-white print:min-w-0 print:w-full print:p-0">
                  <div className="flex items-center pb-2 border-b-2 border-black mb-4 gap-4">
                    <img src="https://arleta.site/interactivelink/2510/logo.png" className="h-[75px] w-auto" alt="Logo" />
                    <div>
                      <h1 className="text-[18px] font-bold uppercase m-0 leading-tight">TETUAN HAIRI MUSTAFA & ASSOCIATES</h1>
                      <p className="text-[11px] font-bold italic m-0 mt-0.5 text-[#222]">PEGUAM SYARIE * PESURUHJAYA SUMPAH</p>
                      <div className="text-[11px] mt-1 leading-[1.3]">
                        <p className="m-0">LOT 02, BANGUNAN ARKED MARA, 09100 BALING, KEDAH</p>
                        <p className="m-0">TEL: 010-2434143 / 011-56531310 | EMAIL: tetuanhairi@gmail.com</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between text-[13px] mb-4">
                    <div>
                      <strong>PELANGGAN:</strong><br/>
                      {form.kategori && <><span className="text-[10px]">[KATEGORI: {form.kategori}]</span><br/></>}
                      <span className="font-bold text-[14px] uppercase">{form.nama || '-'}</span><br/>
                      <span className="whitespace-pre-line uppercase">{form.alamat || '-'}</span>
                    </div>
                    <div className="text-right">
                      <strong>TARIKH:</strong> <span>{form.tarikhDisplay || `${new Date(form.tarikh).getDate()}.${new Date(form.tarikh).getMonth()+1}.${new Date(form.tarikh).getFullYear()}`}</span>
                    </div>
                  </div>

                  <div className="text-center font-bold text-[20px] underline mb-4">RESIT</div>

                  <table className="w-full text-[13px] mb-4 border-collapse border border-black">
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left bg-transparent">ITEM / PERKARA</th>
                        <th className="border border-black p-2 text-right w-[120px] bg-transparent">JUMLAH (RM)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((itm, i) => (
                        <tr key={i}>
                          <td className="border border-black p-2 uppercase">{itm.perkara}</td>
                          <td className="border border-black p-2 text-right">{itm.harga.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-between text-[13px] font-bold">
                    <div>
                      <p className="m-0 uppercase">BUTIRAN KES: <span className="underline">{form.butiran || '-'}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="m-0 mb-1">JUMLAH BAYARAN: RM <span>{form.jumlah.toFixed(2)}</span></p>
                      <p className="m-0 mb-1">BAKI TERDAHULU: RM <span>{form.bakiTerdahulu.toFixed(2)}</span></p>
                      <p className="m-0 pt-1 border-t border-black">BAKI TERKINI: RM <span>{form.bakiTerkini.toFixed(2)}</span></p>
                    </div>
                  </div>

                  <div className="mt-[30px] flex justify-end">
                    <div className="text-center w-[250px] text-[12px]">
                      <img src="https://arleta.site/interactivelink/2510/cop-bulat.png" alt="Cop Rasmi" className="block mx-auto max-h-[85px] w-auto -mb-1" />
                      <p className="m-0 leading-[1.2] relative z-10 font-bold uppercase">HAIRI MUSTAFA & ASSOCIATES</p>
                      <p className="m-0 leading-[1.2] relative z-10 mt-0.5">Peguam Syarie & Pesuruhjaya Sumpah</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-[30px] text-center text-[11px] italic text-[#555]">
                    <p className="m-0 border-t border-dashed border-[#ccc] pt-2">Resit ini dijana oleh komputer, terima kasih atas urusan anda</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-2 print:hidden">
                <button onClick={() => setShowPreview(false)} className="px-4 py-2 text-sm border border-zinc-300 rounded bg-white text-zinc-700 font-medium hover:bg-zinc-100 transition-colors">Tutup</button>
                <button onClick={downloadPDF} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium flex items-center gap-2 transition-colors"><Download size={16} />Muat Turun PDF</button>
                <button onClick={doPrint} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors"><Printer size={16} />Cetak</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
