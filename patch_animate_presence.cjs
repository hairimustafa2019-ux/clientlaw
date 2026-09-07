const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace('<tbody className="text-[13px]">\n                    <AnimatePresence>', '<tbody className="text-[13px]">\n                    <AnimatePresence mode="popLayout">');

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Patched AnimatePresence.");
