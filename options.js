document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('testConnection').addEventListener('click', testConnection);
  
  document.querySelector('.toggle-visibility').addEventListener('click', togglePasswordVisibility);
  
  document.getElementById('fileNaming').addEventListener('change', (e) => {
    const customPrefixGroup = document.getElementById('customPrefixGroup');
    customPrefixGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
  });
  
  document.getElementById('githubToken').addEventListener('input', validateToken);
  document.getElementById('githubOwner').addEventListener('input', validateUsername);
  document.getElementById('githubRepo').addEventListener('input', validateRepo);
}

function loadSettings() {
  chrome.storage.sync.get({
    githubToken: '',
    githubOwner: '',
    githubRepo: '',
    githubBranch: 'main',
    defaultPath: 'conversations/',
    defaultMarkdown: true,
    defaultHTML: true,
    fileNaming: 'auto',
    customPrefix: '',
    autoExport: false,
    confirmBeforeExport: true
  }, (items) => {
    document.getElementById('githubToken').value = items.githubToken;
    document.getElementById('githubOwner').value = items.githubOwner;
    document.getElementById('githubRepo').value = items.githubRepo;
    document.getElementById('githubBranch').value = items.githubBranch;
    document.getElementById('defaultPath').value = items.defaultPath;
    document.getElementById('defaultMarkdown').checked = items.defaultMarkdown;
    document.getElementById('defaultHTML').checked = items.defaultHTML;
    document.getElementById('fileNaming').value = items.fileNaming;
    document.getElementById('customPrefix').value = items.customPrefix;
    document.getElementById('autoExport').checked = items.autoExport;
    document.getElementById('confirmBeforeExport').checked = items.confirmBeforeExport;
    
    if (items.fileNaming === 'custom') {
      document.getElementById('customPrefixGroup').style.display = 'block';
    }
  });
  
  chrome.storage.local.get({
    exportMarkdown: true,
    exportHTML: true
  }, (items) => {
    document.getElementById('defaultMarkdown').checked = items.exportMarkdown;
    document.getElementById('defaultHTML').checked = items.exportHTML;
  });
}

function saveSettings() {
  const settings = {
    githubToken: document.getElementById('githubToken').value.trim(),
    githubOwner: document.getElementById('githubOwner').value.trim(),
    githubRepo: document.getElementById('githubRepo').value.trim(),
    githubBranch: document.getElementById('githubBranch').value.trim() || 'main',
    defaultPath: document.getElementById('defaultPath').value.trim() || 'conversations/',
    defaultMarkdown: document.getElementById('defaultMarkdown').checked,
    defaultHTML: document.getElementById('defaultHTML').checked,
    fileNaming: document.getElementById('fileNaming').value,
    customPrefix: document.getElementById('customPrefix').value.trim(),
    autoExport: document.getElementById('autoExport').checked,
    confirmBeforeExport: document.getElementById('confirmBeforeExport').checked
  };
  
  if (!settings.githubToken) {
    showStatus('Please enter a GitHub Personal Access Token', 'error');
    return;
  }
  
  if (!settings.githubOwner) {
    showStatus('Please enter a GitHub username or organization', 'error');
    return;
  }
  
  if (!settings.githubRepo) {
    showStatus('Please enter a repository name', 'error');
    return;
  }
  
  if (!validateTokenFormat(settings.githubToken)) {
    showStatus('Invalid token format. GitHub tokens start with ghp_ or github_pat_', 'error');
    return;
  }
  
  chrome.storage.sync.set(settings, () => {
    chrome.storage.local.set({
      exportMarkdown: settings.defaultMarkdown,
      exportHTML: settings.defaultHTML
    }, () => {
      showStatus('Settings saved successfully!', 'success');
      setTimeout(() => {
        const statusElement = document.getElementById('statusMessage');
        statusElement.style.display = 'none';
      }, 3000);
    });
  });
}

async function testConnection() {
  const token = document.getElementById('githubToken').value.trim();
  const owner = document.getElementById('githubOwner').value.trim();
  const repo = document.getElementById('githubRepo').value.trim();
  
  if (!token || !owner || !repo) {
    showStatus('Please fill in all required GitHub fields', 'error');
    return;
  }
  
  const testButton = document.getElementById('testConnection');
  testButton.disabled = true;
  testButton.textContent = 'Testing...';
  
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.ok) {
      const repoData = await response.json();
      showStatus(`Successfully connected to ${repoData.full_name}!`, 'success');
    } else if (response.status === 404) {
      showStatus('Repository not found. Please check the owner and repository name.', 'error');
    } else if (response.status === 401) {
      showStatus('Invalid token. Please check your Personal Access Token.', 'error');
    } else {
      showStatus(`Connection failed: ${response.statusText}`, 'error');
    }
  } catch (error) {
    showStatus(`Connection error: ${error.message}`, 'error');
  } finally {
    testButton.disabled = false;
    testButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      Test Connection
    `;
  }
}

function togglePasswordVisibility(e) {
  const button = e.currentTarget;
  const targetId = button.getAttribute('data-target');
  const input = document.getElementById(targetId);
  
  if (input.type === 'password') {
    input.type = 'text';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    `;
  } else {
    input.type = 'password';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
  }
}

function validateTokenFormat(token) {
  return token.startsWith('ghp_') || 
         token.startsWith('github_pat_') || 
         token.startsWith('ghs_') ||
         token.length === 40;
}

function validateToken(e) {
  const token = e.target.value;
  if (token && !validateTokenFormat(token)) {
    e.target.style.borderColor = '#ff6b6b';
  } else {
    e.target.style.borderColor = '';
  }
}

function validateUsername(e) {
  const username = e.target.value;
  const validPattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
  
  if (username && !validPattern.test(username)) {
    e.target.style.borderColor = '#ff6b6b';
  } else {
    e.target.style.borderColor = '';
  }
}

function validateRepo(e) {
  const repo = e.target.value;
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  
  if (repo && !validPattern.test(repo)) {
    e.target.style.borderColor = '#ff6b6b';
  } else {
    e.target.style.borderColor = '';
  }
}

function showStatus(message, type) {
  const statusElement = document.getElementById('statusMessage');
  statusElement.textContent = message;
  statusElement.className = `status-message ${type}`;
  statusElement.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, 5000);
  }
}