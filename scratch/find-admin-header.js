const fs = require('fs');
const path = require('path');
const file = fs.readFileSync(path.join(__dirname, '../admin/admin.js'), 'utf8');

const lines = file.split(/\r?\n/);
lines.forEach((line, index) => {
  if (line.includes('mobile-header') || line.includes('Header') || line.includes('h2') || line.includes('Role')) {
    console.log(`${index + 1}: ${line}`);
  }
});
