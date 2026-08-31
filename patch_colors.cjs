const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const map = {
  'text-emerald-600': 'text-[#059669]',
  'text-amber-600': 'text-[#d97706]',
  'bg-gray-50': 'bg-[#f9fafb]',
  'bg-gray-100': 'bg-[#f3f4f6]',
  'text-zinc-600': 'text-[#52525b]',
  'text-zinc-400': 'text-[#a1a1aa]',
  'divide-gray-300': 'divide-[#d1d5db]'
};

for (const [cls, hex] of Object.entries(map)) {
  const re = new RegExp("\\b" + cls + "\\b", "g");
  code = code.replace(re, hex);
}

fs.writeFileSync('src/App.tsx', code);
console.log("Patched all remaining colors safely");
