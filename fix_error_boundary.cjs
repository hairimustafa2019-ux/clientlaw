const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const boundaryRegex = /class ErrorBoundary extends React\.Component(?:<any, any>)? \{[\s\S]*?return this\.props\.children;\s*\}\s*\}/;

const newBoundary = `
class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg m-4">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-sm opacity-80 mb-4">{this.state.error?.toString()}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded-md">Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}
`;

code = code.replace(boundaryRegex, newBoundary);
code = code.replace(/var currentRenderData = \{/g, "let currentRenderData = {");

fs.writeFileSync('src/App.tsx', code);
