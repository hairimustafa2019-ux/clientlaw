const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const t1 = `    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedRecords: CaseRecord[] = [];
      snapshot.forEach(doc => {
        fetchedRecords.push(doc.data() as CaseRecord);
      });
      skipNextBackupRef.current = true;
      setRecords(fetchedRecords);
    }, (error) => {`;

const r1 = `    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedRecords: CaseRecord[] = [];
      snapshot.forEach(doc => {
        fetchedRecords.push(doc.data() as CaseRecord);
      });
      
      if (fetchedRecords.length === 0) {
        const saved = localStorage.getItem('localOfflineRecords');
        if (saved) {
           try {
              const localRecs = JSON.parse(saved);
              if (localRecs && localRecs.length > 0) {
                 const batch = writeBatch(db);
                 localRecs.forEach((r) => {
                    const rRef = doc(db, targetPath, r.id);
                    batch.set(rRef, { ...r, userId: user.uid });
                 });
                 await batch.commit();
                 return; // will re-trigger
              }
           } catch(e) {}
        }
      }

      skipNextBackupRef.current = true;
      setRecords(fetchedRecords);
    }, (error) => {`;

code = code.replace(t1, r1);
fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Patched auto sync!");
