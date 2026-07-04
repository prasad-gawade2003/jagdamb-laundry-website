const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.VERCEL
  ? '/tmp/jld_laundry.db'
  : path.join(__dirname, 'jld_laundry.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

// ── Schema ──────────────────────────────────────────────────────────────────

function fixMalformedPickupDates(conn) {
  const rows = conn.prepare("SELECT id, pickup_date FROM orders WHERE pickup_date != ''").all();
  const updateStmt = conn.prepare('UPDATE orders SET pickup_date = ? WHERE id = ?');
  const normalize = (value) => {
    if (!value) return '';
    const dateStr = String(value).trim();
    if (!dateStr) return '';

    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    const dmyMatch = dateStr.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;

    const parsed = new Date(dateStr);
    if (!isNaN(parsed)) {
      const year = parsed.getUTCFullYear();
      if (year >= 1000 && year <= 9999) {
        return parsed.toISOString().slice(0, 10);
      }
    }
    return '';
  };

  const update = conn.transaction((items) => {
    for (const item of items) {
      const normalized = normalize(item.pickup_date);
      if (normalized !== item.pickup_date) {
        updateStmt.run(normalized, item.id);
      }
    }
  });
  update(rows);
}

function initTables() {
  const conn = getDb();

  conn.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      store_id TEXT DEFAULT '',
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT DEFAULT '',
      address TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      map_url TEXT DEFAULT '',
      status TEXT DEFAULT 'Open Now',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL DEFAULT 0,
      unit TEXT DEFAULT '',
      icon TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number INTEGER UNIQUE,
      store_id TEXT DEFAULT '',
      store_name TEXT DEFAULT '',
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT DEFAULT '',
      pickup_date TEXT DEFAULT '',
      time_slot TEXT DEFAULT '',
      payment_method TEXT DEFAULT '',
      payment_status TEXT DEFAULT 'Pending',
      order_status TEXT DEFAULT 'New',
      subtotal REAL DEFAULT 0,
      pickup_charge REAL DEFAULT 0,
      total REAL DEFAULT 0,
      location_lat TEXT DEFAULT '',
      location_lng TEXT DEFAULT '',
      location_map_url TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      razorpay_order_id TEXT DEFAULT '',
      razorpay_payment_id TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      service TEXT DEFAULT '',
      qty INTEGER DEFAULT 1,
      price REAL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    );
  `);

  const existingColumns = conn.prepare("PRAGMA table_info(orders)").all();
  if (!existingColumns.some((col) => col.name === 'order_number')) {
    conn.prepare('ALTER TABLE orders ADD COLUMN order_number INTEGER').run();
  }
  if (!existingColumns.some((col) => col.name === 'delivery_date')) {
    conn.prepare('ALTER TABLE orders ADD COLUMN delivery_date TEXT DEFAULT ""').run();
  }
  if (!existingColumns.some((col) => col.name === 'delivery_time_slot')) {
    conn.prepare('ALTER TABLE orders ADD COLUMN delivery_time_slot TEXT DEFAULT ""').run();
  }

  fixMalformedPickupDates(conn);

  // Auto-seed default database if no admins exist
  const adminCount = conn.prepare('SELECT COUNT(*) as count FROM admins').get().count;
  if (adminCount === 0) {
    console.log('Database empty. Seeding default data...');
    
    // Seed default admins
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const hash = bcrypt.hashSync(defaultPassword, 10);
    conn.prepare(`INSERT OR IGNORE INTO admins (username, password, display_name, store_id, role) VALUES (?, ?, ?, ?, ?)`).run('admin', hash, 'Master Admin', '', 'superadmin');
    conn.prepare(`INSERT OR IGNORE INTO admins (username, password, display_name, store_id, role) VALUES (?, ?, ?, ?, ?)`).run('sainagar', hash, 'Sai Nagar Admin', 'sai-nagar', 'admin');
    conn.prepare(`INSERT OR IGNORE INTO admins (username, password, display_name, store_id, role) VALUES (?, ?, ?, ?, ?)`).run('threejewels', hash, 'Three Jewels Admin', 'three-jewels', 'admin');

    // Seed default stores
    const insertStore = conn.prepare(`INSERT OR REPLACE INTO stores (id, name, short_name, address, phone, email, map_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    insertStore.run('sai-nagar', 'Jagdamb Laundry - Sai Nagar', 'Sai Nagar', 'Jagdamb Laundry, Sai Nagar, Sukhsagar Nagar, Kondhwa Budruk, Pune, Maharashtra 411048', '+91 98216 75395', 'jagdambalaundry1@gmail.com', 'https://www.google.com/maps/search/?api=1&query=Jagdamb%20Laundry,%20Sai%20Nagar,%20Sukhsagar%20Nagar,%20Kondhwa%20Budruk,%20Pune,%20Maharashtra%20411048', 'Open Now');
    insertStore.run('three-jewels', 'Jagdamb Laundry - Three Jewels', 'Three Jewels', 'Shop No. 5, Three Jewels Society, Kolte Patil Developers, Tilekar Nagar, Kondhwa Budruk, Pune, Maharashtra ,411048', '+91 98216 75395', 'jagdambalaundry1@gmail.com', 'https://www.google.com/maps/search/?api=1&query=Shop%20No.%205,%20Three%20Jewels%20Society,%20Kolte%20Patil%20Developers,%20Tilekar%20Nagar,%20Kondhwa%20Budruk,%20Pune,%20Maharashtra%20411048', 'Open Now');

    // Seed default services
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
    const insertService = conn.prepare(`INSERT OR REPLACE INTO services (name, description, price, unit, active) VALUES (?, ?, ?, ?, 1)`);
    for (const s of services) {
      insertService.run(s.name, s.desc, s.price, s.unit);
    }

    // Seed default settings
    const insertSetting = conn.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
    insertSetting.run('shop_name', 'Jagdamb Laundry & Drycleaners');
    insertSetting.run('shop_phone', '+91 79774 11572');
    insertSetting.run('whatsapp_link', '917977411572');
    insertSetting.run('inquiry_phone', '917977411572');
    insertSetting.run('upi_id', 'gawadeprasad03-2@okaxis');
    insertSetting.run('pickup_charge', '0');
    insertSetting.run('original_pickup_charge', '49');
    
    console.log('Database seeded with default values.');
  }
}

function getNextOrderNumber() {
  const conn = getDb();
  const row = conn.prepare('SELECT MAX(order_number) as maxOrder FROM orders').get();
  return (row?.maxOrder || 0) + 1;
}

function normalizeDate(value) {
  if (!value) return '';
  const dateStr = String(value).trim();
  if (!dateStr) return '';

  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const dmyMatch = dateStr.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;

  const ymdMatch = dateStr.match(/^(\d{4})[\/\.](\d{2})[\/\.](\d{2})$/);
  if (ymdMatch) return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;

  const numeric = Number(dateStr);
  if (!Number.isNaN(numeric) && numeric > 0) {
    const parsed = new Date(numeric);
    if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10);
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed)) {
    const year = parsed.getUTCFullYear();
    if (year >= 1000 && year <= 9999) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  return '';
}

// ── Admins ───────────────────────────────────────────────────────────────────

function createAdmin(username, password, displayName, storeId = '', role = 'admin') {
  const conn = getDb();
  const hash = bcrypt.hashSync(password, 10);
  const stmt = conn.prepare(
    `INSERT OR IGNORE INTO admins (username, password, display_name, store_id, role) VALUES (?, ?, ?, ?, ?)`
  );
  return stmt.run(username, hash, displayName, storeId, role);
}

function getAdminByUsername(username) {
  const conn = getDb();
  return conn.prepare('SELECT * FROM admins WHERE username = ?').get(username);
}

function verifyAdminPassword(admin, password) {
  return bcrypt.compareSync(password, admin.password);
}

function getAllAdmins() {
  const conn = getDb();
  return conn.prepare('SELECT id, username, display_name, store_id, role, created_at FROM admins').all();
}

function updateAdminPassword(id, newPassword) {
  const conn = getDb();
  const hash = bcrypt.hashSync(newPassword, 10);
  return conn.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hash, id);
}

function deleteAdmin(id) {
  const conn = getDb();
  return conn.prepare('DELETE FROM admins WHERE id = ?').run(id);
}

// ── Stores ───────────────────────────────────────────────────────────────────

function upsertStore(store) {
  const conn = getDb();
  const stmt = conn.prepare(`
    INSERT INTO stores (id, name, short_name, address, phone, email, map_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, short_name=excluded.short_name, address=excluded.address,
      phone=excluded.phone, email=excluded.email, map_url=excluded.map_url, status=excluded.status
  `);
  return stmt.run(store.id, store.name, store.shortName || store.short_name || '',
    store.address || '', store.phone || '', store.email || '',
    store.mapUrl || store.map_url || '', store.status || 'Open Now');
}

function getAllStores() {
  const conn = getDb();
  return conn.prepare('SELECT * FROM stores ORDER BY created_at').all();
}

function getStore(id) {
  const conn = getDb();
  return conn.prepare('SELECT * FROM stores WHERE id = ?').get(id);
}

function deleteStore(id) {
  const conn = getDb();
  return conn.prepare('DELETE FROM stores WHERE id = ?').run(id);
}

// ── Services ─────────────────────────────────────────────────────────────────

function upsertService(service) {
  const conn = getDb();
  if (service.id) {
    const stmt = conn.prepare(`
      UPDATE services SET name=?, description=?, price=?, unit=?, icon=?, active=? WHERE id=?
    `);
    return stmt.run(service.name, service.description || service.desc || '',
      service.price || 0, service.unit || '', service.icon || '', service.active !== undefined ? service.active : 1, service.id);
  } else {
    const stmt = conn.prepare(`
      INSERT INTO services (name, description, price, unit, icon, active) VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(service.name, service.description || service.desc || '',
      service.price || 0, service.unit || '', service.icon || '', 1);
  }
}

function getAllServices(activeOnly = false) {
  const conn = getDb();
  if (activeOnly) {
    return conn.prepare('SELECT * FROM services WHERE active = 1 ORDER BY id').all();
  }
  return conn.prepare('SELECT * FROM services ORDER BY id').all();
}

function getService(id) {
  const conn = getDb();
  return conn.prepare('SELECT * FROM services WHERE id = ?').get(id);
}

function deleteService(id) {
  const conn = getDb();
  return conn.prepare('DELETE FROM services WHERE id = ?').run(id);
}

// ── Orders ───────────────────────────────────────────────────────────────────

function createOrder(order) {
  const conn = getDb();
  const orderNumber = order.order_number || getNextOrderNumber();
  const orderId = order.id || String(orderNumber).padStart(2, '0');
  const pickupDate = normalizeDate(order.pickupDate || order.pickup_date || '');

  const stmt = conn.prepare(`
    INSERT INTO orders (id, order_number, store_id, store_name, customer_name, phone, address,
      pickup_date, time_slot, payment_method, payment_status, order_status,
      subtotal, pickup_charge, total, location_lat, location_lng, location_map_url,
      notes, razorpay_order_id, razorpay_payment_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    orderId,
    orderNumber,
    order.storeId || order.store_id || '',
    order.storeName || order.store_name || '',
    order.customerName || order.customer_name || '',
    order.phone || '',
    order.address || '',
    pickupDate,
    order.timeSlot || order.time_slot || '',
    order.paymentMethod || order.payment_method || '',
    order.paymentStatus || order.payment_status || 'Pending',
    order.orderStatus || order.order_status || 'New',
    order.subtotal || 0,
    order.pickup !== undefined ? order.pickup : (order.pickup_charge || 0),
    order.total || 0,
    order.location?.lat || order.location_lat || '',
    order.location?.lng || order.location_lng || '',
    order.location?.mapUrl || order.location_map_url || '',
    order.notes || '',
    order.razorpay_order_id || '',
    order.razorpay_payment_id || ''
  );

  // Insert order items
  if (order.items && order.items.length) {
    const itemStmt = conn.prepare(
      `INSERT INTO order_items (order_id, item_name, service, qty, price) VALUES (?, ?, ?, ?, ?)`
    );
    const insertItems = conn.transaction((items) => {
      for (const item of items) {
        itemStmt.run(orderId, item.item || item.item_name || '', item.service || '', item.qty || 1, item.price || 0);
      }
    });
    insertItems(order.items);
  }

  return orderId;
}

function getOrder(id) {
  const conn = getDb();
  let order = conn.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    order = conn.prepare('SELECT * FROM orders WHERE razorpay_order_id = ?').get(id);
  }
  if (order) {
    order.items = conn.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  }
  return order;
}

function getAllOrders(filters = {}) {
  const conn = getDb();
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (filters.status) {
    sql += ' AND order_status = ?';
    params.push(filters.status);
  }
  if (filters.store_id) {
    sql += ' AND store_id = ?';
    params.push(filters.store_id);
  }
  if (filters.payment_status) {
    sql += ' AND payment_status = ?';
    params.push(filters.payment_status);
  }
  if (filters.date_from) {
    sql += ' AND pickup_date >= ?';
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    sql += ' AND pickup_date <= ?';
    params.push(filters.date_to);
  }
  if (filters.search) {
    sql += ' AND (customer_name LIKE ? OR phone LIKE ? OR id LIKE ?)';
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY created_at DESC';

  if (filters.limit) {
    sql += ' LIMIT ?';
    params.push(filters.limit);
  }

  const orders = conn.prepare(sql).all(...params);

  // Attach items for each order
  const itemStmt = conn.prepare('SELECT * FROM order_items WHERE order_id = ?');
  for (const order of orders) {
    order.items = itemStmt.all(order.id);
  }

  return orders;
}

function updateOrderStatus(id, orderStatus) {
  const conn = getDb();
  return conn.prepare('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(orderStatus, id);
}

function updatePaymentStatus(id, paymentStatus, paymentId = '') {
  const conn = getDb();
  let sql = 'UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP';
  const params = [paymentStatus];
  if (paymentId) {
    sql += ', razorpay_payment_id = ?';
    params.push(paymentId);
  }
  sql += ' WHERE id = ?';
  params.push(id);
  const result = conn.prepare(sql).run(...params);
  if (result.changes === 0 && paymentId) {
    return conn.prepare('UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP, razorpay_payment_id = ? WHERE razorpay_order_id = ?')
      .run(paymentStatus, paymentId, id);
  }
  return result;
}

function updateRazorpayOrderId(id, razorpayOrderId) {
  const conn = getDb();
  return conn.prepare('UPDATE orders SET razorpay_order_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(razorpayOrderId, id);
}

function updateOrderDelivery(id, deliveryDate, deliveryTimeSlot) {
  const conn = getDb();
  return conn.prepare('UPDATE orders SET delivery_date = ?, delivery_time_slot = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(deliveryDate, deliveryTimeSlot, id);
}

function updateOrderNotes(id, notes) {
  const conn = getDb();
  return conn.prepare('UPDATE orders SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(notes, id);
}

function deleteOrder(id) {
  const conn = getDb();
  conn.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
  return conn.prepare('DELETE FROM orders WHERE id = ?').run(id);
}

// ── Customers (derived from orders) ──────────────────────────────────────────

function getAllCustomers() {
  const conn = getDb();
  return conn.prepare(`
    SELECT
      phone,
      customer_name,
      address,
      COUNT(*) as order_count,
      SUM(total) as total_spent,
      MAX(created_at) as last_order_date
    FROM orders
    GROUP BY phone
    ORDER BY last_order_date DESC
  `).all();
}

function getCustomerOrders(phone) {
  const conn = getDb();
  const orders = conn.prepare('SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC').all(phone);
  const itemStmt = conn.prepare('SELECT * FROM order_items WHERE order_id = ?');
  for (const order of orders) {
    order.items = itemStmt.all(order.id);
  }
  return orders;
}

// ── Reports ──────────────────────────────────────────────────────────────────

function getDashboardSummary(storeId = null) {
  const conn = getDb();
  let where = '';
  const params = [];
  if (storeId) {
    where = ' WHERE store_id = ?';
    params.push(storeId);
  }

  const today = new Date().toISOString().slice(0, 10);

  const totalOrders = conn.prepare(`SELECT COUNT(*) as count FROM orders${where}`).get(...params).count;
  const todayOrders = conn.prepare(`SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?${storeId ? ' AND store_id = ?' : ''}`).get(today, ...params).count;
  const totalRevenue = conn.prepare(`SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE payment_status = 'Paid'${storeId ? ' AND store_id = ?' : ''}`).get(...params).sum;
  const todayRevenue = conn.prepare(`SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE payment_status = 'Paid' AND DATE(created_at) = ?${storeId ? ' AND store_id = ?' : ''}`).get(today, ...params).sum;
  const pendingOrders = conn.prepare(`SELECT COUNT(*) as count FROM orders WHERE order_status NOT IN ('Delivered', 'Completed', 'Cancelled')${storeId ? ' AND store_id = ?' : ''}`).get(...params).count;
  const totalCustomers = conn.prepare(`SELECT COUNT(DISTINCT phone) as count FROM orders${where}`).get(...params).count;

  // Orders by status
  const byStatus = conn.prepare(`SELECT order_status, COUNT(*) as count FROM orders${where} GROUP BY order_status`).all(...params);

  // Payment status breakdown
  const byPaymentStatus = conn.prepare(`SELECT payment_status, COUNT(*) as count FROM orders${where} GROUP BY payment_status`).all(...params);
  const pendingPaymentOrders = conn.prepare(`SELECT COUNT(*) as count FROM orders WHERE payment_status != 'Paid'${storeId ? ' AND store_id = ?' : ''}`).get(...params).count;

  // Payment method breakdown
  const byPayment = conn.prepare(`SELECT payment_method, COUNT(*) as count FROM orders${where} GROUP BY payment_method`).all(...params);

  // Recent 7 days revenue
  const dailyRevenue = conn.prepare(`
    SELECT DATE(created_at) as date, COALESCE(SUM(total), 0) as revenue, COUNT(*) as orders
    FROM orders
    WHERE created_at >= datetime('now', '-7 days')${storeId ? ' AND store_id = ?' : ''}
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all(...params);

  // Top services
  const topServices = conn.prepare(`
    SELECT item_name, SUM(qty) as total_qty, SUM(price * qty) as total_revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    ${where ? where.replace('WHERE', 'WHERE o.') : ''}
    GROUP BY item_name
    ORDER BY total_qty DESC
    LIMIT 10
  `).all(...params);

  // Busiest time slots
  const timeSlots = conn.prepare(`SELECT time_slot, COUNT(*) as count FROM orders${where} GROUP BY time_slot ORDER BY count DESC`).all(...params);

  return {
    totalOrders,
    todayOrders,
    totalRevenue,
    todayRevenue,
    pendingOrders,
    totalCustomers,
    byStatus,
    byPaymentStatus,
    byPayment,
    pendingPaymentOrders,
    dailyRevenue,
    topServices,
    timeSlots
  };
}

function getRevenueData(period = '30', storeId = null) {
  const conn = getDb();
  let where = storeId ? ' AND store_id = ?' : '';
  const params = storeId ? [storeId] : [];

  return conn.prepare(`
    SELECT DATE(created_at) as date, COALESCE(SUM(total), 0) as revenue, COUNT(*) as orders
    FROM orders
    WHERE created_at >= datetime('now', '-${parseInt(period)} days')${where}
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all(...params);
}

// ── Settings ─────────────────────────────────────────────────────────────────

function getSetting(key) {
  const conn = getDb();
  const row = conn.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  const conn = getDb();
  return conn.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value));
}

function getAllSettings() {
  const conn = getDb();
  const rows = conn.prepare('SELECT * FROM settings').all();
  const result = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

// ── Init & Export ────────────────────────────────────────────────────────────

module.exports = {
  initTables,
  getDb,
  // Admins
  createAdmin, getAdminByUsername, verifyAdminPassword, getAllAdmins, updateAdminPassword, deleteAdmin,
  // Stores
  upsertStore, getAllStores, getStore, deleteStore,
  // Services
  upsertService, getAllServices, getService, deleteService,
  // Orders
  createOrder, getOrder, getAllOrders, updateOrderStatus, updatePaymentStatus, updateRazorpayOrderId, updateOrderDelivery, updateOrderNotes, deleteOrder,
  // Customers
  getAllCustomers, getCustomerOrders,
  // Reports
  getDashboardSummary, getRevenueData,
  // Settings
  getSetting, setSetting, getAllSettings,
};
