const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Insert states
const stateInjection = `
  const [isImportingContacts, setIsImportingContacts] = useState(false);
  const [cachedAccessToken, setCachedAccessToken] = useState<string | null>(null);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  const handleImportContacts = async () => {
    setIsImportingContacts(true);
    try {
        let token = cachedAccessToken;
        if (!token) {
            const provider = new GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
            provider.addScope('https://www.googleapis.com/auth/contacts.other.readonly');
            provider.addScope('https://www.googleapis.com/auth/directory.readonly');
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            token = credential?.accessToken || null;
            if (token) {
                setCachedAccessToken(token);
            }
        }
        
        if (!token) {
            throw new Error("No access token");
        }
        
        const response = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses,organizations&pageSize=1000', {
            headers: { Authorization: \`Bearer \${token}\` }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                 setCachedAccessToken(null);
                 alert('Sesi tamat atau tiada kebenaran. Sila cuba lagi.');
            }
            throw new Error(\`API error: \${response.status}\`);
        }
        
        const data = await response.json();
        
        if (!data.connections || data.connections.length === 0) {
            alert("Tiada kontak dijumpai di dalam Google Contacts anda.");
            return;
        }
        
        setAvailableContacts(data.connections);
        setIsContactPickerOpen(true);
        
    } catch (err) {
        console.error(err);
        alert("Gagal mengimport kontak.");
    } finally {
        setIsImportingContacts(false);
    }
  };

  const handleSelectContact = (contact: any) => {
    const name = contact.names?.[0]?.displayName || '';
    const phone = contact.phoneNumbers?.[0]?.value || '';
    
    setNewRecordData(prev => ({
        ...prev,
        nama: name,
        telefon: phone
    }));
    setIsContactPickerOpen(false);
  };
`;

code = code.replace("const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);", "const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);" + stateInjection);

// Add the button to the new record modal
const importButtonCode = `
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider mb-0">
                      Nama Pelanggan / Entiti
                    </label>
                    <button
                      type="button"
                      onClick={handleImportContacts}
                      disabled={isImportingContacts}
                      className="flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md transition-colors"
                      title="Import dari Google Contacts"
                    >
                      {isImportingContacts ? <Loader2 size={12} className="animate-spin" /> : <Users size={12} />}
                      Import dari Contacts
                    </button>
                  </div>
`;

code = code.replace(/<label className="block text-\[11px\] font-semibold text-\[#71717a\] dark:text-\[#a1a1aa\] mb-2 uppercase tracking-wider">\s*Nama Pelanggan \/ Entiti\s*<\/label>/g, importButtonCode);

// Add the Contact Picker Modal
const contactPickerModalCode = `
      {/* Contact Picker Modal */}
      <AnimatePresence>
        {isContactPickerOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#ffffff] dark:bg-zinc-900 rounded-xl shadow-2xl border border-[#e4e4e7] dark:border-zinc-800 w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#f4f4f5] dark:border-zinc-800 bg-[#fafafa] dark:bg-zinc-900/50">
                <h3 className="font-semibold text-[#18181b] dark:text-white flex items-center gap-2">
                  <Users size={18} className="text-blue-500" />
                  Pilih Kontak
                </h3>
                <button onClick={() => setIsContactPickerOpen(false)} className="text-[#a1a1aa] hover:text-[#52525b] dark:hover:text-zinc-300 p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 border-b border-[#f4f4f5] dark:border-zinc-800">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
                  <input
                    type="text"
                    placeholder="Cari kontak..."
                    className="w-full pl-9 pr-3 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 text-[#18181b] dark:text-white"
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                {availableContacts
                  .filter(c => {
                    const name = c.names?.[0]?.displayName || '';
                    const phone = c.phoneNumbers?.[0]?.value || '';
                    const query = contactSearchQuery.toLowerCase();
                    return name.toLowerCase().includes(query) || phone.toLowerCase().includes(query);
                  })
                  .map((contact, idx) => (
                  <button
                    key={contact.resourceName || idx}
                    onClick={() => handleSelectContact(contact)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group"
                  >
                    <div>
                      <div className="font-medium text-sm text-[#18181b] dark:text-white">
                        {contact.names?.[0]?.displayName || 'Tiada Nama'}
                      </div>
                      <div className="text-xs text-[#71717a] dark:text-[#a1a1aa] mt-0.5">
                        {contact.phoneNumbers?.[0]?.value || 'Tiada No. Telefon'}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#a1a1aa] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

code = code.replace("{/* Modals */}", "{/* Modals */}\n" + contactPickerModalCode);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx with Contacts logic");
