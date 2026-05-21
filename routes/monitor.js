const createCategoryRouter = require('./helpers/route-factory');

const config = {
  table: 'monitor',
  fields: [
    'Type', 'Brand', 'Model', 'Size', 'Color',
    'PanelType', 'MaxResolution', 'RefreshRate', 'Total', 'Cost', 'Note',
  ],
};

module.exports = (db) => createCategoryRouter(db, config);
