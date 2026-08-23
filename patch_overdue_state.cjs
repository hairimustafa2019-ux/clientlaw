const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const [whatsappIncludeLink, setWhatsappIncludeLink] = useState(() => {`;

const replaceStr = `  const [overdueDays, setOverdueDays] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('overdueDays');
      return stored ? parseInt(stored, 10) : 30;
    }
    return 30;
  });

  useEffect(() => {
    localStorage.setItem('overdueDays', overdueDays.toString());
  }, [overdueDays]);

  const [whatsappIncludeLink, setWhatsappIncludeLink] = useState(() => {`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
