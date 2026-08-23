const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const handleDownloadSelectedReceiptsZIP = () => {`;

const replaceStr = `  const handlePrintAllSelected = () => {
    const queue = selectedRecords.map(id => records.find(r => r.id === id)).filter(Boolean) as import('./data').CaseRecord[];
    
    if (queue.length === 0) {
      alert("Tiada rekod pelanggan dipilih.");
      return;
    }
    
    combinedPdfInstanceRef.current = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    setIsGeneratingCombinedPDF(true);
    setCombinedPdfQueue(queue);
    setCombinedPdfCurrentIndex(0);
  };

  useEffect(() => {
    const processNextCombinedItem = async () => {
      if (combinedPdfQueue && combinedPdfInstanceRef.current && hiddenCombinedPdfPrintRef.current) {
        if (combinedPdfCurrentIndex < combinedPdfQueue.length) {
          // Allow DOM to update and images to load
          await new Promise(resolve => setTimeout(resolve, 300));
          
          try {
            const canvas = await html2canvas(hiddenCombinedPdfPrintRef.current, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = combinedPdfInstanceRef.current;
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgPropsHeight = (canvas.height * pdfWidth) / canvas.width;
            
            let heightLeft = imgPropsHeight;
            let position = 0;
            
            if (combinedPdfCurrentIndex > 0) {
               pdf.addPage();
            }
            
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
              position = heightLeft - imgPropsHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
              heightLeft -= pageHeight;
            }
            
            setCombinedPdfCurrentIndex(prev => prev + 1);
          } catch (err) {
            console.error("Failed to generate PDF for combined item", err);
            setCombinedPdfCurrentIndex(prev => prev + 1);
          }
        } else {
          // Finished all queue items
          const pdf = combinedPdfInstanceRef.current;
          pdf.save('Penyata_Ringkas_Keseluruhan.pdf');
          setIsGeneratingCombinedPDF(false);
          setCombinedPdfQueue([]);
          combinedPdfInstanceRef.current = null;
        }
      }
    };
    
    if (isGeneratingCombinedPDF && combinedPdfQueue.length > 0) {
      processNextCombinedItem();
    }
  }, [combinedPdfCurrentIndex, isGeneratingCombinedPDF, combinedPdfQueue]);

  const handleDownloadSelectedReceiptsZIP = () => {`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
