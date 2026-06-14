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

// File ka current content fetch karo (base64 encoded)
const getFileContent = async (owner, repo, path, ref) => {
  try {
    const res = await githubApi.get(`/repos/${owner}/${repo}/contents/${path}`, {
      params: { ref },
    });
    return {
      content: Buffer.from(res.data.content, 'base64').toString('utf8'),
      sha: res.data.sha,
      encoding: res.data.encoding,
    };
  } catch (err) {
    return null;
  }
};

// File ko commit karke push karo
const pushFileFix = async (owner, repo, path, newContent, sha, branch, message) => {
  const res = await githubApi.put(`/repos/${owner}/${repo}/contents/${path}`, {
    message,
    content: Buffer.from(newContent, 'utf8').toString('base64'),
    sha,
    branch,
  });
  return res.data;
};

module.exports = { getPRFiles, postPRComment, getFileContent, pushFileFix };
