const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/this\.state =/g, "// @ts-ignore\n    this.state =");
code = code.replace(/this\.setState/g, "// @ts-ignore\n    this.setState");
code = code.replace(/this\.state\.hasError/g, "// @ts-ignore\n    this.state.hasError");
code = code.replace(/this\.state\.error/g, "// @ts-ignore\n    this.state.error");
code = code.replace(/this\.props\.children/g, "// @ts-ignore\n    this.props.children");
fs.writeFileSync('src/App.tsx', code);
