const crypto = require('crypto');
const { query } = require('../config/db');
const { getPRFiles, postPRComment } = require('../services/githubService');
const { reviewCode } = require('../services/aiReviewService');

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

    // Turant response bhejo GitHub ko (timeout avoid karne ke liye)
    res.status(200).json({ received: true });

    if (action === 'opened' || action === 'synchronize') {
      const [owner, repo] = repository.full_name.split('/');

      try {
        console.log('🔍 PR files fetch kar rahe hain...');
        const files = await getPRFiles(owner, repo, pull_request.number);
        console.log(`📄 ${files.length} files changed`);

        console.log('🧠 Gemini se review generate kar rahe hain...');
        const review = await reviewCode(pull_request.title, files);

        console.log('💬 Review comment post kar rahe hain...');
        await postPRComment(owner, repo, pull_request.number, review);

        console.log('✅ AI review successfully posted!');

        await query(
          `INSERT INTO pull_requests (repo_id, github_pr_id, title, author, status, ai_review, ai_review_status, additions, deletions, reviewed_at)
           SELECT id, $2, $3, $4, 'open', $5, 'completed', $6, $7, NOW() FROM repositories WHERE github_repo_id = $1
           ON CONFLICT (repo_id, github_pr_id) DO UPDATE SET title = EXCLUDED.title, ai_review = EXCLUDED.ai_review, ai_review_status = EXCLUDED.ai_review_status, additions = EXCLUDED.additions, deletions = EXCLUDED.deletions, reviewed_at = EXCLUDED.reviewed_at`,
          [repository.id.toString(), pull_request.number, pull_request.title, pull_request.user.login, review, pull_request.additions, pull_request.deletions]
        );
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
