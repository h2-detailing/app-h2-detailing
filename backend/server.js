require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/clients',  require('./routes/clients'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/settings', require('./routes/settings'));

// Only listen directly when running locally (not on Vercel)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`H2 Detailing backend running on http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;
