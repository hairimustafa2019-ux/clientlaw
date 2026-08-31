const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\/\* Hidden PDF renderer for ZIP generation \*\/\}\s*\{zipQueue && zipCurrentIndex < zipQueue\.length && zipQueue\[zipCurrentIndex\] && \(/;
const startIdx = code.search(regex);
if(startIdx !== -1) {
  let block = code.substring(startIdx);
  // find matching end parenthesis for the condition
  // Actually, we can just replace everything in the rest of the file
  let newBlock = block.replace(/\{zipQueue && zipCurrentIndex < zipQueue\.length && zipQueue\[zipCurrentIndex\] && \(/, 
  `{/* Hidden PDF renderer for ZIP and Quick Print generation */}
      {(() => {
        const currentRenderData = quickPrintData || (zipQueue && zipQueue[zipCurrentIndex]);
        return currentRenderData && (`);
  
  newBlock = newBlock.replace(/zipQueue\[zipCurrentIndex\]/g, 'currentRenderData');
  
  // also close the IIFE. The block ends with `)}`
  // I will just replace the very last `      )}` before `    </div>` if it's there.
  
  // Let's do a more robust string replacement:
  code = code.substring(0, startIdx) + newBlock;
  
  // the ending `)}` needs to be `); })()}`
  const endRegex = /\s*\)\}\s*<\/div>\s*<\/div>\s*$/; // wait it's not the end of file
  
  fs.writeFileSync('src/tmp_code.txt', code);
  console.log("Replaced start block");
}
