const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetMobileList = `<div className="md:hidden bg-[#ffffff] dark:bg-zinc-900 border border-[#e4e4e7]  rounded-xl shadow-sm overflow-hidden mb-4 divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <div key={record.id} className="p-3 sm:p-4 hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 cursor-pointer transition-colors relative" onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}>`;

const replacementMobileList = `<div className="md:hidden bg-[#ffffff] dark:bg-zinc-900 border border-[#e4e4e7]  rounded-xl shadow-sm overflow-hidden mb-4 divide-y divide-zinc-200 dark:divide-zinc-800">
                  <AnimatePresence mode="popLayout">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, layout: { type: "spring", bounce: 0.2, duration: 0.4 } }}
                        key={record.id} 
                        className="p-3 sm:p-4 hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 cursor-pointer transition-colors relative" 
                        onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                      >`;

code = code.replace(targetMobileList, replacementMobileList);

const targetMobileListEnd = `</div>
                              {expandedRowId === record.id && (
                                <div className="mt-3 pt-3 border-t border-[#f4f4f5] ">
                                  {renderExpandedDetails(record)}
                                </div>
                              )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-[#71717a] dark:text-[#a1a1aa] text-sm">
                      Tiada rekod dijumpai.
                    </div>
                  )}`;

const replacementMobileListEnd = `</div>
                              {expandedRowId === record.id && (
                                <div className="mt-3 pt-3 border-t border-[#f4f4f5] ">
                                  {renderExpandedDetails(record)}
                                </div>
                              )}
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="p-8 text-center text-[#71717a] dark:text-[#a1a1aa] text-sm"
                    >
                      Tiada rekod dijumpai.
                    </motion.div>
                  )}
                  </AnimatePresence>`;

code = code.replace(targetMobileListEnd, replacementMobileListEnd);

const targetTr = `<motion.tr 
                              layout="position"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                              className={\`border-b border-[#f4f4f5] /50 hover:bg-[#fafafa] dark:hover:bg-zinc-900 cursor-pointer transition-colors \${isOverdue ? 'bg-red-50/30 dark:bg-red-900/10 border-l-2 border-l-red-500' : (record.bakiFeeTerkini > 0 && index % 2 === 0 ? 'bg-[#fafafa]/50 dark:bg-zinc-900/30' : '')} \${record.bakiFeeTerkini > 2000 && !isOverdue ? 'bg-amber-50/10 dark:bg-amber-900/10' : ''} \${expandedRowId === record.id ? 'bg-zinc-100/50 darkdark:bg-zinc-800/30' : ''}\`}
                            >`;

const replacementTr = `<motion.tr 
                              layout
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2, layout: { type: "spring", bounce: 0.2, duration: 0.4 } }}
                              onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                              className={\`border-b border-[#f4f4f5] /50 hover:bg-[#fafafa] dark:hover:bg-zinc-900 cursor-pointer transition-colors \${isOverdue ? 'bg-red-50/30 dark:bg-red-900/10 border-l-2 border-l-red-500' : (record.bakiFeeTerkini > 0 && index % 2 === 0 ? 'bg-[#fafafa]/50 dark:bg-zinc-900/30' : '')} \${record.bakiFeeTerkini > 2000 && !isOverdue ? 'bg-amber-50/10 dark:bg-amber-900/10' : ''} \${expandedRowId === record.id ? 'bg-zinc-100/50 darkdark:bg-zinc-800/30' : ''}\`}
                            >`;

code = code.replace(targetTr, replacementTr);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Patched animations.");
