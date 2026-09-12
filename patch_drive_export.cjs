const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const t1 = `  const handleSyncGoogleSheets = async () => {`;
const r1 = `  const handleExportDBToDrive = async () => {
    if (!user) {
      alert("Sila log masuk untuk mengeksport pangkalan data.");
      return;
    }
    
    const folderName = window.prompt("Sila masukkan nama folder di Google Drive (atau biarkan lalai):", "HMA_Database_Backup");
    if (folderName === null) return; // cancelled
    
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
      
      // Fetch entire database
      const [recordsSnap, receiptsSnap] = await Promise.all([
         getDocs(collection(db, \`users/\${user.uid}/records\`)),
         getDocs(collection(db, \`users/\${user.uid}/receipts\`))
      ]);
      
      const dbExport = {
        exportedAt: new Date().toISOString(),
        userId: user.uid,
        records: recordsSnap.docs.map(d => d.data()),
        receipts: receiptsSnap.docs.map(d => d.data())
      };
      
      const jsonContent = JSON.stringify(dbExport, null, 2);
      const fileName = \`HMA_DB_Export_\${new Date().toISOString().slice(0,10)}.json\`;
      const metadata = {
        name: fileName,
        mimeType: 'application/json'
      };

      // Find or Create Folder
      let folderId = null;
      if (folderName.trim()) {
        const searchRes = await fetch(\`https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder' and name='\${folderName.trim()}' and trashed=false\`, {
           headers: { 'Authorization': \`Bearer \${token}\` }
        });
        if (searchRes.ok) {
           const searchData = await searchRes.json();
           if (searchData.files && searchData.files.length > 0) {
              folderId = searchData.files[0].id;
           }
        }
        
        if (!folderId) {
           const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
              method: 'POST',
              headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: folderName.trim(), mimeType: 'application/vnd.google-apps.folder' })
           });
           if (createFolderRes.ok) {
              const folderData = await createFolderRes.json();
              folderId = folderData.id;
           }
        }
      }
      
      if (folderId) {
         metadata.parents = [folderId];
      }

      // Upload file using multipart upload
      const boundary = '-------314159265358979323846';
      const delimiter = "\\r\\n--" + boundary + "\\r\\n";
      const close_delim = "\\r\\n--" + boundary + "--";

      const multipartRequestBody =
          delimiter +
          'Content-Type: application/json\\r\\n\\r\\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\\r\\n\\r\\n' +
          jsonContent +
          close_delim;

      const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${token}\`,
          'Content-Type': \`multipart/related; boundary=\${boundary}\`
        },
        body: multipartRequestBody
      });

      if (!uploadRes.ok) {
          if (uploadRes.status === 401 || uploadRes.status === 403) {
             setCachedAccessToken(null);
             throw new Error("Sesi keizinan tamat. Sila log masuk semula.");
          }
          throw new Error('Gagal memuat naik fail ke Google Drive');
      }

      alert(\`Pangkalan data berjaya dieksport ke Google Drive!\`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Gagal mengeksport pangkalan data.");
    }
  };

  const handleSyncGoogleSheets = async () => {`;

const t2 = `            <button 
              onClick={handleSyncGoogleSheets}`;
const r2 = `            <button
              onClick={handleExportDBToDrive}
              className="hidden lg:flex p-2 sm:px-4 sm:py-2 items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-lg font-medium cursor-pointer shrink-0 transition-all">
              <Cloud size={14} />
              <span className="hidden sm:inline">Eksport Drive (JSON)</span>
            </button>
            <button 
              onClick={handleSyncGoogleSheets}`;

if (code.includes(t1) && code.includes(t2)) {
  code = code.replace(t1, r1);
  code = code.replace(t2, r2);
  fs.writeFileSync('src/App.tsx', code, 'utf-8');
  console.log('Export DB to Drive button added successfully');
} else {
  console.log('Failed to find replacement targets.');
}
