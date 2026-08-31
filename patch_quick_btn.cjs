const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const search = `                    <button 
                      title="Papar/Cetak Resit"
                      onClick={() => setReceiptData({record, payment})}
                      className="p-1 text-blue-500 hover:text-blue-700 transition-colors rounded hover:bg-blue-50"
                    >
                      <FileText size={14} />
                    </button>`;

const replace = `                    <button 
                      title="Papar Resit"
                      onClick={() => setReceiptData({record, payment})}
                      className="p-1 text-blue-500 hover:text-blue-700 transition-colors rounded hover:bg-blue-50"
                    >
                      <FileText size={14} />
                    </button>
                    <button 
                      title="Cetak Pantas (Muat Turun PDF)"
                      onClick={() => {
                        setQuickPrintData({record, payment});
                        setQuickPrintId(payment.id);
                        setIsGeneratingQuickPrint(true);
                      }}
                      disabled={quickPrintId === payment.id}
                      className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors rounded hover:bg-emerald-50 disabled:opacity-50"
                    >
                      {quickPrintId === payment.id ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                    </button>`;

if (code.includes(search)) {
  code = code.replace(search, replace);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched quick btn");
} else {
  console.log("Not found");
}
