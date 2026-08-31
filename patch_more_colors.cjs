const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  { search: /text-zinc-800/g, replace: 'text-[#27272a]' },
  { search: /dark:text-zinc-200/g, replace: 'dark:text-[#e4e4e7]' },
  { search: /text-zinc-200/g, replace: 'text-[#e4e4e7]' },
  { search: /border-zinc-900/g, replace: 'border-[#18181b]' },
  { search: /dark:border-zinc-100/g, replace: 'dark:border-[#f4f4f5]' },
  { search: /border-zinc-100/g, replace: 'border-[#f4f4f5]' },
  { search: /bg-zinc-50/g, replace: 'bg-[#fafafa]' },
  { search: /border-zinc-200/g, replace: 'border-[#e4e4e7]' },
  { search: /text-zinc-700/g, replace: 'text-[#3f3f46]' }
];

for (const { search, replace } of replacements) {
  code = code.replace(search, replace);
}

fs.writeFileSync('src/App.tsx', code);
console.log("Patched more colors");
