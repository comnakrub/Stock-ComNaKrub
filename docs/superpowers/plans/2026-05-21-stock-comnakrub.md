# Stock ComNaKrub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a back-office web app for computer hardware stock management (8 categories, full CRUD + Excel import) and a DIY PC Builder that assembles specs and deducts stock, deployed as a single Docker container.

**Architecture:** Single Express.js app — REST API routes + static file serving from one process. SQLite (better-sqlite3) for persistence. A `route-factory` helper generates all CRUD endpoints from a config object, keeping the 8 category routes DRY. Vanilla JS frontend, no build step.

**Tech Stack:** Node.js 20, Express 4, better-sqlite3, xlsx (SheetJS), multer, dotenv — Jest + Supertest for API tests — Docker for deployment.

---

## File Map

| File | Purpose |
|------|---------|
| `package.json` | Dependencies + npm scripts |
| `.env.example` | Template for env vars |
| `jest.config.js` | Jest configuration |
| `.gitignore` | Ignore node_modules, data/, .env |
| `server.js` | Express entry point — registers all routes, serves static files |
| `db/schema.sql` | All 9 tables: 8 categories + diy_transactions |
| `db/database.js` | Opens + initialises SQLite DB, exports singleton |
| `routes/helpers/route-factory.js` | Factory: given table config → Express Router with GET/POST/PUT/DELETE/import/template |
| `routes/helpers/excel.js` | Parse uploaded .xlsx → rows; generate template .xlsx buffer |
| `routes/cpu.js` | Exports CPU config to route-factory |
| `routes/ram.js` | Exports RAM config to route-factory |
| `routes/m2.js` | Exports M.2 config to route-factory |
| `routes/ssd.js` | Exports SSD config to route-factory |
| `routes/mainboard.js` | Exports Mainboard config to route-factory |
| `routes/vga.js` | Exports VGA config to route-factory |
| `routes/psu.js` | Exports PSU config to route-factory |
| `routes/monitor.js` | Exports Monitor config to route-factory |
| `routes/diy.js` | GET /catalog, POST /confirm, POST /restore/:txId |
| `public/index.html` | Single HTML shell — sidebar + 9 page containers (8 stock + DIY) |
| `public/css/theme.css` | Dark GitHub theme, table, modal, badge styles |
| `public/js/app.js` | Client router, sidebar nav, EN/TH language toggle |
| `public/js/stock.js` | Per-category config, table render, CRUD modals, Excel import |
| `public/js/diy.js` | DIY split panel, catalog tabs, spec list, preview/confirm/restore |
| `tests/helpers/db.js` | Creates in-memory SQLite DB with full schema for tests |
| `tests/route-factory.test.js` | Full CRUD + import + template tests (via cpu table) |
| `tests/diy.test.js` | catalog / confirm / restore tests |
| `Dockerfile` | Node 20 Alpine image |
| `docker-compose.yml` | App service with volume mount for SQLite |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `.env.example`
- Create: `jest.config.js`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "stock-comnakrub",
  "version": "1.0.0",
  "description": "Back-office stock management for computer hardware",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.4"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create .env.example**

```
PORT=3000
DATABASE_PATH=./data/stock.db
```

- [ ] **Step 4: Create jest.config.js**

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
};
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
data/
.env
*.db
```

- [ ] **Step 6: Create empty directories**

```bash
mkdir -p db routes/helpers public/js public/css tests/helpers
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .env.example jest.config.js .gitignore
git commit -m "feat: project scaffolding — deps, jest config, gitignore"
```

---

### Task 2: Database Schema + Connection

**Files:**
- Create: `db/schema.sql`
- Create: `db/database.js`

- [ ] **Step 1: Create db/schema.sql**

```sql
CREATE TABLE IF NOT EXISTS cpu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  Type TEXT NOT NULL,
  Brand TEXT,
  Model TEXT,
  Package TEXT,
  Socket TEXT,
  Codename TEXT,
  Total INTEGER DEFAULT 0,
  Cost REAL DEFAULT 0,
  Note TEXT
);

CREATE TABLE IF NOT EXISTS ram (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  Type TEXT NOT NULL,
  Brand TEXT,
  Color TEXT,
  RGB TEXT,
  Package TEXT,
  Model TEXT,
  MemoryType TEXT,
  BUS INTEGER,
  MemorySize TEXT,
  Total INTEGER DEFAULT 0,
  Cost REAL DEFAULT 0,
  Note TEXT
);

CREATE TABLE IF NOT EXISTS m2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  Type TEXT NOT NULL,
  Brand TEXT,
  Package TEXT,
  Model TEXT,
  M2Type TEXT,
  Interface TEXT,
  Capacity TEXT,
  Total INTEGER DEFAULT 0,
  Cost REAL DEFAULT 0,
  Note TEXT
);

CREATE TABLE IF NOT EXISTS ssd (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  Type TEXT NOT NULL,
  Brand TEXT,
  Package TEXT,
  Model TEXT,
  Interface TEXT,
  Capacity TEXT,
  Total INTEGER DEFAULT 0,
  Cost REAL DEFAULT 0,
  Note TEXT
);

CREATE TABLE IF NOT EXISTS mainboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  Type TEXT NOT NULL,
  Brand TEXT,
  Model TEXT,
  Size TEXT,
  Socket TEXT,
  Chipset TEXT,
  SlotRAM INTEGER,
  SupportRAM TEXT,
  Total INTEGER DEFAULT 0,
  Cost REAL DEFAULT 0,
  Note TEXT
);

CREATE TABLE IF NOT EXISTS vga (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  Type TEXT NOT NULL,
  Brand TEXT,
  Model TEXT,
  Chipset TEXT,
  FAN INTEGER,
  Series TEXT,
  GPUModel TEXT,
  SizeGB INTEGER,
  Total INTEGER DEFAULT 0,
  Cost REAL DEFAULT 0,
  Note TEXT
);

CREATE TABLE IF NOT EXISTS psu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  Type TEXT NOT NULL,
  Brand TEXT,
  Model TEXT,
  Certification TEXT,
  Watt INTEGER,
  Total INTEGER DEFAULT 0,
  Cost REAL DEFAULT 0,
  Note TEXT
);

CREATE TABLE IF NOT EXISTS monitor (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  Type TEXT NOT NULL,
  Brand TEXT,
  Model TEXT,
  Size TEXT,
  Color TEXT,
  PanelType TEXT,
  MaxResolution TEXT,
  RefreshRate TEXT,
  Total INTEGER DEFAULT 0,
  Cost REAL DEFAULT 0,
  Note TEXT
);

CREATE TABLE IF NOT EXISTS diy_transactions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  items TEXT NOT NULL
);
```

- [ ] **Step 2: Create db/database.js**

```js
require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/stock.db');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
```

- [ ] **Step 3: Commit**

```bash
git add db/
git commit -m "feat: SQLite schema (9 tables) + database singleton"
```

---

### Task 3: Route Factory + Excel Helper

**Files:**
- Create: `routes/helpers/excel.js`
- Create: `routes/helpers/route-factory.js`

- [ ] **Step 1: Create routes/helpers/excel.js**

```js
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
```

- [ ] **Step 2: Create routes/helpers/route-factory.js**

```js
const express = require('express');
const multer = require('multer');
const { parseExcel, generateTemplate } = require('./excel');

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
```

- [ ] **Step 3: Commit**

```bash
git add routes/helpers/
git commit -m "feat: route factory (CRUD + import + template) and Excel helper"
```

---

### Task 4: Route Factory Tests

**Files:**
- Create: `tests/helpers/db.js`
- Create: `tests/route-factory.test.js`

- [ ] **Step 1: Create tests/helpers/db.js**

```js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function createTestDb() {
  const db = new Database(':memory:');
  const schema = fs.readFileSync(path.join(__dirname, '../../db/schema.sql'), 'utf8');
  db.exec(schema);
  return db;
}

module.exports = { createTestDb };
```

- [ ] **Step 2: Create tests/route-factory.test.js**

```js
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
    const res = await request(app).get('/api/cpu/template');
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('cpu-template.xlsx');
    const wb = XLSX.read(res.body, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    expect(rows[0]).toEqual(CPU_CONFIG.fields);
  });
});
```

- [ ] **Step 3: Run tests — expect all to pass**

```bash
npm test -- tests/route-factory.test.js
```

Expected output: `Tests: 12 passed`

- [ ] **Step 4: Commit**

```bash
git add tests/
git commit -m "test: route factory full CRUD + import + template coverage"
```

---

### Task 5: All 8 Category Route Files

**Files:**
- Create: `routes/cpu.js`
- Create: `routes/ram.js`
- Create: `routes/m2.js`
- Create: `routes/ssd.js`
- Create: `routes/mainboard.js`
- Create: `routes/vga.js`
- Create: `routes/psu.js`
- Create: `routes/monitor.js`

Each file exports a function `(db) => router` using `createCategoryRouter`.

- [ ] **Step 1: Create routes/cpu.js**

```js
const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'cpu',
  fields: ['Type', 'Brand', 'Model', 'Package', 'Socket', 'Codename', 'Total', 'Cost', 'Note'],
};

module.exports = (db) => createCategoryRouter(db, config);
```

- [ ] **Step 2: Create routes/ram.js**

```js
const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'ram',
  fields: [
    'Type', 'Brand', 'Color', 'RGB', 'Package', 'Model',
    'MemoryType', 'BUS', 'MemorySize', 'Total', 'Cost', 'Note',
  ],
};

module.exports = (db) => createCategoryRouter(db, config);
```

- [ ] **Step 3: Create routes/m2.js**

```js
const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'm2',
  fields: ['Type', 'Brand', 'Package', 'Model', 'M2Type', 'Interface', 'Capacity', 'Total', 'Cost', 'Note'],
};

module.exports = (db) => createCategoryRouter(db, config);
```

- [ ] **Step 4: Create routes/ssd.js**

```js
const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'ssd',
  fields: ['Type', 'Brand', 'Package', 'Model', 'Interface', 'Capacity', 'Total', 'Cost', 'Note'],
};

module.exports = (db) => createCategoryRouter(db, config);
```

- [ ] **Step 5: Create routes/mainboard.js**

```js
const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'mainboard',
  fields: [
    'Type', 'Brand', 'Model', 'Size', 'Socket', 'Chipset',
    'SlotRAM', 'SupportRAM', 'Total', 'Cost', 'Note',
  ],
};

module.exports = (db) => createCategoryRouter(db, config);
```

- [ ] **Step 6: Create routes/vga.js**

```js
const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'vga',
  fields: [
    'Type', 'Brand', 'Model', 'Chipset', 'FAN', 'Series',
    'GPUModel', 'SizeGB', 'Total', 'Cost', 'Note',
  ],
};

module.exports = (db) => createCategoryRouter(db, config);
```

- [ ] **Step 7: Create routes/psu.js**

```js
const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'psu',
  fields: ['Type', 'Brand', 'Model', 'Certification', 'Watt', 'Total', 'Cost', 'Note'],
};

module.exports = (db) => createCategoryRouter(db, config);
```

- [ ] **Step 8: Create routes/monitor.js**

```js
const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'monitor',
  fields: [
    'Type', 'Brand', 'Model', 'Size', 'Color',
    'PanelType', 'MaxResolution', 'RefreshRate', 'Total', 'Cost', 'Note',
  ],
};

module.exports = (db) => createCategoryRouter(db, config);
```

- [ ] **Step 9: Commit**

```bash
git add routes/cpu.js routes/ram.js routes/m2.js routes/ssd.js \
        routes/mainboard.js routes/vga.js routes/psu.js routes/monitor.js
git commit -m "feat: all 8 category route files (cpu/ram/m2/ssd/mainboard/vga/psu/monitor)"
```

---

### Task 6: DIY Route + Tests

**Files:**
- Create: `routes/diy.js`
- Create: `tests/diy.test.js`

- [ ] **Step 1: Write the failing tests first — create tests/diy.test.js**

```js
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
```

- [ ] **Step 2: Run tests — expect them to FAIL (route doesn't exist yet)**

```bash
npm test -- tests/diy.test.js
```

Expected: FAIL — `Cannot find module '../routes/diy'`

- [ ] **Step 3: Create routes/diy.js**

```js
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
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npm test -- tests/diy.test.js
```

Expected: `Tests: 7 passed`

- [ ] **Step 5: Run all tests to confirm nothing broken**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add routes/diy.js tests/diy.test.js
git commit -m "feat: DIY catalog/confirm/restore routes with full test coverage"
```

---

### Task 7: server.js — Wire Everything Up

**Files:**
- Create: `server.js`

- [ ] **Step 1: Create server.js**

```js
require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db/database');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Stock category routes
['cpu', 'ram', 'm2', 'ssd', 'mainboard', 'vga', 'psu', 'monitor'].forEach(cat => {
  app.use(`/api/${cat}`, require(`./routes/${cat}`)(db));
});

// DIY route
app.use('/api/diy', require('./routes/diy')(db));

// SPA fallback — always serve index.html for non-API paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Stock ComNaKrub running at http://localhost:${PORT}`));
}

module.exports = app;
```

- [ ] **Step 2: Create placeholder public/index.html so server starts**

```html
<!DOCTYPE html>
<html><body><h1>Stock ComNaKrub — coming soon</h1></body></html>
```

- [ ] **Step 3: Start server and verify it responds**

```bash
node server.js
```

In another terminal:
```bash
curl http://localhost:3000/api/cpu
```

Expected: `[]`

- [ ] **Step 4: Stop server and commit**

```bash
git add server.js public/index.html
git commit -m "feat: server.js — wires all routes and serves static files"
```

---

### Task 8: Frontend HTML Shell + Theme CSS

**Files:**
- Modify: `public/index.html` (replace placeholder)
- Create: `public/css/theme.css`

- [ ] **Step 1: Create public/css/theme.css**

```css
/* Reset */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

/* Layout */
body {
  font-family: 'Segoe UI', sans-serif;
  background: #0d1117;
  color: #c9d1d9;
  display: flex;
  height: 100vh;
  overflow: hidden;
  font-size: 13px;
}

/* Sidebar */
#sidebar {
  width: 200px;
  background: #161b22;
  border-right: 1px solid #30363d;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
#sidebar .logo {
  padding: 14px 16px;
  color: #58a6ff;
  font-weight: 700;
  font-size: 14px;
  border-bottom: 1px solid #30363d;
}
#sidebar .logo span {
  font-size: 10px;
  color: #8b949e;
  display: block;
  font-weight: 400;
  margin-top: 2px;
}
#sidebar .sec-label {
  padding: 10px 16px 4px;
  font-size: 10px;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 1px;
}
#sidebar .nav-item {
  padding: 7px 16px;
  cursor: pointer;
  color: #8b949e;
  border-left: 3px solid transparent;
  font-size: 13px;
  transition: all 0.15s;
  user-select: none;
}
#sidebar .nav-item:hover { background: #1c2128; color: #c9d1d9; }
#sidebar .nav-item.active { background: #1c2128; color: #58a6ff; border-left-color: #1f6feb; }
#sidebar .nav-item.diy { color: #f0883e; }
#sidebar .nav-item.diy.active { border-left-color: #f0883e; }
#sidebar .lang-row {
  margin-top: auto;
  padding: 10px 16px;
  border-top: 1px solid #30363d;
  display: flex;
  gap: 6px;
}
.lang-btn {
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  border: 1px solid #30363d;
  background: transparent;
  color: #8b949e;
}
.lang-btn.active { background: #1f6feb; color: #fff; border-color: #1f6feb; }

/* Main area */
#main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.topbar {
  background: #161b22;
  border-bottom: 1px solid #30363d;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.topbar h1 { font-size: 15px; color: #c9d1d9; font-weight: 600; }
.spacer { flex: 1; }
.content { flex: 1; overflow: auto; padding: 16px; }

/* Buttons */
.btn {
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  border: none;
  transition: background 0.15s;
}
.btn-primary { background: #1f6feb; color: #fff; }
.btn-primary:hover { background: #388bfd; }
.btn-success { background: #238636; color: #fff; }
.btn-success:hover { background: #2ea043; }
.btn-danger { background: #b91c1c; color: #fff; padding: 3px 7px; font-size: 11px; }
.btn-warning { background: #9e6a03; color: #fff; padding: 3px 7px; font-size: 11px; }
.btn-outline { background: transparent; border: 1px solid #30363d; color: #8b949e; }
.btn-outline:hover { border-color: #58a6ff; color: #58a6ff; }

/* Tables */
.table-wrap {
  border: 1px solid #30363d;
  border-radius: 8px;
  overflow: auto;
  max-height: calc(100vh - 148px);
}
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th {
  background: #161b22;
  padding: 8px 10px;
  text-align: left;
  color: #8b949e;
  font-weight: 500;
  border-bottom: 1px solid #30363d;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}
td { padding: 7px 10px; border-bottom: 1px solid #21262d; white-space: nowrap; }
tr:hover td { background: #1c2128; }
tr:last-child td { border-bottom: none; }
.actions { display: flex; gap: 3px; }

/* Badges */
.badge { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 11px; font-weight: 600; }
.badge-ok { background: #0d4429; color: #3fb950; }
.badge-low { background: #5a1e02; color: #f0883e; }
.badge-zero { background: #3d1212; color: #f85149; }

/* TotalCost column */
.cell-totalcost { color: #58a6ff; font-weight: 500; }

/* Info bar */
.info-bar {
  background: #1c2128;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 8px 14px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #8b949e;
}

/* Pages */
.page { display: none; flex-direction: column; flex: 1; overflow: hidden; }
.page.active { display: flex; }

/* Modal overlay */
.overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 100;
  align-items: flex-start;
  justify-content: center;
  padding-top: 40px;
  overflow-y: auto;
}
.overlay.show { display: flex; }
.modal {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 10px;
  width: 640px;
  max-width: 95vw;
  margin-bottom: 40px;
}
.mhdr {
  padding: 14px 18px;
  border-bottom: 1px solid #30363d;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mhdr h2 { font-size: 14px; color: #c9d1d9; }
.mclose { cursor: pointer; background: none; border: none; color: #8b949e; font-size: 18px; }
.mclose:hover { color: #f85149; }
.mbody { padding: 18px; }
.mfoot { padding: 14px 18px; border-top: 1px solid #30363d; display: flex; justify-content: flex-end; gap: 8px; }

/* Form */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.fg { display: flex; flex-direction: column; gap: 4px; }
.fg.full { grid-column: 1 / -1; }
label { font-size: 11px; color: #8b949e; font-weight: 500; }
.tag-dropdown {
  display: inline-block; padding: 1px 5px; border-radius: 3px;
  font-size: 9px; background: #1f3a5f; color: #58a6ff; margin-left: 4px;
}
.tag-auto {
  display: inline-block; padding: 1px 5px; border-radius: 3px;
  font-size: 9px; background: #0d4429; color: #3fb950; margin-left: 4px;
}
.form-section {
  font-size: 10px; color: #8b949e; text-transform: uppercase; letter-spacing: 1px;
  padding: 4px 0 8px; border-bottom: 1px solid #21262d; margin-bottom: 4px;
  grid-column: 1 / -1;
}
input, select, textarea {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 5px;
  padding: 7px 10px;
  color: #c9d1d9;
  font-size: 12px;
  width: 100%;
}
select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238b949e' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}
select option { background: #161b22; color: #c9d1d9; }
input:focus, select:focus, textarea:focus { outline: none; border-color: #1f6feb; }
input[readonly] { color: #58a6ff; opacity: 0.8; cursor: not-allowed; }
textarea { resize: vertical; min-height: 52px; }

/* DIY Builder */
.diy-body { display: flex; flex: 1; overflow: hidden; }
.diy-left { flex: 1; display: flex; flex-direction: column; border-right: 1px solid #30363d; overflow: hidden; }
.diy-right { width: 310px; display: flex; flex-direction: column; }
.diy-tabs {
  display: flex; gap: 2px; padding: 10px 14px;
  background: #161b22; border-bottom: 1px solid #30363d; flex-wrap: wrap;
}
.diy-tab {
  padding: 4px 9px; border-radius: 4px; cursor: pointer;
  font-size: 11px; color: #8b949e; border: 1px solid transparent; user-select: none;
}
.diy-tab.active { background: #1f6feb; color: #fff; }
.diy-tab:hover:not(.active) { background: #1c2128; color: #c9d1d9; }
.diy-items { flex: 1; overflow-y: auto; padding: 10px 14px; }
.diy-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 10px; border-radius: 6px; margin-bottom: 5px;
  background: #1c2128; border: 1px solid #21262d;
}
.diy-spec-hdr {
  padding: 10px 14px; background: #161b22;
  border-bottom: 1px solid #30363d; font-size: 13px; font-weight: 600;
}
.diy-spec-list { flex: 1; overflow-y: auto; padding: 10px 14px; }
.spec-row { display: flex; align-items: center; padding: 7px 0; border-bottom: 1px solid #21262d; }
.spec-cat { color: #8b949e; font-size: 11px; min-width: 70px; }
.spec-name { color: #c9d1d9; font-size: 11px; flex: 1; padding: 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.spec-price { color: #58a6ff; font-size: 11px; font-weight: 500; min-width: 70px; text-align: right; }
.spec-rm { background: none; border: none; color: #f85149; cursor: pointer; margin-left: 4px; font-size: 13px; }
.diy-foot { padding: 10px 14px; border-top: 1px solid #30363d; background: #161b22; }
.diy-total { display: flex; justify-content: space-between; margin-bottom: 8px; }
.diy-empty { color: #8b949e; font-size: 12px; text-align: center; padding: 20px; }

/* Preview / Confirmed modal rows */
.prev-row {
  display: flex; justify-content: space-between;
  padding: 7px 0; border-bottom: 1px solid #21262d; font-size: 13px;
}
.prev-total { display: flex; justify-content: space-between; padding: 12px 0 0; font-size: 15px; font-weight: 700; }
```

- [ ] **Step 2: Replace public/index.html with the full shell**

```html
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stock ComNaKrub</title>
  <link rel="stylesheet" href="/css/theme.css">
</head>
<body>

<div id="sidebar">
  <div class="logo">Stock ComNaKrub<span>Computer Hardware</span></div>
  <div class="sec-label" data-en="STOCK" data-th="คลังสินค้า">STOCK</div>
  <div class="nav-item active" data-page="cpu">CPU</div>
  <div class="nav-item" data-page="ram">RAM</div>
  <div class="nav-item" data-page="m2">M.2</div>
  <div class="nav-item" data-page="ssd">SSD</div>
  <div class="nav-item" data-page="mainboard" data-en="Mainboard" data-th="เมนบอร์ด">Mainboard</div>
  <div class="nav-item" data-page="vga">VGA</div>
  <div class="nav-item" data-page="psu">PSU</div>
  <div class="nav-item" data-page="monitor" data-en="Monitor" data-th="มอนิเตอร์">Monitor</div>
  <div class="sec-label" data-en="BUILDER" data-th="ประกอบสเปค">BUILDER</div>
  <div class="nav-item diy" data-page="diy" data-en="DIY PC Builder" data-th="ประกอบสเปคคอม">DIY PC Builder</div>
  <div class="lang-row">
    <button class="lang-btn active" onclick="setLang('en')">EN</button>
    <button class="lang-btn" onclick="setLang('th')">TH</button>
  </div>
</div>

<div id="main">
  <!-- Stock pages — one per category, rendered by stock.js -->
  <div class="page active" id="page-cpu"></div>
  <div class="page" id="page-ram"></div>
  <div class="page" id="page-m2"></div>
  <div class="page" id="page-ssd"></div>
  <div class="page" id="page-mainboard"></div>
  <div class="page" id="page-vga"></div>
  <div class="page" id="page-psu"></div>
  <div class="page" id="page-monitor"></div>

  <!-- DIY page — rendered by diy.js -->
  <div class="page" id="page-diy"></div>
</div>

<!-- Modals — populated dynamically by JS -->
<div class="overlay" id="modal-item">
  <div class="modal">
    <div class="mhdr">
      <h2 id="modal-title">Add Item</h2>
      <button class="mclose" onclick="closeModal('modal-item')">✕</button>
    </div>
    <div class="mbody" id="modal-body"></div>
    <div class="mfoot">
      <button class="btn btn-outline" onclick="closeModal('modal-item')"
              data-en="Cancel" data-th="ยกเลิก">Cancel</button>
      <button class="btn btn-primary" onclick="saveItem()"
              data-en="Save" data-th="บันทึก">Save</button>
    </div>
  </div>
</div>

<div class="overlay" id="modal-import">
  <div class="modal">
    <div class="mhdr">
      <h2 data-en="Import Excel" data-th="นำเข้า Excel">Import Excel</h2>
      <button class="mclose" onclick="closeModal('modal-import')">✕</button>
    </div>
    <div class="mbody">
      <p style="color:#8b949e;font-size:12px;margin-bottom:12px"
         data-en="Headers must match field names exactly."
         data-th="ชื่อคอลัมน์ต้องตรงกับชื่อฟิลด์">Headers must match field names exactly.</p>
      <input type="file" id="import-file" accept=".xlsx" style="margin-bottom:10px">
      <div id="import-result" style="font-size:12px;color:#3fb950;margin-top:8px"></div>
    </div>
    <div class="mfoot">
      <button class="btn btn-outline" onclick="downloadTemplate()"
              data-en="Download Template" data-th="ดาวน์โหลดเทมเพลต">Download Template</button>
      <button class="btn btn-primary" onclick="doImport()"
              data-en="Import" data-th="นำเข้า">Import</button>
    </div>
  </div>
</div>

<div class="overlay" id="modal-diy-preview">
  <div class="modal">
    <div class="mhdr">
      <h2 data-en="Spec Preview" data-th="สรุปสเปค">Spec Preview</h2>
      <button class="mclose" onclick="closeModal('modal-diy-preview')">✕</button>
    </div>
    <div class="mbody" id="diy-preview-body"></div>
    <div class="mfoot">
      <button class="btn btn-outline" onclick="closeModal('modal-diy-preview')"
              data-en="Cancel" data-th="ยกเลิก">Cancel</button>
      <button class="btn btn-success" onclick="confirmOrder()"
              data-en="✓ Confirm &amp; Deduct Stock" data-th="✓ ยืนยันและตัด Stock">
        ✓ Confirm &amp; Deduct Stock
      </button>
    </div>
  </div>
</div>

<div class="overlay" id="modal-diy-confirmed">
  <div class="modal">
    <div class="mhdr">
      <h2 style="color:#3fb950" data-en="✓ Stock Deducted" data-th="✓ ตัด Stock สำเร็จ">✓ Stock Deducted</h2>
      <button class="mclose" onclick="closeModal('modal-diy-confirmed')">✕</button>
    </div>
    <div class="mbody">
      <p style="color:#8b949e;font-size:12px;margin-bottom:12px"
         data-en="Stock has been deducted. Click Restore if the customer cancels."
         data-th="ตัด Stock แล้ว กด คืน Stock หากลูกค้ายกเลิก">
        Stock has been deducted. Click Restore if the customer cancels.
      </p>
      <div id="diy-confirmed-body"></div>
    </div>
    <div class="mfoot">
      <button class="btn btn-danger" style="padding:6px 12px;font-size:12px" onclick="restoreOrder()"
              data-en="↩ Restore Stock" data-th="↩ คืน Stock">↩ Restore Stock</button>
      <button class="btn btn-primary" onclick="diyDone()"
              data-en="Done" data-th="เสร็จสิ้น">Done</button>
    </div>
  </div>
</div>

<script src="/js/app.js"></script>
<script src="/js/stock.js"></script>
<script src="/js/diy.js"></script>
</body>
</html>
```

- [ ] **Step 3: Start server, open browser, verify sidebar appears**

```bash
node server.js
```

Open `http://localhost:3000` — should see sidebar and dark background (pages empty, that's expected).

- [ ] **Step 4: Commit**

```bash
git add public/
git commit -m "feat: HTML shell and theme CSS (dark GitHub style)"
```

---

### Task 9: Frontend — app.js (Router + Language Toggle)

**Files:**
- Create: `public/js/app.js`

- [ ] **Step 1: Create public/js/app.js**

```js
// ── Language ──────────────────────────────────────────────────────────
let currentLang = localStorage.getItem('lang') || 'en';

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-en]').forEach(el => {
    el.textContent = lang === 'en' ? el.dataset.en : el.dataset.th;
  });
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.lang-btn[onclick="setLang('${lang}')"]`).classList.add('active');
}

// ── Router ────────────────────────────────────────────────────────────
let currentPage = 'cpu';

function goTo(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');

  if (page === 'diy') {
    loadDiyCatalog();
  } else {
    renderStock(page);
  }
}

// ── Modal helpers ─────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// ── Sidebar navigation ────────────────────────────────────────────────
document.querySelectorAll('.nav-item[data-page]').forEach(el => {
  el.addEventListener('click', () => goTo(el.dataset.page));
});

// ── Init ──────────────────────────────────────────────────────────────
setLang(currentLang);
goTo(currentPage);
```

- [ ] **Step 2: Start server, open browser, click sidebar items — verify pages switch**

```bash
node server.js
```

Open `http://localhost:3000`. Click each sidebar item. URL stays the same but active page changes (pages empty — OK for now).

- [ ] **Step 3: Toggle EN/TH — verify sidebar labels change language**

Click EN / TH buttons. "STOCK" / "คลังสินค้า", "BUILDER" / "ประกอบสเปค" should toggle.

- [ ] **Step 4: Commit**

```bash
git add public/js/app.js
git commit -m "feat: frontend router, sidebar nav, EN/TH language toggle"
```

---

### Task 10: Frontend — stock.js (Table + CRUD Modals + Import)

**Files:**
- Create: `public/js/stock.js`

- [ ] **Step 1: Create public/js/stock.js**

```js
// ── Category configuration ────────────────────────────────────────────
// Each field: { key, labelEn, labelTh, type, options, cascade, readonly }
// type: 'text' | 'number' | 'select' | 'textarea'
// cascade: { on: 'fieldKey', values: { OPTIONVALUE: [...] } }

const CATEGORIES = {
  cpu: {
    labelEn: 'CPU Stock', labelTh: 'คลังสินค้า CPU',
    addLabelEn: '+ Add CPU', addLabelTh: '+ เพิ่ม CPU',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'select', options: ['INTEL', 'AMD'] },
      {
        key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'select',
        cascade: {
          on: 'Brand',
          values: {
            INTEL: ['I3', 'I5', 'I7', 'I9', 'PENTIUM', 'CORE ULTRA 3', 'CORE ULTRA 5', 'CORE ULTRA 7', 'CORE ULTRA 9'],
            AMD: ['Ryzen 3', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9', 'Athlon'],
          },
        },
      },
      { key: 'Package', labelEn: 'Package', labelTh: 'แพ็กเกจ', type: 'select', options: ['Box', 'Tray', 'OEM'] },
      { key: 'Socket', labelEn: 'Socket', labelTh: 'ซ็อกเก็ต', type: 'select', options: ['LGA1700', 'LGA1200', 'AM5', 'AM4'] },
      { key: 'Codename', labelEn: 'Codename', labelTh: 'โค้ดเนม', type: 'text' },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
  ram: {
    labelEn: 'RAM Stock', labelTh: 'คลังสินค้า RAM',
    addLabelEn: '+ Add RAM', addLabelTh: '+ เพิ่ม RAM',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'text' },
      { key: 'Color', labelEn: 'Color', labelTh: 'สี', type: 'select', options: ['Black', 'White', 'Red', 'Blue', 'Silver'] },
      { key: 'RGB', labelEn: 'RGB', labelTh: 'RGB', type: 'select', options: ['Yes', 'No'] },
      { key: 'Package', labelEn: 'Package', labelTh: 'แพ็กเกจ', type: 'select', options: ['Box', 'Tray', 'OEM'] },
      { key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'text' },
      { key: 'MemoryType', labelEn: 'Memory Type', labelTh: 'ประเภทหน่วยความจำ', type: 'select', options: ['DDR4', 'DDR5'] },
      { key: 'BUS', labelEn: 'BUS (MHz)', labelTh: 'BUS (MHz)', type: 'number' },
      { key: 'MemorySize', labelEn: 'Memory Size', labelTh: 'ขนาดหน่วยความจำ', type: 'text' },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
  m2: {
    labelEn: 'M.2 Stock', labelTh: 'คลังสินค้า M.2',
    addLabelEn: '+ Add M.2', addLabelTh: '+ เพิ่ม M.2',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'text' },
      { key: 'Package', labelEn: 'Package', labelTh: 'แพ็กเกจ', type: 'select', options: ['Box', 'Tray', 'OEM'] },
      { key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'text' },
      { key: 'M2Type', labelEn: 'M.2 Type', labelTh: 'ขนาด M.2', type: 'select', options: ['2280', '2260', '2242'] },
      { key: 'Interface', labelEn: 'Interface', labelTh: 'อินเทอร์เฟส', type: 'select', options: ['PCIe 4.0 NVMe', 'PCIe 3.0 NVMe', 'SATA'] },
      { key: 'Capacity', labelEn: 'Capacity', labelTh: 'ความจุ', type: 'text' },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
  ssd: {
    labelEn: 'SSD Stock', labelTh: 'คลังสินค้า SSD',
    addLabelEn: '+ Add SSD', addLabelTh: '+ เพิ่ม SSD',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'text' },
      { key: 'Package', labelEn: 'Package', labelTh: 'แพ็กเกจ', type: 'select', options: ['Box', 'Tray', 'OEM'] },
      { key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'text' },
      { key: 'Interface', labelEn: 'Interface', labelTh: 'อินเทอร์เฟส', type: 'select', options: ['SATA III', 'PCIe 3.0', 'PCIe 4.0'] },
      { key: 'Capacity', labelEn: 'Capacity', labelTh: 'ความจุ', type: 'text' },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
  mainboard: {
    labelEn: 'Mainboard Stock', labelTh: 'คลังสินค้า เมนบอร์ด',
    addLabelEn: '+ Add Mainboard', addLabelTh: '+ เพิ่ม เมนบอร์ด',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'text' },
      { key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'text' },
      { key: 'Size', labelEn: 'Size', labelTh: 'ขนาด', type: 'select', options: ['ATX', 'mATX', 'ITX', 'E-ATX'] },
      { key: 'Socket', labelEn: 'Socket', labelTh: 'ซ็อกเก็ต', type: 'select', options: ['LGA1700', 'LGA1200', 'AM5', 'AM4'] },
      { key: 'Chipset', labelEn: 'Chipset', labelTh: 'ชิปเซ็ต', type: 'select', options: ['H610', 'B660', 'B760', 'Z690', 'Z790', 'A620', 'B650', 'X670', 'X670E'] },
      { key: 'SlotRAM', labelEn: 'RAM Slots', labelTh: 'สล็อต RAM', type: 'number' },
      { key: 'SupportRAM', labelEn: 'Support RAM', labelTh: 'รองรับ RAM', type: 'text' },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
  vga: {
    labelEn: 'VGA Stock', labelTh: 'คลังสินค้า การ์ดจอ',
    addLabelEn: '+ Add VGA', addLabelTh: '+ เพิ่ม VGA',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'text' },
      { key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'text' },
      { key: 'Chipset', labelEn: 'Chipset', labelTh: 'ชิปเซ็ต', type: 'select', options: ['NVIDIA', 'AMD', 'Intel'] },
      { key: 'FAN', labelEn: 'FAN (count)', labelTh: 'จำนวนพัดลม', type: 'select', options: ['1', '2', '3'] },
      { key: 'Series', labelEn: 'Series', labelTh: 'ซีรีส์', type: 'text' },
      { key: 'GPUModel', labelEn: 'GPU Model', labelTh: 'GPU Model', type: 'text' },
      { key: 'SizeGB', labelEn: 'VRAM (GB)', labelTh: 'VRAM (GB)', type: 'number' },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
  psu: {
    labelEn: 'PSU Stock', labelTh: 'คลังสินค้า PSU',
    addLabelEn: '+ Add PSU', addLabelTh: '+ เพิ่ม PSU',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'text' },
      { key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'text' },
      { key: 'Certification', labelEn: 'Certification', labelTh: 'การรับรอง', type: 'select', options: ['80+ White', '80+ Bronze', '80+ Silver', '80+ Gold', '80+ Platinum', '80+ Titanium'] },
      { key: 'Watt', labelEn: 'Watt', labelTh: 'วัตต์', type: 'number' },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
  monitor: {
    labelEn: 'Monitor Stock', labelTh: 'คลังสินค้า มอนิเตอร์',
    addLabelEn: '+ Add Monitor', addLabelTh: '+ เพิ่ม มอนิเตอร์',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'text' },
      { key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'text' },
      { key: 'Size', labelEn: 'Size', labelTh: 'ขนาด', type: 'text' },
      { key: 'Color', labelEn: 'Color', labelTh: 'สี', type: 'text' },
      { key: 'PanelType', labelEn: 'Panel Type', labelTh: 'ประเภทพาเนล', type: 'select', options: ['IPS', 'VA', 'TN', 'OLED'] },
      { key: 'MaxResolution', labelEn: 'Max Resolution', labelTh: 'ความละเอียดสูงสุด', type: 'select', options: ['1920×1080', '2560×1080', '2560×1440', '3440×1440', '3840×2160'] },
      { key: 'RefreshRate', labelEn: 'Refresh Rate', labelTh: 'อัตรารีเฟรช', type: 'select', options: ['60Hz', '75Hz', '100Hz', '144Hz', '165Hz', '180Hz', '240Hz', '360Hz'] },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
};

// ── State ─────────────────────────────────────────────────────────────
let editingId = null;
let editingCategory = null;

// ── Table render ──────────────────────────────────────────────────────
async function renderStock(cat) {
  const cfg = CATEGORIES[cat];
  const container = document.getElementById(`page-${cat}`);

  const titleText = currentLang === 'en' ? cfg.labelEn : cfg.labelTh;
  const addText   = currentLang === 'en' ? cfg.addLabelEn : cfg.addLabelTh;

  container.innerHTML = `
    <div class="topbar">
      <h1>${titleText}</h1>
      <div class="spacer"></div>
      <button class="btn btn-outline" onclick="openImportModal('${cat}')"
              data-en="Import Excel" data-th="นำเข้า Excel">Import Excel</button>
      <button class="btn btn-primary" onclick="openItemModal('${cat}', null)"
              data-en="${cfg.addLabelEn}" data-th="${cfg.addLabelTh}">${addText}</button>
    </div>
    <div class="content">
      <div class="info-bar"
           data-en="Total Cost = Cost/unit × Total (auto)"
           data-th="Total Cost = ต้นทุน/ชิ้น × คงเหลือ (อัตโนมัติ)">
        Total Cost = Cost/unit × Total (auto)
      </div>
      <div class="table-wrap" id="tbl-${cat}">Loading…</div>
    </div>`;

  try {
    const rows = await fetch(`/api/${cat}`).then(r => r.json());
    renderTable(cat, rows);
  } catch (e) {
    document.getElementById(`tbl-${cat}`).textContent = 'Error loading data.';
  }
}

function renderTable(cat, rows) {
  const cfg = CATEGORIES[cat];
  // Display columns: exclude TotalCost from headers (it's always last data col before Actions)
  const displayFields = cfg.fields.filter(f => f.key !== 'TotalCost' && f.key !== 'Note');

  const ths = [...displayFields, { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)' }, { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ' }]
    .map(f => `<th data-en="${f.labelEn}" data-th="${f.labelTh}">${currentLang === 'en' ? f.labelEn : f.labelTh}</th>`)
    .join('');

  const trs = rows.map(row => {
    const tds = [...displayFields, { key: 'TotalCost' }, { key: 'Note' }].map(f => {
      if (f.key === 'Total') {
        const v = row.Total ?? 0;
        const cls = v >= 3 ? 'badge-ok' : v >= 1 ? 'badge-low' : 'badge-zero';
        return `<td><span class="badge ${cls}">${v}</span></td>`;
      }
      if (f.key === 'TotalCost') {
        return `<td class="cell-totalcost">${(row.TotalCost ?? 0).toLocaleString()}</td>`;
      }
      return `<td>${row[f.key] ?? '—'}</td>`;
    }).join('');

    return `<tr>
      ${tds}
      <td><div class="actions">
        <button class="btn btn-warning" onclick="openItemModal('${cat}', ${row.id})"
                data-en="Edit" data-th="แก้ไข">${currentLang === 'en' ? 'Edit' : 'แก้ไข'}</button>
        <button class="btn btn-danger" onclick="deleteItem('${cat}', ${row.id})">Del</button>
      </div></td>
    </tr>`;
  }).join('');

  document.getElementById(`tbl-${cat}`).innerHTML = `
    <table>
      <thead><tr>${ths}<th data-en="Actions" data-th="จัดการ">${currentLang === 'en' ? 'Actions' : 'จัดการ'}</th></tr></thead>
      <tbody>${trs || `<tr><td colspan="100" style="text-align:center;color:#8b949e;padding:20px">No data</td></tr>`}</tbody>
    </table>`;
}

// ── Add / Edit modal ──────────────────────────────────────────────────
async function openItemModal(cat, id) {
  editingCategory = cat;
  editingId = id;
  const cfg = CATEGORIES[cat];

  let existing = {};
  if (id) {
    const rows = await fetch(`/api/${cat}`).then(r => r.json());
    existing = rows.find(r => r.id === id) || {};
  }

  const titleEn = id ? `Edit ${cat.toUpperCase()}` : `Add ${cat.toUpperCase()}`;
  const titleTh = id ? `แก้ไข ${cat.toUpperCase()}` : `เพิ่ม ${cat.toUpperCase()}`;
  document.getElementById('modal-title').textContent = currentLang === 'en' ? titleEn : titleTh;

  const body = document.getElementById('modal-body');
  body.innerHTML = '<div class="form-grid">' + renderFormFields(cfg.fields, existing) + '</div>';

  // Wire up cascading dropdowns
  cfg.fields.filter(f => f.cascade).forEach(f => {
    const sourceEl = body.querySelector(`[data-field="${f.cascade.on}"]`);
    const targetEl = body.querySelector(`[data-field="${f.key}"]`);
    if (sourceEl && targetEl) {
      const updateCascade = () => {
        const opts = f.cascade.values[sourceEl.value] || [];
        targetEl.innerHTML = '<option value="">-- Select --</option>' +
          opts.map(o => `<option${o === existing[f.key] ? ' selected' : ''}>${o}</option>`).join('');
      };
      sourceEl.addEventListener('change', updateCascade);
      if (existing[f.cascade.on]) updateCascade();
    }
  });

  // Wire up TotalCost auto-compute
  const totalEl = body.querySelector('[data-field="Total"]');
  const costEl  = body.querySelector('[data-field="Cost"]');
  const tcEl    = body.querySelector('[data-field="TotalCost"]');
  if (totalEl && costEl && tcEl) {
    const update = () => { tcEl.value = (parseFloat(totalEl.value) || 0) * (parseFloat(costEl.value) || 0); };
    totalEl.addEventListener('input', update);
    costEl.addEventListener('input', update);
  }

  openModal('modal-item');
}

function renderFormFields(fields, existing) {
  const infoFields = fields.filter(f => !['Total', 'Cost', 'TotalCost', 'Note'].includes(f.key));
  const stockFields = fields.filter(f => ['Total', 'Cost', 'TotalCost'].includes(f.key));
  const noteField   = fields.find(f => f.key === 'Note');

  const renderField = (f) => {
    const label = currentLang === 'en' ? f.labelEn : f.labelTh;
    const value = existing[f.key] ?? '';

    let control;
    if (f.readonly) {
      control = `<input type="number" data-field="${f.key}" value="${value}" readonly>`;
    } else if (f.type === 'select' && !f.cascade) {
      const opts = (f.options || []).map(o =>
        `<option${o === value ? ' selected' : ''}>${o}</option>`
      ).join('');
      control = `<select data-field="${f.key}"><option value="">-- Select --</option>${opts}</select>`;
    } else if (f.cascade) {
      control = `<select data-field="${f.key}"><option value="">-- Select Brand first --</option></select>`;
    } else if (f.type === 'textarea') {
      control = `<textarea data-field="${f.key}">${value}</textarea>`;
    } else if (f.type === 'number') {
      control = `<input type="number" data-field="${f.key}" value="${value}">`;
    } else {
      control = `<input type="text" data-field="${f.key}" value="${value}">`;
    }

    const tag = f.readonly ? '<span class="tag-auto">auto</span>'
              : f.type === 'select' || f.cascade ? '<span class="tag-dropdown">dropdown</span>'
              : '';
    return `<div class="fg"><label>${label} ${tag}</label>${control}</div>`;
  };

  return `
    <div class="form-section">Product Info</div>
    ${infoFields.map(renderField).join('')}
    <div class="form-section">Stock &amp; Cost</div>
    ${stockFields.map(renderField).join('')}
    ${noteField ? `<div class="fg full">${renderField(noteField).replace('<div class="fg">', '').replace('</div>', '')}</div>` : ''}
  `;
}

// ── Save (POST / PUT) ─────────────────────────────────────────────────
async function saveItem() {
  const cat = editingCategory;
  const cfg = CATEGORIES[cat];
  const body = document.getElementById('modal-body');

  const payload = {};
  cfg.fields.filter(f => !f.readonly).forEach(f => {
    const el = body.querySelector(`[data-field="${f.key}"]`);
    if (!el) return;
    payload[f.key] = f.type === 'number' ? (parseFloat(el.value) || 0) : el.value;
  });

  const url = editingId ? `/api/${cat}/${editingId}` : `/api/${cat}`;
  const method = editingId ? 'PUT' : 'POST';

  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) { alert('Save failed'); return; }

  closeModal('modal-item');
  renderStock(cat);
}

// ── Delete ────────────────────────────────────────────────────────────
async function deleteItem(cat, id) {
  const msg = currentLang === 'en' ? 'Delete this item?' : 'ลบรายการนี้?';
  if (!confirm(msg)) return;
  await fetch(`/api/${cat}/${id}`, { method: 'DELETE' });
  renderStock(cat);
}

// ── Import Excel ──────────────────────────────────────────────────────
function openImportModal(cat) {
  editingCategory = cat;
  document.getElementById('import-result').textContent = '';
  document.getElementById('import-file').value = '';
  openModal('modal-import');
}

async function doImport() {
  const file = document.getElementById('import-file').files[0];
  if (!file) { alert('Please select a file'); return; }
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/api/${editingCategory}/import`, { method: 'POST', body: form });
  const data = await res.json();
  const result = document.getElementById('import-result');
  if (res.ok) {
    result.textContent = `✓ Imported ${data.imported} rows`;
    result.style.color = '#3fb950';
    renderStock(editingCategory);
  } else {
    result.textContent = `✗ ${data.error}`;
    result.style.color = '#f85149';
  }
}

function downloadTemplate() {
  window.location.href = `/api/${editingCategory}/template`;
}
```

- [ ] **Step 2: Start server and verify stock pages work**

```bash
node server.js
```

Open `http://localhost:3000`. Click CPU in sidebar:
- Table renders with correct columns
- Click "+ Add CPU" → modal opens with Brand dropdown (INTEL/AMD), Model cascades on Brand selection
- Fill in fields → Save → row appears in table
- Edit button → modal pre-fills values
- Del → confirm prompt → row removed
- TotalCost auto-computes in modal

Repeat for at least RAM, Mainboard to verify different field configs work.

- [ ] **Step 3: Verify Import Excel works**

Click "Import Excel" → Download Template → open in Excel → add 2 rows with data → save → upload → verify rows appear.

- [ ] **Step 4: Commit**

```bash
git add public/js/stock.js
git commit -m "feat: stock.js — table render, CRUD modals, cascading dropdowns, Excel import"
```

---

### Task 11: Frontend — diy.js (DIY PC Builder)

**Files:**
- Create: `public/js/diy.js`

- [ ] **Step 1: Create public/js/diy.js**

```js
let diySpec = {};       // { [category]: { id, type, cost } }
let currentTxId = null;
let catalogData = [];

const DIY_CATEGORIES = ['cpu', 'ram', 'm2', 'ssd', 'mainboard', 'vga', 'psu', 'monitor'];
const DIY_LABELS = { cpu: 'CPU', ram: 'RAM', m2: 'M.2', ssd: 'SSD', mainboard: 'Mainboard', vga: 'VGA', psu: 'PSU', monitor: 'Monitor' };

async function loadDiyCatalog() {
  const page = document.getElementById('page-diy');
  page.innerHTML = buildDiyShell();

  try {
    catalogData = await fetch('/api/diy/catalog').then(r => r.json());
    renderDiyTab(DIY_CATEGORIES[0]);
  } catch (e) {
    page.innerHTML = '<p style="padding:20px;color:#f85149">Failed to load catalog</p>';
  }
}

function buildDiyShell() {
  const tabs = DIY_CATEGORIES.map((cat, i) =>
    `<div class="diy-tab${i === 0 ? ' active' : ''}" onclick="selectDiyTab(this,'${cat}')">${DIY_LABELS[cat]}</div>`
  ).join('');

  const titleEn = 'DIY PC Builder'; const titleTh = 'ประกอบสเปคคอม';
  const clearEn = 'Clear All';      const clearTh = 'ล้างทั้งหมด';
  const prevEn  = 'Preview &amp; Confirm'; const prevTh = 'ดูสรุปและยืนยัน';
  const selEn   = 'Selected Spec';  const selTh = 'สเปคที่เลือก';
  const tcEn    = 'Total Cost';     const tcTh = 'ต้นทุนรวม';

  return `
    <div class="topbar">
      <h1 data-en="${titleEn}" data-th="${titleTh}">${currentLang === 'en' ? titleEn : titleTh}</h1>
      <div class="spacer"></div>
      <button class="btn btn-outline" onclick="clearDiySpec()"
              data-en="${clearEn}" data-th="${clearTh}">${currentLang === 'en' ? clearEn : clearTh}</button>
      <button class="btn btn-success" onclick="showDiyPreview()"
              data-en="${prevEn}" data-th="${prevTh}">${currentLang === 'en' ? prevEn : prevTh}</button>
    </div>
    <div class="diy-body">
      <div class="diy-left">
        <div class="diy-tabs">${tabs}</div>
        <div class="diy-items" id="diy-items"></div>
      </div>
      <div class="diy-right">
        <div class="diy-spec-hdr" data-en="${selEn}" data-th="${selTh}">${currentLang === 'en' ? selEn : selTh}</div>
        <div class="diy-spec-list" id="diy-spec-list"></div>
        <div class="diy-foot">
          <div class="diy-total">
            <span style="color:#8b949e;font-size:12px" data-en="${tcEn}" data-th="${tcTh}">${currentLang === 'en' ? tcEn : tcTh}</span>
            <span style="color:#f0883e;font-size:17px;font-weight:700" id="diy-total-val">฿0</span>
          </div>
          <button class="btn btn-success" style="width:100%;padding:8px" onclick="showDiyPreview()"
                  data-en="${prevEn}" data-th="${prevTh}">${currentLang === 'en' ? prevEn : prevTh}</button>
        </div>
      </div>
    </div>`;
}

function selectDiyTab(el, cat) {
  document.querySelectorAll('.diy-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderDiyTab(cat);
}

function renderDiyTab(cat) {
  const entry = catalogData.find(c => c.category === cat);
  const items = entry ? entry.items : [];
  const container = document.getElementById('diy-items');

  if (!items.length) {
    container.innerHTML = `<div class="diy-empty">${currentLang === 'en' ? 'No stock available' : 'ไม่มีสินค้าในคลัง'}</div>`;
    return;
  }

  container.innerHTML = items.map(item => {
    const selected = diySpec[cat] && diySpec[cat].id === item.id;
    return `
      <div class="diy-item" style="${selected ? 'border-color:#1f6feb' : ''}">
        <div>
          <div style="font-size:12px;color:#c9d1d9">${item.Type}</div>
          <div style="font-size:10px;color:#8b949e">Stock: ${item.Total} | Cost: ฿${item.Cost.toLocaleString()}/unit</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="color:#58a6ff;font-weight:500">฿${item.Cost.toLocaleString()}</span>
          <button class="btn btn-success" style="padding:3px 8px"
                  onclick="addToSpec('${cat}', ${item.id}, '${item.Type.replace(/'/g, "\\'")}', ${item.Cost})">+</button>
        </div>
      </div>`;
  }).join('');
}

function addToSpec(cat, id, type, cost) {
  diySpec[cat] = { id, type, cost };
  renderDiySpec();
  // Re-render current tab to show selection highlight
  const activeTab = document.querySelector('.diy-tab.active');
  if (activeTab && activeTab.textContent === DIY_LABELS[cat]) renderDiyTab(cat);
}

function removeFromSpec(cat) {
  delete diySpec[cat];
  renderDiySpec();
}

function clearDiySpec() {
  diySpec = {};
  renderDiySpec();
}

function renderDiySpec() {
  const list = document.getElementById('diy-spec-list');
  const total = Object.values(diySpec).reduce((s, i) => s + i.cost, 0);
  document.getElementById('diy-total-val').textContent = '฿' + total.toLocaleString();

  const entries = Object.entries(diySpec);
  if (!entries.length) {
    list.innerHTML = `<div class="diy-empty">${currentLang === 'en' ? 'No items selected' : 'ยังไม่มีรายการ'}</div>`;
    return;
  }
  list.innerHTML = entries.map(([cat, item]) => `
    <div class="spec-row">
      <span class="spec-cat">${DIY_LABELS[cat]}</span>
      <span class="spec-name" title="${item.type}">${item.type}</span>
      <span class="spec-price">฿${item.cost.toLocaleString()}</span>
      <button class="spec-rm" onclick="removeFromSpec('${cat}')">✕</button>
    </div>`).join('');
}

function showDiyPreview() {
  const entries = Object.entries(diySpec);
  if (!entries.length) {
    alert(currentLang === 'en' ? 'Please select at least one item' : 'กรุณาเลือกอย่างน้อย 1 รายการ');
    return;
  }
  const total = entries.reduce((s, [, i]) => s + i.cost, 0);
  const rows = entries.map(([cat, item]) => `
    <div class="prev-row">
      <span style="color:#8b949e">${DIY_LABELS[cat]}</span>
      <span>${item.type}</span>
      <span style="color:#58a6ff;font-weight:500">฿${item.cost.toLocaleString()}</span>
    </div>`).join('');
  const tcLabel = currentLang === 'en' ? 'Total Cost' : 'ต้นทุนรวม';
  document.getElementById('diy-preview-body').innerHTML =
    rows + `<div class="prev-total"><span>${tcLabel}</span><span>฿${total.toLocaleString()}</span></div>`;
  openModal('modal-diy-preview');
}

async function confirmOrder() {
  const selections = Object.entries(diySpec).map(([cat, item]) => ({ table: cat, id: item.id }));
  try {
    const res = await fetch('/api/diy/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selections),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    currentTxId = data.txId;

    // Show confirmed modal
    const total = Object.values(diySpec).reduce((s, i) => s + i.cost, 0);
    const tcLabel = currentLang === 'en' ? 'Total Cost' : 'ต้นทุนรวม';
    const rows = Object.entries(diySpec).map(([cat, item]) => `
      <div class="prev-row">
        <span style="color:#8b949e">${DIY_LABELS[cat]}</span>
        <span>${item.type}</span>
        <span style="color:#58a6ff;font-weight:500">฿${item.cost.toLocaleString()}</span>
      </div>`).join('');
    document.getElementById('diy-confirmed-body').innerHTML =
      rows + `<div class="prev-total"><span>${tcLabel}</span><span>฿${total.toLocaleString()}</span></div>`;

    closeModal('modal-diy-preview');
    openModal('modal-diy-confirmed');
  } catch (e) {
    alert('Confirm failed: ' + e.message);
  }
}

async function restoreOrder() {
  if (!currentTxId) return;
  try {
    const res = await fetch(`/api/diy/restore/${currentTxId}`, { method: 'POST' });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    alert(currentLang === 'en' ? 'Stock restored!' : 'คืน Stock เรียบร้อยแล้ว!');
    closeModal('modal-diy-confirmed');
    diyDone();
  } catch (e) {
    alert('Restore failed: ' + e.message);
  }
}

function diyDone() {
  currentTxId = null;
  clearDiySpec();
  closeModal('modal-diy-confirmed');
  loadDiyCatalog();
}
```

- [ ] **Step 2: Start server and verify DIY flow**

```bash
node server.js
```

1. Add some CPU and RAM items via stock pages (ensure Total > 0)
2. Click "DIY PC Builder" in sidebar
3. Select CPU from left panel → appears on right
4. Switch to RAM tab → select RAM → appears on right
5. Click "Preview & Confirm" → preview modal shows items + total
6. Click "✓ Confirm & Deduct Stock" → success modal appears
7. Check CPU/RAM stock pages — Total should be reduced by 1
8. Click "↩ Restore Stock" → confirm alert → check stock pages — Total restored
9. Click "Done" → spec clears

- [ ] **Step 3: Commit**

```bash
git add public/js/diy.js
git commit -m "feat: diy.js — catalog tabs, spec builder, preview/confirm/restore flow"
```

---

### Task 12: Docker

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 2: Create docker-compose.yml**

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - /share/homes/na/stock-data:/app/data
    environment:
      - DATABASE_PATH=/app/data/stock.db
      - PORT=3000
    restart: unless-stopped
```

- [ ] **Step 3: Build and test Docker image locally**

```bash
docker build -t stock-comnakrub .
docker run -p 3000:3000 -e DATABASE_PATH=/tmp/test.db stock-comnakrub
```

Open `http://localhost:3000` — verify app loads.

- [ ] **Step 4: Stop container**

```bash
docker ps   # find container ID
docker stop <id>
```

- [ ] **Step 5: Commit**

```bash
git add Dockerfile docker-compose.yml
git commit -m "feat: Dockerfile and docker-compose for QNAP Container Station deployment"
```

---

## Post-Build Checklist

Before deploying to QNAP:

- [ ] `npm test` — all tests pass
- [ ] Smoke test all 8 stock pages: add, edit, delete, import, download template
- [ ] Smoke test DIY: full confirm + restore cycle
- [ ] EN/TH toggle: all UI labels switch correctly
- [ ] CPU modal: Brand INTEL → Model shows Intel lineup; Brand AMD → Model shows AMD lineup
- [ ] Total badge colours: ≥3 green, 1-2 orange, 0 red
- [ ] TotalCost column updates in real time in Add/Edit modal
- [ ] Docker build succeeds locally

## Deploy to QNAP

```bash
# Build image
docker build -t stock-comnakrub .

# Save image as tar
docker save stock-comnakrub | gzip > stock-comnakrub.tar.gz

# Copy to QNAP
scp stock-comnakrub.tar.gz na@192.168.99.105:/share/homes/na/

# SSH to QNAP and load
ssh na@192.168.99.105
docker load < /share/homes/na/stock-comnakrub.tar.gz

# Start via Container Station (GUI) or docker-compose
mkdir -p /share/homes/na/stock-data
docker run -d \
  --name stock-comnakrub \
  -p 3000:3000 \
  -v /share/homes/na/stock-data:/app/data \
  -e DATABASE_PATH=/app/data/stock.db \
  --restart unless-stopped \
  stock-comnakrub
```

Access at `http://192.168.99.105:3000`
