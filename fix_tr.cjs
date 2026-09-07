const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target1 = `                                </div>
                              </td>
                            </motion.tr>
                            <AnimatePresence>
                              {expandedRowId === record.id && (
                                <motion.tr`;

const replace1 = `                                </div>
                              </td>
                            </tr>
                            <AnimatePresence>
                              {expandedRowId === record.id && (
                                <motion.tr`;

code = code.replace(target1, replace1);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Fixed motion.tr");
