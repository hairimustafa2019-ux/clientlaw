const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Google Sheets sync
code = code.replace(
  `            (r.bakiMileage || 0).toString(),
            r.tarikh,
            r.nota || ''`,
  `            (r.bakiMileage || 0).toString(),
            formatDateDMY(r.tarikh),
            r.nota || ''`
);

// 2. CSV Export
code = code.replace(
  /\[`"\$\{r\.nama\}"`, `"\$\{r\.telefon \|\| ''\}"`, `"\$\{r\.emel \|\| ''\}"`, `"\$\{\(r\.alamat \|\| ''\)\.replace\(\/"\/g, '""'\)\}"`, `"\$\{r\.kes\}"`, r\.totalFee, r\.bayaranTerakhir, r\.tarikh, r\.bakiSebelum, r\.bakiFeeTerkini, r\.bakiMileage\]\.join\(','\)/g,
  `[\`"\${r.nama}"\`, \`"\${r.telefon || ''}"\`, \`"\${r.emel || ''}"\`, \`"\${(r.alamat || '').replace(/"/g, '""')}"\`, \`"\${r.kes}"\`, r.totalFee, r.bayaranTerakhir, formatDateDMY(r.tarikh), r.bakiSebelum, r.bakiFeeTerkini, r.bakiMileage].join(',')`
);

// 3. handleExportDataLengkapExcel
code = code.replace(
  `      'Bayaran Terakhir': r.bayaranTerakhir,
      'Tarikh Akhir': r.tarikh,
      'Baki Sebelum': r.bakiSebelum,`,
  `      'Bayaran Terakhir': r.bayaranTerakhir,
      'Tarikh Akhir': formatDateDMY(r.tarikh),
      'Baki Sebelum': r.bakiSebelum,`
);

code = code.replace(
  `            'No. Resit / ID Bayaran': p.id,
            'Tarikh Bayaran': p.date,
            'Bayaran Fee (RM)': p.amount || 0,`,
  `            'No. Resit / ID Bayaran': p.id,
            'Tarikh Bayaran': formatDateDMY(p.date),
            'Bayaran Fee (RM)': p.amount || 0,`
);

// 4. handleExportCSV
code = code.replace(
  `        return [
          i + 1,
          \`"\${r.tarikh || ''}"\`,
          \`"\${r.nama || ''}"\`,`,
  `        return [
          i + 1,
          \`"\${formatDateDMY(r.tarikh)}"\`,
          \`"\${r.nama || ''}"\`,`
);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Done replacing dates');
