const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetButton = `                                        <button 
                                          className="w-full px-4 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-amber-600 dark:text-amber-500 font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                                          onClick={() => setEditingRecord({...record})}
                                        >
                                          <Edit size={14} />
                                          Edit Rekod
                                        </button>`;

const replacementButton = `                                        <button 
                                          className="w-full px-4 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-teal-600 dark:text-teal-500 font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                                          onClick={() => {
                                            setMileageAdjustmentRecord({...record});
                                            setMileageAdjustmentAmount('');
                                            setMileageAdjustmentType('tambah');
                                          }}
                                        >
                                          <Car size={14} />
                                          Pelarasan Mileage
                                        </button>
                                        <button 
                                          className="w-full px-4 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-amber-600 dark:text-amber-500 font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                                          onClick={() => setEditingRecord({...record})}
                                        >
                                          <Edit size={14} />
                                          Edit Rekod
                                        </button>`;

if (content.includes(targetButton)) {
    content = content.replace(targetButton, replacementButton);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Button patched");
} else {
    console.log("Button target not found");
}

const targetModal = `        {paymentRecord && (`;
const replacementModal = `        {mileageAdjustmentRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Car size={18} className="text-teal-500" />
                  Pelarasan Mileage
                </h3>
                <button onClick={() => setMileageAdjustmentRecord(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-5 p-4 rounded-lg bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Baki Semasa (Mileage):</span>
                    <span className="font-mono font-bold text-teal-700 dark:text-teal-400">{formatRM(mileageAdjustmentRecord.bakiMileage || 0)}</span>
                  </div>
                </div>
                
                <form onSubmit={handleMileageAdjustmentSubmit} className="space-y-5">
                  <div className="flex rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                    <button 
                      type="button" 
                      onClick={() => setMileageAdjustmentType('tambah')}
                      className={\`flex-1 py-2.5 text-sm font-medium transition-colors \${mileageAdjustmentType === 'tambah' ? 'bg-teal-500 text-white' : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}\`}
                    >
                      Tambah (+)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setMileageAdjustmentType('tolak')}
                      className={\`flex-1 py-2.5 text-sm font-medium transition-colors border-l border-zinc-200 dark:border-zinc-800 \${mileageAdjustmentType === 'tolak' ? 'bg-teal-500 text-white border-transparent' : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}\`}
                    >
                      Tolak (-)
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                      Jumlah Pelarasan (RM)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-zinc-500 dark:text-zinc-400 font-mono text-sm">RM</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        className="pl-10 pr-4 py-2.5 w-full border border-zinc-200 dark:border-zinc-800 focus:ring-teal-500/20 focus:border-teal-500 rounded-lg font-mono text-lg focus:outline-none focus:ring-2 transition-all font-medium text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950"
                        placeholder="0.00"
                        value={mileageAdjustmentAmount}
                        onChange={(e) => setMileageAdjustmentAmount(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setMileageAdjustmentRecord(null)}
                      className="px-5 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors cursor-pointer shadow-sm"
                    >
                      Simpan
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {paymentRecord && (`;

if (content.includes(targetModal)) {
    content = content.replace(targetModal, replacementModal);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Modal patched");
} else {
    console.log("Modal target not found");
}
