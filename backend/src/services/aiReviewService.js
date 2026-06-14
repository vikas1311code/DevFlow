const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const personas = [
  {
    name: '🔒 Security Reviewer',
    focus: 'security vulnerabilities, authentication issues, SQL injection, XSS, hardcoded secrets, insecure dependencies, exposed sensitive data, missing input validation',
    instruction: 'Focus ONLY on security. If nothing is suspicious, say so briefly.',
  },
  {
    name: '⚡ Performance Reviewer',
    focus: 'N+1 queries, unnecessary loops, memory leaks, blocking operations, missing indexes, large payloads, unoptimized algorithms',
    instruction: 'Focus ONLY on performance. If nothing is concerning, say so briefly.',
  },
  {
    name: '🤔 Junior Dev',
    focus: 'confusing variable/function names, missing comments, unclear logic, functions that are hard to understand without context',
    instruction: 'Ask questions as if you are a junior developer trying to understand this code. Be curious, not critical. Max 2-3 questions.',
  },
];

const reviewWithPersona = async (persona, prTitle, diffText) => {
  const prompt = `You are a code reviewer with a specific focus: ${persona.name}.
Your focus area: ${persona.focus}
Instruction: ${persona.instruction}

PR Title: "${prTitle}"

Keep your review SHORT and focused — max 150 words. Use markdown. No preamble.

Code diff:
${diffText}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

const reviewCode = async (prTitle, files) => {
  const diffText = files
    .filter((f) => f.patch)
    .map((f) => `### File: ${f.filename} (+${f.additions}/-${f.deletions})\n${f.patch}`)
    .join('\n\n')
    .slice(0, 20000);

  if (!diffText) {
    return [{
      persona: '🤖 DevFlow AI Review',
      review: 'No reviewable code changes found (binary/large files only).\n\n**Verdict:** ✅ Approve',
    }];
  }

  // Main review (verdict + summary + issues)
  const mainPrompt = `You are a senior software engineer reviewing a pull request.
PR Title: "${prTitle}"

Give a concise structured review in markdown:

## Verdict
One line: "✅ Approve", "💬 Comment", or "⚠️ Request Changes" with reason.

## Summary
2-3 lines max.

## Issues
Severity tagged: **[Critical]**, **[Major]**, **[Minor]**. If none: "No issues found."

## Suggestions
1-3 actionable bullets max.

Code diff:
${diffText}`;

  const mainResult = await model.generateContent(mainPrompt);
  const mainReview = mainResult.response.text();

  // 3 persona reviews parallel mein
  const personaReviews = await Promise.all(
    personas.map(async (persona) => {
      const review = await reviewWithPersona(persona, prTitle, diffText);
      return { persona: persona.name, review };
    })
  );

  return [
    { persona: '🤖 DevFlow AI Review', review: mainReview },
    ...personaReviews,
  ];
};

module.exports = { reviewCode };
