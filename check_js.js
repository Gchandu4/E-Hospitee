const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scripts = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
let i = 0;
scripts.forEach(s => {
  i++;
  const code = s.replace(/<\/?script>/g, '');
  try { new Function(code); }
  catch(e) { console.log('Script block ' + i + ': ' + e.message); }
});
console.log('Checked ' + i + ' script blocks');
