const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const search = `      {/* Statement Modal & Print Layout */}`;
const replace = `      {/* Invoice / Quotation Modal & Print Layout */}
      <AnimatePresence>
        {invoiceRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm print:static print:bg-white print:p-0 print:block">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-3xl max-h-screen overflow-hidden flex flex-col print:shadow-none print:border-none print:max-h-none print:w-full print:max-w-none print:overflow-visible print:block"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 print:hidden">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <FileText size={18} className="text-zinc-600 dark:text-zinc-400" />
                  Pratinjau: {invoiceType === 'INVOIS' ? 'Invois (Bil Tuntutan)' : 'Sebut Harga'}
                </h3>
                <button onClick={() => setInvoiceRecord(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 print:hidden shrink-0">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setInvoiceType('INVOIS')}
                    className={\`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors \${invoiceType === 'INVOIS' ? 'bg-blue-600 text-white shadow-sm' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'}\`}
                  >
                    Invois
                  </button>
                  <button
                    onClick={() => setInvoiceType('SEBUT HARGA')}
                    className={\`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors \${invoiceType === 'SEBUT HARGA' ? 'bg-blue-600 text-white shadow-sm' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'}\`}
                  >
                    Sebut Harga
                  </button>
                </div>
                
                <button
                  onClick={handleDownloadInvoicePDF}
                  disabled={isGeneratingInvoicePDF}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isGeneratingInvoicePDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  <span>{isGeneratingInvoicePDF ? 'Menjana PDF...' : 'Muat Turun PDF'}</span>
                </button>
              </div>

              <div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-zinc-100 dark:bg-zinc-950 flex items-start justify-center print:bg-white print:p-0 print:overflow-visible print:block">
                {(() => {
                  const totalFeePayments = invoiceRecord.paymentHistory?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
                  const totalMileagePayments = invoiceRecord.paymentHistory?.reduce((sum, p) => sum + (p.mileageAmount || 0), 0) || 0;
                  const originalFee = invoiceRecord.bakiFeeTerkini + totalFeePayments;
                  const originalMileage = invoiceRecord.bakiMileage !== undefined ? (invoiceRecord.bakiMileage + totalMileagePayments) : 0;
                  const totalAgreed = originalFee + originalMileage;
                  const totalPaid = totalFeePayments + totalMileagePayments;
                  const currentBalance = invoiceRecord.bakiFeeTerkini + (invoiceRecord.bakiMileage || 0);

                  return (
                    <div ref={invoicePrintRef} className="w-[794px] h-[1122px] mx-auto font-sans text-black bg-white flex flex-col p-10 shrink-0 shadow-xl print:shadow-none print:p-0 relative">
                      {/* Header */}
                      <div className="flex items-center pb-6 border-b-2 border-black mb-8 gap-6">
                        <img src="https://arleta.site/interactivelink/2510/logo.png" className="h-[75px] w-auto" alt="Logo" />
                        <div className="flex-1">
                          <h1 className="text-[18px] font-bold uppercase m-0 leading-tight">TETUAN HAIRI MUSTAFA & ASSOCIATES</h1>
                          <p className="text-[11px] font-bold italic m-0 mt-0.5 text-[#222]">PEGUAM SYARIE * PESURUHJAYA SUMPAH</p>
                          <div className="text-[11px] mt-1 leading-[1.3]">
                            <p className="m-0">LOT 02, BANGUNAN ARKED MARA, 09100 BALING, KEDAH</p>
                            <p className="m-0">TEL: 010-2434143 / 011-56531310 | EMAIL: tetuanhairi@gmail.com</p>
                          </div>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <h2 className="text-2xl font-bold tracking-tight uppercase mb-1">{invoiceType === 'INVOIS' ? 'INVOIS' : 'SEBUT HARGA'}</h2>
                          <p className="text-[13px] font-mono mt-1">No: {invoiceType === 'INVOIS' ? 'INV' : 'QT'}-{invoiceRecord.id.substring(0, 6).toUpperCase()}</p>
                          <p className="text-[13px] font-mono">Tarikh: {formatDateDMY(new Date().toISOString().split('T')[0])}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-start mb-8 text-sm">
                        <div>
                          <p className="font-bold uppercase tracking-wider text-black mb-1">Kepada:</p>
                          <p className="font-bold text-[16px] text-black uppercase mb-1">{invoiceRecord.nama}</p>
                          {invoiceRecord.phone && <p className="text-black">No. Tel: {invoiceRecord.phone}</p>}
                          {invoiceRecord.alamat && <p className="text-black max-w-xs">{invoiceRecord.alamat}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold uppercase tracking-wider text-black mb-1">Maklumat Kes:</p>
                          <p className="text-black font-medium">{invoiceRecord.kes}</p>
                        </div>
                      </div>

                      <div className="border-t-[3px] border-b-[3px] border-gray-300 mb-8 flex-1">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-gray-300">
                              <th className="py-3 px-4 font-bold text-left uppercase">Perkara / Butiran</th>
                              <th className="py-3 px-4 font-bold text-right uppercase w-[200px] border-l-2 border-gray-300">Jumlah (RM)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="py-4 px-4 font-medium text-black uppercase">Yuran Guaman (Fee)</td>
                              <td className="py-4 px-4 font-mono font-medium text-right border-l-2 border-gray-300">{originalFee.toFixed(2)}</td>
                            </tr>
                            {originalMileage > 0 && (
                              <tr>
                                <td className="py-4 px-4 font-medium text-black uppercase">Tuntutan Perjalanan (Mileage)</td>
                                <td className="py-4 px-4 font-mono font-medium text-right border-l-2 border-gray-300">{originalMileage.toFixed(2)}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="text-right space-y-4 mb-12">
                        <div className="text-sm font-bold text-black flex justify-end gap-12">
                          <span>JUMLAH KESELURUHAN:</span>
                          <span className="w-32">RM {totalAgreed.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        {invoiceType === 'INVOIS' && totalPaid > 0 && (
                          <div className="text-sm font-bold text-black flex justify-end gap-12">
                            <span>TOLAK BAYARAN DITERIMA:</span>
                            <span className="w-32">- RM {totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                        )}
                        <div className="text-sm font-bold text-black flex justify-end gap-12 pt-3 border-t border-gray-300">
                          <span>{invoiceType === 'INVOIS' ? 'BAKI PERLU DIBAYAR:' : 'JUMLAH SEBUT HARGA:'}</span>
                          <span className="w-32 text-lg">RM {(invoiceType === 'INVOIS' ? currentBalance : totalAgreed).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                      </div>

                      <div className="flex justify-end pt-12">
                        <div className="text-center">
                          <div className="h-[85px]"></div>
                          <p className="font-bold text-sm text-zinc-900 uppercase">Hairi Mustafa & Associates</p>
                          <p className="text-xs text-zinc-500 mt-1">Peguam Syarie & Pesuruhjaya Sumpah</p>
                        </div>
                      </div>
                      <div className="mt-12 pt-6 border-t border-dashed border-zinc-300 text-center text-[10px] text-zinc-500 italic">
                        Dokumen ini dijana oleh komputer. Tandatangan tidak diperlukan.
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Statement Modal & Print Layout */}`;

if(code.includes(search)) {
  code = code.replace(search, replace);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched modal");
}
