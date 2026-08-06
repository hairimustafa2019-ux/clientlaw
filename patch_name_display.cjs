const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  <div className="flex items-center justify-between group">
    <span>{record.nama}</span>
    <button 
      onClick={(e) => { e.stopPropagation(); setClientProfileName(record.nama); }}`;

const replaceStr = `  <div className="flex items-center justify-between group">
    <span>
      {index > 0 && filteredRecords[index - 1].nama === record.nama ? (
        <span className="text-zinc-300 dark:text-zinc-700 font-normal select-none" title={record.nama}>"</span>
      ) : (
        record.nama
      )}
    </span>
    <button 
      onClick={(e) => { e.stopPropagation(); setClientProfileName(record.nama); }}`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
