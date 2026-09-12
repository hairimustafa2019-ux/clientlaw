const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const t = `            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={handleImportCSV} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}`;

const r = `            <button 
              onClick={handleDownloadTemplate}
              className="hidden lg:flex p-2 sm:px-4 sm:py-2 items-center gap-2 text-sm text-[#52525b] dark:text-[#a1a1aa] hover:text-[#18181b] dark:text-white dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium cursor-pointer shrink-0 transition-all">
              <Download size={14} />
              <span className="hidden sm:inline">Templat CSV</span>
            </button>
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={handleImportCSV} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}`;

if (code.includes(t)) {
  code = code.replace(t, r);
  fs.writeFileSync('src/App.tsx', code, 'utf-8');
  console.log('Template button added');
} else {
  console.log('Failed to find replacement target.');
}
