const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `      {/* Invoice / Quotation Modal & Print Layout */}`;
const replaceStr = `
      {/* Edit Payment Modal */}
      <AnimatePresence>
        {editingPaymentDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#18181b]/20 dark:bg-[#000000]/60 backdrop-blur-sm"
              onClick={() => setEditingPaymentDetails(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#ffffff] dark:bg-[#18181b] rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-[#e4e4e7] dark:border-zinc-800"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#f4f4f5] dark:border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                    <Edit size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#18181b] dark:text-white">Kemaskini Bayaran</h2>
                    <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] font-medium">{editingPaymentDetails.record.nama}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingPaymentDetails(null)}
                  className="p-2 text-[#a1a1aa] hover:text-[#18181b] dark:hover:text-white transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    
                    const newAmount = parseFloat(editingPaymentAmount) || 0;
                    const newMileage = parseFloat(editingPaymentMileage) || 0;
                    
                    const record = editingPaymentDetails.record;
                    const oldPayment = editingPaymentDetails.payment;
                    
                    const oldAmount = oldPayment.amount || 0;
                    const oldMileage = oldPayment.mileageAmount || 0;
                    
                    // Revert old payment, then apply new payment
                    const tempFeeBalance = record.bakiFeeTerkini + oldAmount;
                    const tempMileageBalance = (record.bakiMileage || 0) + oldMileage;
                    
                    if (newAmount > tempFeeBalance) {
                       alert("Jumlah bayaran Fee melebihi baki terkini.");
                       return;
                    }
                    if (newMileage > tempMileageBalance) {
                       alert("Jumlah bayaran Mileage melebihi baki terkini.");
                       return;
                    }
                    
                    const updatedPayment = {
                      ...oldPayment,
                      amount: newAmount,
                      mileageAmount: newMileage,
                      date: formatDateDMY(editingPaymentDate),
                      method: editingPaymentMethod,
                      nota: editingPaymentNote
                    };
                    
                    const newHistory = record.paymentHistory.map((p: any) => p.id === oldPayment.id ? updatedPayment : p);
                    
                    const updatedRecord = {
                      ...record,
                      paymentHistory: newHistory,
                      bakiFeeTerkini: tempFeeBalance - newAmount,
                      bakiMileage: tempMileageBalance - newMileage,
                      bayaranTerakhir: newHistory.length > 0 ? newHistory[0].amount : 0
                    };
                    
                    setRecords((prev: any) => prev.map((r: any) => r.id === record.id ? updatedRecord : r));
                    
                    if (user) {
                      try {
                        await setDoc(doc(db, 'users', user.uid, 'records', record.id), updatedRecord);
                      } catch(err) {
                        console.error("Gagal update bayaran:", err);
                      }
                    }
                    
                    setEditingPaymentDetails(null);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">
                      Jumlah Bayaran (Fee) - RM
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-3 pr-4 py-2.5 w-full border border-[#e4e4e7] dark:border-zinc-800 rounded-lg font-mono focus:ring-amber-500/20 focus:border-amber-500 text-lg bg-[#ffffff] dark:bg-zinc-950 text-[#18181b] dark:text-white"
                      value={editingPaymentAmount}
                      onChange={(e) => setEditingPaymentAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">
                      Jumlah Bayaran (Mileage) - RM
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-3 pr-4 py-2.5 w-full border border-[#e4e4e7] dark:border-zinc-800 rounded-lg font-mono focus:ring-amber-500/20 focus:border-amber-500 text-lg bg-[#ffffff] dark:bg-zinc-950 text-[#18181b] dark:text-white"
                      value={editingPaymentMileage}
                      onChange={(e) => setEditingPaymentMileage(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">Tarikh</label>
                    <input
                      type="date"
                      required
                      className="pl-3 pr-4 py-2.5 w-full border border-[#e4e4e7] dark:border-zinc-800 rounded-lg bg-[#ffffff] dark:bg-zinc-950 text-[#18181b] dark:text-white focus:ring-amber-500/20 focus:border-amber-500"
                      value={editingPaymentDate}
                      onChange={(e) => setEditingPaymentDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">Kaedah</label>
                    <select
                      required
                      className="pl-3 pr-4 py-2.5 w-full border border-[#e4e4e7] dark:border-zinc-800 rounded-lg bg-[#ffffff] dark:bg-zinc-950 text-[#18181b] dark:text-white focus:ring-amber-500/20 focus:border-amber-500"
                      value={editingPaymentMethod}
                      onChange={(e) => setEditingPaymentMethod(e.target.value)}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Transfer">Transfer</option>
                      <option value="QR">QR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] mb-2 uppercase tracking-wider">Nota</label>
                    <input
                      type="text"
                      className="pl-3 pr-4 py-2.5 w-full border border-[#e4e4e7] dark:border-zinc-800 rounded-lg bg-[#ffffff] dark:bg-zinc-950 text-[#18181b] dark:text-white focus:ring-amber-500/20 focus:border-amber-500"
                      value={editingPaymentNote}
                      onChange={(e) => setEditingPaymentNote(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-6 mt-6">
                    <button 
                      type="button" 
                      onClick={() => setEditingPaymentDetails(null)}
                      className="px-5 py-2.5 text-sm text-[#52525b] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                    >Batal</button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium flex items-center gap-2"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice / Quotation Modal & Print Layout */}`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/App.tsx', code, 'utf-8');
  console.log('Edit payment modal added');
} else {
  console.log('Target string not found');
}
