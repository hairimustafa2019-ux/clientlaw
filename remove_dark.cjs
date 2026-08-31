const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const refs = ['receiptPrintRef', 'invoicePrintRef', 'hiddenReceiptPrintRef', 'hiddenCombinedPdfPrintRef', 'simplePrintRef'];

for (let ref of refs) {
  let startIdx = code.indexOf(`ref={${ref}}`);
  if (startIdx === -1) continue;
  
  // Find the end of this div by looking for the next print:hidden or some other reliable boundary, 
  // or simply replace in a 10,000 char chunk (safe enough as they are large blocks)
  let endIdx = startIdx + 8000;
  
  let chunk = code.substring(startIdx, endIdx);
  // Actually it's safer to just replace all `dark:[^\\s"']+(?=["\\s])` globally? No, only in print areas.
  chunk = chunk.replace(/dark:[a-zA-Z0-9-\[\]#]+/g, '');
  
  code = code.substring(0, startIdx) + chunk + code.substring(endIdx);
}

fs.writeFileSync('src/App.tsx', code);
console.log("Removed dark mode classes from print areas");
