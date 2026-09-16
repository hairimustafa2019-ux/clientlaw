                              {/* Single Horizontal Swipeable Row */}
                              <div className="flex overflow-x-auto gap-4 pb-4 pt-1 no-scrollbar snap-x scroll-smooth">
                                {/* Kad 1: Jumlah Kes */}
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
                                  whileTap={{ scale: 0.98 }}
                                  className="min-w-[150px] h-[120px] p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 shrink-0 snap-start flex flex-col justify-between"
                                >
                                  <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Jumlah Kes</span>
                                  <p className="text-3xl font-light tracking-tight text-zinc-900 dark:text-white tabular-nums">{stats.totalKes}</p>
                                </motion.div>

                                {/* Kad 2: Total Fee */}
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                                  whileTap={{ scale: 0.98 }}
                                  className="min-w-[160px] h-[120px] p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 shrink-0 snap-start flex flex-col justify-between"
                                >
                                  <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Total Fee</span>
                                  <p className="text-2xl font-light tracking-tight text-zinc-900 dark:text-white tabular-nums">{formatRM(stats.totalFee)}</p>
                                </motion.div>

                                {/* Kad 3: Baki Terkini */}
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
                                  whileTap={{ scale: 0.98 }}
                                  className="min-w-[160px] h-[120px] p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 shrink-0 snap-start flex flex-col justify-between"
                                >
                                  <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Baki Terkini</span>
                                  <p className="text-2xl font-light tracking-tight text-zinc-900 dark:text-white tabular-nums">{formatRM(stats.totalBakiTerkini)}</p>
                                </motion.div>

                                {/* Kad 4: Tunggakan - MERAH SAHAJA */}
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                                  whileTap={{ scale: 0.98 }}
                                  className="min-w-[170px] h-[120px] p-5 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 shrink-0 snap-start flex flex-col justify-between"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-medium uppercase tracking-widest text-red-600 dark:text-red-400">Tunggakan</span>
                                  </div>
                                  <div>
                                    <p className="text-2xl font-light tracking-tight text-red-600 dark:text-red-400 tabular-nums">{formatRM(stats.totalOverdueAmount)}</p>
                                    <p className="text-[10px] text-red-500/80 dark:text-red-400/80 font-medium mt-0.5">{stats.totalOverdueCases} kes &gt;{overdueDays} hari</p>
                                  </div>
                                </motion.div>

                                {/* Kad 5: Mileage */}
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
                                  whileTap={{ scale: 0.98 }}
                                  className="min-w-[160px] h-[120px] p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 shrink-0 snap-start flex flex-col justify-between"
                                >
                                  <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Baki Mileage</span>
                                  <p className="text-2xl font-light tracking-tight text-zinc-900 dark:text-white tabular-nums">{formatRM(stats.totalMileage)}</p>
                                </motion.div>
                              </div>
                            </div>
