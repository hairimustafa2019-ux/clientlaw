const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                                <button 
                                  onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                                  className="text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm whitespace-nowrap flex items-center gap-1.5"
                                  title="Urus Rekod"
                                >
                                  {expandedRowId === record.id ? 'Tutup' : 'Urus'}
                                </button>`;

const replacement = `                                <button 
                                  onClick={() => setEditingRecord(record)}
                                  className="text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 p-1.5 rounded-lg transition-colors"
                                  title="Kemaskini Maklumat"
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                                  className="text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm whitespace-nowrap flex items-center gap-1.5"
                                  title="Urus Rekod"
                                >
                                  {expandedRowId === record.id ? 'Tutup' : 'Urus'}
                                </button>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Edit button added!");
} else {
  console.log("Target not found");
}
