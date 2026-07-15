const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetState = `  const [editingRecord, setEditingRecord] = useState<CaseRecord | null>(null);`;
const replacementState = `  const [editingRecord, setEditingRecord] = useState<CaseRecord | null>(null);
  const [mileageAdjustmentRecord, setMileageAdjustmentRecord] = useState<CaseRecord | null>(null);
  const [mileageAdjustmentAmount, setMileageAdjustmentAmount] = useState<string>('');
  const [mileageAdjustmentType, setMileageAdjustmentType] = useState<'tambah' | 'tolak'>('tambah');`;

if (content.includes(targetState)) {
    content = content.replace(targetState, replacementState);
    fs.writeFileSync('src/App.tsx', content);
    console.log("State patched");
} else {
    console.log("State target not found");
}
