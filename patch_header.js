import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace hidden sm:flex with hidden lg:flex for Cloud Backup
content = content.replace(
  /className="hidden sm:flex p-2 sm:px-4 sm:py-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500\/10/g,
  'className="hidden lg:flex p-2 sm:px-4 sm:py-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
);

// Replace hidden sm:flex with hidden lg:flex for Eksport and Import
// Because they share the same class string, let's just do a string replacement targeting that section
content = content.replace(
  /<button \n              onClick={handleExportData}\n              className="hidden sm:flex p-2 sm:px-4 sm:py-2 flex items-center gap-2/g,
  '<button \n              onClick={handleExportData}\n              className="hidden lg:flex p-2 sm:px-4 sm:py-2 flex items-center gap-2'
);

content = content.replace(
  /<button \n              onClick={\(\) => fileInputRef.current\?.click\(\)}\n              className="hidden sm:flex p-2 sm:px-4 sm:py-2 flex items-center gap-2/g,
  '<button \n              onClick={() => fileInputRef.current?.click()}\n              className="hidden lg:flex p-2 sm:px-4 sm:py-2 flex items-center gap-2'
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
