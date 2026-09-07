const fs = require('fs');
let code = fs.readFileSync('src/components/StandaloneReceipts.tsx', 'utf-8');

const t = '<td className="p-3">{data.tarikhDisplay || data.tarikh}</td>';
const r = '<td className="p-3">{data.tarikhDisplay || `${new Date(data.tarikh).getDate().toString().padStart(2, "0")}/${(new Date(data.tarikh).getMonth()+1).toString().padStart(2, "0")}/${new Date(data.tarikh).getFullYear()}`}</td>';

code = code.replace(t, r);
fs.writeFileSync('src/components/StandaloneReceipts.tsx', code, 'utf-8');
console.log("Fixed standalone table");
