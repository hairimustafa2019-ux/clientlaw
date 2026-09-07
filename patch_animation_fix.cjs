const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldBlock = `                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <div key={record.id} className="p-3 sm:p-4 hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800/50 cursor-pointer transition-colors relative" onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}>`;

const newBlock = `                  <AnimatePresence mode="popLayout">
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

code = code.replace(oldBlock, newBlock);

const oldEnd = `                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-[#ffffff] dark:bg-zinc-900 shadow-sm text-[#a1a1aa] dark:text-[#71717a] dark:text-[#a1a1aa] font-medium">
                      Tiada rekod dijumpai.
                    </div>
                  )}`;

const newEnd = `                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="text-center py-10 bg-[#ffffff] dark:bg-zinc-900 shadow-sm text-[#a1a1aa] dark:text-[#71717a] dark:text-[#a1a1aa] font-medium"
                    >
                      Tiada rekod dijumpai.
                    </motion.div>
                  )}
                  </AnimatePresence>`;

code = code.replace(oldEnd, newEnd);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Fixed animation patch.");
