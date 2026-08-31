const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const refs = ['receiptPrintRef', 'invoicePrintRef', 'hiddenReceiptPrintRef', 'hiddenCombinedPdfPrintRef', 'simplePrintRef'];
for (let ref of refs) {
  let idx = code.indexOf(`ref={${ref}}`);
  if (idx !== -1) {
    let chunk = code.substring(idx, idx + 8000);
    // Find all tailwind colors
    let matches = chunk.match(/(bg|text|border)-(zinc|gray|red|blue|emerald|green|yellow|orange|amber|black|white)-[0-9]{2,3}/g);
    if (matches) {
      console.log(`Found in ${ref}: `, [...new Set(matches)]);
    }
  }
}
