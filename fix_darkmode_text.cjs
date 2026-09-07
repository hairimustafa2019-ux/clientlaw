const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replacements (only replacing if not already followed by dark:text-)
const replacements = [
  { match: /text-\[#18181b\](?!\s+dark:text)/g, replace: 'text-[#18181b] dark:text-white' },
  { match: /text-\[#27272a\](?!\s+dark:text)/g, replace: 'text-[#27272a] dark:text-zinc-100' },
  { match: /text-\[#3f3f46\](?!\s+dark:text)/g, replace: 'text-[#3f3f46] dark:text-zinc-200' },
  { match: /text-\[#52525b\](?!\s+dark:text)/g, replace: 'text-[#52525b] dark:text-zinc-300' },
  { match: /text-\[#71717a\](?!\s+dark:text)/g, replace: 'text-[#71717a] dark:text-[#a1a1aa]' }
];

replacements.forEach(({match, replace}) => {
  content = content.replace(match, replace);
});

// Write it back
fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log("Colors updated.");
