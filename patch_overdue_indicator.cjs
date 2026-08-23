const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                        filteredRecords.map((record, index) => (
                          <React.Fragment key={record.id}>
                            <motion.tr 
                              layout="position"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                              className={\`border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors \${record.bakiFeeTerkini > 0 && index % 2 === 0 ? 'bg-zinc-50/50 dark:bg-zinc-900/30' : ''} \${record.bakiFeeTerkini > 2000 ? 'bg-amber-50/10 dark:bg-amber-900/10' : ''} \${expandedRowId === record.id ? 'bg-zinc-100/50 dark:bg-zinc-800/30' : ''}\`}
                            >`;

const replaceStr = `                        filteredRecords.map((record, index) => {
                          const now = new Date().getTime();
                          const overdueMs = overdueDays * 24 * 60 * 60 * 1000;
                          let lastDateStr = record.tarikh;
                          if (record.paymentHistory && record.paymentHistory.length > 0) {
                            const sortedHistory = [...record.paymentHistory].sort((a: any, b: any) => parseDateObj(b.date).getTime() - parseDateObj(a.date).getTime());
                            lastDateStr = sortedHistory[0].date;
                          }
                          const lastDate = parseDateObj(lastDateStr).getTime();
                          const isOverdue = record.bakiFeeTerkini > 0 && (now - lastDate) >= overdueMs;
                          
                          return (
                          <React.Fragment key={record.id}>
                            <motion.tr 
                              layout="position"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                              className={\`border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors \${isOverdue ? 'bg-red-50/30 dark:bg-red-900/10 border-l-2 border-l-red-500' : (record.bakiFeeTerkini > 0 && index % 2 === 0 ? 'bg-zinc-50/50 dark:bg-zinc-900/30' : '')} \${record.bakiFeeTerkini > 2000 && !isOverdue ? 'bg-amber-50/10 dark:bg-amber-900/10' : ''} \${expandedRowId === record.id ? 'bg-zinc-100/50 dark:bg-zinc-800/30' : ''}\`}
                            >`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
