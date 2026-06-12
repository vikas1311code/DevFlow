const axios = require('axios');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// Step 1: User ko GitHub ke authorize page pe redirect karo
const githubLogin = (req, res) => {
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,user:email&redirect_uri=http://localhost:5000/api/auth/github/callback`;
  res.redirect(redirectUrl);
};

// Step 2: GitHub callback - code ko access token mein exchange karo
const githubCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Authorization code missing' });

  try {
    // Code ko access token se exchange karo
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token } = tokenRes.data;
    if (!access_token) return res.status(400).json({ error: 'GitHub se token nahi mila' });

    // GitHub se user profile fetch karo
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id, login, email, avatar_url } = userRes.data;

    // User ko DB mein upsert karo (insert ya update if exists)
    const result = await query(
      `INSERT INTO users (github_id, username, email, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (github_id) DO UPDATE
       SET username = $2, email = $3, avatar_url = $4
       RETURNING id, github_id, username, email, avatar_url, role`,
      [id.toString(), login, email, avatar_url]
    );

    const user = result.rows[0];

    // JWT access token + refresh token banao
    const accessToken = jwt.sign(
      { userId: user.id, githubId: user.github_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Frontend pe redirect karo tokens ke saath (production mein httpOnly cookies use karenge)
    res.redirect(
      `http://localhost:3000/auth/success?token=${accessToken}&refresh=${refreshToken}`
    );
  } catch (err) {
    console.error('GitHub OAuth error:', err.response?.data || err.message);
    res.status(500).json({ error: 'GitHub login fail ho gaya' });
  }
};

// Refresh token se naya access token banao
const refreshToken = (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(401).json({ error: 'Refresh token missing' });

  try {
    const decoded = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: 'Refresh token invalid ya expired hai' });
  }
};

// Logged-in user ki profile return karo
const getMe = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, github_id, username, email, avatar_url, role FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User nahi mila' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { githubLogin, githubCallback, refreshToken, getMe };
