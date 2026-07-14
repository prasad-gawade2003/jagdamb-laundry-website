const https = require('https');

https.get('https://jagdamb-laundry.vercel.app/api/db-diagnostics', (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', body);
    process.exit(0);
  });
}).on('error', (e) => {
  console.error(e);
  process.exit(1);
});
