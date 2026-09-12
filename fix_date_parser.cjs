const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldParseDateObj = `const parseDateObj = (dateStr: string) => {
  if (!dateStr) return new Date();
  const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
  if (parts.length === 3) {
    if (dateStr.includes('/')) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);
        year += year < 100 ? (year < 50 ? 2000 : 1900) : 0;
        return new Date(year, month, day);
    } else {
        return new Date(dateStr);
    }
  }
  return new Date();
};`;

const newParseDateObj = `const parseDateObj = (dateStr: string) => {
  if (!dateStr) return new Date();
  const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
  if (parts.length === 3) {
    if (dateStr.includes('/')) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);
        year += year < 100 ? (year < 50 ? 2000 : 1900) : 0;
        return new Date(year, month, day);
    } else {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }
  }
  return new Date();
};`;

code = code.replace(oldParseDateObj, newParseDateObj);
fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Fixed parseDateObj');
