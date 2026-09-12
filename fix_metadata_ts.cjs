const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const t = `      const metadata = {
        name: fileName,
        mimeType: 'application/json'
      };`;
const r = `      const metadata: any = {
        name: fileName,
        mimeType: 'application/json'
      };`;

code = code.replace(t, r);
fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Fixed metadata TS error');
