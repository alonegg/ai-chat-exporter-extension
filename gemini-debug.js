// Gemini-specific debug script
// Paste this into the browser console on a Gemini conversation page

console.log('🔍 Gemini Debug Script Starting...');

// Function to analyze Gemini page structure
function analyzeGeminiStructure() {
    const results = {
        timestamp: new Date().toLocaleString(),
        url: window.location.href,
        totalElements: document.querySelectorAll('*').length,
        analysis: {}
    };
    
    // 1. Look for conversation containers
    const containerSelectors = [
        '[role="main"]',
        'main',
        '.conversation',
        '[class*="conversation"]',
        '[class*="chat"]',
        '[class*="Chat"]',
        '[id*="conversation"]',
        '[id*="chat"]'
    ];
    
    results.analysis.containers = {};
    containerSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            results.analysis.containers[selector] = {
                count: elements.length,
                sample: elements[0] ? {
                    tagName: elements[0].tagName,
                    className: elements[0].className,
                    id: elements[0].id,
                    childrenCount: elements[0].children.length
                } : null
            };
        }
    });
    
    // 2. Look for user input/query elements
    const userSelectors = [
        '[data-test-id*="user"]',
        '[data-testid*="user"]',
        '[class*="user"]',
        '[class*="User"]',
        '[class*="query"]',
        '[class*="Query"]',
        '[class*="input"]',
        '[class*="Input"]',
        '[class*="prompt"]',
        '[class*="Prompt"]',
        '[contenteditable="true"]',
        'textarea',
        'input[type="text"]'
    ];
    
    results.analysis.userElements = {};
    userSelectors.forEach(selector => {
        try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                results.analysis.userElements[selector] = {
                    count: elements.length,
                    samples: Array.from(elements).slice(0, 3).map(el => ({
                        tagName: el.tagName,
                        className: el.className,
                        textContent: (el.textContent || '').substring(0, 100),
                        attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value.substring(0, 50)}"`),
                        position: el.getBoundingClientRect().top + window.scrollY
                    }))
                };
            }
        } catch (e) {
            results.analysis.userElements[selector] = { error: e.message };
        }
    });
    
    // 3. Look for AI response elements
    const aiSelectors = [
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
    
    results.analysis.aiElements = {};
    aiSelectors.forEach(selector => {
        try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                results.analysis.aiElements[selector] = {
                    count: elements.length,
                    samples: Array.from(elements).slice(0, 3).map(el => ({
                        tagName: el.tagName,
                        className: el.className,
                        textContent: (el.textContent || '').substring(0, 100),
                        position: el.getBoundingClientRect().top + window.scrollY
                    }))
                };
            }
        } catch (e) {
            results.analysis.aiElements[selector] = { error: e.message };
        }
    });
    
    // 4. Analyze text blocks that might contain conversation
    const textBlocks = [];
    const allElements = document.querySelectorAll('div, p, span, article, section');
    
    allElements.forEach(el => {
        const text = (el.innerText || el.textContent || '').trim();
        
        if (text.length > 20 && 
            text.length < 5000 &&
            !el.closest('nav') &&
            !el.closest('header') &&
            !el.closest('footer') &&
            !el.querySelector('button') &&
            !text.match(/^(settings|menu|home|search|help|about)/i)) {
            
            const hasChildWithSameText = Array.from(el.children).some(child => 
                (child.innerText || child.textContent || '').trim() === text
            );
            
            if (!hasChildWithSameText) {
                textBlocks.push({
                    text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
                    length: text.length,
                    tagName: el.tagName,
                    className: el.className,
                    position: el.getBoundingClientRect().top + window.scrollY,
                    isLikelyUserQuery: isLikelyUserQuery(text, el)
                });
            }
        }
    });
    
    // Sort by position
    textBlocks.sort((a, b) => a.position - b.position);
    results.analysis.textBlocks = {
        count: textBlocks.length,
        samples: textBlocks.slice(0, 10)
    };
    
    // 5. Look for specific Gemini patterns
    results.analysis.geminiSpecific = {
        messageContentElements: document.querySelectorAll('message-content').length,
        divWithMessageClass: document.querySelectorAll('div[class*="message"]').length,
        geminiInClassName: document.querySelectorAll('[class*="gemini"], [class*="Gemini"]').length,
        queryInClassName: document.querySelectorAll('[class*="query"], [class*="Query"]').length,
        responseInClassName: document.querySelectorAll('[class*="response"], [class*="Response"]').length
    };
    
    return results;
}

function isLikelyUserQuery(text, element) {
    const userIndicators = [
        text.length < 200 && text.includes('?'),
        text.match(/^(tell me|explain|how|what|why|can you|please|help)/i),
        text.match(/^(write|create|make|generate|show|list)/i),
        element.className.toLowerCase().includes('user') ||
        element.className.toLowerCase().includes('query') ||
        element.className.toLowerCase().includes('input'),
        element.closest('[class*="user"], [class*="query"], [class*="input"]'),
        text.length < 300 && !text.includes('\n\n')
    ];
    
    return userIndicators.some(indicator => indicator);
}

// Function to extract conversation using current logic
function testGeminiExtraction() {
    console.log('🧪 Testing Gemini extraction...');
    
    const messages = [];
    const conversationContainer = document.querySelector('[role="main"], main, .conversation, [class*="conversation"]');
    
    if (conversationContainer) {
        console.log('✅ Found conversation container:', conversationContainer.tagName, conversationContainer.className);
        
        // Test user query extraction
        const userQueries = [];
        const querySelectors = [
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
            '[contenteditable="true"]',
            'textarea',
            'input[type="text"]'
        ];
        
        querySelectors.forEach(selector => {
            try {
                const elements = conversationContainer.querySelectorAll(selector);
                if (elements.length > 0) {
                    console.log(`Found ${elements.length} elements with selector: ${selector}`);
                    elements.forEach(el => {
                        const text = (el.innerText || el.textContent || '').trim();
                        if (text && text.length > 5) {
                            userQueries.push({
                                selector: selector,
                                text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                                fullText: text
                            });
                        }
                    });
                }
            } catch (e) {
                console.log(`❌ Error with selector ${selector}:`, e.message);
            }
        });
        
        console.log('User queries found:', userQueries);
        
        // Test AI response extraction
        const aiResponses = [];
        const responseSelectors = [
            'message-content',
            '.message-content',
            '[data-test-id*="response"]',
            '[data-testid*="response"]',
            '[class*="response"]',
            '[class*="Response"]',
            '[class*="model"]',
            '[class*="assistant"]',
            '[class*="ai"]',
            '[class*="gemini"]'
        ];
        
        responseSelectors.forEach(selector => {
            try {
                const elements = conversationContainer.querySelectorAll(selector);
                if (elements.length > 0) {
                    console.log(`Found ${elements.length} AI response elements with selector: ${selector}`);
                    elements.forEach(el => {
                        const text = (el.innerText || el.textContent || '').trim();
                        if (text && text.length > 10) {
                            aiResponses.push({
                                selector: selector,
                                text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                                fullText: text
                            });
                        }
                    });
                }
            } catch (e) {
                console.log(`❌ Error with AI selector ${selector}:`, e.message);
            }
        });
        
        console.log('AI responses found:', aiResponses);
        
        return {
            userQueries: userQueries,
            aiResponses: aiResponses,
            conversationContainer: {
                tagName: conversationContainer.tagName,
                className: conversationContainer.className,
                id: conversationContainer.id
            }
        };
    } else {
        console.log('❌ No conversation container found');
        return null;
    }
}

// Function to highlight elements on page
function highlightElements(selector, color = 'red') {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        el.style.outline = `3px solid ${color}`;
        el.style.outlineOffset = '2px';
    });
    console.log(`Highlighted ${elements.length} elements with selector: ${selector}`);
    return elements.length;
}

// Function to remove highlights
function clearHighlights() {
    document.querySelectorAll('*').forEach(el => {
        el.style.outline = '';
        el.style.outlineOffset = '';
    });
    console.log('Cleared all highlights');
}

// Auto-run analysis
const analysis = analyzeGeminiStructure();
console.log('📊 Gemini Structure Analysis:', analysis);

const extraction = testGeminiExtraction();
console.log('🧪 Extraction Test Results:', extraction);

// Export functions to global scope for manual testing
window.analyzeGeminiStructure = analyzeGeminiStructure;
window.testGeminiExtraction = testGeminiExtraction;
window.highlightElements = highlightElements;
window.clearHighlights = clearHighlights;

console.log(`
🔧 Available debug functions:
- analyzeGeminiStructure() - Analyze page structure
- testGeminiExtraction() - Test extraction logic
- highlightElements(selector, color) - Highlight elements (e.g., highlightElements('message-content', 'blue'))
- clearHighlights() - Remove all highlights

Example usage:
highlightElements('[class*="user"]', 'green');
highlightElements('message-content', 'blue');
`);