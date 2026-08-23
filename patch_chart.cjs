const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm p-6 overflow-hidden flex flex-col">
                   <div className="flex justify-between items-center mb-6">
                     <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight flex items-center gap-2">
                       <Zap size={16} className="text-blue-500" />
                       Tindakan Pantas
                     </h3>`;

const replaceStr = `                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm p-6 overflow-hidden">
                   <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight flex items-center gap-2 mb-6">
                     <PieChart size={16} className="text-blue-500" />
                     Baki Fee Mengikut Kes
                   </h3>
                   <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                         <XAxis 
                           dataKey="name" 
                           axisLine={false}
                           tickLine={false}
                           tick={{ fontSize: 10, fill: '#71717a' }}
                           dy={10}
                           interval={0}
                           angle={-45}
                           textAnchor="end"
                         />
                         <YAxis 
                           axisLine={false}
                           tickLine={false}
                           tick={{ fontSize: 10, fill: '#71717a' }}
                           tickFormatter={(value) => \`RM\${value}\`}
                         />
                         <Tooltip 
                           cursor={{ fill: '#f4f4f5' }}
                           contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                           formatter={(value: number) => [\`RM \${value}\`, 'Baki Fee']}
                         />
                         <Bar dataKey="baki" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm p-6 overflow-hidden flex flex-col lg:col-span-2">
                   <div className="flex justify-between items-center mb-6">
                     <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight flex items-center gap-2">
                       <Zap size={16} className="text-blue-500" />
                       Tindakan Pantas
                     </h3>`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/App.tsx', code);
