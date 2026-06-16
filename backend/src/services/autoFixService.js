const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getFileContent, pushFileFix, postPRComment } = require('./githubService');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

const tryAutoFix = async (owner, repo, prNumber, prBranch, files, securityReview) => {
  // Sirf Critical issues pe auto-fix karo
  if (!securityReview.toLowerCase().includes('critical') &&
      !securityReview.toLowerCase().includes('sql injection') &&
      !securityReview.toLowerCase().includes('vulnerability')) {
    console.log('🔧 No critical issues found, skipping auto-fix');
    return;
  }

  console.log('🔧 Critical issue detected! Auto-fix attempt kar rahe hain...');

  const fixableFiles = files.filter(f => f.patch && f.filename.match(/\.(js|ts|jsx|tsx|py)$/));
  if (fixableFiles.length === 0) {
    console.log('🔧 No fixable files found');
    return;
  }

  const fixes = [];

  for (const file of fixableFiles.slice(0, 2)) { // max 2 files fix karo
    const fileData = await getFileContent(owner, repo, file.filename, prBranch);
    if (!fileData) continue;

    const prompt = `You are an expert software engineer fixing a security vulnerability.

Security review found this issue:
${securityReview}

File: ${file.filename}
Current content:
\`\`\`
${fileData.content.slice(0, 3000)}
\`\`\`

Fix ONLY the specific security issue mentioned. Make minimal changes.
Return ONLY the complete fixed file content, no explanation, no markdown fences.`;

    try {
      const result = await model.generateContent(prompt);
      let fixedContent = result.response.text().trim();

      // Markdown fences hata do agar AI ne daal diye
      fixedContent = fixedContent.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');

      if (fixedContent && fixedContent !== fileData.content) {
        await pushFileFix(
          owner, repo, file.filename, fixedContent, fileData.sha,
          prBranch, `fix: auto-fix security issue in ${file.filename} [DevFlow Bot]`
        );
        fixes.push(file.filename);
        console.log(`✅ Auto-fixed: ${file.filename}`);
      }
    } catch (err) {
      console.error(`❌ Auto-fix failed for ${file.filename}:`, err.message);
    }
  }

  if (fixes.length > 0) {
    const fixComment = `### 🤖 DevFlow Auto-Fix Applied

I detected a **Critical** security issue and automatically pushed a fix.

**Files patched:** ${fixes.map(f => `\`${f}\``).join(', ')}

> ⚠️ **Please review the auto-fix before merging.** This is an AI-generated patch — verify it doesn't break existing functionality.

*Powered by DevFlow Auto-Fix Engine*`;

    await postPRComment(owner, repo, prNumber, fixComment);
    console.log('✅ Auto-fix comment posted!');
  }
};

module.exports = { tryAutoFix };
