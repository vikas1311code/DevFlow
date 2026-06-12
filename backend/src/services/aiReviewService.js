const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const reviewCode = async (prTitle, files) => {
  const diffText = files
    .filter((f) => f.patch)
    .map((f) => `### File: ${f.filename} (+${f.additions}/-${f.deletions})\n${f.patch}`)
    .join('\n\n')
    .slice(0, 30000);

  if (!diffText) {
    return '🤖 **DevFlow AI Review**\n\n✅ **Verdict: Approve**\n\nNo reviewable code changes found (binary/large files only).';
  }

  const prompt = `Tum ek senior software engineer ho jo pull requests review karte ho. Tumhara review concise, actionable, aur professional hona chahiye - jaisa CodeRabbit ya GitHub Copilot review karta hai.

PR Title: "${prTitle}"

Neeche diye gaye code changes (diff format, multiple files ho sakte hain) ko **holistically** review karo - sirf individual lines nahi, balki files ke beech relationships, consistency, aur overall design bhi check karo.

Apna jawab EXACTLY ye structure mein do (markdown):

## Verdict
Ek line mein: "✅ Approve", "💬 Comment", ya "⚠️ Request Changes" - reason ke saath.

## Summary
2-3 lines mein bata kya change hua hai aur kyun.

## Issues
Har issue ko severity tag ke saath likho: **[Critical]**, **[Major]**, ya **[Minor]**.
- Critical: security vulnerabilities, data loss, breaking bugs
- Major: logic errors, performance issues, missing error handling
- Minor: style, naming, minor improvements
Agar koi issue nahi: "No issues found."

## Suggestions
1-3 bullet points - concrete, actionable improvements.

Code changes:
${diffText}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  const result = await model.generateContent(prompt);
  const reviewText = result.response.text();

  return `🤖 **DevFlow AI Review**\n\n${reviewText}\n\n---\n*Powered by DevFlow + Gemini AI*`;
};

module.exports = { reviewCode };
