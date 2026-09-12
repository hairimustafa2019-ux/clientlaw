const fs = require('fs');
let code = fs.readFileSync('src/components/StandaloneReceipts.tsx', 'utf-8');

const t = `      snapshot.forEach(d => {
        fetchedReceipts.push(d.data() as any);
      });`;

const r = `      snapshot.forEach(d => {
        fetchedReceipts.push(d.data() as any);
      });
      
      if (fetchedReceipts.length === 0) {
        const saved = localStorage.getItem('hma_receipts');
        if (saved) {
           try {
              const localRecs = JSON.parse(saved);
              if (localRecs && localRecs.length > 0) {
                 const batch = writeBatch(db);
                 localRecs.forEach((r) => {
                    const rRef = doc(db, \`users/\${user.uid}/receipts\`, r.id);
                    batch.set(rRef, { ...r, userId: user.uid });
                 });
                 await batch.commit();
                 return; 
              }
           } catch(e) {}
        }
      }`;

code = code.replace(t, r);
fs.writeFileSync('src/components/StandaloneReceipts.tsx', code, 'utf-8');
console.log("Patched receipts sync");
