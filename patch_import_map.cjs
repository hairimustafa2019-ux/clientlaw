const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `          const rawNama = getValue(colIndex.nama) || '';
          const rawKes = getValue(colIndex.kes) || 'Umum';
          
          // Special fallback for older legacy schemas if columns are completely unmatched
          const fallbackTotalFeeStr = colIndex.totalFee !== -1 ? getValue(colIndex.totalFee) : values[3];
          const fallbackTarikh = colIndex.tarikh !== -1 ? getValue(colIndex.tarikh) : (values[8] || values[5]);
          
          const rawTotalFee = parseFloat(fallbackTotalFeeStr || '') || parseFloat(values[13] || '') || 0;
          const rawBayaranTerakhir = parseFloat(getValue(colIndex.bayaranTerakhir) || '') || 0;
          const rawTarikh = fallbackTarikh || new Date().toISOString().split('T')[0];
          const rawBakiSebelum = parseFloat(getValue(colIndex.bakiSebelum) || '') || 0;
          const rawBakiTerkini = parseFloat(getValue(colIndex.bakiTerkini) || '') || 0;
          const rawBakiMileage = parseFloat(getValue(colIndex.bakiMileage) || '') || 0;
          
          // Ensure valid ID for Firestore
          if (rawId && rawId.includes('/')) {
             rawId = rawId.replace(/\\//g, '-');
          }
          
          const id = rawId || \`CSV\${Date.now()}\${Math.floor(Math.random() * 1000)}\`;
          
          newRecordsFromCsv.push({
            id,
            nama: rawNama,
            kes: rawKes,
            totalFee: rawTotalFee,
            bayaranTerakhir: rawBayaranTerakhir,
            tarikh: rawTarikh,
            bakiSebelum: rawBakiSebelum,
            bakiFeeTerkini: rawBakiTerkini,
            bakiMileage: rawBakiMileage,
            nota: \`Diimport pada \${new Date().toLocaleDateString('ms-MY')}\`,
            paymentHistory: []
          });`;

const replaceStr = `          const rawNama = getValue(colIndex.nama) || '';
          const rawTelefon = getValue(colIndex.telefon) || '';
          const rawEmel = getValue(colIndex.emel) || '';
          const rawAlamat = getValue(colIndex.alamat) || '';
          const rawKes = getValue(colIndex.kes) || 'Umum';
          
          // Special fallback for older legacy schemas if columns are completely unmatched
          const fallbackTotalFeeStr = colIndex.totalFee !== -1 ? getValue(colIndex.totalFee) : values[3];
          const fallbackTarikh = colIndex.tarikh !== -1 ? getValue(colIndex.tarikh) : (values[8] || values[5]);
          
          const rawTotalFee = parseFloat(fallbackTotalFeeStr || '') || parseFloat(values[13] || '') || 0;
          const rawBayaranTerakhir = parseFloat(getValue(colIndex.bayaranTerakhir) || '') || 0;
          const rawTarikh = fallbackTarikh || new Date().toISOString().split('T')[0];
          const rawBakiSebelum = parseFloat(getValue(colIndex.bakiSebelum) || '') || 0;
          const rawBakiTerkini = parseFloat(getValue(colIndex.bakiTerkini) || '') || 0;
          const rawBakiMileage = parseFloat(getValue(colIndex.bakiMileage) || '') || 0;
          
          // Ensure valid ID for Firestore
          if (rawId && rawId.includes('/')) {
             rawId = rawId.replace(/\\//g, '-');
          }
          
          const id = rawId || \`CSV\${Date.now()}\${Math.floor(Math.random() * 1000)}\`;
          
          newRecordsFromCsv.push({
            id,
            nama: rawNama,
            telefon: rawTelefon,
            emel: rawEmel,
            alamat: rawAlamat,
            kes: rawKes,
            totalFee: rawTotalFee,
            bayaranTerakhir: rawBayaranTerakhir,
            tarikh: rawTarikh,
            bakiSebelum: rawBakiSebelum,
            bakiFeeTerkini: rawBakiTerkini,
            bakiMileage: rawBakiMileage,
            nota: \`Diimport pada \${new Date().toLocaleDateString('ms-MY')}\`,
            paymentHistory: []
          });`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
