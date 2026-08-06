const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });`;

const replaceStr = `  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [whatsappTemplate, setWhatsappTemplate] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('whatsappTemplate') || 'Salam {nama}, ini adalah peringatan mesra berkenaan baki tertunggak sebanyak {baki} untuk kes {kes}.';
    }
    return 'Salam {nama}, ini adalah peringatan mesra berkenaan baki tertunggak sebanyak {baki} untuk kes {kes}.';
  });

  useEffect(() => {
    localStorage.setItem('whatsappTemplate', whatsappTemplate);
  }, [whatsappTemplate]);`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
