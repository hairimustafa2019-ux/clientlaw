const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const [isGeneratingZip, setIsGeneratingZip] = useState(false);`;

const replaceStr = `  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [isGeneratingCombinedPDF, setIsGeneratingCombinedPDF] = useState(false);
  const [combinedPdfQueue, setCombinedPdfQueue] = useState<import('./data').CaseRecord[]>([]);
  const [combinedPdfCurrentIndex, setCombinedPdfCurrentIndex] = useState(0);
  const combinedPdfInstanceRef = useRef<any>(null);
  const hiddenCombinedPdfPrintRef = useRef<HTMLDivElement>(null);`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
