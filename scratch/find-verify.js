const fs = require('fs');
const path = require('path');
const file = fs.readFileSync(path.join(__dirname, '../db/database.js'), 'utf8');

const lines = file.split(/\r?\n/);
lines.forEach((line, index) => {
  if (line.includes('verifyAdminPassword') || line.includes('getAdminByUsername')) {
    console.log(`${index + 1}: ${line}`);
  }
});
