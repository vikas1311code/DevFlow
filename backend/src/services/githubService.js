const axios = require('axios');

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_PAT}`,
    Accept: 'application/vnd.github+json',
  },
});

// PR ke changed files aur unka diff fetch karo
const getPRFiles = async (owner, repo, prNumber) => {
  const res = await githubApi.get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`);
  return res.data; // array of { filename, status, additions, deletions, patch }
};

// PR pe AI review comment post karo
const postPRComment = async (owner, repo, prNumber, body) => {
  const res = await githubApi.post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
    body,
  });
  return res.data;
};

module.exports = { getPRFiles, postPRComment };
