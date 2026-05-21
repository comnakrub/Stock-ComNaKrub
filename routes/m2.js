const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'm2',
  fields: ['Type', 'Brand', 'Package', 'Model', 'M2Type', 'Interface', 'Capacity', 'Total', 'Cost', 'Note'],
};

module.exports = (db) => createCategoryRouter(db, config);
