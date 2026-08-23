const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                        {(() => {
                           const overdueRecords = records
                             .filter(r => r.bakiFeeTerkini > 0)
                             .sort((a, b) => b.bakiFeeTerkini - a.bakiFeeTerkini);`;

const replaceStr = `                        {(() => {
                           const now = new Date().getTime();
                           const overdueMs = overdueDays * 24 * 60 * 60 * 1000;
                           const overdueRecords = records
                             .filter(r => {
                               if (r.bakiFeeTerkini <= 0) return false;
                               let lastDateStr = r.tarikh;
                               if (r.paymentHistory && r.paymentHistory.length > 0) {
                                 const sortedHistory = [...r.paymentHistory].sort((a: any, b: any) => parseDateObj(b.date).getTime() - parseDateObj(a.date).getTime());
                                 lastDateStr = sortedHistory[0].date;
                               }
                               const lastDate = parseDateObj(lastDateStr).getTime();
                               return (now - lastDate) >= overdueMs;
                             })
                             .sort((a, b) => b.bakiFeeTerkini - a.bakiFeeTerkini);`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
