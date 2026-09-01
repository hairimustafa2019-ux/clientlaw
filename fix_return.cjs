const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/return \/\* @ts-ignore \*\/[\r\n\s]*this\.props\.children;/g, "return this.props.children as React.ReactNode;");
fs.writeFileSync('src/App.tsx', code);
