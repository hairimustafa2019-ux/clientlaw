const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\}, \[records\]\);\s*>\s*Rekod Pelanggan\s*<\/button>/g;

if (regex.test(content)) {
    content = content.replace(regex, `}, [records]);

  // Export functions removed

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-black font-sans overflow-hidden text-zinc-900 dark:text-zinc-100">
      
      {/* Sidebar for Desktop */}
      <aside className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-900 hidden md:flex flex-col z-20 shrink-0 print:hidden">
        <div className="h-16 flex items-center px-6 border-b border-zinc-100 dark:border-zinc-900 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-inner">
              <Users size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">Lexis<span className="text-blue-600">Track</span></span>
          </div>
        </div>
        
        <div className="px-6 py-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-800">
              <span className="font-bold text-zinc-600 dark:text-zinc-400">HM</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">Hairi Mustafa</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">Peguam Syarie</p>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mt-4 font-medium">Pengurusan Kes</div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={\`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all \${activeTab === 'dashboard' ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}\`}
          >
            Papan Pemuka
          </button>
          <button 
            onClick={() => setActiveTab('records')}
            className={\`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all \${activeTab === 'records' ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}\`}
          >
            Rekod Pelanggan
          </button>`);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Fixed missing JSX start");
} else {
    console.log("Target not found");
}
