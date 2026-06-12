const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

router.get('/db-check', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as time, current_database() as db');
    res.json({ status: 'connected', dbTime: result.rows[0].time, dbName: result.rows[0].db });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
