const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'cpu',
  fields: ['Type', 'Brand', 'Model', 'Package', 'Socket', 'Codename', 'Total', 'Cost', 'Note'],
};

module.exports = (db) => createCategoryRouter(db, config);
