const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const refs = ['hiddenReceiptPrintRef', 'hiddenCombinedPdfPrintRef', 'simplePrintRef', 'receiptPrintRef', 'invoicePrintRef'];

let output = '';
for(let ref of refs) {
  let idx = code.indexOf(`ref={${ref}}`);
  if (idx !== -1) {
    let block = code.substring(idx, idx + 8000); // just grab a chunk
    let matches = block.match(/(bg|text|border)-(zinc|gray|red|blue|emerald|green|yellow|orange|amber|black|white)-[0-9]{2,3}/g);
    if (matches) {
       output += `\n--- ${ref} ---\n` + [...new Set(matches)].join('\n');
    }
  }
}
fs.writeFileSync('print_colors.txt', output);
console.log("Done");
