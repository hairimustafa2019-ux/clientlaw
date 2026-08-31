const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const search = `  // Modal States`;
const replace = `  // Modal States
  const [invoiceRecord, setInvoiceRecord] = useState<CaseRecord | null>(null);
  const [invoiceType, setInvoiceType] = useState<'INVOIS' | 'SEBUT HARGA'>('INVOIS');
  const [isGeneratingInvoicePDF, setIsGeneratingInvoicePDF] = useState(false);
  const invoicePrintRef = useRef<HTMLDivElement>(null);`;

if(code.includes(search)) {
  code = code.replace(search, replace);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched state");
}
