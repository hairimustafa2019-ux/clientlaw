const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-2 shrink-0 print:hidden">
                  <div className="flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Jumlah Kes</div>
                    <div className="text-3xl font-light tracking-tight text-zinc-800 dark:text-zinc-200">{stats.totalKes}</div>
                  </div>
                  
                  <div className="flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Total Fee</div>
                    <div className="text-3xl font-light tracking-tight text-zinc-800 dark:text-zinc-200">{formatRM(stats.totalFee)}</div>
                  </div>

                  <div className="flex flex-col gap-1 border-l-2 border-red-500 dark:border-red-500 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-red-500 dark:text-red-400">Baki Fee Terkini</div>
                    <div className="text-3xl font-light tracking-tight text-red-600 dark:text-red-500">{formatRM(stats.totalBakiTerkini)}</div>
                  </div>

                  <div className="flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Baki Mileage</div>
                    <div className="text-3xl font-light tracking-tight text-zinc-800 dark:text-zinc-200">{formatRM(stats.totalMileage)}</div>
                  </div>
                </div>`;

const replaceStr = `                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-2 shrink-0 print:hidden">
                  <div className="flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Jumlah Kes</div>
                    <div className="text-3xl font-light tracking-tight text-zinc-800 dark:text-zinc-200">{stats.totalKes}</div>
                  </div>
                  
                  <div className="flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Total Fee</div>
                    <div className="text-3xl font-light tracking-tight text-zinc-800 dark:text-zinc-200">{formatRM(stats.totalFee)}</div>
                  </div>

                  <div className="flex flex-col gap-1 border-l-2 border-amber-500 dark:border-amber-500 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-amber-500 dark:text-amber-400">Baki Fee Terkini</div>
                    <div className="text-3xl font-light tracking-tight text-amber-600 dark:text-amber-500">{formatRM(stats.totalBakiTerkini)}</div>
                  </div>

                  <div className="flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Baki Mileage</div>
                    <div className="text-3xl font-light tracking-tight text-zinc-800 dark:text-zinc-200">{formatRM(stats.totalMileage)}</div>
                  </div>

                  <div className="flex flex-col gap-1 border-l-2 border-red-500 dark:border-red-500 pl-4">
                    <div className="text-[10px] font-medium tracking-widest uppercase text-red-500 dark:text-red-400">Tunggakan ({stats.totalOverdueCases} Kes)</div>
                    <div className="text-3xl font-light tracking-tight text-red-600 dark:text-red-500">{formatRM(stats.totalOverdueAmount)}</div>
                  </div>
                </div>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
