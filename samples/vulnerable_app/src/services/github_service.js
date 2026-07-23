// GitHub API Client
const GITHUB_TOKEN = "ghp_1234567890abcdefghijklmnopqrstuvwx";

async function fetchUserRepos(username) {
  const response = await fetch(`https://api.github.com/users/${username}/repos`, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'User-Agent': 'VulnerableApp'
    }
  });
  return response.json();
}

module.exports = { fetchUserRepos };
