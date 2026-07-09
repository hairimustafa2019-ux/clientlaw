const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/initial=\{\{ opacity: 0, scale: 0.95 \}\}/g, "initial={{ opacity: 0, scale: 0.95, y: 20 }}");
content = content.replace(/animate=\{\{ opacity: 1, scale: 1 \}\}/g, "animate={{ opacity: 1, scale: 1, y: 0 }}");
content = content.replace(/exit=\{\{ opacity: 0, scale: 0.95 \}\}\n\s+className="bg-white dark:bg-zinc-900 rounded-xl/g, 'exit={{ opacity: 0, scale: 0.95, y: 20 }}\n              transition={{ type: "spring", damping: 25, stiffness: 300 }}\n              className="bg-white dark:bg-zinc-900 rounded-xl');

fs.writeFileSync('src/App.tsx', content);
