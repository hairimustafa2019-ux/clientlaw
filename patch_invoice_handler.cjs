const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const search = `  const handleDownloadReceiptPDF = async () => {`;
const replace = `  const handleDownloadInvoicePDF = async () => {
    if (!invoicePrintRef.current || !invoiceRecord) return;
    
    setIsGeneratingInvoicePDF(true);
    try {
      const canvas = await html2canvas(invoicePrintRef.current, {
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
      
      const safeName = invoiceRecord.nama.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = \`\${invoiceType === 'INVOIS' ? 'Invois' : 'Sebut_Harga'}_\${safeName}.pdf\`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
    } finally {
      setIsGeneratingInvoicePDF(false);
    }
  };

  const handleDownloadReceiptPDF = async () => {`;

if(code.includes(search)) {
  code = code.replace(search, replace);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched handler");
}
