const request = require('supertest');
const express = require('express');
const { createTestDb } = require('./helpers/db');
const createDiyRouter = require('../routes/diy');
const createCategoryRouter = require('../routes/helpers/route-factory');

let app, db;

beforeEach(() => {
  db = createTestDb();
  app = express();
  app.use(express.json());
  // Mount cpu + ram so DIY can reference them
  app.use('/api/cpu', createCategoryRouter(db, {
    table: 'cpu',
    fields: ['Type', 'Brand', 'Model', 'Package', 'Socket', 'Codename', 'Total', 'Cost', 'Note'],
  }));
  app.use('/api/ram', createCategoryRouter(db, {
    table: 'ram',
    fields: ['Type', 'Brand', 'Color', 'RGB', 'Package', 'Model', 'MemoryType', 'BUS', 'MemorySize', 'Total', 'Cost', 'Note'],
  }));
  app.use('/api/diy', createDiyRouter(db));
});

afterEach(() => db.close());

describe('GET /api/diy/catalog', () => {
  test('returns 8 categories with empty items when no stock', async () => {
    const res = await request(app).get('/api/diy/catalog');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(8);
    expect(res.body[0]).toHaveProperty('category');
    expect(res.body[0]).toHaveProperty('items');
    expect(res.body[0].items).toEqual([]);
  });

  test('returns only items with Total > 0', async () => {
    db.prepare(`INSERT INTO cpu (Type, Total, Cost) VALUES (?, ?, ?)`).run('CPU A', 3, 1000);
    db.prepare(`INSERT INTO cpu (Type, Total, Cost) VALUES (?, ?, ?)`).run('CPU B', 0, 2000);
    const res = await request(app).get('/api/diy/catalog');
    const cpuCat = res.body.find(c => c.category === 'cpu');
    expect(cpuCat.items).toHaveLength(1);
    expect(cpuCat.items[0].Type).toBe('CPU A');
  });
});

describe('POST /api/diy/confirm', () => {
  test('deducts Total by 1 for each selected item and returns txId', async () => {
    const { lastInsertRowid: cpuId } = db.prepare(
      `INSERT INTO cpu (Type, Total, Cost) VALUES (?, ?, ?)`
    ).run('CPU A', 5, 1000);
    const { lastInsertRowid: ramId } = db.prepare(
      `INSERT INTO ram (Type, Total, Cost) VALUES (?, ?, ?)`
    ).run('RAM A', 3, 500);

    const res = await request(app)
      .post('/api/diy/confirm')
      .send([{ table: 'cpu', id: cpuId }, { table: 'ram', id: ramId }]);

    expect(res.status).toBe(200);
    expect(res.body.txId).toBeDefined();

    const cpu = db.prepare(`SELECT Total FROM cpu WHERE id = ?`).get(cpuId);
    const ram = db.prepare(`SELECT Total FROM ram WHERE id = ?`).get(ramId);
    expect(cpu.Total).toBe(4);
    expect(ram.Total).toBe(2);
  });

  test('returns 400 if item has Total = 0 (rolls back entire transaction)', async () => {
    const { lastInsertRowid: cpuId } = db.prepare(
      `INSERT INTO cpu (Type, Total, Cost) VALUES (?, ?, ?)`
    ).run('CPU A', 0, 1000);

    const res = await request(app)
      .post('/api/diy/confirm')
      .send([{ table: 'cpu', id: cpuId }]);

    expect(res.status).toBe(400);
    // Total must remain 0 (rollback)
    const cpu = db.prepare(`SELECT Total FROM cpu WHERE id = ?`).get(cpuId);
    expect(cpu.Total).toBe(0);
  });

  test('returns 400 for empty selections array', async () => {
    const res = await request(app).post('/api/diy/confirm').send([]);
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid table name', async () => {
    const res = await request(app)
      .post('/api/diy/confirm')
      .send([{ table: 'hackers', id: 1 }]);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/diy/restore/:txId', () => {
  test('restores Total by 1 and deletes the transaction', async () => {
    const { lastInsertRowid: cpuId } = db.prepare(
      `INSERT INTO cpu (Type, Total, Cost) VALUES (?, ?, ?)`
    ).run('CPU A', 4, 1000);

    // Confirm first
    const confirmRes = await request(app)
      .post('/api/diy/confirm')
      .send([{ table: 'cpu', id: cpuId }]);
    const { txId } = confirmRes.body;

    // Now restore
    const restoreRes = await request(app).post(`/api/diy/restore/${txId}`);
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.restored).toBe(true);

    // Total should be back to 4
    const cpu = db.prepare(`SELECT Total FROM cpu WHERE id = ?`).get(cpuId);
    expect(cpu.Total).toBe(4);

    // Transaction record should be gone
    const tx = db.prepare(`SELECT * FROM diy_transactions WHERE id = ?`).get(txId);
    expect(tx).toBeUndefined();
  });

  test('returns 404 for unknown txId', async () => {
    const res = await request(app).post('/api/diy/restore/nonexistent-id');
    expect(res.status).toBe(404);
  });
});
