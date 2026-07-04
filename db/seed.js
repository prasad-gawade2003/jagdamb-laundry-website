/**
 * Seed script — run once to create default admin accounts, stores, and services
 * Usage: node db/seed.js
 */
const db = require('./database');

db.initTables();

console.log('✅ Tables created');

// ── Default admin accounts ──────────────────────────────────────────────────
const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

db.createAdmin('admin', defaultPassword, 'Master Admin', '', 'superadmin');
db.createAdmin('sainagar', defaultPassword, 'Sai Nagar Admin', 'sai-nagar', 'admin');
db.createAdmin('threejewels', defaultPassword, 'Three Jewels Admin', 'three-jewels', 'admin');

console.log('✅ Admin accounts seeded (password: ' + defaultPassword + ')');

// ── Default stores ──────────────────────────────────────────────────────────
db.upsertStore({
  id: 'sai-nagar',
  name: 'Jagdamb Laundry - Sai Nagar',
  shortName: 'Sai Nagar',
  address: 'Jagdamb Laundry, Sai Nagar, Sukhsagar Nagar, Kondhwa Budruk, Pune, Maharashtra 411048',
  phone: '+91 98216 75395',
  email: 'jagdambalaundry1@gmail.com',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Jagdamb%20Laundry,%20Sai%20Nagar,%20Sukhsagar%20Nagar,%20Kondhwa%20Budruk,%20Pune,%20Maharashtra%20411048',
  status: 'Open Now'
});

db.upsertStore({
  id: 'three-jewels',
  name: 'Jagdamb Laundry - Three Jewels',
  shortName: 'Three Jewels',
  address: 'Shop No. 5, Three Jewels Society, Kolte Patil Developers, Tilekar Nagar, Kondhwa Budruk, Pune, Maharashtra ,411048',
  phone: '+91 98216 75395',
  email: 'jagdambalaundry1@gmail.com',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Shop%20No.%205,%20Three%20Jewels%20Society,%20Kolte%20Patil%20Developers,%20Tilekar%20Nagar,%20Kondhwa%20Budruk,%20Pune,%20Maharashtra%20411048',
  status: 'Open Now'
});

console.log('✅ Stores seeded');

// ── Default services ────────────────────────────────────────────────────────
const services = [
  { name: 'Wash & Fold', desc: 'Daily wear cleaned, folded and packed.', price: 1, unit: '/kg' },
  { name: 'Wash & Iron', desc: 'Fresh wash with crisp ironing.', price: 90, unit: '/kg' },
  { name: 'Dry Cleaning', desc: 'Premium care for suits, sarees and delicate clothes.', price: 60, unit: '' },
  { name: 'Saree Ironing', desc: 'Sharp finish for office and occasion wear.', price: 60, unit: '' },
  { name: 'Starching', desc: 'Starching your clothes adds crispness and structure.', price: 60, unit: '' },
  { name: 'Bedsheet Cleaning', desc: 'Bedsheets, covers and blankets handled with care.', price: 100, unit: '' },
  { name: 'Shoes Cleaning', desc: 'Special handling for designer garments.', price: 200, unit: '' },
  { name: 'Curtain Cleaning', desc: 'Deep cleaning for home curtains.', price: 100, unit: '' },
];

for (const s of services) {
  db.upsertService({ name: s.name, description: s.desc, price: s.price, unit: s.unit });
}

console.log('✅ Services seeded');

// ── Default settings ────────────────────────────────────────────────────────
db.setSetting('shop_name', 'Jagdamb Laundry & Drycleaners');
db.setSetting('shop_phone', '+91 79774 11572');
db.setSetting('whatsapp_link', '917977411572');
db.setSetting('inquiry_phone', '917977411572');
db.setSetting('upi_id', 'gawadeprasad03-2@okaxis');
db.setSetting('pickup_charge', '0');
db.setSetting('original_pickup_charge', '49');

console.log('✅ Settings seeded');
console.log('\n🎉 Database seeded successfully! You can now start the server.');
