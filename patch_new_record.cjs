const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800/50 mt-6">`;
const replacement = `                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                      Nota / Ringkasan Kes
                    </label>
                    <textarea
                      className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100 resize-y min-h-[80px]"
                      placeholder="Masukkan nota tambahan (pilihan)"
                      value={newRecordData.nota}
                      onChange={(e) => setNewRecordData({ ...newRecordData, nota: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800/50 mt-6">`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
