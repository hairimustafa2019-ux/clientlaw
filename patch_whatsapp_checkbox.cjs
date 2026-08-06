const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Gunakan tag: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-700 dark:text-zinc-300">{"{nama}"}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-700 dark:text-zinc-300">{"{kes}"}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-700 dark:text-zinc-300">{"{baki}"}</code>.
                    </p>
                  </div>`;

const replaceStr = `                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Gunakan tag: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-700 dark:text-zinc-300">{"{nama}"}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-700 dark:text-zinc-300">{"{kes}"}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-700 dark:text-zinc-300">{"{baki}"}</code>.
                    </p>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={whatsappIncludeLink}
                        onChange={(e) => setWhatsappIncludeLink(e.target.checked)}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 dark:bg-zinc-900"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Sertakan Pautan Penyata PDF (jika ada)</span>
                    </label>
                  </div>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
