const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadSelectedReceiptsZIP}`;

const replaceStr = `                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrintAllSelected}
                        disabled={isGeneratingCombinedPDF}
                        className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 font-medium cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingCombinedPDF ? <Loader2 size={12} className="animate-spin" /> : <Printer size={12} />}
                        {isGeneratingCombinedPDF ? \`Mencetak (\${combinedPdfCurrentIndex + 1}/\${combinedPdfQueue.length})...\` : \`Cetak Semua (\${selectedRecords.length})\`}
                      </button>
                      <button
                        onClick={handleDownloadSelectedReceiptsZIP}`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
