const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                        Baki Mileage (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg font-mono text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100"
                        value={editingRecord.bakiMileage}
                        onChange={(e) => setEditingRecord({ ...editingRecord, bakiMileage: parseFloat(e.target.value) || 0 })}
                      />
                    </div>`;

const replacement = `                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                        Baki Mileage (RM)
                      </label>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button" 
                          onClick={() => setEditingRecord({...editingRecord, bakiMileage: Math.max(0, (editingRecord.bakiMileage || 0) - 50)})}
                          className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          title="Tolak RM50"
                        >
                          -50
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg font-mono text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100 text-center"
                          value={editingRecord.bakiMileage}
                          onChange={(e) => setEditingRecord({ ...editingRecord, bakiMileage: parseFloat(e.target.value) || 0 })}
                        />
                        <button 
                          type="button" 
                          onClick={() => setEditingRecord({...editingRecord, bakiMileage: (editingRecord.bakiMileage || 0) + 50})}
                          className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          title="Tambah RM50"
                        >
                          +50
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1.5">Gunakan butang untuk tambah/tolak, atau taip jumlah terus.</p>
                    </div>`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Patched successfully");
} else {
    console.log("Target not found");
}
