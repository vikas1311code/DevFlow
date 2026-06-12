const { query } = require('../config/db');
const axios = require('axios');

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_PAT}`,
    Accept: 'application/vnd.github+json',
  },
});

// User ka repo DevFlow mein register karo
const connectRepo = async (req, res) => {
  const { owner, repo } = req.body;
  if (!owner || !repo) return res.status(400).json({ error: 'owner aur repo dono chahiye' });

  try {
    // GitHub se repo details fetch karo
    const ghRepo = await githubApi.get(`/repos/${owner}/${repo}`);
    const { id, name, full_name } = ghRepo.data;

    const result = await query(
      `INSERT INTO repositories (owner_id, github_repo_id, name, full_name, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (github_repo_id) DO UPDATE SET is_active = true
       RETURNING *`,
      [req.user.userId, id.toString(), name, full_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Repo connect error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Repo connect nahi ho saka' });
  }
};

// Logged-in user ke connected repos list karo
const getRepos = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM repositories WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { connectRepo, getRepos };
