const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target1 = `                  </thead>
                  <tbody className="text-[13px]">
                    <AnimatePresence mode="popLayout">
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((record, index) => {`;

const replace1 = `                  </thead>
                  <AnimatePresence mode="popLayout">
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((record, index) => {`;

code = code.replace(target1, replace1);

const target2 = `                          return (
                          <React.Fragment key={record.id}>
                            <motion.tr 
                              layout
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2, layout: { type: "spring", bounce: 0.2, duration: 0.4 } }}
                              onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                              className={\`border-b border-[#f4f4f5] /50 hover:bg-[#fafafa] dark:hover:bg-zinc-900 cursor-pointer transition-colors \${isOverdue ? 'bg-red-50/30 dark:bg-red-900/10 border-l-2 border-l-red-500' : (record.bakiFeeTerkini > 0 && index % 2 === 0 ? 'bg-[#fafafa]/50 dark:bg-zinc-900/30' : '')} \${record.bakiFeeTerkini > 2000 && !isOverdue ? 'bg-amber-50/10 dark:bg-amber-900/10' : ''} \${expandedRowId === record.id ? 'bg-zinc-100/50 darkdark:bg-zinc-800/30' : ''}\`}
                            >`;

const replace2 = `                          return (
                          <motion.tbody 
                            key={record.id} 
                            className="text-[13px]"
                            layout
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, layout: { type: "spring", bounce: 0.2, duration: 0.4 } }}
                          >
                            <tr 
                              onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                              className={\`border-b border-[#f4f4f5] /50 hover:bg-[#fafafa] dark:hover:bg-zinc-900 cursor-pointer transition-colors \${isOverdue ? 'bg-red-50/30 dark:bg-red-900/10 border-l-2 border-l-red-500' : (record.bakiFeeTerkini > 0 && index % 2 === 0 ? 'bg-[#fafafa]/50 dark:bg-zinc-900/30' : '')} \${record.bakiFeeTerkini > 2000 && !isOverdue ? 'bg-amber-50/10 dark:bg-amber-900/10' : ''} \${expandedRowId === record.id ? 'bg-zinc-100/50 darkdark:bg-zinc-800/30' : ''}\`}
                            >`;

code = code.replace(target2, replace2);

const target3 = `                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      );
                      })
                    ) : (
                      <motion.tr 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={10} className="px-4 py-8 text-center text-[#a1a1aa] dark:text-[#71717a] dark:text-[#a1a1aa] font-medium">
                          Tiada rekod dijumpai.
                        </td>
                      </motion.tr>
                    )}
                    </AnimatePresence>
                  </tbody>
                </table>`;

const replace3 = `                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </motion.tbody>
                      );
                      })
                    ) : (
                      <motion.tbody 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="text-[13px]"
                      >
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-[#a1a1aa] dark:text-[#71717a] dark:text-[#a1a1aa] font-medium">
                            Tiada rekod dijumpai.
                          </td>
                        </tr>
                      </motion.tbody>
                    )}
                  </AnimatePresence>
                </table>`;

code = code.replace(target3, replace3);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Replaced React.Fragment with motion.tbody");
