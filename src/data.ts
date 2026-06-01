export interface PaymentEntry {
  id: string;
  date: string;
  amount: number;
  mileageAmount?: number;
  method: string;
}

export interface CaseRecord {
  id: string;
  nama: string;
  kes: string;
  totalFee: number;
  bayaranTerakhir: number;
  tarikh: string;
  bakiSebelum: number;
  bakiFeeTerkini: number;
  bakiMileage: number;
  paymentHistory?: PaymentEntry[];
}

export const records: CaseRecord[] = [
  { id: '1',  nama: 'Amira', kes: 'N.Anak', totalFee: 2500, bayaranTerakhir: 200, tarikh: '17/3/26', bakiSebelum: 970, bakiFeeTerkini: 770, bakiMileage: 0 },
  { id: '2',  nama: 'Amir', kes: 'Faraid Pusaka', totalFee: 4000, bayaranTerakhir: 800, tarikh: '8/4/2026', bakiSebelum: 2300, bakiFeeTerkini: 1500, bakiMileage: 0 },
  { id: '3',  nama: 'Hajar', kes: 'Fasakh', totalFee: 4000, bayaranTerakhir: 0, tarikh: '4/5/2026', bakiSebelum: 1700, bakiFeeTerkini: 1700, bakiMileage: 600 },
  { id: '4',  nama: 'Hajar', kes: 'Rayuan', totalFee: 500, bayaranTerakhir: 0, tarikh: '4/6/2026', bakiSebelum: 500, bakiFeeTerkini: 500, bakiMileage: 300 },
  { id: '5',  nama: 'Izwany', kes: 'Takliq', totalFee: 3000, bayaranTerakhir: 150, tarikh: '10/3/2026', bakiSebelum: 900, bakiFeeTerkini: 750, bakiMileage: 0 },
  { id: '6',  nama: 'Musliha', kes: 'HDP', totalFee: 6000, bayaranTerakhir: 300, tarikh: '2/12/2025', bakiSebelum: 500, bakiFeeTerkini: 200, bakiMileage: 0 },
  { id: '7',  nama: 'Rashidi', kes: 'N.Anak', totalFee: 4500, bayaranTerakhir: 300, tarikh: '2/2/2026', bakiSebelum: 1900, bakiFeeTerkini: 1900, bakiMileage: 0 },
  { id: '8',  nama: 'S.Amberi', kes: 'Hadhanah', totalFee: 4500, bayaranTerakhir: 250, tarikh: '25/4/26', bakiSebelum: 1000, bakiFeeTerkini: 750, bakiMileage: 0 },
  { id: '9',  nama: 'Syafawani', kes: 'Fasakh', totalFee: 3500, bayaranTerakhir: 100, tarikh: '2/4/2025', bakiSebelum: 1970, bakiFeeTerkini: 1750, bakiMileage: 0 },
  { id: '10', nama: 'Yazid', kes: 'Fasakh', totalFee: 1500, bayaranTerakhir: 100, tarikh: '11/5/2025', bakiSebelum: 750, bakiFeeTerkini: 650, bakiMileage: 0 },
  { id: '11', nama: 'Zainab', kes: 'Takliq', totalFee: 3200, bayaranTerakhir: 100, tarikh: '12/1/2026', bakiSebelum: 3200, bakiFeeTerkini: 300, bakiMileage: 50 },
  { id: '12', nama: 'Zulhazlin', kes: 'H.Sepencarian', totalFee: 5000, bayaranTerakhir: 850, tarikh: '4/8/2025', bakiSebelum: 3500, bakiFeeTerkini: 2650, bakiMileage: 0 },
  { id: '13', nama: 'Zulhazlin', kes: 'Rayuan', totalFee: 15000, bayaranTerakhir: 15000, tarikh: '4/7/2026', bakiSebelum: 15000, bakiFeeTerkini: 15000, bakiMileage: 2600 },
  { id: '14', nama: 'Zul Azrin', kes: 'Pusaka', totalFee: 3000, bayaranTerakhir: 300, tarikh: '4/7/2026', bakiSebelum: 1100, bakiFeeTerkini: 800, bakiMileage: 0 },
  { id: '15', nama: 'Nor Riza', kes: 'Fasakh', totalFee: 3500, bayaranTerakhir: 200, tarikh: '26/2/26', bakiSebelum: 1500, bakiFeeTerkini: 1300, bakiMileage: 0 },
  { id: '16', nama: 'Hayati', kes: 'Hadhanah', totalFee: 4500, bayaranTerakhir: 300, tarikh: '15/2/26', bakiSebelum: 3700, bakiFeeTerkini: 3400, bakiMileage: 0 },
  { id: '17', nama: 'Aswad', kes: 'Nafkah Anak', totalFee: 3500, bayaranTerakhir: 300, tarikh: '24/4/26', bakiSebelum: 2800, bakiFeeTerkini: 2200, bakiMileage: 0 },
  { id: '18', nama: 'Rusnani', kes: 'Peng. Hibah', totalFee: 4800, bayaranTerakhir: 400, tarikh: '18/1/26', bakiSebelum: 4000, bakiFeeTerkini: 3600, bakiMileage: 0 },
  { id: '19', nama: 'Abu Hassan', kes: 'Peng. Hibah', totalFee: 6000, bayaranTerakhir: 1000, tarikh: '4/3/2026', bakiSebelum: 6000, bakiFeeTerkini: 5000, bakiMileage: 0 },
  { id: '20', nama: 'Fatmah', kes: 'fasakh', totalFee: 3500, bayaranTerakhir: 500, tarikh: '26/2/26', bakiSebelum: 3500, bakiFeeTerkini: 3100, bakiMileage: 0 },
  { id: '21', nama: 'Kamal', kes: 'pusaka', totalFee: 4000, bayaranTerakhir: 350, tarikh: '29/4/26', bakiSebelum: 2750, bakiFeeTerkini: 2400, bakiMileage: 0 },
  { id: '22', nama: 'Noriaidawaty', kes: 'fasakh', totalFee: 3500, bayaranTerakhir: 500, tarikh: '13/4/26', bakiSebelum: 3500, bakiFeeTerkini: 3000, bakiMileage: 0 },
  { id: '23', nama: "Ro'ain", kes: 'fasakh', totalFee: 2500, bayaranTerakhir: 500, tarikh: '4/5/2026', bakiSebelum: 2500, bakiFeeTerkini: 2000, bakiMileage: 0 },
  { id: '24', nama: 'Rusnani', kes: 'H.Sepencarian', totalFee: 5000, bayaranTerakhir: 0, tarikh: '4/5/2026', bakiSebelum: 5000, bakiFeeTerkini: 5000, bakiMileage: 0 },
  { id: '25', nama: 'Safwan', kes: 'fasakh', totalFee: 4500, bayaranTerakhir: 0, tarikh: '4/5/2026', bakiSebelum: 4500, bakiFeeTerkini: 4500, bakiMileage: 0 },
  { id: '26', nama: 'Suraya', kes: 'U.P.N. ank', totalFee: 2500, bayaranTerakhir: 600, tarikh: '15/4/26', bakiSebelum: 2500, bakiFeeTerkini: 1900, bakiMileage: 0 }
];
