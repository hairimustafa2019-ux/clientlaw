const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `const list = new Set(initialRecords.map(r => r.kes));`;
const replaceStr = `const list = new Set(records.map(r => r.kes));`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/App.tsx', code);
