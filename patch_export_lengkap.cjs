const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetFunction = `  const silentBackupToCloud = async (currentRecords: CaseRecord[]) => {`;

const replaceFunction = `  const handleExportDataLengkapExcel = () => {
    // 1. Data Rekod Utama
    const recordsData = filteredRecords.map(r => ({
      'ID Rekod': r.id,
      'Nama': r.nama,
      'Telefon': r.telefon || '',
      'Emel': r.emel || '',
      'Alamat': r.alamat || '',
      'Kategori Kes': r.kes,
      'Total Fee': r.totalFee,
      'Bayaran Terakhir': r.bayaranTerakhir,
      'Tarikh Akhir': r.tarikh,
      'Baki Sebelum': r.bakiSebelum,
      'Baki Fee Terkini': r.bakiFeeTerkini,
      'Baki Mileage': r.bakiMileage || 0,
      'Nota': r.nota || '',
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
            'Tarikh Bayaran': p.date,
            'Bayaran Fee (RM)': p.amount || 0,
            'Bayaran Mileage (RM)': p.mileageAmount || 0,
            'Kaedah Bayaran': p.method,
            'Nota': p.nota || ''
          });
        });
      }
    });

    const wb = XLSX.utils.book_new();
    const wsRecords = XLSX.utils.json_to_sheet(recordsData);
    const wsPayments = XLSX.utils.json_to_sheet(paymentsData);

    XLSX.utils.book_append_sheet(wb, wsRecords, "Rekod Pelanggan");
    XLSX.utils.book_append_sheet(wb, wsPayments, "Sejarah Pembayaran");

    XLSX.writeFile(wb, \`Data_Lengkap_Pelanggan_\${new Date().toISOString().split('T')[0]}.xlsx\`);
  };

  const silentBackupToCloud = async (currentRecords: CaseRecord[]) => {`;

code = code.replace(targetFunction, replaceFunction);
fs.writeFileSync('src/App.tsx', code);
