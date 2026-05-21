const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'ssd',
  fields: ['Type', 'Brand', 'Package', 'Model', 'Interface', 'Capacity', 'Total', 'Cost', 'Note'],
};

module.exports = (db) => createCategoryRouter(db, config);
