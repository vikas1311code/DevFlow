const express = require('express');
const router = express.Router();
const { getIssues, createIssue, updateIssueStatus, deleteIssue } = require('../controllers/issueController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/repo/:repoId', getIssues);
router.post('/repo/:repoId', createIssue);
router.patch('/:issueId', updateIssueStatus);
router.delete('/:issueId', deleteIssue);

module.exports = router;
