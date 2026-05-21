const express = require('express');
const { randomUUID } = require('crypto');

const VALID_TABLES = ['cpu', 'ram', 'm2', 'ssd', 'mainboard', 'vga', 'psu', 'monitor'];

module.exports = (db) => {
  const router = express.Router();

  // GET /api/diy/catalog
  router.get('/catalog', (req, res) => {
    const catalog = VALID_TABLES.map(table => {
      const items = db.prepare(
        `SELECT id, Type, Cost, Total FROM ${table} WHERE Total > 0 ORDER BY Type`
      ).all();
      return { category: table, items };
    });
    res.json(catalog);
  });

  // POST /api/diy/confirm
  router.post('/confirm', (req, res) => {
    const selections = req.body;
    if (!Array.isArray(selections) || !selections.length) {
      return res.status(400).json({ error: 'selections must be a non-empty array' });
    }

    const deduct = db.transaction((items) => {
      for (const { table, id } of items) {
        if (!VALID_TABLES.includes(table)) {
          throw new Error(`invalid table: ${table}`);
        }
        const result = db.prepare(
          `UPDATE ${table} SET Total = Total - 1 WHERE id = ? AND Total > 0`
        ).run(id);
        if (!result.changes) {
          throw new Error(`out of stock or not found: ${table}/${id}`);
        }
      }
      const txId = randomUUID();
      db.prepare(
        `INSERT INTO diy_transactions (id, created_at, items) VALUES (?, ?, ?)`
      ).run(txId, new Date().toISOString(), JSON.stringify(items));
      return txId;
    });

    try {
      const txId = deduct(selections);
      res.json({ txId });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // POST /api/diy/restore/:txId
  router.post('/restore/:txId', (req, res) => {
    const tx = db.prepare(
      `SELECT * FROM diy_transactions WHERE id = ?`
    ).get(req.params.txId);
    if (!tx) return res.status(404).json({ error: 'transaction not found' });

    const restore = db.transaction((items) => {
      for (const { table, id } of items) {
        db.prepare(`UPDATE ${table} SET Total = Total + 1 WHERE id = ?`).run(id);
      }
      db.prepare(`DELETE FROM diy_transactions WHERE id = ?`).run(tx.id);
    });

    try {
      restore(JSON.parse(tx.items));
      res.json({ restored: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
