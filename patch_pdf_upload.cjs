const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr1 = `      pdf.save(\`Penyata_\${statementRecord.nama.replace(/\\s+/g, '_')}_\${statementRecord.id}.pdf\`);`;
const replaceStr1 = `      pdf.save(\`Penyata_\${statementRecord.nama.replace(/\\s+/g, '_')}_\${statementRecord.id}.pdf\`);
      const pdfBlob = pdf.output('blob');
      if (user) {
        try {
          const storageRef = ref(storage, \`statements/\${user.uid}/\${statementRecord.id}.pdf\`);
          await uploadBytes(storageRef, pdfBlob);
          const url = await getDownloadURL(storageRef);
          await setDoc(doc(db, 'users', user.uid, 'records', statementRecord.id), { statementUrl: url }, { merge: true });
          setRecords(prev => prev.map(r => r.id === statementRecord.id ? { ...r, statementUrl: url } : r));
        } catch (err) {
          console.error('Failed to upload PDF', err);
        }
      }`;

code = code.replace(targetStr1, replaceStr1);

const targetStr2 = `      pdf.save(\`Penyata_Ringkas_\${simpleStatementRecord.nama.replace(/\\s+/g, '_')}_\${simpleStatementRecord.id}.pdf\`);`;
const replaceStr2 = `      pdf.save(\`Penyata_Ringkas_\${simpleStatementRecord.nama.replace(/\\s+/g, '_')}_\${simpleStatementRecord.id}.pdf\`);
      const pdfBlob = pdf.output('blob');
      if (user) {
        try {
          const storageRef = ref(storage, \`statements/\${user.uid}/\${simpleStatementRecord.id}_ringkas.pdf\`);
          await uploadBytes(storageRef, pdfBlob);
          const url = await getDownloadURL(storageRef);
          await setDoc(doc(db, 'users', user.uid, 'records', simpleStatementRecord.id), { statementUrl: url }, { merge: true });
          setRecords(prev => prev.map(r => r.id === simpleStatementRecord.id ? { ...r, statementUrl: url } : r));
        } catch (err) {
          console.error('Failed to upload PDF', err);
        }
      }`;

code = code.replace(targetStr2, replaceStr2);

fs.writeFileSync('src/App.tsx', code);
