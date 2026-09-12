const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldInitial = `initial={{ opacity: 0, y: 20 }}`;
const oldAnimate = `animate={{ opacity: 1, y: 0 }}`;
const oldExit = `exit={{ opacity: 0, y: -20 }}`;
const oldTransition = `transition={{ duration: 0.3, ease: "easeOut" }}`;

const newInitial = `initial={{ opacity: 0, y: 15 }}`;
const newAnimate = `animate={{ opacity: 1, y: 0 }}`;
const newExit = `exit={{ opacity: 0, y: -15 }}`;
const newTransition = `transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}`; // smoother ease-out curve

code = code.split(oldInitial).join(newInitial);
code = code.split(oldExit).join(newExit);
code = code.split(oldTransition).join(newTransition);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Patched animations');
