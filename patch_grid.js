import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  '<div className="grid grid-cols-4 gap-2">',
  '<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">'
);
fs.writeFileSync('src/App.tsx', content, 'utf8');
