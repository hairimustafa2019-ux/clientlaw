const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

let newCode = code.replace(/border-gray-300/g, 'border-[#d1d5db]')
                  .replace(/text-black/g, 'text-[#000000]')
                  .replace(/border-black/g, 'border-[#000000]');

fs.writeFileSync('src/App.tsx', newCode);
console.log("Patched gray and black");
