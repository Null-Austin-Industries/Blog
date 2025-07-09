// a file that takes in the markdown of text, and converts it to HTML
const marked = require('marked');

function markdownToHtml(markdown) {
    // Use marked to convert markdown to HTML
    return marked.marked(markdown);
}
module.exports = markdownToHtml;