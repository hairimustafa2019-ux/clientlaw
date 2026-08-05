const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const handleExportCSV = () => {
    const headers = [
      'No', 'Tarikh Kemaskini', 'Nama Pelanggan', 'Kategori Kes', 'Nota', 
      'Jumlah Fee (RM)', 'Jumlah Bayaran (Fee) (RM)', 'Baki Fee (RM)', 
      'Jumlah Bayaran (Mileage) (RM)', 'Baki Mileage (RM)'
    ];

    const csvData = [
      headers.join(','),
      ...filteredRecords.map((r, i) => {
        const totalPaidFee = r.paymentHistory?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const totalPaidMileage = r.paymentHistory?.reduce((sum, p) => sum + (p.mileageAmount || 0), 0) || 0;
        
        return [
          i + 1,
          \`"\${r.tarikh || ''}"\`,
          \`"\${r.nama || ''}"\`,
          \`"\${r.kes || ''}"\`,
          \`"\${(r.nota || '').replace(/"/g, '""')}"\`,
          r.totalFee || 0,
          totalPaidFee,
          r.bakiFeeTerkini || 0,
          totalPaidMileage,
          r.bakiMileage || 0
        ].join(',');
      })
    ].join('\\n');`;

const replaceStr = `  const handleExportCSV = () => {
    const headers = [
      'No', 'Tarikh Kemaskini', 'Nama Pelanggan', 'No. Telefon', 'Emel', 'Alamat', 'Kategori Kes', 'Nota', 
      'Jumlah Fee (RM)', 'Jumlah Bayaran (Fee) (RM)', 'Baki Fee (RM)', 
      'Jumlah Bayaran (Mileage) (RM)', 'Baki Mileage (RM)'
    ];

    const csvData = [
      headers.join(','),
      ...filteredRecords.map((r, i) => {
        const totalPaidFee = r.paymentHistory?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const totalPaidMileage = r.paymentHistory?.reduce((sum, p) => sum + (p.mileageAmount || 0), 0) || 0;
        
        return [
          i + 1,
          \`"\${r.tarikh || ''}"\`,
          \`"\${r.nama || ''}"\`,
          \`"\${r.telefon || ''}"\`,
          \`"\${r.emel || ''}"\`,
          \`"\${(r.alamat || '').replace(/"/g, '""')}"\`,
          \`"\${r.kes || ''}"\`,
          \`"\${(r.nota || '').replace(/"/g, '""')}"\`,
          r.totalFee || 0,
          totalPaidFee,
          r.bakiFeeTerkini || 0,
          totalPaidMileage,
          r.bakiMileage || 0
        ].join(',');
      })
    ].join('\\n');`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
