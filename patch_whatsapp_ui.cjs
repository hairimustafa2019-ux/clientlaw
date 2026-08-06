const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">
                          <Upload size={18} />
                        </div>
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Import Data CSV</span>
                      </div>
                      <ChevronRight size={18} className="text-zinc-400" />
                    </button>
                  </div>
                </div>
              </div>
                </div>
              </motion.div>
            )}
            {/* Main Dashboard Content */}`;

const replaceStr = `                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">
                          <Upload size={18} />
                        </div>
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Import Data CSV</span>
                      </div>
                      <ChevronRight size={18} className="text-zinc-400" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                  <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Tetapan Peringatan WhatsApp</h2>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Template Mesej</label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-zinc-900 dark:text-zinc-100 resize-y"
                      value={whatsappTemplate}
                      onChange={(e) => setWhatsappTemplate(e.target.value)}
                    />
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Gunakan tag: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-700 dark:text-zinc-300">{"{nama}"}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-700 dark:text-zinc-300">{"{kes}"}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-700 dark:text-zinc-300">{"{baki}"}</code>.
                    </p>
                  </div>
                </div>
                
              </div>
                </div>
              </motion.div>
            )}
            {/* Main Dashboard Content */}`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
