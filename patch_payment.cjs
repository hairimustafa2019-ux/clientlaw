const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const feeLabel = `<label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                      Jumlah Bayaran Fee (RM)
                    </label>`;
const newFeeLabel = `<div className="flex justify-between items-center mb-2">
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Jumlah Bayaran Fee (RM)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentAmount(paymentRecord.bakiFeeTerkini.toString());
                          if (paymentError) setPaymentError('');
                        }}
                        className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 px-2 py-1 rounded transition-colors font-medium cursor-pointer"
                      >
                        Penuh ({formatRM(paymentRecord.bakiFeeTerkini)})
                      </button>
                    </div>`;

const mileageLabel = `<label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                        Jumlah Bayaran Mileage (RM)
                      </label>`;
const newMileageLabel = `<div className="flex justify-between items-center mb-2">
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Jumlah Bayaran Mileage (RM)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMileageAmount((paymentRecord.bakiMileage || 0).toString());
                          if (paymentError) setPaymentError('');
                        }}
                        className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 px-2 py-1 rounded transition-colors font-medium cursor-pointer"
                      >
                        Penuh ({formatRM(paymentRecord.bakiMileage || 0)})
                      </button>
                    </div>`;

code = code.replace(feeLabel, newFeeLabel);
code = code.replace(mileageLabel, newMileageLabel);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched payment suggestions");
