const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const startIndex = content.indexOf('{/* Dashboard and Reports View: Charts */}');
const endIndex = content.indexOf('{/* Main Data Table Area */}');

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + content.substring(endIndex);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Reports section removed.");
}

// Remove from state definition
content = content.replace(
    `const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'reports' | 'standalone'>('dashboard');`,
    `const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'standalone'>('dashboard');`
);

fs.writeFileSync('src/App.tsx', content);

