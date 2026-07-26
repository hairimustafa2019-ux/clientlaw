import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  /className="p-8 overflow-y-auto overflow-x-auto flex-1 bg-white print:p-0 print:overflow-visible print:block"/g,
  'className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-white print:p-0 print:overflow-visible print:block"'
);
fs.writeFileSync('src/App.tsx', content, 'utf8');
