const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const errorBlock1 = `            </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'standalone' && (`

code = code.replace(errorBlock1, `            </div>
              </motion.div>
            )}
            
            {activeTab === 'standalone' && (`);

const errorBlock2 = `                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  ) : (`;
code = code.replace(errorBlock2, `                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  ) : (`);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Fixed extra div tags.");
