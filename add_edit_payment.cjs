const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetState = `  const [editingRecord, setEditingRecord] = useState<CaseRecord | null>(null);`;
const replaceState = `  const [editingRecord, setEditingRecord] = useState<CaseRecord | null>(null);
  const [editingPaymentDetails, setEditingPaymentDetails] = useState<{record: CaseRecord, payment: any} | null>(null);
  const [editingPaymentAmount, setEditingPaymentAmount] = useState<string>('');
  const [editingPaymentMileage, setEditingPaymentMileage] = useState<string>('');
  const [editingPaymentDate, setEditingPaymentDate] = useState<string>('');
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<string>('Cash');
  const [editingPaymentNote, setEditingPaymentNote] = useState<string>('');`;

const targetBtn = `                    <button 
                      onClick={async () => {
                        if (window.confirm('Padam rekod bayaran ini?')) {`;
const replaceBtn = `                    <button 
                      title="Kemaskini Bayaran"
                      onClick={() => {
                        setEditingPaymentDetails({record, payment});
                        setEditingPaymentAmount((payment.amount || 0).toString());
                        setEditingPaymentMileage((payment.mileageAmount || 0).toString());
                        setEditingPaymentDate(formatDateISO(payment.date));
                        setEditingPaymentMethod(payment.method || 'Cash');
                        setEditingPaymentNote(payment.nota || '');
                      }}
                      className="p-1 text-amber-500 hover:text-amber-700 transition-colors rounded hover:bg-amber-50"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      title="Padam Bayaran"
                      onClick={async () => {
                        if (window.confirm('Padam rekod bayaran ini?')) {`;

code = code.replace(targetState, replaceState);
code = code.split(targetBtn).join(replaceBtn);
fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('States and buttons added');
