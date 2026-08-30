const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace handleAddNewRecord to remove undefined
const handleAddNewRecordRegex = /const newRecord: CaseRecord & \{ userId\?: string \} = \{[\s\S]*?paymentHistory: \[\]\n\s*\};/;
const handleAddNewRecordReplacement = `const newRecord: CaseRecord & { userId?: string } = {
      id,
      nama: newRecordData.nama,
      kes: newRecordData.kes || 'Umum',
      totalFee: totalFee,
      bayaranTerakhir: 0,
      tarikh: formatDateDMY(newRecordData.tarikh),
      bakiSebelum: totalFee,
      bakiFeeTerkini: totalFee,
      bakiMileage: bakiMileage,
      paymentHistory: []
    };
    if (newRecordData.telefon) newRecord.telefon = newRecordData.telefon;
    if (newRecordData.emel) newRecord.emel = newRecordData.emel;
    if (newRecordData.alamat) newRecord.alamat = newRecordData.alamat;
    if (newRecordData.nota) newRecord.nota = newRecordData.nota;
    if (user) newRecord.userId = user.uid;`;
code = code.replace(handleAddNewRecordRegex, handleAddNewRecordReplacement);

// Fix other occurrences of `userId: user ? user.uid : undefined`
code = code.replace(/userId:\s*user\s*\?\s*user\.uid\s*:\s*undefined/g, `userId: user ? user.uid : ""`);

// Let's remove the buggy auto-sync of localOfflineRecords to cloud which overwrites the server data
const autoSyncRegex = /\/\/ Auto sync local offline records when user logs in[\s\S]*?const q = query\(collection\(db, targetPath\)\);/;
const autoSyncReplacement = `// Auto sync local offline records disabled to prevent overwriting cloud with initialRecords\n    const q = query(collection(db, targetPath));`;
code = code.replace(autoSyncRegex, autoSyncReplacement);

// Fix the localOfflineRecords setting
const localSyncRegex = /useEffect\(\(\) => \{\n\s*if \(authReady && !user\) \{\n\s*localStorage\.setItem\('localOfflineRecords', JSON\.stringify\(records\)\);\n\s*\}\n\s*\}, \[records, user, authReady\]\);/;
const localSyncReplacement = `useEffect(() => {
    // Only save to local storage if user is truly offline and not just logged out with initial data
    if (authReady && !user && records.length > 0 && records !== initialRecords) {
      localStorage.setItem('localOfflineRecords', JSON.stringify(records));
    }
  }, [records, user, authReady]);`;
code = code.replace(localSyncRegex, localSyncReplacement);

// Write back
fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx successfully");
