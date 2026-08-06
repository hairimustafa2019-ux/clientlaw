const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  useEffect(() => {
    localStorage.setItem('whatsappTemplate', whatsappTemplate);
  }, [whatsappTemplate]);`;

const replaceStr = `  useEffect(() => {
    localStorage.setItem('whatsappTemplate', whatsappTemplate);
  }, [whatsappTemplate]);

  const [whatsappIncludeLink, setWhatsappIncludeLink] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('whatsappIncludeLink') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('whatsappIncludeLink', String(whatsappIncludeLink));
  }, [whatsappIncludeLink]);`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
