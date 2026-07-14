const { execSync } = require('child_process');

const envs = [
  { name: 'JWT_SECRET', value: 'jld-admin-secret-change-this-in-production' },
  { name: 'ADMIN_DEFAULT_PASSWORD', value: 'admin123' },
  { name: 'RAZORPAY_KEY_ID', value: 'rzp_test_T5ZiuU0sAuSHox' },
  { name: 'RAZORPAY_KEY_SECRET', value: 'd1vZcAf3XqSyCZ7UZlxKuiWi' },
  { name: 'WHATSAPP_LAUNDRY_PHONE', value: '917977411572' }
];

for (const env of envs) {
  try {
    console.log(`Adding ${env.name}...`);
    // Use --force to overwrite if it already exists
    const cmd = `npx vercel env add ${env.name} production --value "${env.value}" --yes --force`;
    const out = execSync(cmd, { stdio: 'inherit' });
    console.log(`Successfully added ${env.name}`);
  } catch (err) {
    console.error(`Failed to add ${env.name}:`, err.message);
  }
}
