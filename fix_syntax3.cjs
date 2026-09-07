const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target1 = `                  <button className="px-3 py-1.5 border border-[#e4e4e7]  rounded-lg bg-[#ffffff] dark:bg-zinc-900 hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800 disabled:opacity-50 transition-colors" disabled>Seterusnya</button>
                </div>
              </div>
            </div>
            </div>
            </div>
              </motion.div>
            )}`;

const replace1 = `                  <button className="px-3 py-1.5 border border-[#e4e4e7]  rounded-lg bg-[#ffffff] dark:bg-zinc-900 hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800 disabled:opacity-50 transition-colors" disabled>Seterusnya</button>
                </div>
              </div>
            </div>
                </div>
              </motion.div>
            )}`;

code = code.replace(target1, replace1);

// Now I also need to make sure the opening divs match. Let's see how many there are open for `records`.
// 1. <motion.div key="records" ...>
// 2. <div className="flex-1 px-4 sm:px-6 md:px-8 ...">
// 3. <div className="flex-1 bg-[#ffffff] ... border border-[#f4f4f5] ...">
// 4. Then inside it, there is header, mobile list, desktop table, and the footer pagination.
// So three open tags: motion.div, div, div. The footer is inside the third div.
// Then the third div ends.
// Then the second div ends.
// Then motion.div ends.
// So we need </div></div></motion.div>.
// Wait, my replacement above uses </div></div></motion.div>

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Fixed missing divs 3.");
