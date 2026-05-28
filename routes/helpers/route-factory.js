const express = require('express');
const multer = require('multer');
const { parseExcel, generateTemplate, generateExport } = require('./excel');

const upload = multer({ storage: multer.memoryStorage() });

function createCategoryRouter(db, { table, fields }) {
  const router = express.Router();

  // GET all — includes computed TotalCost
  router.get('/', (req, res) => {
    const rows = db.prepare(
      `SELECT *, Cost * Total AS TotalCost FROM ${table} ORDER BY id`
    ).all();
    res.json(rows);
  });

  // POST create
  router.post('/', (req, res) => {
    const cols = fields.filter(f => f in req.body);
    if (!cols.length) return res.status(400).json({ error: 'no fields provided' });
    const stmt = db.prepare(
      `INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`
    );
    const result = stmt.run(...cols.map(f => req.body[f] ?? null));
    const row = db.prepare(
      `SELECT *, Cost * Total AS TotalCost FROM ${table} WHERE id = ?`
    ).get(result.lastInsertRowid);
    res.status(201).json(row);
  });

  // PUT update
  router.put('/:id', (req, res) => {
    const cols = fields.filter(f => f in req.body);
    if (!cols.length) return res.status(400).json({ error: 'no fields to update' });
    const stmt = db.prepare(
      `UPDATE ${table} SET ${cols.map(f => `${f} = ?`).join(', ')} WHERE id = ?`
    );
    const result = stmt.run(...cols.map(f => req.body[f] ?? null), req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'not found' });
    const row = db.prepare(
      `SELECT *, Cost * Total AS TotalCost FROM ${table} WHERE id = ?`
    ).get(req.params.id);
    res.json(row);
  });

  // DELETE
  router.delete('/:id', (req, res) => {
    const result = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: true });
  });

  // POST /import — upload .xlsx, bulk insert
  router.post('/import', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'no file uploaded' });
    try {
      const rows = parseExcel(req.file.buffer, fields);
      if (!rows.length) return res.status(400).json({ error: 'no rows found in file' });
      const insert = db.prepare(
        `INSERT INTO ${table} (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`
      );
      const insertMany = db.transaction(rows => {
        for (const row of rows) insert.run(...fields.map(f => row[f] ?? null));
      });
      insertMany(rows);
      res.json({ imported: rows.length });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET /export — download all current data as .xlsx
  router.get('/export', (req, res) => {
    const rows = db.prepare(
      `SELECT *, Cost * Total AS TotalCost FROM ${table} ORDER BY id`
    ).all();
    const buf = generateExport(rows, fields, table.toUpperCase());
    res.setHeader('Content-Disposition', `attachment; filename="${table}-export.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  });

  // GET /template — download blank .xlsx with correct headers
  router.get('/template', (req, res) => {
    const buf = generateTemplate(fields);
    res.setHeader('Content-Disposition', `attachment; filename="${table}-template.xlsx"`);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.send(buf);
  });

  return router;
}

module.exports = createCategoryRouter;
