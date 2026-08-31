const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const search = `            <span>Penyata Ringkas</span>
          </button>`;

const replace = `            <span>Penyata Ringkas</span>
          </button>
          <button 
            onClick={() => { setInvoiceType('INVOIS'); setInvoiceRecord(record); }}
            className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-sm border border-emerald-200 dark:border-emerald-800/50"
            title="Cetak Invois / Sebut Harga"
          >
            <FileText size={12} />
            <span>Invois</span>
          </button>`;

if (code.includes(search)) {
  code = code.replace(search, replace);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched button");
}
