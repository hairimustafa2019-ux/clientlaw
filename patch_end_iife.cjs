const fs = require('fs');
let code = fs.readFileSync('src/tmp_code.txt', 'utf8');
code = code.replace(/      \)\}\n      \{\/\* Client Profile Modal \*\/\}/, '      );\n      })()}\n      {/* Client Profile Modal */}');
fs.writeFileSync('src/App.tsx', code);
console.log("Patched end iife");
