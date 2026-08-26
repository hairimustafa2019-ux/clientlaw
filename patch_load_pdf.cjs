const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetFunction = `  const handleFormatData = async () => {`;

const insertCode = `  const handleMuatDataPDF = async () => {
    if (window.confirm("Adakah anda pasti mahu memuatkan data dari PDF? Ini akan menggantikan semua rekod semasa anda.")) {
      setRecords(initialRecords);
      if (user) {
        try {
          const batch = writeBatch(db);
          
          // Delete existing
          const q = query(collection(db, \`users/\${user.uid}/records\`));
          const snapshot = await getDocs(q);
          snapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          
          // Add new
          initialRecords.forEach(rec => {
            const docRef = doc(db, 'users', user.uid, 'records', rec.id);
            batch.set(docRef, { ...rec, userId: user.uid });
          });
          
          await batch.commit();
        } catch(error) {
          console.error("Gagal memuat data ke Cloud:", error);
        }
      } else {
        localStorage.setItem('localOfflineRecords', JSON.stringify(initialRecords));
      }
      alert("Data dari PDF telah berjaya dimuatkan!");
    }
  };

  const handleFormatData = async () => {`;

code = code.replace(targetFunction, insertCode);

const targetButton = `                    <button onClick={handleFormatData} className="w-full flex items-center justify-between p-4 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">`;

const insertButton = `                    <button onClick={handleMuatDataPDF} className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                          <CloudUpload size={18} />
                        </div>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Muat Data dari PDF</span>
                      </div>
                      <ChevronRight size={18} className="text-blue-400" />
                    </button>
                    <button onClick={handleFormatData} className="w-full flex items-center justify-between p-4 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">`;

code = code.replace(targetButton, insertButton);

fs.writeFileSync('src/App.tsx', code);
