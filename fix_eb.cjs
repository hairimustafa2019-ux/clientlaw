const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  'class ErrorBoundary extends React.Component<any, any> {',
  'class ErrorBoundary extends React.Component<{children: React.ReactNode}, any> {'
);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Fixed ErrorBoundary.");
