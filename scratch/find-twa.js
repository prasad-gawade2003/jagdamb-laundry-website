const fs = require('fs');
const path = require('path');
const file = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8');

const lines = file.split(/\r?\n/);
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('twa') || line.toLowerCase().includes('referrer')) {
    console.log(`${index + 1}: ${line}`);
  }
});
