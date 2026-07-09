const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                                          <p className="flex justify-between items-center"><span className="text-zinc-500">Dikemaskini</span> <span className="text-zinc-900 dark:text-zinc-100">{formatDateDMY(record.tarikh)}</span></p>
                                        </div>
                                      </div>`;

const replacement = `                                          <p className="flex justify-between items-center"><span className="text-zinc-500">Dikemaskini</span> <span className="text-zinc-900 dark:text-zinc-100">{formatDateDMY(record.tarikh)}</span></p>
                                          {record.nota && (
                                            <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800">
                                              <p className="text-zinc-500 mb-1">Nota / Ringkasan</p>
                                              <p className="text-zinc-900 dark:text-zinc-100 whitespace-pre-line">{record.nota}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
