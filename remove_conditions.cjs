const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Remove condition around (Bayar) link
code = code.replace(
`            {record.bakiFeeTerkini > 0 && (
              <button 
                onClick={() => setPaymentRecord(record)}
                className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline flex items-center cursor-pointer"
                title="Buat Bayaran"
              >
                (Bayar)
              </button>
            )}`,
`              <button 
                onClick={() => setPaymentRecord(record)}
                className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline flex items-center cursor-pointer"
                title="Buat Bayaran"
              >
                (Bayar)
              </button>`
);

// 2. Remove condition around + Bayaran button in Modal header
code = code.replace(
`          {record.bakiFeeTerkini > 0 && (
            <button 
              onClick={() => setPaymentRecord(record)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 shadow-sm hover:shadow-md hover:-translate-y-0.5 animate-subtle-pulse"
              title="Tambah Bayaran"
            >
              <Plus size={12} />
              <span>+ Bayaran</span>
            </button>
          )}`,
`            <button 
              onClick={() => setPaymentRecord(record)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 shadow-sm hover:shadow-md hover:-translate-y-0.5 animate-subtle-pulse"
              title="Tambah Bayaran"
            >
              <Plus size={12} />
              <span>+ Bayaran</span>
            </button>`
);

// 3. Remove condition around + Bayaran button in Table Row
code = code.replace(
`                                {record.bakiFeeTerkini > 0 && (
                                  <button 
                                    onClick={() => setPaymentRecord(record)}
                                    className="text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 px-2 py-1.5 rounded-lg text-xs font-medium transition-all border border-blue-200 dark:border-blue-800/50 flex items-center gap-1 shrink-0 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 animate-subtle-pulse"
                                    title="Tambah Bayaran"
                                  >
                                    <Plus size={13} className="text-blue-600 dark:text-blue-400" />
                                    <span>+ Bayaran</span>
                                  </button>
                                )}`,
`                                  <button 
                                    onClick={() => setPaymentRecord(record)}
                                    className="text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 px-2 py-1.5 rounded-lg text-xs font-medium transition-all border border-blue-200 dark:border-blue-800/50 flex items-center gap-1 shrink-0 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 animate-subtle-pulse"
                                    title="Tambah Bayaran"
                                  >
                                    <Plus size={13} className="text-blue-600 dark:text-blue-400" />
                                    <span>+ Bayaran</span>
                                  </button>`
);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Removed conditional rendering for payment buttons');
