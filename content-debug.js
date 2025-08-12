// Debug version with enhanced extraction capabilities
class ChatExtractor {
  constructor() {
    this.platform = this.detectPlatform();
    console.log('🔍 AI Chat Exporter - Platform detected:', this.platform);
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
    console.log('🎯 Starting extraction for platform:', this.platform);
    
    let result;
    switch (this.platform) {
      case 'chatgpt':
        result = this.extractChatGPT();
        break;
      case 'claude':
        result = this.extractClaude();
        break;
      case 'gemini':
        result = this.extractGemini();
        break;
      case 'poe':
        result = this.extractPoe();
        break;
      default:
        result = this.extractGeneric();
    }
    
    // If no messages found, try generic extraction
    if (!result || result.messages.length === 0) {
      console.log('⚠️ No messages found with specific extractor, trying generic method...');
      result = this.extractGeneric();
    }
    
    console.log(`✅ Extracted ${result?.messages?.length || 0} messages`);
    return result;
  }

  extractGeneric() {
    console.log('🔄 Using generic extraction method...');
    const messages = [];
    
    // Strategy 1: Look for any conversational patterns
    const allElements = document.querySelectorAll('*');
    const conversationElements = [];
    
    allElements.forEach(el => {
      const text = el.innerText || el.textContent || '';
      // Look for elements with substantial text that aren't scripts or styles
      if (text.length > 30 && 
          el.tagName !== 'SCRIPT' && 
          el.tagName !== 'STYLE' &&
          el.tagName !== 'NOSCRIPT' &&
          !el.closest('nav') &&
          !el.closest('header') &&
          !el.closest('footer')) {
        
        // Check if this element has children with similar text (avoid duplicates)
        const hasChildWithSameText = Array.from(el.children).some(child => 
          (child.innerText || child.textContent || '').trim() === text.trim()
        );
        
        if (!hasChildWithSameText) {
          conversationElements.push({
            element: el,
            text: text.trim(),
            depth: this.getElementDepth(el)
          });
        }
      }
    });
    
    // Sort by depth to get the most specific elements
    conversationElements.sort((a, b) => b.depth - a.depth);
    
    // Group elements by their container
    const groups = this.groupByContainer(conversationElements);
    
    // Extract messages from groups
    groups.forEach((group, index) => {
      if (group.length > 0) {
        group.forEach((item, itemIndex) => {
          // Try to determine role based on position or content
          const isUser = itemIndex % 2 === 0; // Alternate pattern
          
          messages.push({
            role: isUser ? 'User' : 'Assistant',
            content: item.text
          });
        });
      }
    });
    
    // Remove obvious duplicates
    const uniqueMessages = this.removeDuplicates(messages);
    
    return {
      platform: this.platform.charAt(0).toUpperCase() + this.platform.slice(1),
      messages: uniqueMessages,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      extractionMethod: 'generic'
    };
  }

  extractChatGPT() {
    console.log('🤖 Extracting ChatGPT conversation...');
    const messages = [];
    
    // Multiple strategies for ChatGPT
    const strategies = [
      // Strategy 1: Official data attributes
      () => {
        const elements = document.querySelectorAll('[data-message-author-role]');
        console.log(`  Found ${elements.length} elements with data-message-author-role`);
        return Array.from(elements).map(el => ({
          role: el.getAttribute('data-message-author-role'),
          element: el
        }));
      },
      // Strategy 2: Class-based selection
      () => {
        const elements = document.querySelectorAll('.group.w-full');
        console.log(`  Found ${elements.length} elements with .group.w-full`);
        return Array.from(elements).map(el => ({
          role: el.querySelector('.text-gray-800') ? 'assistant' : 'user',
          element: el
        }));
      },
      // Strategy 3: Markdown content
      () => {
        const elements = document.querySelectorAll('[class*="markdown"], [class*="prose"]');
        console.log(`  Found ${elements.length} markdown/prose elements`);
        return Array.from(elements).map(el => ({
          role: 'unknown',
          element: el.closest('[class*="group"]') || el
        }));
      }
    ];
    
    for (const strategy of strategies) {
      const results = strategy();
      if (results.length > 0) {
        results.forEach(({ role, element }) => {
          const content = this.extractText(element);
          if (content.trim()) {
            messages.push({
              role: role === 'user' ? 'User' : 'Assistant',
              content: content
            });
          }
        });
        break;
      }
    }
    
    return {
      platform: 'ChatGPT',
      messages: this.removeDuplicates(messages),
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }

  extractClaude() {
    console.log('🤖 Extracting Claude conversation...');
    const messages = [];
    
    // Try multiple strategies for Claude
    const strategies = [
      // Look for human/assistant labels
      () => {
        const humanElements = document.querySelectorAll('[class*="Human"], [class*="human"]');
        const assistantElements = document.querySelectorAll('[class*="Assistant"], [class*="assistant"]');
        console.log(`  Found ${humanElements.length} human and ${assistantElements.length} assistant elements`);
        
        const results = [];
        humanElements.forEach(el => results.push({ role: 'user', element: el }));
        assistantElements.forEach(el => results.push({ role: 'assistant', element: el }));
        return results;
      },
      // Look for conversation turns
      () => {
        const elements = document.querySelectorAll('[class*="turn"], [class*="Turn"]');
        console.log(`  Found ${elements.length} turn elements`);
        return Array.from(elements).map((el, i) => ({
          role: i % 2 === 0 ? 'user' : 'assistant',
          element: el
        }));
      }
    ];
    
    for (const strategy of strategies) {
      const results = strategy();
      if (results.length > 0) {
        results.forEach(({ role, element }) => {
          const content = this.extractText(element);
          if (content.trim()) {
            messages.push({
              role: role === 'user' ? 'User' : 'Assistant',
              content: content
            });
          }
        });
        break;
      }
    }
    
    return {
      platform: 'Claude',
      messages: this.removeDuplicates(messages),
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }

  extractGemini() {
    console.log('🤖 Extracting Gemini conversation...');
    const messages = [];
    
    // Gemini-specific extraction
    const strategies = [
      // Look for message containers
      () => {
        const elements = document.querySelectorAll('message-content, .message-content');
        console.log(`  Found ${elements.length} message-content elements`);
        return Array.from(elements).map((el, i) => ({
          role: i % 2 === 0 ? 'user' : 'assistant',
          element: el
        }));
      },
      // Look for query/response pattern
      () => {
        const queries = document.querySelectorAll('[class*="query"], [class*="Query"]');
        const responses = document.querySelectorAll('[class*="response"], [class*="Response"]');
        console.log(`  Found ${queries.length} queries and ${responses.length} responses`);
        
        const results = [];
        queries.forEach(el => results.push({ role: 'user', element: el }));
        responses.forEach(el => results.push({ role: 'assistant', element: el }));
        return results;
      },
      // Look for any text containers in main area
      () => {
        const main = document.querySelector('main, [role="main"], .main-content');
        if (main) {
          const elements = main.querySelectorAll('div[class], p[class]');
          const filtered = Array.from(elements).filter(el => {
            const text = el.textContent || '';
            return text.length > 30 && !el.querySelector('button');
          });
          console.log(`  Found ${filtered.length} text containers in main area`);
          return filtered.map((el, i) => ({
            role: i % 2 === 0 ? 'user' : 'assistant',
            element: el
          }));
        }
        return [];
      }
    ];
    
    for (const strategy of strategies) {
      const results = strategy();
      if (results.length > 0) {
        results.forEach(({ role, element }) => {
          const content = this.extractText(element);
          if (content.trim()) {
            messages.push({
              role: role === 'user' ? 'User' : 'Assistant',
              content: content
            });
          }
        });
        break;
      }
    }
    
    return {
      platform: 'Gemini',
      messages: this.removeDuplicates(messages),
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }

  extractPoe() {
    console.log('🤖 Extracting Poe conversation...');
    const messages = [];
    
    // Poe-specific extraction
    const strategies = [
      // Look for ChatMessage classes
      () => {
        const elements = document.querySelectorAll('[class*="ChatMessage"], [class*="Message"]');
        console.log(`  Found ${elements.length} message elements`);
        return Array.from(elements).map(el => ({
          role: el.className.includes('human') || el.className.includes('Human') ? 'user' : 'assistant',
          element: el
        }));
      },
      // Look for message rows
      () => {
        const elements = document.querySelectorAll('[class*="messageRow"], [class*="message-row"]');
        console.log(`  Found ${elements.length} message row elements`);
        return Array.from(elements).map((el, i) => ({
          role: i % 2 === 0 ? 'user' : 'assistant',
          element: el
        }));
      }
    ];
    
    for (const strategy of strategies) {
      const results = strategy();
      if (results.length > 0) {
        results.forEach(({ role, element }) => {
          const content = this.extractText(element);
          if (content.trim()) {
            messages.push({
              role: role === 'user' ? 'User' : 'Assistant',
              content: content
            });
          }
        });
        break;
      }
    }
    
    return {
      platform: 'Poe',
      messages: this.removeDuplicates(messages),
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }

  extractText(element) {
    if (!element) return '';
    
    const clonedElement = element.cloneNode(true);
    
    // Remove interactive elements
    const toRemove = clonedElement.querySelectorAll(
      'button, .copy-button, .feedback-button, nav, header, footer, script, style, noscript'
    );
    toRemove.forEach(el => el.remove());
    
    // Handle code blocks specially
    const codeBlocks = clonedElement.querySelectorAll('pre code, .code-block, [class*="code"]');
    codeBlocks.forEach(block => {
      const language = block.className.match(/language-(\w+)/)?.[1] || '';
      const codeText = block.textContent.trim();
      const wrapper = document.createElement('div');
      wrapper.textContent = `\`\`\`${language}\n${codeText}\n\`\`\``;
      block.parentNode?.replaceChild(wrapper, block);
    });
    
    // Get text content
    let text = clonedElement.innerText || clonedElement.textContent || '';
    
    // Clean up whitespace
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    
    return text;
  }

  getElementDepth(element) {
    let depth = 0;
    let current = element;
    while (current.parentElement) {
      depth++;
      current = current.parentElement;
    }
    return depth;
  }

  groupByContainer(elements) {
    const groups = [];
    const used = new Set();
    
    elements.forEach(item => {
      if (used.has(item.element)) return;
      
      const group = [item];
      used.add(item.element);
      
      // Find siblings at similar depth
      elements.forEach(other => {
        if (!used.has(other.element) && 
            Math.abs(other.depth - item.depth) <= 2 &&
            this.haveSameAncestor(item.element, other.element, 3)) {
          group.push(other);
          used.add(other.element);
        }
      });
      
      if (group.length > 0) {
        groups.push(group);
      }
    });
    
    return groups;
  }

  haveSameAncestor(el1, el2, maxLevels) {
    let ancestor1 = el1;
    let ancestor2 = el2;
    
    for (let i = 0; i < maxLevels; i++) {
      ancestor1 = ancestor1.parentElement;
      ancestor2 = ancestor2.parentElement;
      
      if (!ancestor1 || !ancestor2) return false;
      if (ancestor1 === ancestor2) return true;
    }
    
    return false;
  }

  removeDuplicates(messages) {
    const seen = new Set();
    const unique = [];
    
    messages.forEach(msg => {
      // Use first 100 chars as key to identify duplicates
      const key = msg.content.substring(0, 100).trim();
      if (!seen.has(key) && msg.content.trim()) {
        seen.add(key);
        unique.push(msg);
      }
    });
    
    return unique;
  }

  convertToMarkdown(conversation) {
    if (!conversation) return null;
    
    let markdown = `# ${conversation.platform} Conversation\n\n`;
    markdown += `**Date:** ${new Date(conversation.timestamp).toLocaleString()}\n`;
    markdown += `**URL:** [${conversation.url}](${conversation.url})\n`;
    
    if (conversation.extractionMethod) {
      markdown += `**Extraction Method:** ${conversation.extractionMethod}\n`;
    }
    
    markdown += `\n---\n\n`;
    
    if (conversation.messages.length === 0) {
      markdown += `*No messages could be extracted from this conversation.*\n\n`;
      markdown += `Please ensure the conversation is fully loaded and try again.\n`;
    } else {
      conversation.messages.forEach((msg, index) => {
        markdown += `## ${msg.role}\n\n`;
        markdown += `${msg.content}\n\n`;
        if (index < conversation.messages.length - 1) {
          markdown += `---\n\n`;
        }
      });
    }
    
    return markdown;
  }
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractChat') {
    console.log('📨 Received extraction request');
    
    try {
      const extractor = new ChatExtractor();
      const conversation = extractor.extractConversation();
      
      if (conversation && conversation.messages.length > 0) {
        const markdown = extractor.convertToMarkdown(conversation);
        console.log('✅ Extraction successful:', conversation.messages.length, 'messages');
        sendResponse({
          success: true,
          conversation: conversation,
          markdown: markdown
        });
      } else {
        console.log('⚠️ No messages extracted');
        sendResponse({
          success: false,
          error: 'Unable to extract conversation from this page. Please ensure the conversation is fully loaded.'
        });
      }
    } catch (error) {
      console.error('❌ Extraction error:', error);
      sendResponse({
        success: false,
        error: 'Error extracting conversation: ' + error.message
      });
    }
  }
  return true;
});

console.log('🚀 AI Chat Exporter content script loaded');