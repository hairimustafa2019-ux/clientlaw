const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `      {/* Hidden PDF renderer for ZIP generation */}`;

const replaceStr = `      {/* Hidden PDF renderer for Combined PDF generation */}
      {combinedPdfQueue && combinedPdfCurrentIndex < combinedPdfQueue.length && combinedPdfQueue[combinedPdfCurrentIndex] && (
        <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden w-[800px]">
          <div className="p-4 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-white print:p-0 print:overflow-visible print:block">
            <div ref={hiddenCombinedPdfPrintRef} className="w-full min-w-[700px] mx-auto font-sans text-black bg-white print:min-w-0 print:w-full print:p-0 p-8 sm:p-12 relative overflow-hidden h-[1122px] flex flex-col justify-between">
              
              <div>
                  <div className="flex items-center pb-6 border-b border-gray-300 mb-8 gap-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl overflow-hidden border border-gray-200">
                      <img src="/logo.png" alt="Hairi Mustafa & Co Logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h1 className="text-[1.35rem] sm:text-2xl font-black text-black tracking-tight leading-tight uppercase">Tetuan Hairi Mustafa & Co</h1>
                      <div className="flex flex-col gap-0.5 mt-2 text-xs sm:text-[13px] font-medium text-black uppercase tracking-wide">
                        <p className="m-0">PEGUAM SYARIE & PERUNDING CARA ISLAM</p>
                        <p className="m-0 text-black font-semibold">NO. 19-1 (TINGKAT 1), JALAN SAUJANA INDAH 4, TAMAN SAUJANA INDAH, 75450 BUKIT KATIL, MELAKA</p>
                        <p className="m-0">TEL: 010-2434143 / 011-56531310 | EMAIL: tetuanhairi@gmail.com</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-start mb-8 text-sm">
                    <div>
                      <p className="text-[13px] font-mono mt-1">Ref: {combinedPdfQueue[combinedPdfCurrentIndex].id}</p>
                      <p className="font-bold text-black text-lg mb-1">{combinedPdfQueue[combinedPdfCurrentIndex].nama}</p>
                      <p className="text-black font-medium">Kategori Kes: {combinedPdfQueue[combinedPdfCurrentIndex].kes}</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-bold tracking-tight uppercase mb-1">Penyata Ringkas</h2>
                      <p className="text-[13px] font-mono">Tarikh: {formatDateDMY(new Date().toISOString().split('T')[0])}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-100 p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                      <span className="text-black font-semibold uppercase tracking-wider text-xs mb-2">Baki Fee Semasa</span>
                      <p className="text-3xl font-bold font-mono text-black">{formatRM(combinedPdfQueue[combinedPdfCurrentIndex].bakiFeeTerkini)}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col justify-between">
                      <div>
                        <span className="text-black font-medium text-sm mb-1 block">Bayaran Terakhir: <span className="font-bold">{formatRM(combinedPdfQueue[combinedPdfCurrentIndex].bayaranTerakhir)}</span></span>
                        <span className="text-black text-xs block">
                          Tarikh Terakhir Bayaran: {combinedPdfQueue[combinedPdfCurrentIndex].paymentHistory && combinedPdfQueue[combinedPdfCurrentIndex].paymentHistory.length > 0 
                          ? formatDateDMY([...combinedPdfQueue[combinedPdfCurrentIndex].paymentHistory].sort((a: any, b: any) => parseDateObj(b.date).getTime() - parseDateObj(a.date).getTime())[0].date)
                          : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t-[3px] border-b-[3px] border-gray-300 mb-8 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white border-b border-gray-300">
                        <tr>
                          <th className="py-3 px-5 font-semibold text-black uppercase tracking-wider text-xs">Perkara</th>
                          <th className="py-3 px-5 font-semibold text-black text-right uppercase tracking-wider text-xs">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300 bg-white">
                        <tr className="hover:bg-white transition-colors">
                          <td className="py-4 px-5 text-black font-medium">Jumlah Bayaran Penuh (Fee)</td>
                          <td className="py-4 px-5 text-right font-mono font-bold text-black">{formatRM(combinedPdfQueue[combinedPdfCurrentIndex].totalFee)}</td>
                        </tr>
                        <tr className="hover:bg-white transition-colors bg-gray-50 border-t border-gray-300">
                          <td className="py-4 px-5 text-black font-medium">Jumlah Bayaran Terkumpul (Fee)</td>
                          <td className="py-4 px-5 text-right font-mono font-medium text-emerald-600">
                            -{formatRM((combinedPdfQueue[combinedPdfCurrentIndex].paymentHistory || []).reduce((acc, curr) => acc + (curr.amount || 0), 0))}
                          </td>
                        </tr>
                        {combinedPdfQueue[combinedPdfCurrentIndex].bakiMileage !== undefined && combinedPdfQueue[combinedPdfCurrentIndex].bakiMileage > 0 && (
                          <tr className="hover:bg-white transition-colors border-t border-gray-300">
                            <td className="py-4 px-5 text-black font-medium">Baki Terkini (Mileage)</td>
                            <td className="py-4 px-5 text-right font-mono text-amber-600 font-medium">
                              {formatRM(combinedPdfQueue[combinedPdfCurrentIndex].bakiMileage || 0)}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-gray-200 text-black border-t-2 border-gray-300">
                          <td className="py-4 px-5 font-bold text-sm tracking-wide">BAKI TERKINI (FEE)</td>
                          <td className="py-4 px-5 text-right font-mono font-bold text-lg">{formatRM(combinedPdfQueue[combinedPdfCurrentIndex].bakiFeeTerkini)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

              </div>

              <div>
                  <div className="flex justify-between items-start border-t border-gray-300 pt-6">
                    <div className="text-sm font-bold text-black uppercase flex flex-col gap-2 text-left w-2/3">
                      <div>Terma & Syarat:</div>
                      <p className="normal-case font-normal text-zinc-600 text-[11px] leading-relaxed text-left text-justify">
                        Penyata ringkas ini dikeluarkan sebagai rujukan status akaun pelanggan. Sila pastikan semua baki tertunggak (sekiranya ada) dijelaskan mengikut jadual yang telah dipersetujui. Untuk sebarang pertanyaan atau percanggahan maklumat, sila hubungi pihak kami dengan segera.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-dashed border-zinc-300 dark:border-zinc-700 text-center text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                    Penyata ini dijana oleh komputer, tiada tandatangan diperlukan.
                  </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF renderer for ZIP generation */}`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
