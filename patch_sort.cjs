const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/a\.namaPelanggan/g, 'a.nama');
code = code.replace(/b\.namaPelanggan/g, 'b.nama');

fs.writeFileSync('src/App.tsx', code);
