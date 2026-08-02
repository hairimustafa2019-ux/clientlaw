const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add "Penyata Penuh" button in the expanded view
const expandedActionsOld = `          <button 
            onClick={() => setSimpleStatementRecord(record)}
            className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-sm border border-zinc-200 dark:border-zinc-700"
            title="Cetak Penyata Ringkas"
          >
            <Printer size={12} />
            <span>Penyata Ringkas</span>
          </button>
          {record.bakiFeeTerkini > 0 && (`;

const expandedActionsNew = `          <button 
            onClick={() => setStatementRecord(record)}
            className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-sm border border-zinc-200 dark:border-zinc-700"
            title="Cetak Penyata Akaun Penuh"
          >
            <Printer size={12} />
            <span>Penyata Penuh</span>
          </button>
          <button 
            onClick={() => setSimpleStatementRecord(record)}
            className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-sm border border-zinc-200 dark:border-zinc-700"
            title="Cetak Penyata Ringkas"
          >
            <Printer size={12} />
            <span>Penyata Ringkas</span>
          </button>
          {record.bakiFeeTerkini > 0 && (`;

code = code.replace(expandedActionsOld, expandedActionsNew);

// 2. Add "Penyata Penuh" title in the modal
const modalTitleOld = ` <h2 className="text-2xl font-bold tracking-tight uppercase mb-1">Penyata Akaun</h2>`;
const modalTitleNew = ` <h2 className="text-2xl font-bold tracking-tight uppercase mb-1">Penyata Akaun Penuh</h2>`;
code = code.replace(modalTitleOld, modalTitleNew);

// 3. Change Pratinjau Penyata to Pratinjau Penyata Penuh
const pratinjauOld = `                  <Printer size={18} className="text-zinc-600 dark:text-zinc-400" />
                  Pratinjau Penyata
                </h3>`;
const pratinjauNew = `                  <Printer size={18} className="text-zinc-600 dark:text-zinc-400" />
                  Pratinjau Penyata Penuh
                </h3>`;
code = code.replace(pratinjauOld, pratinjauNew);


fs.writeFileSync('src/App.tsx', code);
