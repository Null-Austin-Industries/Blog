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

function getTOC(content){
    // Simplified version - just return basic markdown conversion
    const html = markdownToHtml(content);
    return html;
}

function getEnhancedHtml(content) {
    // Simplified - just return the HTML without TOC
    return {
        html: markdownToHtml(content),
        toc: []
    };
}

module.exports = { 
  markdownToHtml, 
  getTOC, 
  getEnhancedHtml, 
  addCustomEmoji, 
  addMultipleCustomEmojis 
};