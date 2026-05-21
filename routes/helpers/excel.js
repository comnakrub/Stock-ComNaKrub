const XLSX = require('xlsx');

function parseExcel(buffer, fields) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  return rows.map(row => {
    const clean = {};
    fields.forEach(f => { clean[f] = row[f] ?? null; });
    return clean;
  });
}

function generateTemplate(fields) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([fields]);
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { parseExcel, generateTemplate };
