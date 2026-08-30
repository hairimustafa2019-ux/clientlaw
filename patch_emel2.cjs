const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The remaining ones:
code = code.replace(/const emel = formData\.get\('emel'\) as string;\s*/, '');
code = code.replace(/telefon, emel, alamat/, 'telefon, alamat');

code = code.replace(
  /\`"\\\$\{r\.nama\}\"\`, \`"\\\$\{r\.telefon \|\| ''\}\"\`, \`"\\\$\{r\.emel \|\| ''\}\"\`, \`"\\\$\{\(r\.alamat \|\| ''\)\.replace\(\/\"\/g, '\"\"'\)\}\"\`/g,
  "`\"${r.nama}\"`, `\"${r.telefon || ''}\"`, `\"${(r.alamat || '').replace(/\"/g, '\"\"')}\"`"
);

// Receipt print configuration form has an Emel field
const receiptEmel = /<div[^>]*>\s*<label[^>]*>Emel<\/label>\s*<input name="emel"[^>]*>\s*<\/div>/g;
code = code.replace(receiptEmel, '');

// Also manually find lines with <input name="emel" and remove its parent div.
const printEmelBlock = `<div>
                            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1 uppercase">Emel</label>
                            <input name="emel" type="email" defaultValue={firstCase.emel || ''} className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="emel@contoh.com" />
                          </div>`;
code = code.replace(printEmelBlock, '');

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx for Emel 2");
