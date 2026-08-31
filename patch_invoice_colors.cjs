const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

let newCode = code.replace(/text-zinc-900/g, 'text-[#18181b]')
                  .replace(/text-zinc-500/g, 'text-[#71717a]')
                  .replace(/border-zinc-300/g, 'border-[#d4d4d8]');

fs.writeFileSync('src/App.tsx', newCode);
console.log("Patched colors");
