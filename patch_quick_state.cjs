const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const search = `  const [isGeneratingZip, setIsGeneratingZip] = useState(false);`;
const replace = search + `
  const [quickPrintData, setQuickPrintData] = useState<{record: CaseRecord, payment: import('./data').PaymentEntry} | null>(null);
  const [isGeneratingQuickPrint, setIsGeneratingQuickPrint] = useState(false);
  const [quickPrintId, setQuickPrintId] = useState<string | null>(null);`;
if(code.includes(search)) {
  code = code.replace(search, replace);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched state");
}
