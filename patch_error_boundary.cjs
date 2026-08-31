const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const errorBoundaryCode = `
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{padding: 20, color: 'red', background: 'white', zIndex: 9999, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}>
        <h2>Something went wrong.</h2>
        <details style={{ whiteSpace: 'pre-wrap' }}>
          {this.state.error && this.state.error.toString()}
          <br />
          {this.state.errorInfo && this.state.errorInfo.componentStack}
        </details>
      </div>;
    }
    return this.props.children; 
  }
}
`;

// Inject ErrorBoundary class at the top
code = code.replace("function App() {", errorBoundaryCode + "\nfunction AppContent() {");
code = code.replace("export default App;", "function App() { return <ErrorBoundary><AppContent /></ErrorBoundary>; }\nexport default App;");

fs.writeFileSync('src/App.tsx', code);
console.log("Injected ErrorBoundary");
