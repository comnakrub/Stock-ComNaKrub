const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'mainboard',
  fields: [
    'Type', 'Brand', 'Model', 'Size', 'Socket', 'Chipset',
    'SlotRAM', 'SupportRAM', 'Total', 'Cost', 'Note',
  ],
};

module.exports = (db) => createCategoryRouter(db, config);
