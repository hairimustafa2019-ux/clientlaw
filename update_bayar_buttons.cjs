const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Desktop Edit
const desktopSearch = 
`                                <span className={record.bakiFeeTerkini > 2000 ? 'text-red-600 dark:text-red-400' : 'text-[#27272a] dark:text-[#e4e4e7]'}>
                                  {formatRM(record.bakiFeeTerkini)}
                                </span>
                              </div>
                            </td>`;

const desktopReplace = 
`                                <span className={record.bakiFeeTerkini > 2000 ? 'text-red-600 dark:text-red-400' : 'text-[#27272a] dark:text-[#e4e4e7]'}>
                                  {formatRM(record.bakiFeeTerkini)}
                                </span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setPaymentRecord(record); }}
                                  className="ml-1 text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide cursor-pointer flex items-center shrink-0 font-sans transition-colors"
                                  title="Tambah Bayaran"
                                >
                                  Bayar
                                </button>
                              </div>
                            </td>`;

code = code.replace(desktopSearch, desktopReplace);

// Mobile Edit
const mobileSearch = 
`                               <span className={\`font-bold text-[13px] sm:text-sm shrink-0 leading-tight \${record.bakiFeeTerkini > 2000 ? 'text-red-600 dark:text-red-400' : 'text-[#27272a] dark:text-[#e4e4e7]'}\`}>
                                 {formatRM(record.bakiFeeTerkini)}
                               </span>
                             </div>
                             
                             <div className="flex justify-between items-center mt-1">`;

const mobileReplace = 
`                               <div className="flex items-center gap-1.5 shrink-0">
                                 <span className={\`font-bold text-[13px] sm:text-sm leading-tight \${record.bakiFeeTerkini > 2000 ? 'text-red-600 dark:text-red-400' : 'text-[#27272a] dark:text-[#e4e4e7]'}\`}>
                                   {formatRM(record.bakiFeeTerkini)}
                                 </span>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setPaymentRecord(record); }}
                                   className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase cursor-pointer flex items-center font-sans shadow-sm transition-colors"
                                   title="Tambah Bayaran"
                                 >
                                   Bayar
                                 </button>
                               </div>
                             </div>
                             
                             <div className="flex justify-between items-center mt-1">`;

code = code.replace(mobileSearch, mobileReplace);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Added inline Bayar buttons');
