const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf-8');

const search = "workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg}'] },";
const replace = "workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg}'], maximumFileSizeToCacheInBytes: 5000000 },";

code = code.replace(search, replace);
fs.writeFileSync('vite.config.ts', code, 'utf-8');
console.log('Fixed VitePWA config');
