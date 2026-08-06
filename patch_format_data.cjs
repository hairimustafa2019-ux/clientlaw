const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const handleExportData = () => {`;

const replaceStr = `  const handleFormatData = async () => {
    if (window.confirm("AMARAN: Adakah anda pasti mahu memadam SEMUA rekod? Tindakan ini tidak boleh dipulihkan.")) {
      if (user) {
        try {
          for (const rec of records) {
            await deleteDoc(doc(db, 'users', user.uid, 'records', rec.id));
          }
        } catch (err) {
          console.error("Gagal memadam dari awan", err);
        }
      }
      setRecords([]);
      alert("Semua data telah berjaya dipadam (diformat).");
    }
  };

  const handleExportData = () => {`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
