const { query } = require('../config/db');

// Repo ke saare issues lao
const getIssues = async (req, res) => {
  const { repoId } = req.params;
  try {
    const result = await query(
      `SELECT i.* FROM issues i
       JOIN repositories r ON i.repo_id = r.id
       WHERE i.repo_id = $1 AND r.owner_id = $2
       ORDER BY i.created_at DESC`,
      [repoId, req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Naya issue/task banao
const createIssue = async (req, res) => {
  const { repoId } = req.params;
  const { title, body, priority, assignee } = req.body;
  if (!title) return res.status(400).json({ error: 'title zaroori hai' });

  try {
    const result = await query(
      `INSERT INTO issues (repo_id, github_issue_id, title, body, priority, assignee, status)
       VALUES ($1, 0, $2, $3, $4, $5, 'open')
       RETURNING *`,
      [repoId, title, body || '', priority || 'medium', assignee || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Issue ka status update karo (Kanban drag-drop ke liye: open -> in_progress -> done)
const updateIssueStatus = async (req, res) => {
  const { issueId } = req.params;
  const { status, priority, assignee } = req.body;

  try {
    const result = await query(
      `UPDATE issues SET
        status = COALESCE($2, status),
        priority = COALESCE($3, priority),
        assignee = COALESCE($4, assignee)
       WHERE id = $1 RETURNING *`,
      [issueId, status, priority, assignee]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Issue nahi mila' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Issue delete karo
const deleteIssue = async (req, res) => {
  const { issueId } = req.params;
  try {
    await query('DELETE FROM issues WHERE id = $1', [issueId]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getIssues, createIssue, updateIssueStatus, deleteIssue };
