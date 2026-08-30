const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLine = `        [\`"\$\{r.nama\}"\`, \`"\$\{r.telefon || ''\}"\`, \`"\$\{r.emel || ''\}"\`, \`"\$\{(r.alamat || '').replace(/\\"/g, '""')\}"\`, \`"\$\{r.kes\}"\`, r.totalFee, r.bayaranTerakhir, r.tarikh, r.bakiSebelum, r.bakiFeeTerkini, r.bakiMileage].join(',')`;
const newLine = `        [\`"\$\{r.nama\}"\`, \`"\$\{r.telefon || ''\}"\`, \`"\$\{(r.alamat || '').replace(/\\"/g, '""')\}"\`, \`"\$\{r.kes\}"\`, r.totalFee, r.bayaranTerakhir, r.tarikh, r.bakiSebelum, r.bakiFeeTerkini, r.bakiMileage].join(',')`;

code = code.replace(oldLine, newLine);
fs.writeFileSync('src/App.tsx', code);
