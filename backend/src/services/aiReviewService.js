const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// PR ke diffs ko Gemini ko bhejo aur structured review pao
const reviewCode = async (prTitle, files) => {
  // Sirf patch (diff) data combine karo, bahut bade files skip karo
  const diffText = files
    .filter((f) => f.patch) // binary files mein patch nahi hota
    .map((f) => `### File: ${f.filename}\n${f.patch}`)
    .join('\n\n')
    .slice(0, 30000); // Gemini limit ke liye truncate karo

  if (!diffText) {
    return '🤖 **DevFlow AI Review**\n\nIs PR mein review karne layak code changes nahi mile (sirf binary/large files honge).';
  }

  const prompt = `Tum ek senior software engineer ho jo pull requests review karte ho.

PR Title: "${prTitle}"

Neeche diye gaye code changes (diff format mein) ko review karo aur ye batao:
1. **Summary** - PR mein kya change hua hai (2-3 lines)
2. **Issues** - Koi bugs, security issues, ya bad practices (agar koi nahi to "No major issues found")
3. **Suggestions** - Code quality improve karne ke liye 1-3 suggestions

Markdown format mein concise jawab do. Bahut lamba mat likho.

Code changes:
${diffText}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  const result = await model.generateContent(prompt);
  const reviewText = result.response.text();

  return `🤖 **DevFlow AI Review**\n\n${reviewText}\n\n---\n*Powered by DevFlow + Gemini AI*`;
};

module.exports = { reviewCode };
