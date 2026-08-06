const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `const [nameSortOrder, setNameSortOrder] = useState<'asc' | 'desc' | null>(null);`;
const replaceStr = `const [nameSortOrder, setNameSortOrder] = useState<'asc' | 'desc' | null>('asc');`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
