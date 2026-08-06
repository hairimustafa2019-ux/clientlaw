const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `            <button 
              onClick={() => fileInputRef.current?.click()}
              className="hidden lg:flex p-2 sm:px-4 sm:py-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium cursor-pointer shrink-0 transition-all">
              <Upload size={14} />
              <span className="hidden sm:inline">Import</span>
            </button>`;

const replaceStr = `            <button 
              onClick={() => fileInputRef.current?.click()}
              className="hidden lg:flex p-2 sm:px-4 sm:py-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium cursor-pointer shrink-0 transition-all">
              <Upload size={14} />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button 
              onClick={handleFormatData}
              className="hidden lg:flex p-2 sm:px-4 sm:py-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg font-medium cursor-pointer shrink-0 transition-all">
              <Trash2 size={14} />
              <span className="hidden sm:inline">Format</span>
            </button>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
