const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `      const colIndex = {
        id: headers.findIndex(h => h === 'id' || h.includes('id rekod')),
        nama: headers.findIndex(h => h.includes('nama')),
        kes: headers.findIndex(h => h.includes('kes')),
        totalFee: headers.findIndex(h => h.includes('total fee') || h.includes('jumlah fee')),
        bayaranTerakhir: headers.findIndex(h => h.includes('bayaran terakhir')),
        tarikh: headers.findIndex(h => h.includes('tarikh')),
        bakiSebelum: headers.findIndex(h => h.includes('baki sebelum')),
        bakiTerkini: headers.findIndex(h => h.includes('baki') && h.includes('terkini') && !h.includes('mileage')),
        bakiMileage: headers.findIndex(h => h.includes('mileage'))
      };`;

const replaceStr = `      const colIndex = {
        id: headers.findIndex(h => h === 'id' || h.includes('id rekod')),
        nama: headers.findIndex(h => h.includes('nama')),
        telefon: headers.findIndex(h => h.includes('telefon')),
        emel: headers.findIndex(h => h.includes('emel')),
        alamat: headers.findIndex(h => h.includes('alamat')),
        kes: headers.findIndex(h => h.includes('kes')),
        totalFee: headers.findIndex(h => h.includes('total fee') || h.includes('jumlah fee')),
        bayaranTerakhir: headers.findIndex(h => h.includes('bayaran terakhir')),
        tarikh: headers.findIndex(h => h.includes('tarikh')),
        bakiSebelum: headers.findIndex(h => h.includes('baki sebelum')),
        bakiTerkini: headers.findIndex(h => h.includes('baki') && h.includes('terkini') && !h.includes('mileage')),
        bakiMileage: headers.findIndex(h => h.includes('mileage'))
      };`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
