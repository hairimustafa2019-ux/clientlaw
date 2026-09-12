const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldGrid = `                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-2 shrink-0 print:hidden">
                  <div className="flex flex-col gap-1 border-l-2 border-[#e4e4e7]  pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-[#71717a] dark:text-[#a1a1aa]">Jumlah Kes</div>
                    <div className="text-3xl font-light tracking-tight text-[#27272a] dark:text-[#e4e4e7]">{stats.totalKes}</div>
                  </div>
                  
                  <div className="flex flex-col gap-1 border-l-2 border-[#e4e4e7]  pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-[#71717a] dark:text-[#a1a1aa]">Total Fee</div>
                    <div className="text-3xl font-light tracking-tight text-[#27272a] dark:text-[#e4e4e7]">{formatRM(stats.totalFee)}</div>
                  </div>

                  <div className="flex flex-col gap-1 border-l-2 border-amber-500 dark:border-amber-500 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-amber-500 dark:text-amber-400">Baki Fee Terkini</div>
                    <div className="text-3xl font-light tracking-tight text-[#d97706] dark:text-amber-500">{formatRM(stats.totalBakiTerkini)}</div>
                  </div>

                  <div className="flex flex-col gap-1 border-l-2 border-[#e4e4e7]  pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-[#71717a] dark:text-[#a1a1aa]">Baki Mileage</div>
                    <div className="text-3xl font-light tracking-tight text-[#27272a] dark:text-[#e4e4e7]">{formatRM(stats.totalMileage)}</div>
                  </div>

                  <div className="flex flex-col gap-1 border-l-2 border-red-500 dark:border-red-500 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-red-500 dark:text-red-400">Tunggakan ({stats.totalOverdueCases} Kes)</div>
                    <div className="text-3xl font-light tracking-tight text-red-600 dark:text-red-500">{formatRM(stats.totalOverdueAmount)}</div>
                  </div>
                </div>`;

const newGrid = `                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-2 shrink-0 print:hidden">
                  <div className="flex flex-col gap-2 p-4 bg-[#ffffff] dark:bg-zinc-900 border border-[#e4e4e7] dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-[10px] font-bold tracking-widest uppercase text-[#71717a] dark:text-[#a1a1aa] truncate">Jumlah Kes</div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181b] dark:text-white mt-1">{stats.totalKes}</div>
                  </div>
                  
                  <div className="flex flex-col gap-2 p-4 bg-[#ffffff] dark:bg-zinc-900 border border-[#e4e4e7] dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Wallet size={14} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="text-[10px] font-bold tracking-widest uppercase text-[#71717a] dark:text-[#a1a1aa] truncate">Total Fee</div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181b] dark:text-white mt-1">{formatRM(stats.totalFee)}</div>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#ffffff] dark:bg-zinc-900 flex items-center justify-center shrink-0 shadow-sm">
                        <CreditCard size={14} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="text-[10px] font-bold tracking-widest uppercase text-amber-700 dark:text-amber-400 truncate">Baki Fee Terkini</div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-700 dark:text-amber-400 mt-1">{formatRM(stats.totalBakiTerkini)}</div>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-[#ffffff] dark:bg-zinc-900 border border-[#e4e4e7] dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center shrink-0">
                        <Car size={14} className="text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="text-[10px] font-bold tracking-widest uppercase text-[#71717a] dark:text-[#a1a1aa] truncate">Baki Mileage</div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181b] dark:text-white mt-1">{formatRM(stats.totalMileage)}</div>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl shadow-sm hover:shadow-md transition-shadow lg:col-span-1 md:col-span-3 sm:col-span-2 col-span-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#ffffff] dark:bg-zinc-900 flex items-center justify-center shrink-0 shadow-sm">
                          <AlertTriangle size={14} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div className="text-[10px] font-bold tracking-widest uppercase text-red-700 dark:text-red-400 truncate">Tunggakan</div>
                      </div>
                      <div className="text-[10px] font-bold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">{stats.totalOverdueCases} Kes</div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight text-red-700 dark:text-red-400 mt-1">{formatRM(stats.totalOverdueAmount)}</div>
                  </div>
                </div>`;

if (code.includes(oldGrid)) {
  code = code.split(oldGrid).join(newGrid);
  console.log('Replaced old grid in dashboard tab.');
}

// ALSO, let's remove the stats grid from settings if it's there.
// If it's directly inside activeTab === 'settings', we can just find it.
const settingsGridTarget = `{activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col overflow-hidden min-h-0"
              >
` + newGrid;

if (code.includes(settingsGridTarget)) {
  code = code.replace(settingsGridTarget, `{activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col overflow-hidden min-h-0"
              >`);
  console.log('Removed mistakenly added grid from settings tab.');
}

fs.writeFileSync('src/App.tsx', code, 'utf-8');
