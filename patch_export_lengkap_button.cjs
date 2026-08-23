const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                    <button onClick={handleExportData} className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">
                          <Download size={18} />
                        </div>
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Eksport Data CSV</span>
                      </div>
                      <ChevronRight size={18} className="text-zinc-400" />
                    </button>`;

const replaceStr = `                    <button onClick={handleExportData} className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">
                          <Download size={18} />
                        </div>
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Eksport Data CSV (Ringkas)</span>
                      </div>
                      <ChevronRight size={18} className="text-zinc-400" />
                    </button>
                    <button onClick={handleExportDataLengkapExcel} className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                          <Download size={18} />
                        </div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Eksport Data Lengkap (Excel)</span>
                      </div>
                      <ChevronRight size={18} className="text-blue-400" />
                    </button>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
