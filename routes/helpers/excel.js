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

function generateExport(rows, fields, sheetName) {
  const headers = [...fields, 'TotalCost'];
  const data = rows.map(row => headers.map(f => row[f] ?? null));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { parseExcel, generateTemplate, generateExport };
