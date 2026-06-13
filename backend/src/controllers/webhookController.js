const crypto = require('crypto');
const { query } = require('../config/db');
const { getPRFiles, postPRComment } = require('../services/githubService');
const { reviewCode } = require('../services/aiReviewService');
const { calculateRisk } = require('../services/riskService');

const verifySignature = (payload, signature, secret) => {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
};

const handleWebhook = async (req, res) => {
  const event = req.headers['x-github-event'];

  console.log(`📩 GitHub event aaya: ${event}`);

  if (event === 'pull_request') {
    const { action, pull_request, repository } = req.body;
    console.log(`PR #${pull_request.number} - ${action}`);
    console.log(`Title: ${pull_request.title}`);
    console.log(`Repo: ${repository.full_name}`);

    res.status(200).json({ received: true });

    if (action === 'opened' || action === 'synchronize') {
      const [owner, repo] = repository.full_name.split('/');

      try {
        // repo_id lookup karo
        const repoRow = await query(
          'SELECT id FROM repositories WHERE github_repo_id = $1',
          [repository.id.toString()]
        );
        const repoId = repoRow.rows[0]?.id;

        console.log('🔍 PR files fetch kar rahe hain...');
        const files = await getPRFiles(owner, repo, pull_request.number);
        console.log(`📄 ${files.length} files changed`);

        let risk = { riskScore: 0, hotFiles: [], filesTouched: files.map(f => f.filename) };
        if (repoId) {
          risk = await calculateRisk(repoId, files);
          console.log(`⚠️  Risk score: ${risk.riskScore}/100, hot files: ${risk.hotFiles.join(', ') || 'none'}`);
        }

        console.log('🧠 Gemini se review generate kar rahe hain...');
        let review = await reviewCode(pull_request.title, files);

        // Risk/blast-radius section AI review ke neeche append karo (code-computed, AI se nahi)
        const riskEmoji = risk.riskScore >= 70 ? '🔴' : risk.riskScore >= 40 ? '🟡' : '🟢';
        review += `\n\n---\n### ${riskEmoji} Blast Radius\n**Risk Score: ${risk.riskScore}/100** · ${risk.filesTouched.length} file(s) touched`;
        if (risk.hotFiles.length > 0) {
          review += `\n⚠️ **Hot files** (frequently changed, higher regression risk): ${risk.hotFiles.map(f => `\`${f}\``).join(', ')}`;
        }

        console.log('💬 Review comment post kar rahe hain...');
        await postPRComment(owner, repo, pull_request.number, review);

        console.log('✅ AI review successfully posted!');

        if (repoId) {
          await query(
            `INSERT INTO pull_requests (repo_id, github_pr_id, title, author, status, ai_review, ai_review_status, additions, deletions, risk_score, files_touched, reviewed_at)
             VALUES ($1, $2, $3, $4, 'open', $5, 'completed', $6, $7, $8, $9, NOW())
             ON CONFLICT (repo_id, github_pr_id) DO UPDATE SET
               title = EXCLUDED.title, ai_review = EXCLUDED.ai_review, ai_review_status = EXCLUDED.ai_review_status,
               additions = EXCLUDED.additions, deletions = EXCLUDED.deletions, risk_score = EXCLUDED.risk_score,
               files_touched = EXCLUDED.files_touched, reviewed_at = EXCLUDED.reviewed_at`,
            [repoId, pull_request.number, pull_request.title, pull_request.user.login, review, pull_request.additions, pull_request.deletions, risk.riskScore, risk.filesTouched]
          );
        }
      } catch (err) {
        console.error('❌ AI review error:', err.response?.data || err.message);
      }
    }
    return;
  } else if (event === 'ping') {
    console.log('✅ Webhook ping received - setup successful!');
  }

  res.status(200).json({ received: true });
};

module.exports = { handleWebhook, verifySignature };
