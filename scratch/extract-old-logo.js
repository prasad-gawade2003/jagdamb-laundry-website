const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('Extracting old logo...');
  const buffer = execSync('git show 9b40aed:assets/jagdamblogo.png');
  const targetPath = path.join(__dirname, '../assets/jagdamblogo-old.png');
  fs.writeFileSync(targetPath, buffer);
  console.log('Saved old logo to assets/jagdamblogo-old.png');
  process.exit(0);
} catch (err) {
  console.error('Failed to extract:', err.message);
  process.exit(1);
}
