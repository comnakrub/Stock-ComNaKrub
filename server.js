require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db/database');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Stock category routes
['cpu', 'ram', 'm2', 'ssd', 'mainboard', 'vga', 'psu', 'monitor'].forEach(cat => {
  app.use(`/api/${cat}`, require(`./routes/${cat}`)(db));
});

// DIY route
app.use('/api/diy', require('./routes/diy')(db));

// SPA fallback — always serve index.html for non-API paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Stock ComNaKrub running at http://localhost:${PORT}`));
}

module.exports = app;
