const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const filteredRecordsMatch = code.match(/(\/\/ Filter records\n  const filteredRecords = useMemo\(\(\) => \{[\s\S]*?\}, \[searchTerm, filterKes, filterStartDate, filterEndDate, records, dateSortOrder, nameSortOrder\]\);\n)/);
const statsMatch = code.match(/(\/\/ Derive summary statistics\n  const stats = useMemo\(\(\) => \{[\s\S]*?\}, \[records, overdueDays\]\);\n)/);
const chartDataMatch = code.match(/(\/\/ Compute chart data for balances by category\n  const chartData = useMemo\(\(\) => \{[\s\S]*?\}, \[records\]\);\n)/);

if (filteredRecordsMatch && statsMatch && chartDataMatch) {
  // Remove them from current positions
  code = code.replace(filteredRecordsMatch[0], '');
  code = code.replace(statsMatch[0], '');
  code = code.replace(chartDataMatch[0], '');

  // Modify them
  let newStats = statsMatch[0].replace(/records\.reduce/g, 'filteredRecords.reduce');
  newStats = newStats.replace(/totalKes: records\.length/g, 'totalKes: filteredRecords.length');
  newStats = newStats.replace(/\[records, overdueDays\]/g, '[filteredRecords, overdueDays]');

  let newChartData = chartDataMatch[0].replace(/records\.forEach/g, 'filteredRecords.forEach');
  newChartData = newChartData.replace(/\[records\]/g, '[filteredRecords]');

  // Insert them back in the new order
  const newOrder = filteredRecordsMatch[0] + '\n' + newStats + '\n' + newChartData;
  
  // Find where to inject them. Let's find uniqueKes
  const uniqueKesMatch = code.match(/(\/\/ Extract unique cases for the dropdown\n  const uniqueKes = useMemo\(\(\) => \{[\s\S]*?\}, \[\]\);\n)/);
  if (uniqueKesMatch) {
    code = code.replace(uniqueKesMatch[0], newOrder + '\n' + uniqueKesMatch[0]);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Successfully patched");
  } else {
    console.log("Failed to find uniqueKesMatch");
  }
} else {
  console.log("Failed to find matches");
}
