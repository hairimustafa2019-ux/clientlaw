const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Sertakan Pautan Penyata PDF (jika ada)</span>
                    </label>
                  </div>
                </div>`;

const replaceStr = `                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Sertakan Pautan Penyata PDF (jika ada)</span>
                    </label>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                  <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Tetapan Penjejak Tunggakan</h2>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tempoh Tunggakan (Hari)</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      className="w-full sm:w-32 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-zinc-900 dark:text-zinc-100"
                      value={overdueDays}
                      onChange={(e) => setOverdueDays(parseInt(e.target.value) || 30)}
                    />
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Rekod pelanggan akan ditanda sebagai "Tunggakan" (Overdue) jika baki tertunggak melebihi RM 0 dan tiada bayaran dibuat melepasi tempoh hari yang ditetapkan ini.
                    </p>
                  </div>
                </div>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
