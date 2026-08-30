const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove Emel from add record modal
const addModalEmel = `<div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Emel</label>
                      <input
                        type="email"
                        className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100"
                        placeholder="Contoh: ali@example.com"
                        value={newRecordData.emel || ''}
                        onChange={(e) => setNewRecordData({ ...newRecordData, emel: e.target.value })}
                      />
                    </div>`;
code = code.replace(addModalEmel, '');

// 2. Remove Emel from edit record modal
const editModalEmel = `<div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Emel</label>
                      <input
                        type="email"
                        className="px-3 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100"
                        placeholder="Contoh: ali@example.com"
                        value={editingRecord.emel || ''}
                        onChange={(e) => setEditingRecord({ ...editingRecord, emel: e.target.value })}
                      />
                    </div>`;
code = code.replace(editModalEmel, '');

// 3. Remove Emel from CSV headers
code = code.replace(
  "const headers = ['Nama', 'Telefon', 'Emel', 'Alamat', 'Kes', 'Total Fee', 'Bayaran Terakhir', 'Tarikh Akhir', 'Baki Sebelum', 'Baki Fee Terkini', 'Baki Mileage'];",
  "const headers = ['Nama', 'Telefon', 'Alamat', 'Kes', 'Total Fee', 'Bayaran Terakhir', 'Tarikh Akhir', 'Baki Sebelum', 'Baki Fee Terkini', 'Baki Mileage'];"
);

// 4. Remove Emel from CSV rows mapping
code = code.replace(
  /\`"\\\$\{r\.nama\}\"\`, \`"\\\$\{r\.telefon \|\| ''\}\"\`, \`"\\\$\{r\.emel \|\| ''\}\"\`, \`"\\\$\{\(r\.alamat \|\| ''\)\.replace\(\/\"\/g, '\"\"'\)\}\"\`/g,
  "`\"${r.nama}\"`, `\"${r.telefon || ''}\"`, `\"${(r.alamat || '').replace(/\"/g, '\"\"')}\"`"
);

// 5. Remove Emel from Print view
const printEmel = `'Emel': r.emel || '',`;
code = code.replace(printEmel, '');

const tableHeaderEmel = `'No', 'Tarikh Kemaskini', 'Nama Pelanggan', 'No. Telefon', 'Emel', 'Alamat', 'Kategori Kes', 'Nota', `;
code = code.replace(tableHeaderEmel, `'No', 'Tarikh Kemaskini', 'Nama Pelanggan', 'No. Telefon', 'Alamat', 'Kategori Kes', 'Nota', `);

const printRowEmel = `          \`"\$\{r.emel || ''\}"\`,
`;
code = code.replace(printRowEmel, '');

// 6. CSV Import
code = code.replace(
  /emel: headers\.findIndex\(h => h\.includes\('emel'\)\),/,
  ''
);

const csvRawEmel = `            const rawEmel = indices.emel !== -1 ? values[indices.emel] : '';`;
code = code.replace(csvRawEmel, '');

const parsedCsvEmel = `            emel: rawEmel,`;
code = code.replace(parsedCsvEmel, '');

const handleNewEmel = `if (newRecordData.emel) newRecord.emel = newRecordData.emel;`;
code = code.replace(handleNewEmel, '');

const saveHandleNewEmel = `if (newRecordData.emel) newRecord.emel = newRecordData.emel;`;
code = code.replace(saveHandleNewEmel, '');

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx for Emel");
