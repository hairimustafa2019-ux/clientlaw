const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const handleUpdateClientProfile = (e: React.FormEvent, nama: string) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const telefon = formData.get('telefon') as string;
    const emel = formData.get('emel') as string;
    const alamat = formData.get('alamat') as string;
    
    setRecords(prev => prev.map(r => {
      if (r.nama === nama) {
        return { ...r, telefon, emel, alamat };
      }
      return r;
    }));
    
    // Optionally stay open or show toast
    alert('Profil Pelanggan Berjaya Dikemaskini');
  };`;

const replaceStr = `  const handleUpdateClientProfile = async (e: React.FormEvent, nama: string) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const telefon = formData.get('telefon') as string;
    const emel = formData.get('emel') as string;
    const alamat = formData.get('alamat') as string;
    
    const updatedRecords = records.map(r => {
      if (r.nama === nama) {
        return { ...r, telefon, emel, alamat };
      }
      return r;
    });
    
    setRecords(updatedRecords);
    
    if (user) {
      try {
        const updates = updatedRecords.filter(r => r.nama === nama);
        for (const rec of updates) {
          const targetPath = \`users/\${user.uid}/records/\${rec.id}\`;
          await setDoc(doc(db, 'users', user.uid, 'records', rec.id), { ...rec, userId: user.uid }, { merge: true });
        }
      } catch (err) {
        console.error("Gagal mengemaskini di awan", err);
      }
    }
    
    alert('Profil Pelanggan Berjaya Dikemaskini');
  };`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
