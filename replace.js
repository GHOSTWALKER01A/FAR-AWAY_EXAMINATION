const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      results.push(file);
    }
  });
  return results;
};

const files = walk('./');
let count = 0;

files.forEach(file => {
  if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css') || file.endsWith('.md') || file.endsWith('.py')) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('Exami') || content.includes('exami')) {
      const newContent = content.replace(/Exami/g, 'Exami').replace(/exami/g, 'exami');
      fs.writeFileSync(file, newContent, 'utf8');
      count++;
      console.log(`Updated: ${file}`);
    }
  }
});

console.log(`Updated ${count} files.`);
