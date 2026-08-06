const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                                   {r.telefon ? (
                                      <a 
                                        href={\`https://wa.me/\${r.telefon.replace(/[^0-9]/g, '')}?text=\${encodeURIComponent(whatsappTemplate.replace(/\\{nama\\}/g, r.nama || '').replace(/\\{kes\\}/g, r.kes || '').replace(/\\{baki\\}/g, formatRM(r.bakiFeeTerkini)))}\`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                                        title="Hantar Peringatan WhatsApp"
                                      >`;

const replaceStr = `                                   {r.telefon ? (
                                      <a 
                                        href={\`https://wa.me/\${r.telefon.replace(/[^0-9]/g, '')}?text=\${encodeURIComponent(whatsappTemplate.replace(/\\{nama\\}/g, r.nama || '').replace(/\\{kes\\}/g, r.kes || '').replace(/\\{baki\\}/g, formatRM(r.bakiFeeTerkini)) + (whatsappIncludeLink && r.statementUrl ? '\\n\\nPautan Penyata: ' + r.statementUrl : ''))}\`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                                        title="Hantar Peringatan WhatsApp"
                                      >`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
