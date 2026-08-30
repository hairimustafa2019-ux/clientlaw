const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The corrupted part is around line 697.
// We need to replace the corrupted block with the original CSV logic + handleAddNewRecord logic.
const corruptedRegex = /const id = rawId \|\| \`CSV\$\{Date\.now\(\)\}\$\{Math\.floor\(Math\.random\(\) \* 1000\)\}\`;[\s\S]*?if \(user\) newRecord\.userId = user\.uid;/;

const correctCode = `const id = rawId || \`CSV\$\{Date.now()\}\$\{Math.floor(Math.random() * 1000)\}\`;
          
          const newRecord: CaseRecord & { userId?: string } = {
            id,
            nama: rawNama,
            telefon: rawTelefon,
            emel: rawEmel,
            alamat: rawAlamat,
            kes: rawKes,
            totalFee: rawTotalFee,
            bayaranTerakhir: rawBayaranTerakhir,
            tarikh: formatDateDMY(rawTarikh),
            bakiSebelum: rawBakiSebelum,
            bakiFeeTerkini: rawBakiTerkini,
            bakiMileage: rawBakiMileage,
            paymentHistory: [],
            userId: user ? user.uid : ""
          };
          newRecordsFromCsv.push(newRecord);
          
          if (user) {
            const targetPath = \`users/\$\{user.uid\}/records/\$\{id\}\`;
            await setDoc(doc(db, 'users', user.uid, 'records', id), newRecord).catch(err => {
              handleFirestoreError(err, OperationType.WRITE, targetPath);
            });
          }
        } catch (e) {
          console.error("Failed to parse row", values, e);
        }
      }
      
      if (newRecordsFromCsv.length > 0) {
        setRecords(prev => [...newRecordsFromCsv, ...prev]);
        alert(\`\$\{newRecordsFromCsv.length\} rekod berjaya diimport!\`);
      } else {
        alert("Tiada data yang sah dijumpai dalam fail CSV.");
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleAddNewRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordData.nama || !newRecordData.totalFee) return;
    const totalFee = parseFloat(newRecordData.totalFee);
    const bakiMileage = parseFloat(newRecordData.bakiMileage) || 0;
    const id = \`C-\$\{Math.floor(Math.random() * 10000).toString().padStart(4, '0')\}\`;
    
    const newRecord: CaseRecord & { userId?: string } = {
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

code = code.replace(corruptedRegex, correctCode);
fs.writeFileSync('src/App.tsx', code);
console.log("Restored App.tsx");
