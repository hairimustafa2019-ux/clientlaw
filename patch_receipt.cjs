const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Modify handleDownloadReceiptPDF
const dlReceiptOld = `      const imgPropsHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgPropsHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgPropsHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
        heightLeft -= pageHeight;
      }`;
const dlReceiptNew = `      const imgPropsHeight = (canvas.height * pdfWidth) / canvas.width;
      const finalHeight = Math.min(imgPropsHeight, pageHeight);
      const finalWidth = (canvas.width * finalHeight) / canvas.height;
      const xOffset = (pdfWidth - finalWidth) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);`;
code = code.replace(dlReceiptOld, dlReceiptNew);

// 2. Modify processNextZipItem
const dlZipOld = `            const imgPropsHeight = (canvas.height * pdfWidth) / canvas.width;
            
            let heightLeft = imgPropsHeight;
            let position = 0;
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
            heightLeft -= pageHeight;
            while (heightLeft >= 0) {
              position = heightLeft - imgPropsHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight);
              heightLeft -= pageHeight;
            }`;
const dlZipNew = `            const imgPropsHeight = (canvas.height * pdfWidth) / canvas.width;
            const finalHeight = Math.min(imgPropsHeight, pageHeight);
            const finalWidth = (canvas.width * finalHeight) / canvas.height;
            const xOffset = (pdfWidth - finalWidth) / 2;
            pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);`;
code = code.replace(dlZipOld, dlZipNew);

// 3. Modify receiptPrintRef div
// Old: <div ref={receiptPrintRef} className="w-full min-w-[700px] mx-auto font-sans text-black bg-white print:min-w-0 print:w-full print:p-0">
const refOld = `<div ref={receiptPrintRef} className="w-full min-w-[700px] mx-auto font-sans text-black bg-white print:min-w-0 print:w-full print:p-0">`;
const refNew = `<div ref={receiptPrintRef} className="w-[794px] h-[1122px] mx-auto font-sans text-black bg-white flex flex-col p-10 shrink-0 shadow-xl print:shadow-none print:p-0 relative">`;
code = code.replace(refOld, refNew);

// Also need to adjust the wrapper of receiptPrintRef
const wrapperOld = `<div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-white print:p-0 print:overflow-visible print:block">`;
const wrapperNew = `<div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-zinc-100 dark:bg-zinc-950 flex items-start justify-center print:bg-white print:p-0 print:overflow-visible print:block">`;
code = code.replace(wrapperOld, wrapperNew);


// 4. Modify hiddenReceiptPrintRef div
const hiddenRefOld = `<div ref={hiddenReceiptPrintRef} className="w-full min-w-[700px] mx-auto font-sans text-black bg-white print:min-w-0 print:w-full print:p-0">`;
const hiddenRefNew = `<div ref={hiddenReceiptPrintRef} className="w-[794px] h-[1122px] mx-auto font-sans text-black bg-white flex flex-col p-10 shrink-0 relative">`;
code = code.replace(hiddenRefOld, hiddenRefNew);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx successfully");
