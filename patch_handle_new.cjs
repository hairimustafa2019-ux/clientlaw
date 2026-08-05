const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `    const newRecord: CaseRecord & { userId?: string } = {
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
    };`;

const replaceStr = `    const newRecord: CaseRecord & { userId?: string } = {
      id,
      nama: newRecordData.nama,
      telefon: newRecordData.telefon,
      emel: newRecordData.emel,
      alamat: newRecordData.alamat,
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
    };`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
