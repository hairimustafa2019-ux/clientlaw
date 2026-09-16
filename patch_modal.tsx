      <AnimatePresence>
        {editingPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-2xl border border-[#e4e4e7] dark:border-zinc-800 w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#f4f4f5] dark:border-zinc-800 bg-[#fafafa]/50 dark:bg-zinc-900/50">
                <h3 className="font-semibold text-[#18181b] dark:text-white flex items-center gap-2">
                  <Edit size={18} className="text-[#52525b] dark:text-zinc-400" />
                  Kemaskini Pembayaran
                </h3>
                <button onClick={() => setEditingPayment(null)} className="text-[#a1a1aa] hover:text-[#52525b] dark:hover:text-zinc-300 transition-colors cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleUpdateEditedPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#71717a] dark:text-zinc-400 uppercase tracking-wider mb-2">Tarikh (DD/MM/YYYY)</label>
                    <input 
                      type="text"
                      value={editingPayment.payment.date}
                      onChange={(e) => setEditingPayment({...editingPayment, payment: {...editingPayment.payment, date: e.target.value}})}
                      className="w-full px-4 py-2.5 bg-[#ffffff] dark:bg-zinc-950 border border-[#e4e4e7] dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-[#18181b] dark:text-white"
                      placeholder="Contoh: 15/08/2026"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#71717a] dark:text-zinc-400 uppercase tracking-wider mb-2">Jumlah Fee (RM)</label>
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingPayment.payment.amount || ''}
                        onChange={(e) => setEditingPayment({...editingPayment, payment: {...editingPayment.payment, amount: parseFloat(e.target.value) || 0}})}
                        className="w-full px-4 py-2.5 bg-[#ffffff] dark:bg-zinc-950 border border-[#e4e4e7] dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-[#18181b] dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#71717a] dark:text-zinc-400 uppercase tracking-wider mb-2">Jumlah Mileage (RM)</label>
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingPayment.payment.mileageAmount || ''}
                        onChange={(e) => setEditingPayment({...editingPayment, payment: {...editingPayment.payment, mileageAmount: parseFloat(e.target.value) || 0}})}
                        className="w-full px-4 py-2.5 bg-[#ffffff] dark:bg-zinc-950 border border-[#e4e4e7] dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-[#18181b] dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#71717a] dark:text-zinc-400 uppercase tracking-wider mb-2">Kaedah Bayaran</label>
                    <select 
                      value={editingPayment.payment.method}
                      onChange={(e) => setEditingPayment({...editingPayment, payment: {...editingPayment.payment, method: e.target.value}})}
                      className="w-full px-4 py-2.5 bg-[#ffffff] dark:bg-zinc-950 border border-[#e4e4e7] dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-[#18181b] dark:text-white"
                    >
                      <option value="Tunai">Tunai</option>
                      <option value="Transfer">Pindahan Bank (Transfer)</option>
                      <option value="Cek">Cek</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#71717a] dark:text-zinc-400 uppercase tracking-wider mb-2">Nota Tambahan</label>
                    <input 
                      type="text"
                      value={editingPayment.payment.nota || ''}
                      onChange={(e) => setEditingPayment({...editingPayment, payment: {...editingPayment.payment, nota: e.target.value}})}
                      className="w-full px-4 py-2.5 bg-[#ffffff] dark:bg-zinc-950 border border-[#e4e4e7] dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-[#18181b] dark:text-white"
                      placeholder="Catatan..."
                    />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setEditingPayment(null)}
                      className="px-5 py-2.5 text-sm border border-[#e4e4e7] dark:border-zinc-800 rounded-lg hover:bg-[#fafafa] dark:hover:bg-zinc-800 text-[#52525b] dark:text-zinc-300 font-medium transition-all flex-1"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all flex-1 shadow-sm"
                    >
                      Simpan
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
