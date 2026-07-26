import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/className="hidden (sm|md|lg|xl):table-cell/g, 'className="');
fs.writeFileSync('src/App.tsx', content, 'utf8');
