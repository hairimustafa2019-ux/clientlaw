const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `            <button 
              onClick={handleExportData}
              className="hidden lg:flex p-2 sm:px-4 sm:py-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium cursor-pointer shrink-0 transition-all">
              <Download size={14} />
              <span className="hidden sm:inline">Eksport</span>
            </button>`;

const replaceStr = `            <button 
              onClick={handleExportDataLengkapExcel}
              className="hidden lg:flex p-2 sm:px-4 sm:py-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg font-medium cursor-pointer shrink-0 transition-all">
              <Download size={14} />
              <span className="hidden sm:inline">Eksport Lengkap</span>
            </button>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
