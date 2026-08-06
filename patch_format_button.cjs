const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                      <ChevronRight size={18} className="text-zinc-400" />
                    </button>
                  </div>
                </div>`;

const replaceStr = `                      <ChevronRight size={18} className="text-zinc-400" />
                    </button>
                    <button onClick={handleFormatData} className="w-full flex items-center justify-between p-4 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                          <Trash2 size={18} />
                        </div>
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">Format Semua Data</span>
                      </div>
                      <ChevronRight size={18} className="text-red-400" />
                    </button>
                  </div>
                </div>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
