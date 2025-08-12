chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Chat Exporter installed');
  
  chrome.storage.sync.get(['githubToken', 'githubRepo', 'githubOwner'], (result) => {
    if (!result.githubToken || !result.githubRepo || !result.githubOwner) {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'uploadToGitHub') {
    handleGitHubUpload(request.data)
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleGitHubUpload(data) {
  const { token, owner, repo, path, content, message, branch = 'main' } = data;
  
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  try {
    const checkResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    let sha = null;
    if (checkResponse.ok) {
      const existingFile = await checkResponse.json();
      sha = existingFile.sha;
    }
    
    const body = {
      message: message || `Add/Update ${path}`,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: branch
    };
    
    if (sha) {
      body.sha = sha;
    }
    
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        url: result.content.html_url,
        sha: result.content.sha
      };
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }
  } catch (error) {
    throw error;
  }
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.githubToken || changes.githubRepo || changes.githubOwner) {
      chrome.storage.sync.get(['githubToken', 'githubRepo', 'githubOwner'], (result) => {
        if (!result.githubToken || !result.githubRepo || !result.githubOwner) {
          chrome.action.setBadgeText({ text: '!' });
          chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
        } else {
          chrome.action.setBadgeText({ text: '' });
        }
      });
    }
  }
});