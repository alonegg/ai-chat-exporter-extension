let extractedConversation = null;
let extractedMarkdown = null;
let extractedHTML = null;

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
  checkConfiguration();
});

function setupEventListeners() {
  document.getElementById('extractBtn').addEventListener('click', extractConversation);
  document.getElementById('exportBtn').addEventListener('click', exportToGitHub);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('configureLink').addEventListener('click', openSettings);
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  document.getElementById('fileName').addEventListener('input', (e) => {
    chrome.storage.local.set({ customFileName: e.target.value });
  });
  
  document.getElementById('repoPath').addEventListener('input', (e) => {
    chrome.storage.local.set({ repoPath: e.target.value });
  });
  
  document.getElementById('exportMarkdown').addEventListener('change', saveExportSettings);
  document.getElementById('exportHTML').addEventListener('change', saveExportSettings);
}

function loadSettings() {
  chrome.storage.local.get(['customFileName', 'repoPath', 'exportMarkdown', 'exportHTML'], (result) => {
    if (result.customFileName) {
      document.getElementById('fileName').value = result.customFileName;
    }
    if (result.repoPath) {
      document.getElementById('repoPath').value = result.repoPath;
    }
    if (result.exportMarkdown !== undefined) {
      document.getElementById('exportMarkdown').checked = result.exportMarkdown;
    }
    if (result.exportHTML !== undefined) {
      document.getElementById('exportHTML').checked = result.exportHTML;
    }
  });
}

function saveExportSettings() {
  chrome.storage.local.set({
    exportMarkdown: document.getElementById('exportMarkdown').checked,
    exportHTML: document.getElementById('exportHTML').checked
  });
}

function checkConfiguration() {
  chrome.storage.sync.get(['githubToken', 'githubRepo', 'githubOwner'], (result) => {
    if (!result.githubToken || !result.githubRepo || !result.githubOwner) {
      showStatus('Please configure your GitHub settings first', 'info');
      document.getElementById('exportBtn').disabled = true;
    }
  });
}

async function extractConversation() {
  showStatus('Extracting conversation...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { action: 'extractChat' }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Error: Unable to access the page. Please refresh and try again.', 'error');
        return;
      }
      
      if (response && response.success) {
        extractedConversation = response.conversation;
        extractedMarkdown = response.markdown;
        extractedHTML = convertMarkdownToHTML(response.markdown);
        
        showPreview();
        document.getElementById('exportBtn').disabled = false;
        showStatus('Conversation extracted successfully!', 'success');
      } else {
        showStatus(response?.error || 'Failed to extract conversation', 'error');
      }
    });
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
}

function convertMarkdownToHTML(markdown) {
  const lines = markdown.split('\n');
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Chat Conversation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    h2 {
      color: #667eea;
      margin-top: 30px;
    }
    .metadata {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .metadata strong {
      color: #555;
    }
    hr {
      border: none;
      border-top: 2px solid #e0e0e0;
      margin: 30px 0;
    }
    pre {
      background: #282c34;
      color: #abb2bf;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
    }
    code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre code {
      background: transparent;
      padding: 0;
    }
    .user-message {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .assistant-message {
      background: #f3e5f5;
      border-left: 4px solid #9c27b0;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    a {
      color: #667eea;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">`;
  
  let inCodeBlock = false;
  let inUserMessage = false;
  let inAssistantMessage = false;
  
  lines.forEach(line => {
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        const language = line.substring(3).trim();
        html += `<pre><code class="language-${language}">`;
        inCodeBlock = true;
      } else {
        html += '</code></pre>';
        inCodeBlock = false;
      }
    } else if (inCodeBlock) {
      html += escapeHtml(line) + '\n';
    } else if (line.startsWith('# ')) {
      html += `<h1>${escapeHtml(line.substring(2))}</h1>`;
    } else if (line.startsWith('## User')) {
      if (inAssistantMessage) {
        html += '</div>';
        inAssistantMessage = false;
      }
      html += '<div class="user-message"><h2>User</h2>';
      inUserMessage = true;
    } else if (line.startsWith('## Assistant')) {
      if (inUserMessage) {
        html += '</div>';
        inUserMessage = false;
      }
      html += '<div class="assistant-message"><h2>Assistant</h2>';
      inAssistantMessage = true;
    } else if (line.startsWith('**')) {
      const match = line.match(/\*\*(.*?)\*\*(.*)/); 
      if (match) {
        html += `<div class="metadata"><strong>${escapeHtml(match[1])}</strong>${escapeHtml(match[2])}</div>`;
      }
    } else if (line === '---') {
      if (inUserMessage) {
        html += '</div>';
        inUserMessage = false;
      }
      if (inAssistantMessage) {
        html += '</div>';
        inAssistantMessage = false;
      }
      html += '<hr>';
    } else if (line.trim()) {
      html += `<p>${escapeHtml(line)}</p>`;
    }
  });
  
  if (inUserMessage || inAssistantMessage) {
    html += '</div>';
  }
  
  html += `
  </div>
</body>
</html>`;
  
  return html;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function showPreview() {
  document.getElementById('previewSection').style.display = 'block';
  document.getElementById('markdownPreview').textContent = extractedMarkdown;
  document.getElementById('htmlPreview').innerHTML = extractedHTML;
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  document.querySelectorAll('.preview-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  
  if (tab === 'markdown') {
    document.getElementById('markdownPreview').classList.add('active');
  } else {
    document.getElementById('htmlPreview').classList.add('active');
  }
}

async function exportToGitHub() {
  showStatus('Exporting to GitHub...', 'info');
  
  chrome.storage.sync.get(['githubToken', 'githubRepo', 'githubOwner'], async (config) => {
    if (!config.githubToken || !config.githubRepo || !config.githubOwner) {
      showStatus('Please configure GitHub settings first', 'error');
      return;
    }
    
    const fileName = document.getElementById('fileName').value || generateFileName();
    const repoPath = document.getElementById('repoPath').value || 'conversations/';
    const exportMarkdown = document.getElementById('exportMarkdown').checked;
    const exportHTML = document.getElementById('exportHTML').checked;
    
    if (!exportMarkdown && !exportHTML) {
      showStatus('Please select at least one export format', 'error');
      return;
    }
    
    try {
      const results = [];
      
      if (exportMarkdown) {
        const mdResult = await uploadToGitHub(
          config,
          `${repoPath}${fileName}.md`,
          extractedMarkdown,
          'text/plain'
        );
        results.push(mdResult);
      }
      
      if (exportHTML) {
        const htmlResult = await uploadToGitHub(
          config,
          `${repoPath}${fileName}.html`,
          extractedHTML,
          'text/html'
        );
        results.push(htmlResult);
      }
      
      if (results.every(r => r.success)) {
        showStatus('Successfully exported to GitHub!', 'success');
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        const errors = results.filter(r => !r.success).map(r => r.error);
        showStatus('Export failed: ' + errors.join(', '), 'error');
      }
    } catch (error) {
      showStatus('Export failed: ' + error.message, 'error');
    }
  });
}

async function uploadToGitHub(config, path, content, contentType) {
  const apiUrl = `https://api.github.com/repos/${config.githubOwner}/${config.githubRepo}/contents/${path}`;
  
  try {
    const checkResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${config.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    let sha = null;
    if (checkResponse.ok) {
      const existingFile = await checkResponse.json();
      sha = existingFile.sha;
    }
    
    const body = {
      message: `Add conversation export: ${path}`,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: config.branch || 'main'
    };
    
    if (sha) {
      body.sha = sha;
      body.message = `Update conversation export: ${path}`;
    }
    
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${config.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.message || 'Upload failed' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function generateFileName() {
  const now = new Date();
  const platform = extractedConversation?.platform || 'chat';
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  
  const firstMessage = extractedConversation?.messages?.[0]?.content || '';
  const slug = firstMessage
    .slice(0, 30)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return `${platform}-${timestamp}${slug ? '-' + slug : ''}`;
}

function showStatus(message, type) {
  const statusElement = document.getElementById('statusMessage');
  statusElement.textContent = message;
  statusElement.className = `status-message ${type}`;
}

function openSettings() {
  chrome.runtime.openOptionsPage();
}