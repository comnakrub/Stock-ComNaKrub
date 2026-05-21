const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'psu',
  fields: ['Type', 'Brand', 'Model', 'Certification', 'Watt', 'Total', 'Cost', 'Note'],
};

module.exports = (db) => createCategoryRouter(db, config);
