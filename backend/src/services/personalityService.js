const { query } = require('../config/db');

const PERSONALITIES = [
  {
    name: 'Cowboy',
    emoji: '🤠',
    description: 'Ships fast, breaks things. High risk, high reward.',
    condition: (p) => p.avg_risk_score >= 60 || p.avg_files_per_pr >= 10,
  },
  {
    name: 'Sniper',
    emoji: '🎯',
    description: 'Laser focused. Small, precise, low-risk changes only.',
    condition: (p) => p.avg_risk_score <= 20 && p.avg_files_per_pr <= 3 && p.total_prs >= 2,
  },
  {
    name: 'Documenter',
    emoji: '📚',
    description: 'The team MVP. Always keeps docs and comments up to date.',
    condition: (p) => p.docs_prs / Math.max(p.total_prs, 1) >= 0.4,
  },
  {
    name: 'Guardian',
    emoji: '🛡️',
    description: 'Security-first mindset. Catches issues others miss.',
    condition: (p) => p.avg_risk_score >= 40 && p.avg_files_per_pr <= 5,
  },
  {
    name: 'Architect',
    emoji: '🏗️',
    description: 'Big thinker. Large structured changes with clear intent.',
    condition: (p) => p.avg_additions >= 200 && p.avg_files_per_pr >= 5,
  },
  {
    name: 'Balanced',
    emoji: '⚖️',
    description: 'Steady and consistent. The backbone of the team.',
    condition: () => true, // default
  },
];

const getPersonality = (stats) => {
  for (const p of PERSONALITIES) {
    if (p.condition(stats)) return p;
  }
  return PERSONALITIES[PERSONALITIES.length - 1];
};

const updateDeveloperProfile = async (repoId, author, prData, filesTouched) => {
  // Doc files check karo
  const docFiles = ['readme', 'docs', 'changelog', 'contributing', '.md', '.txt'];
  const isDocsPR = filesTouched.some((f) =>
    docFiles.some((d) => f.toLowerCase().includes(d))
  );

  // Existing profile fetch karo
  const existing = await query(
    'SELECT * FROM developer_profiles WHERE repo_id = $1 AND username = $2',
    [repoId, author]
  );

  let stats;
  if (existing.rows.length === 0) {
    // Naya profile
    stats = {
      total_prs: 1,
      avg_risk_score: prData.riskScore,
      avg_files_per_pr: filesTouched.length,
      avg_additions: prData.additions || 0,
      docs_prs: isDocsPR ? 1 : 0,
    };
  } else {
    const e = existing.rows[0];
    const n = e.total_prs + 1;
    stats = {
      total_prs: n,
      avg_risk_score: (e.avg_risk_score * e.total_prs + prData.riskScore) / n,
      avg_files_per_pr: (e.avg_files_per_pr * e.total_prs + filesTouched.length) / n,
      avg_additions: (e.avg_additions * e.total_prs + (prData.additions || 0)) / n,
      docs_prs: e.docs_prs + (isDocsPR ? 1 : 0),
    };
  }

  const personality = getPersonality(stats);

  await query(
    `INSERT INTO developer_profiles (repo_id, username, personality, personality_emoji, total_prs, avg_risk_score, avg_files_per_pr, avg_additions, docs_prs, last_updated)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     ON CONFLICT (repo_id, username) DO UPDATE SET
       personality = $3, personality_emoji = $4, total_prs = $5,
       avg_risk_score = $6, avg_files_per_pr = $7, avg_additions = $8,
       docs_prs = $9, last_updated = NOW()`,
    [repoId, author, personality.name, personality.emoji, stats.total_prs, stats.avg_risk_score, stats.avg_files_per_pr, stats.avg_additions, stats.docs_prs]
  );

  console.log(`👤 ${author} → ${personality.emoji} ${personality.name}`);
  return { ...personality, stats };
};

const getTeamProfiles = async (repoId) => {
  const result = await query(
    'SELECT * FROM developer_profiles WHERE repo_id = $1 ORDER BY total_prs DESC',
    [repoId]
  );
  return result.rows;
};

module.exports = { updateDeveloperProfile, getTeamProfiles, getPersonality, PERSONALITIES };
