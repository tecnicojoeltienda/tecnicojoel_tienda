// frontend/scripts/set-items-per-page.js
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'pages', 'tienda');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

const singleLineRegex = /const\s+itemsPerPage\s*=\s*[^;]+;/g;
const useMemoRegex = /const\s+itemsPerPage\s*=\s*useMemo\([\s\S]*?\);/g;

let changed = [];

files.forEach(file => {
  const full = path.join(dir, file);
  let content = fs.readFileSync(full, 'utf8');
  let newContent = content;

  newContent = newContent.replace(useMemoRegex, 'const itemsPerPage = 20;');
  newContent = newContent.replace(singleLineRegex, 'const itemsPerPage = 20;');

  if (newContent !== content) {
    fs.writeFileSync(full, newContent, 'utf8');
    changed.push(file);
  }
});

if (changed.length) {
  console.log('Updated files:', changed.join(', '));
} else {
  console.log('No files changed.');
}