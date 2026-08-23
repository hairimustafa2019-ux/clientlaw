const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetImport = `import JSZip from 'jszip';`;
const replaceImport = `import JSZip from 'jszip';
import * as XLSX from 'xlsx';`;

code = code.replace(targetImport, replaceImport);
fs.writeFileSync('src/App.tsx', code);
