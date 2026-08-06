const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                      Nama Pelanggan / Entiti
                    </label>
                    <input
                      type="text"
                      required
                      className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100"
                      value={editingRecord.nama || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, nama: e.target.value })}
                      autoFocus
                    />
                  </div>`;

const replaceStr = `                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                      Nama Pelanggan / Entiti
                    </label>
                    <input
                      type="text"
                      required
                      className={\`px-3 py-2 w-full border \${editingRecord.nama && records.some(r => r.id !== editingRecord.id && r.nama.toLowerCase().trim() === editingRecord.nama.toLowerCase().trim()) ? 'border-amber-400 focus:ring-amber-500/20 focus:border-amber-500' : 'border-zinc-200 dark:border-zinc-800 focus:ring-blue-500/20 focus:border-blue-500'} rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 transition-all font-medium text-zinc-900 dark:text-zinc-100\`}
                      value={editingRecord.nama || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, nama: e.target.value })}
                      autoFocus
                    />
                    {editingRecord.nama && records.some(r => r.id !== editingRecord.id && r.nama.toLowerCase().trim() === editingRecord.nama.toLowerCase().trim()) && (
                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-1.5 flex items-center gap-1.5">
                        <AlertTriangle size={12} />
                        Nama pelanggan sudah wujud dalam sistem.
                      </p>
                    )}
                  </div>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
