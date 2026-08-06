const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `<div className="flex flex-col gap-6 sm:hidden pb-10">
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">`;

const replaceStr = `<div className="flex flex-col gap-6 pb-10 max-w-2xl">
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
