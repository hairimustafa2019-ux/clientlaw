const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetHandler = `  const handleEditRecordSubmit = async (e: React.FormEvent) => {`;
const replacementHandler = `  const handleMileageAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mileageAdjustmentRecord || !mileageAdjustmentAmount) return;
    
    const amount = parseFloat(mileageAdjustmentAmount);
    if (isNaN(amount) || amount <= 0) return;

    let newBakiMileage = mileageAdjustmentRecord.bakiMileage || 0;
    if (mileageAdjustmentType === 'tambah') {
        newBakiMileage += amount;
    } else {
        newBakiMileage -= amount;
        if (newBakiMileage < 0) newBakiMileage = 0;
    }

    const updatedRecord = {
        ...mileageAdjustmentRecord,
        bakiMileage: newBakiMileage
    };

    if (user) {
      const targetPath = \`users/\${user.uid}/records/\${mileageAdjustmentRecord.id}\`;
      try {
          await setDoc(doc(db, 'users', user.uid, 'records', mileageAdjustmentRecord.id), { ...updatedRecord, userId: user.uid });
      } catch(err) {
          handleFirestoreError(err, OperationType.WRITE, targetPath);
      }
    } else {
      setRecords(prev => prev.map(rec => rec.id === mileageAdjustmentRecord.id ? updatedRecord : rec));
    }
    setMileageAdjustmentRecord(null);
    setMileageAdjustmentAmount('');
  };

  const handleEditRecordSubmit = async (e: React.FormEvent) => {`;

if (content.includes(targetHandler)) {
    content = content.replace(targetHandler, replacementHandler);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Handler patched");
} else {
    console.log("Handler target not found");
}
