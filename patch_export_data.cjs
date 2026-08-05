const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const handleExportData = () => {
    const headers = ['Nama', 'Kes', 'Total Fee', 'Bayaran Terakhir', 'Tarikh Akhir', 'Baki Sebelum', 'Baki Fee Terkini', 'Baki Mileage'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(r => 
        [\`"\${r.nama}"\`, \`"\${r.kes}"\`, r.totalFee, r.bayaranTerakhir, r.tarikh, r.bakiSebelum, r.bakiFeeTerkini, r.bakiMileage].join(',')
      )
    ].join('\\n');`;

const replaceStr = `  const handleExportData = () => {
    const headers = ['Nama', 'Telefon', 'Emel', 'Alamat', 'Kes', 'Total Fee', 'Bayaran Terakhir', 'Tarikh Akhir', 'Baki Sebelum', 'Baki Fee Terkini', 'Baki Mileage'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(r => 
        [\`"\${r.nama}"\`, \`"\${r.telefon || ''}"\`, \`"\${r.emel || ''}"\`, \`"\${(r.alamat || '').replace(/"/g, '""')}"\`, \`"\${r.kes}"\`, r.totalFee, r.bayaranTerakhir, r.tarikh, r.bakiSebelum, r.bakiFeeTerkini, r.bakiMileage].join(',')
      )
    ].join('\\n');`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
