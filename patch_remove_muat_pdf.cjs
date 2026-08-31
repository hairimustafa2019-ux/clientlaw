const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Use a regex to remove handleMuatDataPDF
const funcRegex = /\s*const handleMuatDataPDF = async \(\) => \{[\s\S]*?alert\("Data dari PDF telah berjaya dimuatkan!"\);\n\s*\}\n\s*\};/;
code = code.replace(funcRegex, '');

// Also remove the button in Settings
const btnRegex = /\s*<button onClick=\{handleMuatDataPDF\}[\s\S]*?<span className="text-sm font-medium text-blue-600 dark:text-blue-400">Muat Data dari PDF<\/span>\s*<\/div>\s*<ChevronRight size=\{18\} className="text-blue-400" \/>\s*<\/button>/;
code = code.replace(btnRegex, '');

fs.writeFileSync('src/App.tsx', code);
console.log("Patched Muat Data PDF");
