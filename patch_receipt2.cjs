const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const imgPropsHeight = \(canvas\.height \* pdfWidth\) \/ canvas\.width;\s*let heightLeft = imgPropsHeight;\s*let position = 0;\s*pdf\.addImage\(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight\);\s*heightLeft -= pageHeight;\s*while \(heightLeft >= 0\) \{\s*position = heightLeft - imgPropsHeight;\s*pdf\.addPage\(\);\s*pdf\.addImage\(imgData, 'PNG', 0, position, pdfWidth, imgPropsHeight\);\s*heightLeft -= pageHeight;\s*\}/;

const replacement = `const imgPropsHeight = (canvas.height * pdfWidth) / canvas.width;
      const finalHeight = Math.min(imgPropsHeight, pageHeight);
      const finalWidth = (canvas.width * finalHeight) / canvas.height;
      const xOffset = (pdfWidth - finalWidth) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched handleDownloadReceiptPDF");
} else {
  console.log("Regex not matched");
}
