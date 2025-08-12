class ChatExtractor {
  constructor() {
    this.platform = this.detectPlatform();
    console.log('Detected platform:', this.platform);
  }

  detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      return 'chatgpt';
    } else if (hostname.includes('claude.ai')) {
      return 'claude';
    } else if (hostname.includes('gemini.google.com')) {
      return 'gemini';
    } else if (hostname.includes('poe.com')) {
      return 'poe';
    }
    return 'unknown';
  }

  extractConversation() {
    switch (this.platform) {
      case 'chatgpt':
        return this.extractChatGPT();
      case 'claude':
        return this.extractClaude();
      case 'gemini':
        return this.extractGemini();
      case 'poe':
        return this.extractPoe();
      default:
        return null;
    }
  }

  extractChatGPT() {
    const messages = [];
    
    // Try multiple selector strategies for ChatGPT
    let messageElements = document.querySelectorAll('[data-message-author-role]');
    
    if (messageElements.length === 0) {
      // Fallback selectors for different ChatGPT versions
      messageElements = document.querySelectorAll('.group.w-full');
    }
    
    messageElements.forEach(element => {
      const role = element.getAttribute('data-message-author-role') || 
                   (element.querySelector('.text-gray-800') ? 'assistant' : 'user');
      
      // Try multiple content selectors
      const contentSelectors = [
        '.markdown.prose',
        '.text-base',
        '.whitespace-pre-wrap',
        'div[class*="markdown"]',
        'div[class*="text-base"]'
      ];
      
      let textElement = null;
      for (const selector of contentSelectors) {
        textElement = element.querySelector(selector);
        if (textElement) break;
      }
      
      if (textElement) {
        messages.push({
          role: role === 'user' ? 'User' : 'Assistant',
          content: this.extractText(textElement)
        });
      }
    });

    return {
      platform: 'ChatGPT',
      messages,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }

  extractClaude() {
    const messages = [];
    
    // Updated selectors for Claude
    const selectors = [
      '[data-testid="conversation-turn"]',
      '.conversation-turn',
      'div[class*="ConversationTurn"]',
      'div[class*="message-row"]',
      'div[class*="chat-message"]'
    ];
    
    let messageContainers = [];
    for (const selector of selectors) {
      messageContainers = document.querySelectorAll(selector);
      if (messageContainers.length > 0) break;
    }
    
    // If still no messages found, try a more generic approach
    if (messageContainers.length === 0) {
      const allDivs = document.querySelectorAll('div[class*="message"], div[class*="Message"]');
      messageContainers = Array.from(allDivs).filter(div => {
        return div.textContent.trim().length > 0;
      });
    }
    
    messageContainers.forEach(container => {
      // Check if it's a user message
      const userIndicators = [
        '[data-testid="user-message"]',
        '.user-message',
        '[class*="user"]',
        '[class*="User"]',
        '[class*="human"]',
        '[class*="Human"]'
      ];
      
      let isUser = false;
      for (const indicator of userIndicators) {
        if (container.querySelector(indicator) || container.matches(indicator)) {
          isUser = true;
          break;
        }
      }
      
      // Try to find content
      const contentSelectors = [
        '.prose',
        '.message-content',
        '[data-testid="message-content"]',
        'div[class*="prose"]',
        'div[class*="content"]',
        'div[class*="Content"]',
        'p',
        'span'
      ];
      
      let contentElement = null;
      for (const selector of contentSelectors) {
        contentElement = container.querySelector(selector);
        if (contentElement && contentElement.textContent.trim()) break;
      }
      
      if (contentElement) {
        const content = this.extractText(contentElement);
        if (content.trim()) {
          messages.push({
            role: isUser ? 'User' : 'Assistant',
            content: content
          });
        }
      }
    });

    return {
      platform: 'Claude',
      messages,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }

  extractGemini() {
    console.log('🤖 Extracting Gemini conversation...');
    const messages = [];
    
    // Strategy 1: Look for conversation structure with turn-based pattern
    const conversationContainer = document.querySelector('[role="main"], main, .conversation, [class*="conversation"]');
    
    if (conversationContainer) {
      console.log('Found conversation container');
      
      // Look for user queries and AI responses in pairs
      const userQueries = [];
      const aiResponses = [];
      
      // Find user input/query elements
      const querySelectors = [
        // User query indicators
        '[data-test-id*="user"]',
        '[data-testid*="user"]',
        '[class*="user-message"]',
        '[class*="query"]',
        '[class*="Query"]',
        '[class*="human"]',
        '[class*="Human"]',
        '[class*="input"]',
        '[class*="prompt"]',
        '[class*="Prompt"]',
        // Look for editable or input-like elements that might contain user text
        '[contenteditable="true"]',
        'textarea',
        'input[type="text"]'
      ];
      
      querySelectors.forEach(selector => {
        try {
          const elements = conversationContainer.querySelectorAll(selector);
          elements.forEach(el => {
            const text = this.extractText(el);
            if (text.trim() && text.length > 5) {
              userQueries.push({
                element: el,
                text: text,
                position: this.getElementPosition(el)
              });
            }
          });
        } catch (e) {
          console.log(`Error with selector ${selector}:`, e);
        }
      });
      
      // Find AI response elements
      const responseSelectors = [
        'message-content',
        '.message-content',
        '[data-test-id*="response"]',
        '[data-testid*="response"]',
        '[class*="response"]',
        '[class*="Response"]',
        '[class*="model"]',
        '[class*="Model"]',
        '[class*="assistant"]',
        '[class*="Assistant"]',
        '[class*="ai"]',
        '[class*="AI"]',
        '[class*="gemini"]',
        '[class*="Gemini"]'
      ];
      
      responseSelectors.forEach(selector => {
        try {
          const elements = conversationContainer.querySelectorAll(selector);
          elements.forEach(el => {
            const text = this.extractText(el);
            if (text.trim() && text.length > 10) {
              aiResponses.push({
                element: el,
                text: text,
                position: this.getElementPosition(el)
              });
            }
          });
        } catch (e) {
          console.log(`Error with selector ${selector}:`, e);
        }
      });
      
      console.log(`Found ${userQueries.length} user queries and ${aiResponses.length} AI responses`);
      
      // Sort by position to maintain order
      userQueries.sort((a, b) => a.position - b.position);
      aiResponses.sort((a, b) => a.position - b.position);
      
      // Combine messages in chronological order
      const allMessages = [...userQueries.map(q => ({...q, role: 'User'})), 
                          ...aiResponses.map(r => ({...r, role: 'Assistant'}))];
      allMessages.sort((a, b) => a.position - b.position);
      
      allMessages.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.text
        });
      });
    }
    
    // Strategy 2: If no structured conversation found, try text-based extraction
    if (messages.length === 0) {
      console.log('No structured conversation found, trying text-based extraction');
      
      // Look for any significant text blocks in the main content area
      const textBlocks = [];
      const allElements = document.querySelectorAll('div, p, span, article, section');
      
      allElements.forEach(el => {
        const text = (el.innerText || el.textContent || '').trim();
        
        // Filter for conversation-like content
        if (text.length > 20 && 
            text.length < 10000 &&
            !el.closest('nav') &&
            !el.closest('header') &&
            !el.closest('footer') &&
            !el.closest('aside') &&
            !el.querySelector('button') &&
            !el.querySelector('input') &&
            !el.querySelector('nav') &&
            !text.match(/^(settings|menu|home|search|help|about)/i)) {
          
          // Check if this is a leaf text element
          const hasChildWithSameText = Array.from(el.children).some(child => 
            (child.innerText || child.textContent || '').trim() === text
          );
          
          if (!hasChildWithSameText) {
            textBlocks.push({
              text: text,
              element: el,
              position: this.getElementPosition(el),
              // Try to identify if it's likely a user query
              isLikelyUserQuery: this.isLikelyUserQuery(text, el)
            });
          }
        }
      });
      
      // Sort by position
      textBlocks.sort((a, b) => a.position - b.position);
      
      // Assign roles based on content analysis and position
      textBlocks.forEach((block, index) => {
        let role = 'Assistant'; // Default to assistant
        
        // Check if this looks like a user query
        if (block.isLikelyUserQuery || 
            (index === 0) || // First message often user
            (textBlocks[index - 1] && textBlocks[index - 1].text.length > block.text.length * 3)) {
          role = 'User';
        }
        
        messages.push({
          role: role,
          content: block.text
        });
      });
    }
    
    // Strategy 3: Last resort - look for any conversational patterns
    if (messages.length === 0) {
      console.log('Using last resort extraction method');
      const fallbackMessages = this.extractGeminiFallback();
      messages.push(...fallbackMessages);
    }
    
    // Clean up and remove duplicates
    const uniqueMessages = this.removeDuplicates(messages);
    
    console.log(`Gemini extraction complete: ${uniqueMessages.length} messages`);
    
    return {
      platform: 'Gemini',
      messages: uniqueMessages,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }
  
  isLikelyUserQuery(text, element) {
    // Characteristics that suggest user input
    const userIndicators = [
      // Short, question-like text
      text.length < 200 && text.includes('?'),
      // Imperative statements
      text.match(/^(tell me|explain|how|what|why|can you|please|help)/i),
      // Simple requests
      text.match(/^(write|create|make|generate|show|list)/i),
      // Element has user-related classes
      element.className.toLowerCase().includes('user') ||
      element.className.toLowerCase().includes('query') ||
      element.className.toLowerCase().includes('input') ||
      element.className.toLowerCase().includes('prompt'),
      // Parent has user indicators
      element.closest('[class*="user"], [class*="query"], [class*="input"]'),
      // Shorter than typical AI responses
      text.length < 300 && !text.includes('\n\n')
    ];
    
    return userIndicators.some(indicator => indicator);
  }
  
  extractGeminiFallback() {
    const messages = [];
    
    // Look for any text that might be part of a conversation
    const potentialMessages = document.querySelectorAll('*');
    const textElements = [];
    
    potentialMessages.forEach(el => {
      const text = (el.innerText || el.textContent || '').trim();
      
      if (text.length > 15 && 
          text.length < 5000 &&
          el.tagName !== 'SCRIPT' && 
          el.tagName !== 'STYLE' &&
          !el.closest('nav, header, footer, aside') &&
          !text.match(/^(cookie|privacy|terms|settings|menu)/i)) {
        
        // Avoid parent-child duplication
        const hasChildWithSameText = Array.from(el.children).some(child => 
          (child.innerText || child.textContent || '').trim() === text
        );
        
        if (!hasChildWithSameText) {
          textElements.push({
            text: text,
            position: this.getElementPosition(el),
            element: el
          });
        }
      }
    });
    
    // Sort by position and assign alternating roles
    textElements.sort((a, b) => a.position - b.position);
    
    textElements.forEach((item, index) => {
      messages.push({
        role: index % 2 === 0 ? 'User' : 'Assistant',
        content: item.text
      });
    });
    
    return messages;
  }

  extractPoe() {
    const messages = [];
    
    // Updated selectors for Poe
    const messageSelectors = [
      '.ChatMessage_messageRow__DHlnq',
      '.message-row',
      '[class*="ChatMessage"]',
      '[class*="messageRow"]',
      '[class*="Message_row"]',
      'div[class*="message"]'
    ];
    
    let messageElements = [];
    for (const selector of messageSelectors) {
      messageElements = document.querySelectorAll(selector);
      if (messageElements.length > 0) break;
    }
    
    messageElements.forEach(element => {
      const isUser = element.classList.toString().includes('human') || 
                     element.classList.toString().includes('Human') ||
                     element.classList.toString().includes('user') ||
                     element.querySelector('.human-message');
      
      const contentSelectors = [
        '.Message_botMessageContent__CPXW5',
        '.message-content',
        '[class*="messageContent"]',
        '[class*="MessageContent"]',
        'div[class*="content"]',
        'p',
        'span'
      ];
      
      let contentElement = null;
      for (const selector of contentSelectors) {
        contentElement = element.querySelector(selector);
        if (contentElement && contentElement.textContent.trim()) break;
      }
      
      if (contentElement) {
        messages.push({
          role: isUser ? 'User' : 'Assistant',
          content: this.extractText(contentElement)
        });
      }
    });

    return {
      platform: 'Poe',
      messages,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }

  extractGeneric() {
    console.log('🔄 Using generic extraction method...');
    const messages = [];
    
    // Strategy 1: Look for input fields that might contain user queries
    const inputElements = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
    const userInputs = [];
    
    inputElements.forEach(input => {
      const text = input.value || input.innerText || input.textContent || '';
      if (text.trim() && text.length > 5) {
        userInputs.push({
          text: text.trim(),
          position: this.getElementPosition(input),
          source: 'input'
        });
      }
    });
    
    // Strategy 2: Look for conversational patterns in the page
    const textElements = [];
    const allElements = document.querySelectorAll('*');
    
    // Find elements with substantial text content
    allElements.forEach(el => {
      const text = (el.innerText || el.textContent || '').trim();
      
      // Skip elements that are clearly not conversation content
      if (text.length > 10 && 
          text.length < 10000 && // Reasonable message length
          el.tagName !== 'SCRIPT' && 
          el.tagName !== 'STYLE' &&
          el.tagName !== 'NOSCRIPT' &&
          !el.closest('nav') &&
          !el.closest('header') &&
          !el.closest('footer') &&
          !el.closest('aside') &&
          !el.querySelector('button') &&
          !el.querySelector('input') &&
          !el.querySelector('select') &&
          !text.toLowerCase().includes('cookie') &&
          !text.toLowerCase().includes('privacy policy') &&
          !text.toLowerCase().includes('terms of service') &&
          !text.match(/^(settings|menu|home|search|help|about|sign|log)/i)) {
        
        // Check if this is a leaf element (no children with same text)
        const hasChildWithSameText = Array.from(el.children).some(child => 
          (child.innerText || child.textContent || '').trim() === text
        );
        
        if (!hasChildWithSameText) {
          textElements.push({
            element: el,
            text: text,
            position: this.getElementPosition(el),
            isLikelyUserQuery: this.isLikelyUserQuery(text, el)
          });
        }
      }
    });
    
    // Combine user inputs and text elements
    const allMessages = [
      ...userInputs.map(input => ({
        text: input.text,
        position: input.position,
        isUser: true,
        source: input.source
      })),
      ...textElements.map(item => ({
        text: item.text,
        position: item.position,
        isUser: item.isLikelyUserQuery,
        source: 'text'
      }))
    ];
    
    // Sort by position to maintain conversation order
    allMessages.sort((a, b) => a.position - b.position);
    
    // Smart role assignment
    allMessages.forEach((item, index) => {
      let role = 'Assistant'; // Default assumption
      
      if (item.isUser || 
          item.source === 'input' ||
          (index === 0) || // First message often user
          this.isShortQuery(item.text) ||
          (index > 0 && allMessages[index - 1].text.length > item.text.length * 2)) {
        role = 'User';
      }
      
      if (item.text.trim()) {
        messages.push({
          role: role,
          content: item.text
        });
      }
    });
    
    // If no clear pattern found, try alternating pattern
    if (messages.length === 0) {
      textElements.forEach((item, index) => {
        if (item.text.trim()) {
          messages.push({
            role: index % 2 === 0 ? 'User' : 'Assistant',
            content: item.text
          });
        }
      });
    }
    
    // Remove duplicates and filter very short messages
    const uniqueMessages = this.removeDuplicates(messages).filter(msg => 
      msg.content.length >= 5
    );
    
    console.log(`Generic extraction found ${uniqueMessages.length} messages`);
    
    return {
      platform: this.platform.charAt(0).toUpperCase() + this.platform.slice(1),
      messages: uniqueMessages,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      extractionMethod: 'generic'
    };
  }

  isShortQuery(text) {
    return text.length < 100 && (
      text.includes('?') ||
      text.match(/^(tell me|explain|how|what|why|can you|please|help|write|create|make|generate|show|list)/i)
    );
  }

  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return rect.top + window.scrollY;
  }

  removeDuplicates(messages) {
    const seen = new Set();
    const unique = [];
    
    messages.forEach(msg => {
      // Use first 50 chars as key to identify duplicates
      const key = msg.content.substring(0, 50).trim().toLowerCase();
      if (!seen.has(key) && msg.content.trim()) {
        seen.add(key);
        unique.push(msg);
      }
    });
    
    return unique;
  }

  extractText(element) {
    if (!element) return '';
    
    const clonedElement = element.cloneNode(true);
    
    // Remove interactive and non-content elements
    const toRemove = clonedElement.querySelectorAll(
      'button, .copy-button, .feedback-button, nav, header, footer, script, style, noscript, svg, img'
    );
    toRemove.forEach(el => el.remove());
    
    // Get text content
    let text = clonedElement.innerText || clonedElement.textContent || '';
    
    // Clean up the text
    text = text
      .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n\n')  // Preserve paragraph breaks
      .trim();
    
    // Handle code blocks specially
    const codeBlocks = clonedElement.querySelectorAll('pre, code');
    if (codeBlocks.length > 0) {
      // Preserve code formatting
      codeBlocks.forEach(block => {
        const codeText = block.innerText || block.textContent || '';
        if (codeText.trim()) {
          text += '\n\n```\n' + codeText + '\n```\n';
        }
      });
    }
    
    return text;
  }

  convertToMarkdown(conversation) {
    if (!conversation || !conversation.messages) {
      return '# No conversation found\n\nUnable to extract conversation from this page.';
    }

    let markdown = `# ${conversation.platform} Conversation\n\n`;
    markdown += `**Exported:** ${new Date(conversation.timestamp).toLocaleString()}\n`;
    markdown += `**URL:** ${conversation.url}\n\n`;
    markdown += '---\n\n';

    conversation.messages.forEach((message, index) => {
      const roleIcon = message.role === 'User' ? '👤' : '🤖';
      markdown += `## ${roleIcon} ${message.role}\n\n`;
      markdown += `${message.content}\n\n`;
      
      if (index < conversation.messages.length - 1) {
        markdown += '---\n\n';
      }
    });

    return markdown;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractConversation') {
    console.log('🚀 Starting conversation extraction...');
    
    try {
      const extractor = new ChatExtractor();
      let conversation = extractor.extractConversation();
      
      // If platform-specific extraction failed, try generic extraction
      if (!conversation || !conversation.messages || conversation.messages.length === 0) {
        console.log('Platform-specific extraction failed, trying generic method...');
        conversation = extractor.extractGeneric();
      }
      
      if (conversation && conversation.messages && conversation.messages.length > 0) {
        const markdown = extractor.convertToMarkdown(conversation);
        console.log(`✅ Extraction successful: ${conversation.messages.length} messages`);
        
        sendResponse({
          success: true,
          conversation: conversation,
          markdown: markdown
        });
      } else {
        console.log('❌ No conversation found');
        sendResponse({
          success: false,
          error: 'No conversation found on this page. Please make sure you are on a chat page with visible messages.'
        });
      }
    } catch (error) {
      console.error('❌ Extraction error:', error);
      sendResponse({
        success: false,
        error: `Extraction failed: ${error.message}`
      });
    }
    
    return true; // Keep message channel open for async response
  }
});

console.log('🚀 AI Chat Exporter content script loaded');