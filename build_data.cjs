const fs = require('fs');

const rawRecords = [
  {
    nama: "Nor Izwany binti Abdul Majid",
    kes: "Takliq",
    totalFee: 5000,
    payments: [
      { date: "08/01/2025", amount: 500, note: "Deposit" },
      { date: "15/01/2025", amount: 100, note: "Runner Saman" },
      { date: "02/02/2025", amount: 150, note: "Fee Guaman" },
      { date: "18/02/2025", amount: 0, mileageAmount: 100, note: "Mileage" },
      { date: "20/02/2025", amount: 0, mileageAmount: 100, note: "Mileage bagi tarikh 2.2.25" },
      { date: "10/03/2025", amount: 150, mileageAmount: 100, note: "Fee & Mileage" },
      { date: "21/04/2025", amount: 150, note: "Fee" },
      { date: "03/05/2025", amount: 150, mileageAmount: 100, note: "Fee & Mileage bagi tarikh 04/05" },
      { date: "05/06/2025", amount: 150, mileageAmount: 100, note: "Fee RM 150 + Mileage RM 100" },
      { date: "08/07/2025", amount: 150, mileageAmount: 100, note: "Fee RM 150 + Mileage RM 100" },
      { date: "06/08/2025", amount: 150, mileageAmount: 100, note: "Fee RM 150 + Mileage bagi 17/8/25" },
      { date: "02/09/2025", amount: 150, mileageAmount: 100, note: "Fee RM 150 + Mileage bagi 22/9/25" },
      { date: "28/09/2025", amount: 0, mileageAmount: 100, note: "Mileage" },
      { date: "05/10/2025", amount: 150, note: "Fee" },
      { date: "05/11/2025", amount: 150, note: "Fee" },
      { date: "07/01/2026", amount: 150, note: "Fee" },
      { date: "05/02/2026", amount: 200, note: "Fee" },
      { date: "10/03/2026", amount: 150, note: "Fee" },
      { date: "04/05/2026", amount: 150, note: "Fee" },
      { date: "07/07/2026", amount: 150, note: "Fee Julai" },
    ]
  },
  {
    nama: "Nur Amira binti Nordin",
    kes: "Nafkah Anak / Nafkah Isteri",
    totalFee: 5000,
    payments: [
      { date: "06/11/2023", amount: 150, note: "Fee Guaman Nafkah Anak" },
      { date: "02/11/2023", amount: 300, note: "Fee Guaman Nafkah Isteri Tertunggak" },
      { date: "17/01/2024", amount: 0, mileageAmount: 150, note: "Mileage Nafkah Anak/Takliq" },
      { date: "07/03/2024", amount: 0, mileageAmount: 150, note: "Mileage Nafkah Anak" },
      { date: "02/04/2024", amount: 200, note: "Fee Nafkah Anak" },
      { date: "27/05/2024", amount: 200, note: "Fee Nafkah Anak" },
      { date: "14/07/2024", amount: 0, mileageAmount: 100, note: "Mileage Nafkah Isteri" },
      { date: "19/07/2024", amount: 200, note: "Fee Nafkah Anak" },
      { date: "12/08/2024", amount: 0, mileageAmount: 100, note: "Mileage Nafkah Isteri" },
      { date: "09/09/2024", amount: 0, mileageAmount: 100, note: "Mileage Nafkah Isteri" },
      { date: "21/10/2024", amount: 0, mileageAmount: 100, note: "Mileage Nafkah Isteri" },
      { date: "19/11/2024", amount: 0, mileageAmount: 100, note: "Mileage Nafkah Isteri" },
      { date: "19/01/2025", amount: 0, mileageAmount: 100, note: "Mileage Nafkah Isteri" },
      { date: "03/03/2025", amount: 130, note: "Fee Nafkah Anak" },
      { date: "21/10/2025", amount: 150, note: "Fee Nafkah Anak" },
      { date: "24/12/2025", amount: 150, note: "Fee Nafkah Anak" },
      { date: "17/03/2026", amount: 200, note: "Fee Nafkah Anak" },
      { date: "07/06/2026", amount: 150, note: "Fee Nafkah Anak" },
      { date: "05/08/2026", amount: 200, note: "Fee Guaman Nafkah Anak" }
    ]
  },
  {
    nama: "Syafawani binti Md Zain",
    kes: "Fasakh",
    totalFee: 3000,
    payments: [
      { date: "10/06/2024", amount: 300, note: "Deposit" },
      { date: "09/07/2024", amount: 0, mileageAmount: 50, note: "Mileage" },
      { date: "30/07/2024", amount: 0, mileageAmount: 50, note: "Mileage" },
      { date: "09/09/2024", amount: 250, note: "Fee" },
      { date: "14/11/2024", amount: 250, mileageAmount: 50, note: "Fee RM 250 + Mileage 09.09.24 RM 50" },
      { date: "09/01/2025", amount: 250, mileageAmount: 50, note: "Fee RM 250 + Mileage 20.11.24 RM 50" },
      { date: "01/02/2025", amount: 200, note: "Fee" },
      { date: "03/03/2025", amount: 300, note: "Fee" },
      { date: "02/04/2025", amount: 200, mileageAmount: 50, note: "Fee RM 200 + Mileage RM 50" }
    ]
  },
  {
    nama: "Yazid bin Baharom",
    kes: "Fasakh",
    totalFee: 3000,
    payments: [
      { date: "27/11/2023", amount: 50, mileageAmount: 100, note: "Fee RM 50 + Mileage RM 100" },
      { date: "14/01/2024", amount: 50, mileageAmount: 100, note: "Fee RM 50 + Mileage RM 100" },
      { date: "25/03/2024", amount: 50, mileageAmount: 100, note: "Fee RM 50 + Mileage RM 100" },
      { date: "25/06/2024", amount: 50, mileageAmount: 100, note: "Fee RM 50 + Mileage RM 100" },
      { date: "27/07/2024", amount: 50, mileageAmount: 100, note: "Fee RM 50 + Mileage RM 100" },
      { date: "25/08/2024", amount: 50, mileageAmount: 100, note: "Fee RM 50 + Mileage RM 100" },
      { date: "21/10/2024", amount: 50, mileageAmount: 100, note: "Fee RM 50 + Mileage RM 100" },
      { date: "28/11/2024", amount: 50, mileageAmount: 100, note: "Fee RM 50 + Mileage RM 100" },
      { date: "14/01/2025", amount: 50, mileageAmount: 100, note: "Fee RM 50 + Mileage 17.12.24 RM 100" },
      { date: "27/01/2025", amount: 50, mileageAmount: 100, note: "Fee RM 50 + Mileage 03.02.25 RM 100" },
      { date: "09/03/2025", amount: 100, note: "Fee Guaman" },
      { date: "11/05/2025", amount: 100, note: "Fee Guaman" }
    ]
  },
  {
    nama: "Mohamad Ameer Hakimi bin Mohamad Azhari",
    kes: "Faraid Pusaka",
    totalFee: 4000,
    payments: [
      { date: "30/07/2025", amount: 500, note: "Fee Guaman" },
      { date: "12/08/2025", amount: 400, mileageAmount: 50, note: "Fee RM 400 + Mileage RM 50" },
      { date: "27/09/2025", amount: 400, note: "Fee Guaman" },
      { date: "30/10/2025", amount: 400, note: "Fee Guaman" },
      { date: "24/11/2025", amount: 0, mileageAmount: 200, note: "Mileage Pusaka" },
      { date: "08/04/2026", amount: 800, note: "Fee Guaman" }
    ]
  },
  {
    nama: "Siti Hajar binti Mohamed Kassim",
    kes: "Fasakh / Nusyuz",
    totalFee: 4000,
    payments: [
      { date: "28/02/2024", amount: 0, mileageAmount: 300, note: "Mileage" },
      { date: "24/03/2024", amount: 0, mileageAmount: 50, note: "Mileage" },
      { date: "31/03/2024", amount: 0, mileageAmount: 50, note: "Mileage" },
      { date: "29/05/2024", amount: 0, mileageAmount: 100, note: "Mileage" },
      { date: "15/10/2024", amount: 150, mileageAmount: 50, note: "Mileage RM 50 + RM 150 (Fee)" },
      { date: "11/11/2024", amount: 0, mileageAmount: 50, note: "Mileage" },
      { date: "07/01/2025", amount: 0, mileageAmount: 100, note: "Mileage" },
      { date: "01/02/2025", amount: 0, mileageAmount: 100, note: "Mileage bagi 25.7.24" },
      { date: "24/04/2025", amount: 0, mileageAmount: 150, note: "Mileage bagi 19.8.24" },
      { date: "31/07/2025", amount: 0, mileageAmount: 100, note: "Mileage bagi 12/09/2024" },
      { date: "16/10/2025", amount: 0, mileageAmount: 100, note: "Mileage" },
      { date: "31/12/2025", amount: 0, mileageAmount: 200, note: "Mileage" },
      { date: "19/04/2026", amount: 0, mileageAmount: 100, note: "Mileage" },
      { date: "10/10/2024", amount: 1000, note: "Deposit kes keseluruhan (daripada Nota)" }
    ]
  },
  {
    nama: "Suraya binti Ahmad",
    kes: "Ubah Perintah Nafkah Anak",
    totalFee: 3000,
    payments: [
      { date: "18/02/2024", amount: 100, note: "Fee" },
      { date: "21/02/2024", amount: 0, mileageAmount: 100, note: "Mileage" },
      { date: "14/04/2024", amount: 0, mileageAmount: 100, note: "Mileage" },
      { date: "15/04/2026", amount: 600, note: "Deposit" },
      { date: "19/05/2026", amount: 200, note: "Fee" },
      { date: "14/06/2026", amount: 100, mileageAmount: 100, note: "Fee RM 100 + Mileage RM 100" },
      { date: "26/07/2026", amount: 100, mileageAmount: 100, note: "Fee RM 100 & Mileage RM 100" },
      { date: "08/09/2026", amount: 100, mileageAmount: 100, note: "Fee RM 100 & Mileage bertarikh 8-9-2026" }
    ]
  },
  {
    nama: "Zul Azrin bin Hairol Fadilah @ Amir",
    kes: "Pusaka",
    totalFee: 4000,
    payments: [
      { date: "05/10/2025", amount: 500, note: "Deposit" },
      { date: "06/01/2026", amount: 600, note: "Fee Guaman" },
      { date: "04/07/2026", amount: 300, note: "Fee Bulanan" },
      { date: "10/06/2026", amount: 300, mileageAmount: 150, note: "Fee & Kos Mileage RM 150" },
      { date: "13/07/2026", amount: 1000, note: "Fee" }
    ]
  },
  {
    nama: "Rusnani binti Md Isa",
    kes: "Pengesahan Hibah / Harta Sepencarian",
    totalFee: 5000,
    payments: [
      { date: "07/12/2025", amount: 800, note: "Deposit Hibah" },
      { date: "18/01/2026", amount: 400, mileageAmount: 200, note: "Fee RM 400 + Mileage 18/1/26 RM 150 + Mileage 16/2/26 RM 150" },
      { date: "08/05/2026", amount: 350, note: "Fee Hibah - nama Rosnani" },
      { date: "09/06/2026", amount: 1000, mileageAmount: 150, note: "Gabungan Fee Guaman Feb, April, Mei RM 1,000 & RM 150 Mileage Harta Sepencarian" }
    ]
  },
  {
    nama: "Nor Riza binti Abdull Rasib",
    kes: "Fasakh / S47",
    totalFee: 3500,
    payments: [
      { date: "24/11/2025", amount: 500, note: "Deposit Fasakh" },
      { date: "06/01/2026", amount: 0, mileageAmount: 50, note: "Mileage bertarikh 29.12.25" },
      { date: "26/02/2026", amount: 200, note: "Fee Fasakh" },
      { date: "08/06/2026", amount: 150, note: "Fee S47" }
    ]
  },
  {
    nama: "Muhamad Amirul Aswad bin Md Azni",
    kes: "Nafkah Anak",
    totalFee: 4000,
    payments: [
      { date: "03/12/2025", amount: 1000, note: "Deposit" },
      { date: "13/01/2026", amount: 0, mileageAmount: 100, note: "Mileage" },
      { date: "15/03/2026", amount: 0, mileageAmount: 100, note: "Mileage" },
      { date: "24/04/2026", amount: 300, mileageAmount: 100, note: "Fee RM 300 + Mileage RM 100" },
      { date: "06/06/2026", amount: 200, note: "Fee/Deposit" },
      { date: "03/08/2026", amount: 200, mileageAmount: 200, note: "Fee RM 200 + Mileage 18/5 & 15/7 RM 200" }
    ]
  },
  {
    nama: "Siti Nur Musliha binti Sahlan",
    kes: "Iddah / Mutaah / H.D.P.",
    totalFee: 5000,
    payments: [
      { date: "16/02/2024", amount: 200, note: "USD 200.00 / RM 200.00 (Fee Guaman)" },
      { date: "03/04/2024", amount: 200, note: "Fee Guaman" },
      { date: "05/06/2024", amount: 200, note: "Fee Guaman" },
      { date: "16/07/2024", amount: 200, note: "Fee Guaman" },
      { date: "18/08/2024", amount: 200, note: "Fee Guaman" },
      { date: "02/12/2024", amount: 300, note: "Fee Guaman" }
    ]
  },
  {
    nama: "Kamal Kusyairi bin Abd Ghani",
    kes: "Faraid / Pusaka",
    totalFee: 4500,
    payments: [
      { date: "04/11/2025", amount: 500, note: "Perkhidmatan Carian Tanah" },
      { date: "22/01/2026", amount: 500, note: "Deposit Pusaka" },
      { date: "24/02/2026", amount: 350, note: "Fee Guaman" },
      { date: "23/05/2026", amount: 1050, note: "Gabungan Fee Mac, April, Mei - RM350 setiap satu" }
    ]
  },
  {
    nama: "Siti Zainab binti Ahmad",
    kes: "Fasakh / Takliq",
    totalFee: 3500,
    payments: [
      { date: "10/06/2025", amount: 300, note: "Deposit Takliq" },
      { date: "29/08/2025", amount: 50, note: "Kos Hantar Saman Fasakh" },
      { date: "04/09/2025", amount: 200, note: "Fee Fasakh" },
      { date: "07/10/2025", amount: 200, mileageAmount: 50, note: "Fee RM 200 + Mileage 22.9.25 RM 50" },
      { date: "05/11/2025", amount: 0, mileageAmount: 50, note: "Mileage bertarikh 21/10/25" },
      { date: "12/01/2026", amount: 100, note: "Fee Fasakh" }
    ]
  },
  {
    nama: "Fatmah binti Hasinon",
    kes: "Fasakh",
    totalFee: 3000,
    payments: [
      { date: "19/04/2026", amount: 0, mileageAmount: 200, note: "Mileage bagi tarikh 07/04/2026 & 19/04/2026" },
      { date: "08/05/2026", amount: 350, note: "Fee Fasakh" },
      { date: "15/06/2026", amount: 0, mileageAmount: 100, note: "Mileage Submit Penghujahan" },
      { date: "08/08/2026", amount: 600, mileageAmount: 100, note: "Fee RM 600 & RM 100 Mileage bertarikh 20-7-2026" }
    ]
  },
  {
    nama: "Zulhazlin bin Abas",
    kes: "Harta Sepencarian",
    totalFee: 5000,
    payments: [
      { date: "17/03/2024", amount: 400, note: "Fee Guaman" },
      { date: "16/07/2024", amount: 0, mileageAmount: 500, note: "Mileage" },
      { date: "04/08/2025", amount: 850, mileageAmount: 1150, note: "Tunggakan Mileage RM 1,150 + Tunggakan Fee RM 850" }
    ]
  },
  { nama: "Mahamad Sukri bin Awang Kechik", kes: "Umum", totalFee: 3000, payments: [{ date: "25/11/2024", amount: 1000, note: "Fee Guaman" }] },
  { nama: "Abu Hasan bin Isa", kes: "Pengesahan Hibah", totalFee: 4000, payments: [{ date: "04/03/2026", amount: 1000, note: "Deposit Pengesahan Hibah" }] },
  { nama: "Noraidawaty Binti Ishak", kes: "Fasakh", totalFee: 3000, payments: [{ date: "13/04/2026", amount: 500, note: "Deposit Fasakh" }] },
  { nama: "Azrina Hanim binti Amir", kes: "Fasakh", totalFee: 3000, payments: [{ date: "25/04/2026", amount: 300, note: "Fee Fasakh" }, { date: "25/06/2026", amount: 1000, note: "Deposit Fasakh" }] },
  { nama: "Muhammad Safuan bin Na'aim", kes: "Fasakh", totalFee: 3000, payments: [{ date: "08/06/2026", amount: 500, note: "Fee/Deposit Fasakh" }] },
  { nama: "Nurul Masitah binti Alias", kes: "Fasakh", totalFee: 3500, payments: [{ date: "17/05/2026", amount: 500, note: "Deposit" }, { date: "10/06/2026", amount: 450, note: "Fee" }, { date: "15/07/2026", amount: 450, note: "Fee" }] },
  { nama: "Suhisyam bin Talib", kes: "Fasakh", totalFee: 3000, payments: [{ date: "02/08/2026", amount: 450, note: "Fee Guaman Fasakh" }] },
  { nama: "Norasidah binti Zakaria", kes: "Pusaka", totalFee: 4000, payments: [{ date: "22/07/2026", amount: 1000, note: "Fee/Deposit Pusaka" }] },
  { nama: "Norma binti Hamid", kes: "Fasakh", totalFee: 3500, payments: [{ date: "16/08/2026", amount: 600, note: "Deposit Fasakh" }] }
];

let generatedRecords = [];
let idx = 1;

for (let raw of rawRecords) {
  let totalPaid = 0;
  let paymentHistory = [];
  let pIdx = 1;
  let lastDate = "01/01/2024";

  for (let p of raw.payments) {
    let pDate = p.date;
    if (pDate.split("/").length === 3 && pDate.split("/")[2].length === 2) {
      // expand yy to yyyy
      const parts = pDate.split("/");
      pDate = `${parts[0]}/${parts[1]}/20${parts[2]}`;
    }
    
    totalPaid += (p.amount || 0);
    paymentHistory.push({
      id: `P${idx}-${pIdx}`,
      date: pDate,
      amount: p.amount || 0,
      mileageAmount: p.mileageAmount || 0,
      method: "Cash/Transfer",
      nota: p.note
    });
    lastDate = pDate;
    pIdx++;
  }

  // Determine balances
  let bakiFeeTerkini = raw.totalFee - totalPaid;
  if (bakiFeeTerkini < 0) bakiFeeTerkini = 0;
  
  // Try to determine a plausible "bakiSebelum" which is current balance + last payment
  let lastPaymentAmount = raw.payments.length > 0 ? raw.payments[raw.payments.length - 1].amount || 0 : 0;
  let bakiSebelum = bakiFeeTerkini + lastPaymentAmount;

  generatedRecords.push({
    id: String(idx),
    nama: raw.nama,
    telefon: "",
    emel: "",
    alamat: "",
    kes: raw.kes,
    totalFee: raw.totalFee,
    bayaranTerakhir: lastPaymentAmount,
    nota: "Diimport daripada data PDF",
    tarikh: lastDate,
    bakiSebelum: bakiSebelum,
    bakiFeeTerkini: bakiFeeTerkini,
    bakiMileage: 0,
    paymentHistory: paymentHistory
  });
  
  idx++;
}

const dataFileContent = `
export interface PaymentEntry {
  id: string;
  date: string;
  amount: number;
  mileageAmount?: number;
  method: string;
  nota?: string;
}

export interface CaseRecord {
  id: string;
  nama: string;
  telefon?: string;
  emel?: string;
  alamat?: string;
  kes: string;
  totalFee: number;
  bayaranTerakhir: number;
  nota?: string;
  tarikh: string;
  bakiSebelum: number;
  bakiFeeTerkini: number;
  bakiMileage: number;
  paymentHistory?: PaymentEntry[];
  statementUrl?: string;
}

export const records: CaseRecord[] = ${JSON.stringify(generatedRecords, null, 2)};
`;

fs.writeFileSync('src/data.ts', dataFileContent);
console.log("src/data.ts written successfully.");
