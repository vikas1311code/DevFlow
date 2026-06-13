const { query } = require('../config/db');

// Har file ka churn count update karo aur risk score calculate karo
const calculateRisk = async (repoId, files) => {
  const filenames = files.map((f) => f.filename);
  const totalChanges = files.reduce((sum, f) => sum + (f.additions || 0) + (f.deletions || 0), 0);
  const filesCount = files.length;

  // Har touched file ka churn count +1 karo (upsert)
  for (const filename of filenames) {
    await query(
      `INSERT INTO file_churn (repo_id, filename, change_count)
       VALUES ($1, $2, 1)
       ON CONFLICT (repo_id, filename) DO UPDATE SET change_count = file_churn.change_count + 1`,
      [repoId, filename]
    );
  }

  // Touched files ke current churn counts fetch karo
  const churnResult = await query(
    `SELECT filename, change_count FROM file_churn WHERE repo_id = $1 AND filename = ANY($2)`,
    [repoId, filenames]
  );
  const churnMap = {};
  churnResult.rows.forEach((r) => { churnMap[r.filename] = r.change_count; });

  // "Hot files" - jo 3+ baar change ho chuki hain
  const hotFiles = filenames.filter((f) => (churnMap[f] || 0) >= 3);

  // Risk score components
  const sizeScore = Math.min(40, Math.round(totalChanges / 5));        // up to 40
  const filesScore = Math.min(20, filesCount * 4);                      // up to 20
  const hotScore = Math.min(40, hotFiles.length * 15);                  // up to 40

  const riskScore = Math.min(100, sizeScore + filesScore + hotScore);

  return { riskScore, hotFiles, filesTouched: filenames, totalChanges, filesCount };
};

module.exports = { calculateRisk };
