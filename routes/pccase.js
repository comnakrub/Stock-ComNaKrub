const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'pccase',
  fields: ['Type', 'Brand', 'Model', 'Total', 'Cost', 'Note'],
};

module.exports = (db) => createCategoryRouter(db, config);
