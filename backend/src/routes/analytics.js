const express = require('express');
const router = express.Router();
const { getRepoAnalytics, getTeamPersonalities } = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

router.get('/repo/:repoId', authenticate, getRepoAnalytics);
router.get('/team/:repoId', authenticate, getTeamPersonalities);

module.exports = router;
