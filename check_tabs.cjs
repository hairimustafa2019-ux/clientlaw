const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf-8');

const matches = [...code.matchAll(/activeTab === '(\w+)' && \(\s*<motion\.div/g)];
matches.forEach(m => console.log(m[0]));
