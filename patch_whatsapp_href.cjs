const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = "href={`https://wa.me/${r.telefon.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Salam, ini adalah peringatan mesra berkenaan baki tertunggak sebanyak ${formatRM(r.bakiFeeTerkini)} untuk kes ${r.kes}.`)}`}";

const replaceStr = "href={`https://wa.me/${r.telefon.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappTemplate.replace(/\\\\{nama\\\\}/g, r.nama).replace(/\\\\{kes\\\\}/g, r.kes).replace(/\\\\{baki\\\\}/g, formatRM(r.bakiFeeTerkini)))}`}";

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
