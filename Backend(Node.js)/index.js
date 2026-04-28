const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json()); // Essential for parsing JSON in 2026

app.get('/', (req, res) => {
  res.send({ status: 'active', message: 'Node.js server is live' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));