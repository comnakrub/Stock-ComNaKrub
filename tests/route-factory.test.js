const request = require('supertest');
const express = require('express');
const XLSX = require('xlsx');
const { createTestDb } = require('./helpers/db');
const createCategoryRouter = require('../routes/helpers/route-factory');

const CPU_CONFIG = {
  table: 'cpu',
  fields: ['Type', 'Brand', 'Model', 'Package', 'Socket', 'Codename', 'Total', 'Cost', 'Note'],
};

let app, db;

beforeEach(() => {
  db = createTestDb();
  app = express();
  app.use(express.json());
  app.use('/api/cpu', createCategoryRouter(db, CPU_CONFIG));
});

afterEach(() => db.close());

// ── GET ──────────────────────────────────────────────────────────────
describe('GET /api/cpu', () => {
  test('returns empty array when no rows', async () => {
    const res = await request(app).get('/api/cpu');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns rows with computed TotalCost', async () => {
    db.prepare(`INSERT INTO cpu (Type, Total, Cost) VALUES (?, ?, ?)`).run('TEST', 3, 1000);
    const res = await request(app).get('/api/cpu');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].TotalCost).toBe(3000);
  });
});

// ── POST ─────────────────────────────────────────────────────────────
describe('POST /api/cpu', () => {
  test('creates row and returns it with TotalCost', async () => {
    const res = await request(app).post('/api/cpu').send({
      Type: 'INTEL I5 GEN14 14500', Brand: 'Intel', Total: 5, Cost: 5200,
    });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.TotalCost).toBe(26000);
    expect(res.body.Type).toBe('INTEL I5 GEN14 14500');
  });

  test('returns 400 when no fields provided', async () => {
    const res = await request(app).post('/api/cpu').send({});
    expect(res.status).toBe(400);
  });
});

// ── PUT ──────────────────────────────────────────────────────────────
describe('PUT /api/cpu/:id', () => {
  test('updates row and returns updated data with TotalCost', async () => {
    const { lastInsertRowid } = db.prepare(
      `INSERT INTO cpu (Type, Total, Cost) VALUES (?, ?, ?)`
    ).run('OLD', 1, 1000);
    const res = await request(app)
      .put(`/api/cpu/${lastInsertRowid}`)
      .send({ Total: 5, Cost: 2000 });
    expect(res.status).toBe(200);
    expect(res.body.Total).toBe(5);
    expect(res.body.TotalCost).toBe(10000);
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).put('/api/cpu/9999').send({ Total: 1 });
    expect(res.status).toBe(404);
  });

  test('returns 400 when no fields provided', async () => {
    const res = await request(app).put('/api/cpu/1').send({});
    expect(res.status).toBe(400);
  });
});

// ── DELETE ───────────────────────────────────────────────────────────
describe('DELETE /api/cpu/:id', () => {
  test('deletes row and returns { deleted: true }', async () => {
    const { lastInsertRowid } = db.prepare(
      `INSERT INTO cpu (Type, Total, Cost) VALUES (?, ?, ?)`
    ).run('DEL', 1, 1000);
    const res = await request(app).delete(`/api/cpu/${lastInsertRowid}`);
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
    expect(db.prepare('SELECT * FROM cpu').all()).toHaveLength(0);
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/cpu/9999');
    expect(res.status).toBe(404);
  });
});

// ── IMPORT ───────────────────────────────────────────────────────────
describe('POST /api/cpu/import', () => {
  test('imports rows from xlsx and returns count', async () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Type', 'Brand', 'Total', 'Cost'],
      ['CPU A', 'Intel', 5, 3000],
      ['CPU B', 'AMD',   3, 4000],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const res = await request(app)
      .post('/api/cpu/import')
      .attach('file', buf, { filename: 'test.xlsx', contentType: 'application/octet-stream' });
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(2);
    expect(db.prepare('SELECT * FROM cpu').all()).toHaveLength(2);
  });

  test('returns 400 when no file attached', async () => {
    const res = await request(app).post('/api/cpu/import');
    expect(res.status).toBe(400);
  });
});

// ── TEMPLATE ─────────────────────────────────────────────────────────
describe('GET /api/cpu/template', () => {
  test('returns xlsx file with correct headers', async () => {
    // Supertest doesn't auto-parse binary responses; use buffer + custom parser
    const res = await request(app)
      .get('/api/cpu/template')
      .buffer(true)
      .parse((response, cb) => {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('cpu-template.xlsx');
    const wb = XLSX.read(res.body, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    expect(rows[0]).toEqual(CPU_CONFIG.fields);
  });
});
