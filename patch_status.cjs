const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<td className={\`px-3 sm:px-4 py-3 font-mono font-bold border-r border-zinc-100 dark:border-zinc-800/50 text-right \${record.bakiFeeTerkini > 2000 ? 'text-red-600 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-200'}\`}>
                              {formatRM(record.bakiFeeTerkini)}
                            </td>`;

const replacement = `<td className="px-3 sm:px-4 py-3 border-r border-zinc-100 dark:border-zinc-800/50">
                              <div className="flex items-center justify-end gap-2 font-mono font-bold">
                                {record.bakiFeeTerkini <= 0 ? (
                                  <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 font-sans">Selesai</span>
                                ) : (
                                  <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 font-sans">Belum</span>
                                )}
                                <span className={record.bakiFeeTerkini > 2000 ? 'text-red-600 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-200'}>
                                  {formatRM(record.bakiFeeTerkini)}
                                </span>
                              </div>
                            </td>`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Status label added successfully");
} else {
    console.log("Target not found");
}
