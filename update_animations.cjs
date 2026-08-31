const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  {
    search: /initial=\{\{ opacity: 0, y: 15, scale: 0\.99 \}\}/g,
    replace: 'initial={{ opacity: 0, y: 20 }}'
  },
  {
    search: /animate=\{\{ opacity: 1, y: 0, scale: 1 \}\}/g,
    replace: 'animate={{ opacity: 1, y: 0 }}'
  },
  {
    search: /exit=\{\{ opacity: 0, y: -15, scale: 0\.99 \}\}/g,
    replace: 'exit={{ opacity: 0, y: -20 }}'
  },
  {
    search: /transition=\{\{ type: "spring", stiffness: 300, damping: 25, mass: 0\.8 \}\}/g,
    replace: 'transition={{ duration: 0.3, ease: "easeOut" }}'
  }
];

for (const { search, replace } of replacements) {
  code = code.replace(search, replace);
}

fs.writeFileSync('src/App.tsx', code);
console.log("Animations updated");
