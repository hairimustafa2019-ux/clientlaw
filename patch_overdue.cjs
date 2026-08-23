const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                           const overdueRecords = records
                             .filter(r => {
                               if (r.bakiFeeTerkini <= 0) return false;`;

const replaceStr = `                           const overdueRecords = filteredRecords
                             .filter(r => {
                               if (r.bakiFeeTerkini <= 0) return false;`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
