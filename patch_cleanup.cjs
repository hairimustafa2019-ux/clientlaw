const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const monthlyPaymentDataStart = content.indexOf('// Compute chart data for monthly payments (current year)');
if (monthlyPaymentDataStart !== -1) {
    const endStr = '}, [records]);';
    const endIdx = content.indexOf(endStr, monthlyPaymentDataStart);
    if (endIdx !== -1) {
        content = content.substring(0, monthlyPaymentDataStart) + content.substring(endIdx + endStr.length);
        console.log("monthlyPaymentData removed");
    }
}

const handleExportStart = content.indexOf('const handleExportLaporanCSV = () => {');
if (handleExportStart !== -1) {
    const endStr = '  };';
    let endIdx = content.indexOf(endStr, handleExportStart);
    if (endIdx !== -1) {
        content = content.substring(0, handleExportStart) + content.substring(endIdx + endStr.length);
        console.log("handleExportLaporanCSV removed");
    }
}

fs.writeFileSync('src/App.tsx', content);
