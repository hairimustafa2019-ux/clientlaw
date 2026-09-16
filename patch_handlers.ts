export const handleUpdateEditedPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    const recordIndex = records.findIndex(r => r.id === editingPayment.recordId);
    if (recordIndex === -1) return;

    const updatedRecords = [...records];
    const record = { ...updatedRecords[recordIndex] };
    const paymentIndex = record.paymentHistory?.findIndex(p => p.id === editingPayment.payment.id) ?? -1;
    
    if (paymentIndex === -1 || !record.paymentHistory) return;

    const oldPayment = record.paymentHistory[paymentIndex];
    const newPayment = editingPayment.payment;
    
    const feeDiff = (newPayment.amount || 0) - (oldPayment.amount || 0);
    const mileageDiff = (newPayment.mileageAmount || 0) - (oldPayment.mileageAmount || 0);

    record.paymentHistory[paymentIndex] = newPayment;
    record.bakiFeeTerkini = Math.max(0, record.bakiFeeTerkini - feeDiff);
    record.bakiMileage = Math.max(0, (record.bakiMileage || 0) - mileageDiff);
    
    // update bayaranTerakhir and tarikh if it was the latest payment
    const sortedPayments = [...record.paymentHistory].sort((a: any, b: any) => {
      const partsA = a.date.split('/');
      const partsB = b.date.split('/');
      return new Date(`${partsB[2]}-${partsB[1]}-${partsB[0]}`).getTime() - new Date(`${partsA[2]}-${partsA[1]}-${partsA[0]}`).getTime();
    });
    if (sortedPayments.length > 0) {
      record.bayaranTerakhir = sortedPayments[0].amount || sortedPayments[0].mileageAmount || 0;
      record.tarikh = sortedPayments[0].date;
    }

    updatedRecords[recordIndex] = record;
    setRecords(updatedRecords);
    
    if (user) {
        try {
            await setDoc(doc(db, 'users', user.uid, 'records', record.id), record);
            silentBackupToCloud(updatedRecords);
        } catch(err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/records/${record.id}`);
        }
    }
    
    if (statementRecord && statementRecord.id === record.id) {
        setStatementRecord(record);
    }
    
    setEditingPayment(null);
};

export const handleDeletePayment = async (recordId: string, paymentId: string) => {
    if (!window.confirm("Adakah anda pasti untuk memadam rekod pembayaran ini?")) return;
    
    const recordIndex = records.findIndex(r => r.id === recordId);
    if (recordIndex === -1) return;

    const updatedRecords = [...records];
    const record = { ...updatedRecords[recordIndex] };
    const paymentIndex = record.paymentHistory?.findIndex(p => p.id === paymentId) ?? -1;
    
    if (paymentIndex === -1 || !record.paymentHistory) return;

    const oldPayment = record.paymentHistory[paymentIndex];
    
    record.paymentHistory = record.paymentHistory.filter(p => p.id !== paymentId);
    record.bakiFeeTerkini = record.bakiFeeTerkini + (oldPayment.amount || 0);
    record.bakiMileage = (record.bakiMileage || 0) + (oldPayment.mileageAmount || 0);
    
    const sortedPayments = [...record.paymentHistory].sort((a: any, b: any) => {
      const partsA = a.date.split('/');
      const partsB = b.date.split('/');
      return new Date(`${partsB[2]}-${partsB[1]}-${partsB[0]}`).getTime() - new Date(`${partsA[2]}-${partsA[1]}-${partsA[0]}`).getTime();
    });
    
    if (sortedPayments.length > 0) {
      record.bayaranTerakhir = sortedPayments[0].amount || sortedPayments[0].mileageAmount || 0;
      record.tarikh = sortedPayments[0].date;
    } else {
      record.bayaranTerakhir = 0;
      // You could set tarikh to created date or something, but let's keep it as is or empty
    }

    updatedRecords[recordIndex] = record;
    setRecords(updatedRecords);
    
    if (user) {
        try {
            await setDoc(doc(db, 'users', user.uid, 'records', record.id), record);
            silentBackupToCloud(updatedRecords);
        } catch(err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/records/${record.id}`);
        }
    }
    
    if (statementRecord && statementRecord.id === record.id) {
        setStatementRecord(record);
    }
};
