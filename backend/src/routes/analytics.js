const express = require('express');
const router = express.Router();
const { getRepoAnalytics } = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

router.get('/repo/:repoId', authenticate, getRepoAnalytics);

module.exports = router;
