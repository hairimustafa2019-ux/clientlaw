const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetState = `const [isBackingUp, setIsBackingUp] = useState(false);`;
const replacementState = `const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);`;
code = code.replace(targetState, replacementState);


const targetFn = `const handleExportData = () => {`;
const replacementFn = `
  const handleSyncGoogleSheets = async () => {
    setIsSyncingSheets(true);
    try {
        let token = cachedAccessToken;
        if (!token) {
            const provider = new GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/drive.file');
            provider.addScope('https://www.googleapis.com/auth/spreadsheets');
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            token = credential?.accessToken || null;
            if (token) {
                setCachedAccessToken(token);
            } else {
                throw new Error("Failed to get Google access token");
            }
        }
        
        // 1. Create a new Spreadsheet
        const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
            method: 'POST',
            headers: {
                'Authorization': \`Bearer \${token}\`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: {
                    title: \`Data Kes HMA - \${new Date().toLocaleString()}\`
                }
            })
        });
        
        if (!createRes.ok) {
            if (createRes.status === 401 || createRes.status === 403) {
                 setCachedAccessToken(null); // Invalid token, force re-auth next time
                 throw new Error("Sesi keizinan tamat. Sila klik butang sekali lagi untuk log masuk semula.");
            }
            throw new Error('Gagal mencipta lembaran Google Sheet');
        }
        
        const spreadsheet = await createRes.json();
        const spreadsheetId = spreadsheet.spreadsheetId;
        
        // 2. Prepare data
        const headers = ['ID Rekod', 'Nama Pelanggan', 'Telefon', 'Alamat', 'Kategori Kes', 'Total Fee (RM)', 'Baki Fee Terkini (RM)', 'Baki Mileage (RM)', 'Tarikh', 'Nota'];
        const rows = filteredRecords.map(r => [
            r.id,
            r.nama,
            r.telefon || '',
            r.alamat || '',
            r.kes,
            r.totalFee.toString(),
            r.bakiFeeTerkini.toString(),
            (r.bakiMileage || 0).toString(),
            r.tarikh,
            r.nota || ''
        ]);
        
        // 3. Update spreadsheet
        const updateRes = await fetch(\`https://sheets.googleapis.com/v4/spreadsheets/\${spreadsheetId}/values/Sheet1!A1:J\${rows.length + 1}?valueInputOption=USER_ENTERED\`, {
            method: 'PUT',
            headers: {
                'Authorization': \`Bearer \${token}\`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: [headers, ...rows]
            })
        });
        
        if (!updateRes.ok) {
            throw new Error('Gagal mengemas kini data ke Google Sheet');
        }
        
        window.open(\`https://docs.google.com/spreadsheets/d/\${spreadsheetId}/edit\`, '_blank');
        
    } catch (e: any) {
        console.error(e);
        alert('Ralat menyegerak ke Google Sheets: ' + e.message);
    } finally {
        setIsSyncingSheets(false);
    }
  };

  const handleExportData = () => {`;
code = code.replace(targetFn, replacementFn);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Patched function.");
