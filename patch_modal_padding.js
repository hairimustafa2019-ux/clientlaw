import fs from 'fs';
let content = fs.readFileSync('src/components/StandaloneReceipts.tsx', 'utf8');
content = content.replace(
  '<div className="p-8 overflow-y-auto overflow-x-auto flex-1 bg-white print:p-0 print:overflow-visible print:block">',
  '<div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-white print:p-0 print:overflow-visible print:block">'
);
fs.writeFileSync('src/components/StandaloneReceipts.tsx', content, 'utf8');
