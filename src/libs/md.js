// a file that takes in the markdown of text, and converts it to HTML
const marked = require('marked');
const JSDOM = require('jsdom').JSDOM;
const Prism = require('prismjs');
const emoji = require('node-emoji');

// Load additional language components for syntax highlighting
require('prismjs/components/prism-javascript');
require('prismjs/components/prism-typescript');
require('prismjs/components/prism-python');
require('prismjs/components/prism-java');
require('prismjs/components/prism-css');
require('prismjs/components/prism-json');
require('prismjs/components/prism-bash');
require('prismjs/components/prism-sql');
require('prismjs/components/prism-markdown');

// Custom emoji mappings
const customEmojis = {
  blog: '📝',
  austin: '🤠',
  coffee_code: '☕💻',
  thinking_face: '🤔',
  party_blob: '🎉',
  custom_heart: '💖',
  sparkles: '✨',
  wave_hello: '👋',
  code_ninja: '👨‍💻🥷',
  bug_hunter: '🐛🔍'
};

function processCustomEmojis(text) {
  let processedText = text;
  
  // First process custom emojis
  for (const [name, emojiChar] of Object.entries(customEmojis)) {
    const regex = new RegExp(`:${name}:`, 'g');
    processedText = processedText.replace(regex, emojiChar);
  }
  
  // Then process standard emojis
  return emoji.emojify(processedText);
}

function markdownToHtml(markdown) {
  // Process emojis (custom and standard) before markdown conversion
  const emojiProcessed = processCustomEmojis(markdown);
  
  // Configure marked with extensions for code highlighting
  marked.use({
    renderer: {
      code(token) {
        // In marked v16, the code renderer receives a token object
        const code = token.text || token;
        const language = token.lang || '';
        
        if (language && Prism.languages[language]) {
          try {
            const highlighted = Prism.highlight(String(code), Prism.languages[language], language);
            return `<pre class="language-${language}"><code class="language-${language}">${highlighted}</code></pre>`;
          } catch (err) {
            console.warn(`Failed to highlight ${language} code:`, err.message);
            // Fallback to plain code block
            const escaped = String(code).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<pre><code>${escaped}</code></pre>`;
          }
        } else {
          // Fallback for unknown languages
          const escaped = String(code).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return `<pre><code>${escaped}</code></pre>`;
        }
      },
      codespan(token) {
        const code = token.text || token;
        return `<code class="inline-code">${code}</code>`;
      }
    }
  });

  // Set marked options
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true
  });

  return marked.parse(emojiProcessed);
}

// Function to add a single custom emoji
function addCustomEmoji(name, emojiChar) {
  customEmojis[name] = emojiChar;
}

// Function to add multiple custom emojis at once
function addMultipleCustomEmojis(emojiMap) {
  for (const [name, emojiChar] of Object.entries(emojiMap)) {
    customEmojis[name] = emojiChar;
  }
}

function generateRandomSuffix() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function extractHeaders(markdown) {
    const headers = [];
    const lines = markdown.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
        
        if (headerMatch) {
            const level = headerMatch[1].length;
            const text = headerMatch[2];
            // Create a URL-safe ID from the header text
            let baseId = text.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single
                .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
            
            baseId = baseId || `header-${i}`; // Fallback ID if text produces empty string
            const id = `${baseId}-${generateRandomSuffix()}`;
            
            headers.push({
                level,
                text,
                id: id
            });
        }
    }
    
    return headers;
}

function extractHeadersFromHtml(html) {
    const headers = [];
    const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
    const document = dom.window.document;
    
    const headerElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headerElements.forEach((element, i) => {
        const level = parseInt(element.tagName.charAt(1));
        const text = element.textContent.trim();
        // Create a URL-safe ID from the header text
        let baseId = text.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
        
        baseId = baseId || `header-${i}`; // Fallback ID if text produces empty string
        const id = `${baseId}-${generateRandomSuffix()}`;
        
        headers.push({
            level,
            text,
            id: id
        });
    });
    
    return headers;
}

function addIdsToHeaders(html, headers) {
    // Wrap the HTML in a complete document structure for JSDOM
    const wrappedHtml = `<!DOCTYPE html><html><body>${html}</body></html>`;
    const dom = new JSDOM(wrappedHtml);
    const document = dom.window.document;
    
    // Find all header elements
    const headerElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let headerIndex = 0;
    
    headerElements.forEach((element) => {
        if (headerIndex < headers.length) {
            element.id = headers[headerIndex].id;
            headerIndex++;
        }
    });
    
    return document.body.innerHTML;
}

function generateTOCHtml(headers) {
    if (headers.length === 0) {
        return '<p>No headers found</p>';
    }
    
    let tocHtml = '';
    
    headers.forEach(header => {
        const marginLeft = (header.level - 1) * 1; // 1rem per level
        tocHtml += `<h${header.level} style="margin-left: ${marginLeft}rem;">
            <a href="#${header.id}" style="text-decoration: none; color: inherit;">
                ${header.text}
            </a>
        </h${header.level}>`;
    });
    
    return tocHtml;
}

function getTOC(content) {
    const headers = extractHeaders(content);
    return generateTOCHtml(headers);
}

function getEnhancedHtml(content) {
    let headers = [];
    let html = '';
    
    // Check if content is already HTML (contains HTML tags) or is markdown
    if (content.includes('<h1>') || content.includes('<h2>') || content.includes('<h3>') || 
        content.includes('<h4>') || content.includes('<h5>') || content.includes('<h6>')) {
        // Content is already HTML, extract headers from HTML
        html = content;
        headers = extractHeadersFromHtml(content);
    } else {
        // Content is markdown, extract headers from markdown first
        headers = extractHeaders(content);
        
        // Convert markdown to HTML
        html = markdownToHtml(content);
    }
    
    // Add IDs to headers in the HTML
    html = addIdsToHeaders(html, headers);
    
    // Generate TOC HTML
    const tocHtml = generateTOCHtml(headers);
    
    return {
        html: html,
        toc: tocHtml,
        headers: headers
    };
}

module.exports = { 
  markdownToHtml, 
  getTOC, 
  getEnhancedHtml, 
  addCustomEmoji, 
  addMultipleCustomEmojis,
  extractHeaders,
  extractHeadersFromHtml,
  generateTOCHtml
};