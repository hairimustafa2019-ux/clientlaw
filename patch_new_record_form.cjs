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
                      placeholder="Contoh: Ali bin Abu"
                      value={newRecordData.nama}
                      onChange={(e) => setNewRecordData({ ...newRecordData, nama: e.target.value })}
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
                      className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100"
                      placeholder="Contoh: Ali bin Abu"
                      value={newRecordData.nama || ''}
                      onChange={(e) => setNewRecordData({ ...newRecordData, nama: e.target.value })}
                      autoFocus
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">No. Telefon</label>
                      <input
                        type="text"
                        className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100"
                        placeholder="Contoh: 0123456789"
                        value={newRecordData.telefon || ''}
                        onChange={(e) => setNewRecordData({ ...newRecordData, telefon: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Emel</label>
                      <input
                        type="email"
                        className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100"
                        placeholder="Contoh: ali@example.com"
                        value={newRecordData.emel || ''}
                        onChange={(e) => setNewRecordData({ ...newRecordData, emel: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Alamat</label>
                    <textarea
                      rows={2}
                      className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100"
                      placeholder="Alamat penuh..."
                      value={newRecordData.alamat || ''}
                      onChange={(e) => setNewRecordData({ ...newRecordData, alamat: e.target.value })}
                    />
                  </div>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
