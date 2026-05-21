const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'vga',
  fields: [
    'Type', 'Brand', 'Model', 'Chipset', 'FAN', 'Series',
    'GPUModel', 'SizeGB', 'Total', 'Cost', 'Note',
  ],
};

module.exports = (db) => createCategoryRouter(db, config);
