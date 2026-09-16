                            {/* Grid 2x2 for Four Main Data Cards */}
                            <div className="grid grid-cols-2 gap-4">
                              {/* 1. Jumlah Kes (Atas Kiri) */}
                              <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 transition-shadow hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-black/50 flex flex-col justify-between h-[160px]"
                              >
                                <div>
                                  <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                    Jumlah Kes
                                  </span>
                                </div>
                                <div>
                                  <p className="text-4xl font-light tracking-tight text-zinc-900 dark:text-white tabular-nums">
                                    {stats.totalKes}
                                  </p>
                                </div>
                              </motion.div>

                              {/* 2. Total Fee (Atas Kanan) */}
                              <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 transition-shadow hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-black/50 flex flex-col justify-between h-[160px]"
                              >
                                <div>
                                  <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                    Total Fee
                                  </span>
                                </div>
                                <div>
                                  <p className="text-4xl font-light tracking-tight text-zinc-900 dark:text-white tabular-nums">
                                    {formatRM(stats.totalFee)}
                                  </p>
                                </div>
                              </motion.div>

                              {/* 3. Baki Fee Terkini (Bawah Kiri) */}
                              <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 transition-shadow hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-black/50 flex flex-col justify-between h-[160px]"
                              >
                                <div>
                                  <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                    Baki Terkini
                                  </span>
                                </div>
                                <div>
                                  <p className="text-4xl font-light tracking-tight text-zinc-900 dark:text-white tabular-nums">
                                    {formatRM(stats.totalBakiTerkini)}
                                  </p>
                                </div>
                              </motion.div>

                              {/* 4. Tunggakan - MERAH SAHAJA */}
                              <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                className="p-6 rounded-3xl bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/20 transition-shadow hover:shadow-lg hover:shadow-red-500/10 dark:hover:shadow-red-900/20 flex flex-col justify-between h-[160px]"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-medium uppercase tracking-widest text-red-600 dark:text-red-400">
                                    Tunggakan
                                  </span>
                                </div>
                                <div>
                                  <p className="text-4xl font-light tracking-tight text-red-600 dark:text-red-400 tabular-nums">
                                    {formatRM(stats.totalOverdueAmount)}
                                  </p>
                                  <p className="text-xs text-red-500/80 dark:text-red-400/80 mt-1.5 font-medium">
                                    {stats.totalOverdueCases} kes &gt;{overdueDays} hari
                                  </p>
                                </div>
                              </motion.div>
                            </div>
