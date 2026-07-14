const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8');

const keywords = ['standalone', 'display', 'twa', 'apk', 'referrer', 'matchMedia', 'header', 'nav'];
keywords.forEach(kw => {
  const count = (content.match(new RegExp(kw, 'gi')) || []).length;
  console.log(`Keyword "${kw}" found ${count} times`);
});
