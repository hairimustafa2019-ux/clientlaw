const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove handleExportLaporanCSV
content = content.replace(/  const handleExportLaporanCSV = \(\) => \{[\s\S]*?    document.body.removeChild\(link\);\n  \};\n/, '');

// 2. Remove monthlyPaymentData
content = content.replace(/  \/\/ Compute chart data for monthly payments \(current year\)[\s\S]*?    \}\);\n  \}, \[records\]\);\n/, '');

// 3. Remove Desktop Tab Button
const desktopTabPattern = /          <button \n            onClick=\{\(\) => setActiveTab\('reports'\)\}\n            className=\{`w-full text-left px-4 py-2\.5 rounded-lg text-sm font-medium transition-all \$\{activeTab === 'reports' \? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900\/50'\}`\}\n          >\n            Laporan Kewangan\n          <\/button>\n/;
content = content.replace(desktopTabPattern, '');

// 4. Update Page Title
const pageTitlePattern = /\{activeTab === 'dashboard' \? 'Papan Pemuka' : activeTab === 'records' \? 'Rekod Pelanggan' : activeTab === 'reports' \? 'Laporan Kewangan' : 'Resit Bebas'\}/;
content = content.replace(pageTitlePattern, "{activeTab === 'dashboard' ? 'Papan Pemuka' : activeTab === 'records' ? 'Rekod Pelanggan' : 'Resit Bebas'}");

// 5. Remove Mobile Tab Button
const mobileTabPattern = /        <button \n          onClick=\{\(\) => setActiveTab\('reports'\)\} \n          className=\{`flex flex-col items-center p-1 text-\[9px\] w-1\/4 text-center \$\{activeTab === 'reports' \? 'text-white' : 'hover:text-white'\}`\}\n        >\n          <BarChart2 size=\{20\} className="mb-1" \/> Laporan Kewangan\n        <\/button>\n/;
content = content.replace(mobileTabPattern, '');

// 6. Remove Tab Content
const tabContentPattern = /            \{\/\* Dashboard and Reports View: Charts \*\/\}[\s\S]*?            \}\)\}\n/;
content = content.replace(tabContentPattern, '');

fs.writeFileSync('src/App.tsx', content);
