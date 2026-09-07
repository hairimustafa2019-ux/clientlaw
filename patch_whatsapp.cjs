const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetContent = `<td className="px-4 py-3 text-center">
                                   {r.telefon ? (
                                      <a 
                                        href={\`https://wa.me/\${r.telefon.replace(/[^0-9]/g, '')}?text=\${encodeURIComponent(whatsappTemplate.replace(/\\{nama\\}/g, r.nama || '').replace(/\\{kes\\}/g, r.kes || '').replace(/\\{baki\\}/g, formatRM(r.bakiFeeTerkini)) + (whatsappIncludeLink && r.statementUrl ? '\\n\\nPautan Penyata: ' + r.statementUrl : ''))}\`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center p-1.5 text-[#059669] bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                                        title="Hantar Peringatan WhatsApp"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                                      </a>
                                   ) : '-'}
                                 </td>`;

const replacementContent = `<td className="px-4 py-3 text-center">
                                   {r.telefon ? (
                                      <a 
                                        href={\`https://wa.me/\${r.telefon.replace(/[^0-9]/g, '')}?text=\${encodeURIComponent(whatsappTemplate.replace(/\\{nama\\}/g, r.nama || '').replace(/\\{kes\\}/g, r.kes || '').replace(/\\{baki\\}/g, formatRM(r.bakiFeeTerkini)) + (whatsappIncludeLink && r.statementUrl ? '\\n\\nPautan Penyata: ' + r.statementUrl : ''))}\`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-500/20 shadow-sm"
                                        title="Hantar Peringatan WhatsApp"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                                        WhatsApp
                                      </a>
                                   ) : <span className="text-[10px] text-[#a1a1aa]">Tiada No. Tel</span>}
                                 </td>`;

const newCode = code.replace(targetContent, replacementContent);
if (newCode === code) {
  console.log("No changes made!");
} else {
  fs.writeFileSync('src/App.tsx', newCode, 'utf-8');
  console.log("Patched WhatsApp button!");
}
