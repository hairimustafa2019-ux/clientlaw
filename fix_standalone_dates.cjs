const fs = require('fs');
let code = fs.readFileSync('src/components/StandaloneReceipts.tsx', 'utf-8');

const t1 = 'const tarikhDisplay = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;';
const r1 = 'const tarikhDisplay = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;';
code = code.replace(t1, r1);

const t2 = '<strong>TARIKH:</strong> <span>{form.tarikhDisplay || `${new Date(form.tarikh).getDate()}.${new Date(form.tarikh).getMonth()+1}.${new Date(form.tarikh).getFullYear()}`}</span>';
const r2 = '<strong>TARIKH:</strong> <span>{form.tarikhDisplay || `${new Date(form.tarikh).getDate().toString().padStart(2, "0")}/${(new Date(form.tarikh).getMonth()+1).toString().padStart(2, "0")}/${new Date(form.tarikh).getFullYear()}`}</span>';
code = code.replace(t2, r2);

fs.writeFileSync('src/components/StandaloneReceipts.tsx', code, 'utf-8');
console.log("Fixed standalone dates");
