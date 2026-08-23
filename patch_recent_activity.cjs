const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                     {records.slice(-5).reverse().map(record => (`;
const replaceStr = `                     {filteredRecords.slice(-5).reverse().map(record => (`;

const targetStr2 = `                     {records.length === 0 && (`;
const replaceStr2 = `                     {filteredRecords.length === 0 && (`;

code = code.replace(targetStr, replaceStr);
code = code.replace(targetStr2, replaceStr2);

fs.writeFileSync('src/App.tsx', code);
