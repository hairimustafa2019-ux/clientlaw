
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

export const records: CaseRecord[] = [
  {
    "id": "1",
    "nama": "Nor Izwany binti Abdul Majid",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Takliq",
    "totalFee": 5000,
    "bayaranTerakhir": 150,
    "nota": "Diimport daripada data PDF",
    "tarikh": "07/07/2026",
    "bakiSebelum": 2250,
    "bakiFeeTerkini": 2100,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P1-1",
        "date": "08/01/2025",
        "amount": 500,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Deposit"
      },
      {
        "id": "P1-2",
        "date": "15/01/2025",
        "amount": 100,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Runner Saman"
      },
      {
        "id": "P1-3",
        "date": "02/02/2025",
        "amount": 150,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      },
      {
        "id": "P1-4",
        "date": "18/02/2025",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P1-5",
        "date": "20/02/2025",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage bagi tarikh 2.2.25"
      },
      {
        "id": "P1-6",
        "date": "10/03/2025",
        "amount": 150,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee & Mileage"
      },
      {
        "id": "P1-7",
        "date": "21/04/2025",
        "amount": 150,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee"
      },
      {
        "id": "P1-8",
        "date": "03/05/2025",
        "amount": 150,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee & Mileage bagi tarikh 04/05"
      },
      {
        "id": "P1-9",
        "date": "05/06/2025",
        "amount": 150,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 150 + Mileage RM 100"
      },
      {
        "id": "P1-10",
        "date": "08/07/2025",
        "amount": 150,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 150 + Mileage RM 100"
      },
      {
        "id": "P1-11",
        "date": "06/08/2025",
        "amount": 150,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 150 + Mileage bagi 17/8/25"
      },
      {
        "id": "P1-12",
        "date": "02/09/2025",
        "amount": 150,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 150 + Mileage bagi 22/9/25"
      },
      {
        "id": "P1-13",
        "date": "28/09/2025",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P1-14",
        "date": "05/10/2025",
        "amount": 150,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee"
      },
      {
        "id": "P1-15",
        "date": "05/11/2025",
        "amount": 150,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee"
      },
      {
        "id": "P1-16",
        "date": "07/01/2026",
        "amount": 150,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee"
      },
      {
        "id": "P1-17",
        "date": "05/02/2026",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee"
      },
      {
        "id": "P1-18",
        "date": "10/03/2026",
        "amount": 150,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee"
      },
      {
        "id": "P1-19",
        "date": "04/05/2026",
        "amount": 150,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee"
      },
      {
        "id": "P1-20",
        "date": "07/07/2026",
        "amount": 150,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Julai"
      }
    ]
  },
  {
    "id": "2",
    "nama": "Nur Amira binti Nordin",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Nafkah Anak / Nafkah Isteri",
    "totalFee": 5000,
    "bayaranTerakhir": 200,
    "nota": "Diimport daripada data PDF",
    "tarikh": "05/08/2026",
    "bakiSebelum": 3170,
    "bakiFeeTerkini": 2970,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P2-1",
        "date": "06/11/2023",
        "amount": 150,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman Nafkah Anak"
      },
      {
        "id": "P2-2",
        "date": "02/11/2023",
        "amount": 300,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman Nafkah Isteri Tertunggak"
      },
      {
        "id": "P2-3",
        "date": "17/01/2024",
        "amount": 0,
        "mileageAmount": 150,
        "method": "Cash/Transfer",
        "nota": "Mileage Nafkah Anak/Takliq"
      },
      {
        "id": "P2-4",
        "date": "07/03/2024",
        "amount": 0,
        "mileageAmount": 150,
        "method": "Cash/Transfer",
        "nota": "Mileage Nafkah Anak"
      },
      {
        "id": "P2-5",
        "date": "02/04/2024",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Nafkah Anak"
      },
      {
        "id": "P2-6",
        "date": "27/05/2024",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Nafkah Anak"
      },
      {
        "id": "P2-7",
        "date": "14/07/2024",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage Nafkah Isteri"
      },
      {
        "id": "P2-8",
        "date": "19/07/2024",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Nafkah Anak"
      },
      {
        "id": "P2-9",
        "date": "12/08/2024",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage Nafkah Isteri"
      },
      {
        "id": "P2-10",
        "date": "09/09/2024",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage Nafkah Isteri"
      },
      {
        "id": "P2-11",
        "date": "21/10/2024",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage Nafkah Isteri"
      },
      {
        "id": "P2-12",
        "date": "19/11/2024",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage Nafkah Isteri"
      },
      {
        "id": "P2-13",
        "date": "19/01/2025",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage Nafkah Isteri"
      },
      {
        "id": "P2-14",
        "date": "03/03/2025",
        "amount": 130,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Nafkah Anak"
      },
      {
        "id": "P2-15",
        "date": "21/10/2025",
        "amount": 150,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Nafkah Anak"
      },
      {
        "id": "P2-16",
        "date": "24/12/2025",
        "amount": 150,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Nafkah Anak"
      },
      {
        "id": "P2-17",
        "date": "17/03/2026",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Nafkah Anak"
      },
      {
        "id": "P2-18",
        "date": "07/06/2026",
        "amount": 150,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Nafkah Anak"
      },
      {
        "id": "P2-19",
        "date": "05/08/2026",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman Nafkah Anak"
      }
    ]
  },
  {
    "id": "3",
    "nama": "Syafawani binti Md Zain",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Fasakh",
    "totalFee": 3000,
    "bayaranTerakhir": 200,
    "nota": "Diimport daripada data PDF",
    "tarikh": "02/04/2025",
    "bakiSebelum": 1450,
    "bakiFeeTerkini": 1250,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P3-1",
        "date": "10/06/2024",
        "amount": 300,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Deposit"
      },
      {
        "id": "P3-2",
        "date": "09/07/2024",
        "amount": 0,
        "mileageAmount": 50,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P3-3",
        "date": "30/07/2024",
        "amount": 0,
        "mileageAmount": 50,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P3-4",
        "date": "09/09/2024",
        "amount": 250,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee"
      },
      {
        "id": "P3-5",
        "date": "14/11/2024",
        "amount": 250,
        "mileageAmount": 50,
        "method": "Cash/Transfer",
        "nota": "Fee RM 250 + Mileage 09.09.24 RM 50"
      },
      {
        "id": "P3-6",
        "date": "09/01/2025",
        "amount": 250,
        "mileageAmount": 50,
        "method": "Cash/Transfer",
        "nota": "Fee RM 250 + Mileage 20.11.24 RM 50"
      },
      {
        "id": "P3-7",
        "date": "01/02/2025",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee"
      },
      {
        "id": "P3-8",
        "date": "03/03/2025",
        "amount": 300,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee"
      },
      {
        "id": "P3-9",
        "date": "02/04/2025",
        "amount": 200,
        "mileageAmount": 50,
        "method": "Cash/Transfer",
        "nota": "Fee RM 200 + Mileage RM 50"
      }
    ]
  },
  {
    "id": "4",
    "nama": "Yazid bin Baharom",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Fasakh",
    "totalFee": 3000,
    "bayaranTerakhir": 100,
    "nota": "Diimport daripada data PDF",
    "tarikh": "11/05/2025",
    "bakiSebelum": 2400,
    "bakiFeeTerkini": 2300,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P4-1",
        "date": "27/11/2023",
        "amount": 50,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 50 + Mileage RM 100"
      },
      {
        "id": "P4-2",
        "date": "14/01/2024",
        "amount": 50,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 50 + Mileage RM 100"
      },
      {
        "id": "P4-3",
        "date": "25/03/2024",
        "amount": 50,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 50 + Mileage RM 100"
      },
      {
        "id": "P4-4",
        "date": "25/06/2024",
        "amount": 50,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 50 + Mileage RM 100"
      },
      {
        "id": "P4-5",
        "date": "27/07/2024",
        "amount": 50,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 50 + Mileage RM 100"
      },
      {
        "id": "P4-6",
        "date": "25/08/2024",
        "amount": 50,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 50 + Mileage RM 100"
      },
      {
        "id": "P4-7",
        "date": "21/10/2024",
        "amount": 50,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 50 + Mileage RM 100"
      },
      {
        "id": "P4-8",
        "date": "28/11/2024",
        "amount": 50,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 50 + Mileage RM 100"
      },
      {
        "id": "P4-9",
        "date": "14/01/2025",
        "amount": 50,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 50 + Mileage 17.12.24 RM 100"
      },
      {
        "id": "P4-10",
        "date": "27/01/2025",
        "amount": 50,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 50 + Mileage 03.02.25 RM 100"
      },
      {
        "id": "P4-11",
        "date": "09/03/2025",
        "amount": 100,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      },
      {
        "id": "P4-12",
        "date": "11/05/2025",
        "amount": 100,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      }
    ]
  },
  {
    "id": "5",
    "nama": "Mohamad Ameer Hakimi bin Mohamad Azhari",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Faraid Pusaka",
    "totalFee": 4000,
    "bayaranTerakhir": 800,
    "nota": "Diimport daripada data PDF",
    "tarikh": "08/04/2026",
    "bakiSebelum": 2300,
    "bakiFeeTerkini": 1500,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P5-1",
        "date": "30/07/2025",
        "amount": 500,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      },
      {
        "id": "P5-2",
        "date": "12/08/2025",
        "amount": 400,
        "mileageAmount": 50,
        "method": "Cash/Transfer",
        "nota": "Fee RM 400 + Mileage RM 50"
      },
      {
        "id": "P5-3",
        "date": "27/09/2025",
        "amount": 400,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      },
      {
        "id": "P5-4",
        "date": "30/10/2025",
        "amount": 400,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      },
      {
        "id": "P5-5",
        "date": "24/11/2025",
        "amount": 0,
        "mileageAmount": 200,
        "method": "Cash/Transfer",
        "nota": "Mileage Pusaka"
      },
      {
        "id": "P5-6",
        "date": "08/04/2026",
        "amount": 800,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      }
    ]
  },
  {
    "id": "6",
    "nama": "Siti Hajar binti Mohamed Kassim",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Fasakh / Nusyuz",
    "totalFee": 4000,
    "bayaranTerakhir": 1000,
    "nota": "Diimport daripada data PDF",
    "tarikh": "10/10/2024",
    "bakiSebelum": 3850,
    "bakiFeeTerkini": 2850,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P6-1",
        "date": "28/02/2024",
        "amount": 0,
        "mileageAmount": 300,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P6-2",
        "date": "24/03/2024",
        "amount": 0,
        "mileageAmount": 50,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P6-3",
        "date": "31/03/2024",
        "amount": 0,
        "mileageAmount": 50,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P6-4",
        "date": "29/05/2024",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P6-5",
        "date": "15/10/2024",
        "amount": 150,
        "mileageAmount": 50,
        "method": "Cash/Transfer",
        "nota": "Mileage RM 50 + RM 150 (Fee)"
      },
      {
        "id": "P6-6",
        "date": "11/11/2024",
        "amount": 0,
        "mileageAmount": 50,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P6-7",
        "date": "07/01/2025",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P6-8",
        "date": "01/02/2025",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage bagi 25.7.24"
      },
      {
        "id": "P6-9",
        "date": "24/04/2025",
        "amount": 0,
        "mileageAmount": 150,
        "method": "Cash/Transfer",
        "nota": "Mileage bagi 19.8.24"
      },
      {
        "id": "P6-10",
        "date": "31/07/2025",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage bagi 12/09/2024"
      },
      {
        "id": "P6-11",
        "date": "16/10/2025",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P6-12",
        "date": "31/12/2025",
        "amount": 0,
        "mileageAmount": 200,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P6-13",
        "date": "19/04/2026",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P6-14",
        "date": "10/10/2024",
        "amount": 1000,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Deposit kes keseluruhan (daripada Nota)"
      }
    ]
  },
  {
    "id": "7",
    "nama": "Suraya binti Ahmad",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Ubah Perintah Nafkah Anak",
    "totalFee": 3000,
    "bayaranTerakhir": 100,
    "nota": "Diimport daripada data PDF",
    "tarikh": "08/09/2026",
    "bakiSebelum": 1900,
    "bakiFeeTerkini": 1800,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P7-1",
        "date": "18/02/2024",
        "amount": 100,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee"
      },
      {
        "id": "P7-2",
        "date": "21/02/2024",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P7-3",
        "date": "14/04/2024",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P7-4",
        "date": "15/04/2026",
        "amount": 600,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Deposit"
      },
      {
        "id": "P7-5",
        "date": "19/05/2026",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee"
      },
      {
        "id": "P7-6",
        "date": "14/06/2026",
        "amount": 100,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 100 + Mileage RM 100"
      },
      {
        "id": "P7-7",
        "date": "26/07/2026",
        "amount": 100,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 100 & Mileage RM 100"
      },
      {
        "id": "P7-8",
        "date": "08/09/2026",
        "amount": 100,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 100 & Mileage bertarikh 8-9-2026"
      }
    ]
  },
  {
    "id": "8",
    "nama": "Zul Azrin bin Hairol Fadilah @ Amir",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Pusaka",
    "totalFee": 4000,
    "bayaranTerakhir": 1000,
    "nota": "Diimport daripada data PDF",
    "tarikh": "13/07/2026",
    "bakiSebelum": 2300,
    "bakiFeeTerkini": 1300,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P8-1",
        "date": "05/10/2025",
        "amount": 500,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Deposit"
      },
      {
        "id": "P8-2",
        "date": "06/01/2026",
        "amount": 600,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      },
      {
        "id": "P8-3",
        "date": "04/07/2026",
        "amount": 300,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Bulanan"
      },
      {
        "id": "P8-4",
        "date": "10/06/2026",
        "amount": 300,
        "mileageAmount": 150,
        "method": "Cash/Transfer",
        "nota": "Fee & Kos Mileage RM 150"
      },
      {
        "id": "P8-5",
        "date": "13/07/2026",
        "amount": 1000,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee"
      }
    ]
  },
  {
    "id": "9",
    "nama": "Rusnani binti Md Isa",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Pengesahan Hibah / Harta Sepencarian",
    "totalFee": 5000,
    "bayaranTerakhir": 1000,
    "nota": "Diimport daripada data PDF",
    "tarikh": "09/06/2026",
    "bakiSebelum": 3450,
    "bakiFeeTerkini": 2450,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P9-1",
        "date": "07/12/2025",
        "amount": 800,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Deposit Hibah"
      },
      {
        "id": "P9-2",
        "date": "18/01/2026",
        "amount": 400,
        "mileageAmount": 200,
        "method": "Cash/Transfer",
        "nota": "Fee RM 400 + Mileage 18/1/26 RM 150 + Mileage 16/2/26 RM 150"
      },
      {
        "id": "P9-3",
        "date": "08/05/2026",
        "amount": 350,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Hibah - nama Rosnani"
      },
      {
        "id": "P9-4",
        "date": "09/06/2026",
        "amount": 1000,
        "mileageAmount": 150,
        "method": "Cash/Transfer",
        "nota": "Gabungan Fee Guaman Feb, April, Mei RM 1,000 & RM 150 Mileage Harta Sepencarian"
      }
    ]
  },
  {
    "id": "10",
    "nama": "Nor Riza binti Abdull Rasib",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Fasakh / S47",
    "totalFee": 3500,
    "bayaranTerakhir": 150,
    "nota": "Diimport daripada data PDF",
    "tarikh": "08/06/2026",
    "bakiSebelum": 2800,
    "bakiFeeTerkini": 2650,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P10-1",
        "date": "24/11/2025",
        "amount": 500,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Deposit Fasakh"
      },
      {
        "id": "P10-2",
        "date": "06/01/2026",
        "amount": 0,
        "mileageAmount": 50,
        "method": "Cash/Transfer",
        "nota": "Mileage bertarikh 29.12.25"
      },
      {
        "id": "P10-3",
        "date": "26/02/2026",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Fasakh"
      },
      {
        "id": "P10-4",
        "date": "08/06/2026",
        "amount": 150,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee S47"
      }
    ]
  },
  {
    "id": "11",
    "nama": "Muhamad Amirul Aswad bin Md Azni",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Nafkah Anak",
    "totalFee": 4000,
    "bayaranTerakhir": 200,
    "nota": "Diimport daripada data PDF",
    "tarikh": "03/08/2026",
    "bakiSebelum": 2500,
    "bakiFeeTerkini": 2300,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P11-1",
        "date": "03/12/2025",
        "amount": 1000,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Deposit"
      },
      {
        "id": "P11-2",
        "date": "13/01/2026",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P11-3",
        "date": "15/03/2026",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P11-4",
        "date": "24/04/2026",
        "amount": 300,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 300 + Mileage RM 100"
      },
      {
        "id": "P11-5",
        "date": "06/06/2026",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee/Deposit"
      },
      {
        "id": "P11-6",
        "date": "03/08/2026",
        "amount": 200,
        "mileageAmount": 200,
        "method": "Cash/Transfer",
        "nota": "Fee RM 200 + Mileage 18/5 & 15/7 RM 200"
      }
    ]
  },
  {
    "id": "12",
    "nama": "Siti Nur Musliha binti Sahlan",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Iddah / Mutaah / H.D.P.",
    "totalFee": 5000,
    "bayaranTerakhir": 300,
    "nota": "Diimport daripada data PDF",
    "tarikh": "02/12/2024",
    "bakiSebelum": 4000,
    "bakiFeeTerkini": 3700,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P12-1",
        "date": "16/02/2024",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "USD 200.00 / RM 200.00 (Fee Guaman)"
      },
      {
        "id": "P12-2",
        "date": "03/04/2024",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      },
      {
        "id": "P12-3",
        "date": "05/06/2024",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      },
      {
        "id": "P12-4",
        "date": "16/07/2024",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      },
      {
        "id": "P12-5",
        "date": "18/08/2024",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      },
      {
        "id": "P12-6",
        "date": "02/12/2024",
        "amount": 300,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      }
    ]
  },
  {
    "id": "13",
    "nama": "Kamal Kusyairi bin Abd Ghani",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Faraid / Pusaka",
    "totalFee": 4500,
    "bayaranTerakhir": 1050,
    "nota": "Diimport daripada data PDF",
    "tarikh": "23/05/2026",
    "bakiSebelum": 3150,
    "bakiFeeTerkini": 2100,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P13-1",
        "date": "04/11/2025",
        "amount": 500,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Perkhidmatan Carian Tanah"
      },
      {
        "id": "P13-2",
        "date": "22/01/2026",
        "amount": 500,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Deposit Pusaka"
      },
      {
        "id": "P13-3",
        "date": "24/02/2026",
        "amount": 350,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      },
      {
        "id": "P13-4",
        "date": "23/05/2026",
        "amount": 1050,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Gabungan Fee Mac, April, Mei - RM350 setiap satu"
      }
    ]
  },
  {
    "id": "14",
    "nama": "Siti Zainab binti Ahmad",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Fasakh / Takliq",
    "totalFee": 3500,
    "bayaranTerakhir": 100,
    "nota": "Diimport daripada data PDF",
    "tarikh": "12/01/2026",
    "bakiSebelum": 2750,
    "bakiFeeTerkini": 2650,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P14-1",
        "date": "10/06/2025",
        "amount": 300,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Deposit Takliq"
      },
      {
        "id": "P14-2",
        "date": "29/08/2025",
        "amount": 50,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Kos Hantar Saman Fasakh"
      },
      {
        "id": "P14-3",
        "date": "04/09/2025",
        "amount": 200,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Fasakh"
      },
      {
        "id": "P14-4",
        "date": "07/10/2025",
        "amount": 200,
        "mileageAmount": 50,
        "method": "Cash/Transfer",
        "nota": "Fee RM 200 + Mileage 22.9.25 RM 50"
      },
      {
        "id": "P14-5",
        "date": "05/11/2025",
        "amount": 0,
        "mileageAmount": 50,
        "method": "Cash/Transfer",
        "nota": "Mileage bertarikh 21/10/25"
      },
      {
        "id": "P14-6",
        "date": "12/01/2026",
        "amount": 100,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Fasakh"
      }
    ]
  },
  {
    "id": "15",
    "nama": "Fatmah binti Hasinon",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Fasakh",
    "totalFee": 3000,
    "bayaranTerakhir": 600,
    "nota": "Diimport daripada data PDF",
    "tarikh": "08/08/2026",
    "bakiSebelum": 2650,
    "bakiFeeTerkini": 2050,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P15-1",
        "date": "19/04/2026",
        "amount": 0,
        "mileageAmount": 200,
        "method": "Cash/Transfer",
        "nota": "Mileage bagi tarikh 07/04/2026 & 19/04/2026"
      },
      {
        "id": "P15-2",
        "date": "08/05/2026",
        "amount": 350,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Fasakh"
      },
      {
        "id": "P15-3",
        "date": "15/06/2026",
        "amount": 0,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Mileage Submit Penghujahan"
      },
      {
        "id": "P15-4",
        "date": "08/08/2026",
        "amount": 600,
        "mileageAmount": 100,
        "method": "Cash/Transfer",
        "nota": "Fee RM 600 & RM 100 Mileage bertarikh 20-7-2026"
      }
    ]
  },
  {
    "id": "16",
    "nama": "Zulhazlin bin Abas",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Harta Sepencarian",
    "totalFee": 5000,
    "bayaranTerakhir": 850,
    "nota": "Diimport daripada data PDF",
    "tarikh": "04/08/2025",
    "bakiSebelum": 4600,
    "bakiFeeTerkini": 3750,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P16-1",
        "date": "17/03/2024",
        "amount": 400,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      },
      {
        "id": "P16-2",
        "date": "16/07/2024",
        "amount": 0,
        "mileageAmount": 500,
        "method": "Cash/Transfer",
        "nota": "Mileage"
      },
      {
        "id": "P16-3",
        "date": "04/08/2025",
        "amount": 850,
        "mileageAmount": 1150,
        "method": "Cash/Transfer",
        "nota": "Tunggakan Mileage RM 1,150 + Tunggakan Fee RM 850"
      }
    ]
  },
  {
    "id": "17",
    "nama": "Mahamad Sukri bin Awang Kechik",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Umum",
    "totalFee": 3000,
    "bayaranTerakhir": 1000,
    "nota": "Diimport daripada data PDF",
    "tarikh": "25/11/2024",
    "bakiSebelum": 3000,
    "bakiFeeTerkini": 2000,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P17-1",
        "date": "25/11/2024",
        "amount": 1000,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman"
      }
    ]
  },
  {
    "id": "18",
    "nama": "Abu Hasan bin Isa",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Pengesahan Hibah",
    "totalFee": 4000,
    "bayaranTerakhir": 1000,
    "nota": "Diimport daripada data PDF",
    "tarikh": "04/03/2026",
    "bakiSebelum": 4000,
    "bakiFeeTerkini": 3000,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P18-1",
        "date": "04/03/2026",
        "amount": 1000,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Deposit Pengesahan Hibah"
      }
    ]
  },
  {
    "id": "19",
    "nama": "Noraidawaty Binti Ishak",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Fasakh",
    "totalFee": 3000,
    "bayaranTerakhir": 500,
    "nota": "Diimport daripada data PDF",
    "tarikh": "13/04/2026",
    "bakiSebelum": 3000,
    "bakiFeeTerkini": 2500,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P19-1",
        "date": "13/04/2026",
        "amount": 500,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Deposit Fasakh"
      }
    ]
  },
  {
    "id": "20",
    "nama": "Azrina Hanim binti Amir",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Fasakh",
    "totalFee": 3000,
    "bayaranTerakhir": 1000,
    "nota": "Diimport daripada data PDF",
    "tarikh": "25/06/2026",
    "bakiSebelum": 2700,
    "bakiFeeTerkini": 1700,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P20-1",
        "date": "25/04/2026",
        "amount": 300,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Fasakh"
      },
      {
        "id": "P20-2",
        "date": "25/06/2026",
        "amount": 1000,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Deposit Fasakh"
      }
    ]
  },
  {
    "id": "21",
    "nama": "Muhammad Safuan bin Na'aim",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Fasakh",
    "totalFee": 3000,
    "bayaranTerakhir": 500,
    "nota": "Diimport daripada data PDF",
    "tarikh": "08/06/2026",
    "bakiSebelum": 3000,
    "bakiFeeTerkini": 2500,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P21-1",
        "date": "08/06/2026",
        "amount": 500,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee/Deposit Fasakh"
      }
    ]
  },
  {
    "id": "22",
    "nama": "Nurul Masitah binti Alias",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Fasakh",
    "totalFee": 3500,
    "bayaranTerakhir": 450,
    "nota": "Diimport daripada data PDF",
    "tarikh": "15/07/2026",
    "bakiSebelum": 2550,
    "bakiFeeTerkini": 2100,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P22-1",
        "date": "17/05/2026",
        "amount": 500,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Deposit"
      },
      {
        "id": "P22-2",
        "date": "10/06/2026",
        "amount": 450,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee"
      },
      {
        "id": "P22-3",
        "date": "15/07/2026",
        "amount": 450,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee"
      }
    ]
  },
  {
    "id": "23",
    "nama": "Suhisyam bin Talib",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Fasakh",
    "totalFee": 3000,
    "bayaranTerakhir": 450,
    "nota": "Diimport daripada data PDF",
    "tarikh": "02/08/2026",
    "bakiSebelum": 3000,
    "bakiFeeTerkini": 2550,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P23-1",
        "date": "02/08/2026",
        "amount": 450,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee Guaman Fasakh"
      }
    ]
  },
  {
    "id": "24",
    "nama": "Norasidah binti Zakaria",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Pusaka",
    "totalFee": 4000,
    "bayaranTerakhir": 1000,
    "nota": "Diimport daripada data PDF",
    "tarikh": "22/07/2026",
    "bakiSebelum": 4000,
    "bakiFeeTerkini": 3000,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P24-1",
        "date": "22/07/2026",
        "amount": 1000,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Fee/Deposit Pusaka"
      }
    ]
  },
  {
    "id": "25",
    "nama": "Norma binti Hamid",
    "telefon": "",
    "emel": "",
    "alamat": "",
    "kes": "Fasakh",
    "totalFee": 3500,
    "bayaranTerakhir": 600,
    "nota": "Diimport daripada data PDF",
    "tarikh": "16/08/2026",
    "bakiSebelum": 3500,
    "bakiFeeTerkini": 2900,
    "bakiMileage": 0,
    "paymentHistory": [
      {
        "id": "P25-1",
        "date": "16/08/2026",
        "amount": 600,
        "mileageAmount": 0,
        "method": "Cash/Transfer",
        "nota": "Deposit Fasakh"
      }
    ]
  }
];
