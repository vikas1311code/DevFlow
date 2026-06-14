const crypto = require('crypto');
const { query } = require('../config/db');
const { getPRFiles, postPRComment } = require('../services/githubService');
const { reviewCode } = require('../services/aiReviewService');
const { calculateRisk } = require('../services/riskService');
const { tryAutoFix } = require('../services/autoFixService');

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

    res.status(200).json({ received: true });

    if (action === 'opened' || action === 'synchronize') {
      const [owner, repo] = repository.full_name.split('/');
      const prBranch = pull_request.head.ref;

      try {
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
          console.log(`⚠️  Risk score: ${risk.riskScore}/100`);
        }

        console.log('🧠 Multi-persona AI reviews generate kar rahe hain...');
        const reviews = await reviewCode(pull_request.title, files);

        // Main review + blast radius
        const mainReview = reviews[0];
        const riskEmoji = risk.riskScore >= 70 ? '🔴' : risk.riskScore >= 40 ? '🟡' : '🟢';
        let mainComment = `🤖 **DevFlow AI Review**\n\n${mainReview.review}\n\n---\n*Powered by DevFlow + Gemini AI*`;
        mainComment += `\n\n---\n### ${riskEmoji} Blast Radius\n**Risk Score: ${risk.riskScore}/100** · ${risk.filesTouched.length} file(s) touched`;
        if (risk.hotFiles.length > 0) {
          mainComment += `\n⚠️ **Hot files**: ${risk.hotFiles.map(f => `\`${f}\``).join(', ')}`;
        }

        await postPRComment(owner, repo, pull_request.number, mainComment);
        console.log('✅ Main review posted!');

        // Persona reviews
        const securityReview = reviews.find(r => r.persona.includes('Security'));
        for (const p of reviews.slice(1)) {
          const comment = `### ${p.persona}\n\n${p.review}`;
          await postPRComment(owner, repo, pull_request.number, comment);
          console.log(`✅ ${p.persona} posted!`);
          await new Promise(r => setTimeout(r, 1000));
        }

        // Auto-fix - security review mein critical issue ho to
        if (securityReview) {
          await tryAutoFix(owner, repo, pull_request.number, prBranch, files, securityReview.review);
        }

        if (repoId) {
          await query(
            `INSERT INTO pull_requests (repo_id, github_pr_id, title, author, status, ai_review, ai_review_status, additions, deletions, risk_score, files_touched, reviewed_at)
             VALUES ($1, $2, $3, $4, 'open', $5, 'completed', $6, $7, $8, $9, NOW())
             ON CONFLICT (repo_id, github_pr_id) DO UPDATE SET
               title = EXCLUDED.title, ai_review = EXCLUDED.ai_review, ai_review_status = EXCLUDED.ai_review_status,
               additions = EXCLUDED.additions, deletions = EXCLUDED.deletions, risk_score = EXCLUDED.risk_score,
               files_touched = EXCLUDED.files_touched, reviewed_at = EXCLUDED.reviewed_at`,
            [repoId, pull_request.number, pull_request.title, pull_request.user.login, mainComment, pull_request.additions, pull_request.deletions, risk.riskScore, risk.filesTouched]
          );
        }
      } catch (err) {
        console.error('❌ Error:', err.response?.data || err.message);
      }
    }
    return;
  } else if (event === 'ping') {
    console.log('✅ Webhook ping received!');
  }

  res.status(200).json({ received: true });
};

module.exports = { handleWebhook, verifySignature };
