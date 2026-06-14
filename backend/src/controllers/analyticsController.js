const { query } = require('../config/db');

const getRepoAnalytics = async (req, res) => {
  const { repoId } = req.params;

  try {
    const prStats = await query(
      `SELECT
        COUNT(*) as total_prs,
        COUNT(*) FILTER (WHERE status = 'open') as open_prs,
        COUNT(*) FILTER (WHERE status = 'merged') as merged_prs,
        COUNT(*) FILTER (WHERE ai_review_status = 'completed') as reviewed_prs,
        COALESCE(AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at))), 0) as avg_review_time_sec
       FROM pull_requests WHERE repo_id = $1`,
      [repoId]
    );

    const issueStats = await query(
      `SELECT status, COUNT(*) as count FROM issues WHERE repo_id = $1 GROUP BY status`,
      [repoId]
    );

    const recentPRs = await query(
      `SELECT github_pr_id, title, author, status, ai_review_status, additions, deletions, created_at
       FROM pull_requests WHERE repo_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [repoId]
    );

    res.json({
      prStats: prStats.rows[0],
      issueStats: issueStats.rows,
      recentPRs: recentPRs.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getRepoAnalytics };

const getTeamPersonalities = async (req, res) => {
  const { repoId } = req.params;
  try {
    const { getTeamProfiles } = require('../services/personalityService');
    const profiles = await getTeamProfiles(repoId);
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getRepoAnalytics, getTeamPersonalities };
