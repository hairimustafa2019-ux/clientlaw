const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `          <button 
            onClick={() => { { setActiveTab('standalone'); setIsMobileMenuOpen(false); }; setStandaloneInitialRecord(null); }}
            className={\`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all \${activeTab === 'standalone' ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}\`}
          >
            Paparan Resit
          </button>
        </nav>`;

const replaceStr = `          <button 
            onClick={() => { { setActiveTab('standalone'); setIsMobileMenuOpen(false); }; setStandaloneInitialRecord(null); }}
            className={\`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all \${activeTab === 'standalone' ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}\`}
          >
            Paparan Resit
          </button>
          
          <button 
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            className={\`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all \${activeTab === 'settings' ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}\`}
          >
            Tetapan
          </button>
        </nav>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
