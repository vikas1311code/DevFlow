const express = require('express');
const router = express.Router();
const { connectRepo, getRepos } = require('../controllers/repoController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/connect', connectRepo);
router.get('/', getRepos);

module.exports = router;
