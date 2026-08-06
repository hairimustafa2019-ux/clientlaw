const fs = require('fs');
let code = fs.readFileSync('src/data.ts', 'utf8');

code = code.replace(
  'paymentHistory?: PaymentEntry[];',
  'paymentHistory?: PaymentEntry[];\n  statementUrl?: string;'
);

fs.writeFileSync('src/data.ts', code);
