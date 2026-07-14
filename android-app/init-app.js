const { spawn } = require('child_process');

const answers = {
  'Domain': 'jagdamb-laundry.vercel.app\n',
  'URL path': '/\n',
  'Application name': 'Jagdamb Laundry & Drycleaners\n',
  'Short name': 'JLD Laundry\n',
  'Application ID': 'com.jagdamb_laundry.twa\n',
  'version code': '1\n',
  'version name': '1.0.0\n',
  'Display mode': 'standalone\n',
  'Orientation': 'portrait\n',
  'Status bar color': '#1a73e8\n',
  'Splash screen color': '#ffffff\n',
  'background activity': 'no\n',
  'notification delegation': 'no\n',
  'Location of the Keystore': './android.keystore\n',
  'Key name': 'android\n',
  'Keystore password': 'android123\n',
  'Key password': 'android123\n',
  'create a new keystore': 'yes\n',
  'First and Last Name': 'Prasad Gawade\n',
  'Organizational Unit': 'JLD\n',
  'Organization': 'Jagdamb Laundry\n',
  'City': 'Pune\n',
  'State': 'MH\n',
  'Country Code': 'IN\n'
};

const child = spawn('bubblewrap', ['init', '--manifest=https://jagdamb-laundry.vercel.app/manifest.json'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  shell: true
});

// Forward parent stdin to child stdin
process.stdin.pipe(child.stdin);

let buffer = '';

child.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(str);
  buffer += str;

  for (const [question, answer] of Object.entries(answers)) {
    if (str.includes(question) || buffer.includes(question)) {
      if (!answers[question + '_done']) {
        answers[question + '_done'] = true;
        child.stdin.write(answer);
        buffer = ''; // Clear buffer
        break;
      }
    }
  }
});

child.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
  process.exit(code);
});
