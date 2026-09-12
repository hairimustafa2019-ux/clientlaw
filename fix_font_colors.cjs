const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace standard zinc-500/400 labels with slightly darker/lighter for better contrast
code = code.replace(/text-\[\#71717a\] dark:text-\[\#a1a1aa\] truncate/g, 'text-zinc-600 dark:text-zinc-300 truncate');
code = code.replace(/text-\[\#18181b\] dark:text-white mt-1/g, 'text-zinc-900 dark:text-zinc-50 mt-1');

// Replace Amber colors to make them a bit richer and easier to read
code = code.replace(/text-amber-700 dark:text-amber-400 truncate/g, 'text-amber-800 dark:text-amber-300 truncate');
code = code.replace(/text-amber-700 dark:text-amber-400 mt-1/g, 'text-amber-800 dark:text-amber-300 mt-1');

// Replace Red colors for better readability
code = code.replace(/text-red-700 dark:text-red-400 truncate/g, 'text-red-800 dark:text-red-300 truncate');
code = code.replace(/text-red-700 dark:text-red-400 mt-1/g, 'text-red-800 dark:text-red-300 mt-1');

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Font colors adjusted for better contrast.');
