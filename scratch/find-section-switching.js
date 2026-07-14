const fs = require('fs');
const path = require('path');
const file = fs.readFileSync(path.join(__dirname, '../admin/admin.js'), 'utf8');

const lines = file.split(/\r?\n/);
lines.forEach((line, index) => {
  if (line.includes('section') || line.includes('sec-') || line.includes('nav-item')) {
    if (line.includes('click') || line.includes('classList') || line.includes('show') || line.includes('each')) {
      console.log(`${index + 1}: ${line}`);
    }
  }
});
