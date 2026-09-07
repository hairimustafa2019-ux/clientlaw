const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetBtnDesktop = `<button 
              onClick={handleExportDataLengkapExcel}
              className="hidden lg:flex p-2 sm:px-4 sm:py-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg font-medium cursor-pointer shrink-0 transition-all">
              <Download size={14} />
              <span className="hidden sm:inline">Eksport Lengkap</span>
            </button>`;
            
const replacementBtnDesktop = `<button 
              onClick={handleExportDataLengkapExcel}
              className="hidden lg:flex p-2 sm:px-4 sm:py-2 items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg font-medium cursor-pointer shrink-0 transition-all">
              <Download size={14} />
              <span className="hidden sm:inline">Eksport Lengkap</span>
            </button>
            <button 
              onClick={handleSyncGoogleSheets}
              disabled={isSyncingSheets}
              className="hidden lg:flex p-2 sm:px-4 sm:py-2 items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg font-medium cursor-pointer disabled:opacity-50 shrink-0 transition-all">
              {isSyncingSheets ? <Loader2 size={14} className="animate-spin" /> : <Cloud size={14} />}
              <span className="hidden sm:inline">Sync Sheets</span>
            </button>`;

code = code.replace(targetBtnDesktop, replacementBtnDesktop);

const targetBtnMobile = `<button onClick={handleExportDataLengkapExcel} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                          <Download size={18} />
                        </div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Eksport Data Lengkap (Excel)</span>
                      </div>
                      <ChevronRight size={18} className="text-[#a1a1aa]" />
                    </button>`;

const replacementBtnMobile = `<button onClick={handleExportDataLengkapExcel} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                          <Download size={18} />
                        </div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Eksport Data Lengkap (Excel)</span>
                      </div>
                      <ChevronRight size={18} className="text-[#a1a1aa]" />
                    </button>
                    <button onClick={handleSyncGoogleSheets} disabled={isSyncingSheets} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 transition-colors disabled:opacity-50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                          {isSyncingSheets ? <Loader2 size={18} className="animate-spin" /> : <Cloud size={18} />}
                        </div>
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Segerak Google Sheets</span>
                      </div>
                      <ChevronRight size={18} className="text-[#a1a1aa]" />
                    </button>`;

code = code.replace(targetBtnMobile, replacementBtnMobile);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Patched buttons.");
