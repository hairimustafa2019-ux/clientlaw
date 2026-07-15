const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove sidebar button
const sidebarTarget = `          <button 
            onClick={() => setActiveTab('reports')}
            className={\`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all \${activeTab === 'reports' ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}\`}
          >
            Laporan Kewangan
          </button>`;
if (content.includes(sidebarTarget)) {
    content = content.replace(sidebarTarget, '');
    console.log("Sidebar button removed.");
}

// 2. Remove bottom bar button
const bottomBarTarget = `        <button 
          onClick={() => setActiveTab('reports')} 
          className={\`flex flex-col items-center p-1 text-[9px] w-1/4 text-center \${activeTab === 'reports' ? 'text-white' : 'hover:text-white'}\`}
        >
          <BarChart2 size={20} className="mb-1" /> Laporan Kewangan
        </button>`;
if (content.includes(bottomBarTarget)) {
    content = content.replace(bottomBarTarget, '');
    // Need to adjust w-1/4 to w-1/3 since we have 3 tabs now.
    content = content.replace(/w-1\/4/g, 'w-1/3');
    console.log("Bottom bar button removed.");
}

// 3. Remove reports content section
const reportsSectionRegex = /\{\/\* Dashboard and Reports View: Charts \*\/\}\s*\{activeTab === 'reports' && \([\s\S]*?\}\)[\s]*\{\/\* Main Data Table Area \*\/\}/g;
content = content.replace(reportsSectionRegex, '{/* Main Data Table Area */}');

// 4. Update Header title
const headerTitleTarget = `{activeTab === 'dashboard' ? 'Papan Pemuka' : activeTab === 'records' ? 'Rekod Pelanggan' : activeTab === 'reports' ? 'Laporan Kewangan' : 'Resit Bebas'}`;
const headerTitleReplacement = `{activeTab === 'dashboard' ? 'Papan Pemuka' : activeTab === 'records' ? 'Rekod Pelanggan' : 'Resit Bebas'}`;
if (content.includes(headerTitleTarget)) {
    content = content.replace(headerTitleTarget, headerTitleReplacement);
    console.log("Header title updated.");
}

// 5. Optionally remove unused import `BarChart2`
const importTarget = `import { Search, Car, Users, FileText, CreditCard, Wallet, MapPin, ChevronDown, Filter, ChevronRight, X, Printer, CheckCircle, Download, Loader2, PieChart, Edit, Trash2, AlertTriangle, ArrowUp, ArrowDown, Upload, LogOut, LogIn, CloudUpload, Moon, Sun, Home, BarChart2, Clock, Zap, Plus } from 'lucide-react';`;
const importReplacement = `import { Search, Car, Users, FileText, CreditCard, Wallet, MapPin, ChevronDown, Filter, ChevronRight, X, Printer, CheckCircle, Download, Loader2, PieChart, Edit, Trash2, AlertTriangle, ArrowUp, ArrowDown, Upload, LogOut, LogIn, CloudUpload, Moon, Sun, Home, Clock, Zap, Plus } from 'lucide-react';`;
if (content.includes(importTarget)) {
    content = content.replace(importTarget, importReplacement);
}

fs.writeFileSync('src/App.tsx', content);
