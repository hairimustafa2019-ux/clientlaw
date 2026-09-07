const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target1 = `                  <button className="px-3 py-1.5 border border-[#e4e4e7]  rounded-lg bg-[#ffffff] dark:bg-zinc-900 hover:bg-[#fafafa] dark:hoverdark:bg-zinc-800 disabled:opacity-50 transition-colors" disabled>Seterusnya</button>
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
            </div>
              </motion.div>
            )}`;

code = code.replace(target1, replace1);
fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Fixed missing divs.");
