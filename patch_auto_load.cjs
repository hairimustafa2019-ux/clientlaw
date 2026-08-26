const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetEffect = `  useEffect(() => {
    if (authReady && !user) {
      localStorage.setItem('localOfflineRecords', JSON.stringify(records));
    }
  }, [records, user, authReady]);`;

const replacementEffect = `  useEffect(() => {
    if (authReady && !user) {
      localStorage.setItem('localOfflineRecords', JSON.stringify(records));
    }
  }, [records, user, authReady]);

  // Auto-load PDF data one-time
  useEffect(() => {
    if (authReady && !localStorage.getItem('pdfDataLoaded_v1')) {
      if (window.confirm("Kemas kini Sistem: Terdapat rekod data pelanggan baru (dari PDF). Adakah anda mahu memuatkan data ini ke dalam akaun anda sekarang?")) {
        handleMuatDataPDF();
      }
      localStorage.setItem('pdfDataLoaded_v1', 'true');
    }
  }, [authReady]);`;

code = code.replace(targetEffect, replacementEffect);
fs.writeFileSync('src/App.tsx', code);
