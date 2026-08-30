const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /initial=\{\{ opacity: 0, y: 10 \}\}\s*animate=\{\{ opacity: 1, y: 0 \}\}\s*exit=\{\{ opacity: 0, y: -10 \}\}\s*transition=\{\{ duration: 0\.2 \}\}/g;

const replacement = `initial={{ opacity: 0, y: 15, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.99 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.8 }}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log("Animation patched!");
