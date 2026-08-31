const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const search = `  const handleExportCSV = () => {`;
const replace = `
  useEffect(() => {
    const processQuickPrint = async () => {
      if (quickPrintData && hiddenReceiptPrintRef.current) {
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const canvas = await html2canvas(hiddenReceiptPrintRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const imgPropsHeight = (canvas.height * pdfWidth) / canvas.width;
          const finalHeight = Math.min(imgPropsHeight, pageHeight);
          const finalWidth = (canvas.width * finalHeight) / canvas.height;
          const xOffset = (pdfWidth - finalWidth) / 2;
          
          pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);
          
          pdf.save(\`Resit_\${quickPrintData.record.nama.replace(/\\s+/g, '_')}_\${quickPrintData.payment.id}.pdf\`);
        } catch (err) {
          console.error("Failed to generate PDF for quick print", err);
          alert("Ralat semasa menjana resit pantas.");
        } finally {
          setIsGeneratingQuickPrint(false);
          setQuickPrintId(null);
          setQuickPrintData(null);
        }
      }
    };

    if (isGeneratingQuickPrint && quickPrintData) {
      processQuickPrint();
    }
  }, [quickPrintData, isGeneratingQuickPrint]);

  const handleExportCSV = () => {`;

if (code.includes(search)) {
  code = code.replace(search, replace);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched effect");
}
