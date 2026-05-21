const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'ram',
  fields: [
    'Type', 'Brand', 'Color', 'RGB', 'Package', 'Model',
    'MemoryType', 'BUS', 'MemorySize', 'Total', 'Cost', 'Note',
  ],
};

module.exports = (db) => createCategoryRouter(db, config);
