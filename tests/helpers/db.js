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
