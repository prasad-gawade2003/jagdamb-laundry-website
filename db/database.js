const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool;

function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn("WARNING: DATABASE_URL is not set. Database queries will fail.");
    }
    const isLocal = !connectionString || connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    pool = new Pool({
      connectionString,
      ssl: isLocal ? false : {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}

// ── Schema ──────────────────────────────────────────────────────────────────

async function fixMalformedPickupDates(pool) {
  try {
    const res = await pool.query("SELECT id, pickup_date FROM orders WHERE pickup_date != '' AND pickup_date IS NOT NULL");
    const rows = res.rows;
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

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of rows) {
        const normalized = normalize(item.pickup_date);
        if (normalized !== item.pickup_date) {
          await client.query('UPDATE orders SET pickup_date = $1 WHERE id = $2', [normalized, item.id]);
        }
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fixing malformed pickup dates:', err.message);
  }
}

async function initTables() {
  const pool = getDb();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      display_name VARCHAR(255) NOT NULL,
      store_id VARCHAR(255) DEFAULT '',
      role VARCHAR(255) DEFAULT 'admin',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stores (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(255) DEFAULT '',
      address TEXT DEFAULT '',
      phone VARCHAR(255) DEFAULT '',
      email VARCHAR(255) DEFAULT '',
      map_url TEXT DEFAULT '',
      status VARCHAR(255) DEFAULT 'Open Now',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      price REAL DEFAULT 0,
      unit VARCHAR(255) DEFAULT '',
      icon VARCHAR(255) DEFAULT '',
      active INTEGER DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(255) PRIMARY KEY,
      order_number INTEGER UNIQUE,
      store_id VARCHAR(255) DEFAULT '',
      store_name VARCHAR(255) DEFAULT '',
      customer_name VARCHAR(255) NOT NULL,
      phone VARCHAR(255) NOT NULL,
      address TEXT DEFAULT '',
      pickup_date VARCHAR(255) DEFAULT '',
      time_slot VARCHAR(255) DEFAULT '',
      payment_method VARCHAR(255) DEFAULT '',
      payment_status VARCHAR(255) DEFAULT 'Pending',
      order_status VARCHAR(255) DEFAULT 'New',
      subtotal REAL DEFAULT 0,
      pickup_charge REAL DEFAULT 0,
      total REAL DEFAULT 0,
      location_lat VARCHAR(255) DEFAULT '',
      location_lng VARCHAR(255) DEFAULT '',
      location_map_url TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      razorpay_order_id VARCHAR(255) DEFAULT '',
      razorpay_payment_id VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      delivery_date VARCHAR(255) DEFAULT '',
      delivery_time_slot VARCHAR(255) DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id VARCHAR(255) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      item_name VARCHAR(255) NOT NULL,
      service VARCHAR(255) DEFAULT '',
      qty INTEGER DEFAULT 1,
      price REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT DEFAULT ''
    );
  `);

  // Enable Realtime for the orders table in Supabase publication
  try {
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
        ) THEN
          NULL;
        ELSE
          ALTER PUBLICATION supabase_realtime ADD TABLE orders;
        END IF;
      END $$;
    `);
  } catch (e) {
    console.log('Realtime publication setup skipped or not supported:', e.message);
  }

  // Disable RLS and set REPLICA IDENTITY to FULL for realtime subscription compatibility
  try {
    await pool.query('ALTER TABLE orders DISABLE ROW LEVEL SECURITY;');
    await pool.query('ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;');
    console.log('Disabled Row Level Security (RLS) on orders and order_items tables.');
  } catch (e) {
    console.log('Could not disable RLS:', e.message);
  }

  try {
    await pool.query('ALTER TABLE orders REPLICA IDENTITY FULL;');
    console.log('Set REPLICA IDENTITY FULL on orders table.');
  } catch (e) {
    console.log('Could not set replica identity FULL on orders:', e.message);
  }

  await fixMalformedPickupDates(pool);

  // Auto-seed default database if no admins exist
  const res = await pool.query('SELECT COUNT(*) as count FROM admins');
  const adminCount = parseInt(res.rows[0].count);
  if (adminCount === 0) {
    console.log('Database empty. Seeding default data...');
    
    // Seed default admins
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const hash = bcrypt.hashSync(defaultPassword, 10);
    
    await pool.query(`INSERT INTO admins (username, password, display_name, store_id, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING`, ['admin', hash, 'Master Admin', '', 'superadmin']);
    await pool.query(`INSERT INTO admins (username, password, display_name, store_id, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING`, ['sainagar', hash, 'Sai Nagar Admin', 'sai-nagar', 'admin']);
    await pool.query(`INSERT INTO admins (username, password, display_name, store_id, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING`, ['threejewels', hash, 'Three Jewels Admin', 'three-jewels', 'admin']);

    // Seed default stores
    await pool.query(`
      INSERT INTO stores (id, name, short_name, address, phone, email, map_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name=EXCLUDED.name, short_name=EXCLUDED.short_name, address=EXCLUDED.address,
        phone=EXCLUDED.phone, email=EXCLUDED.email, map_url=EXCLUDED.map_url, status=EXCLUDED.status
    `, ['sai-nagar', 'Jagdamb Laundry - Sai Nagar', 'Sai Nagar', 'Jagdamb Laundry, Sai Nagar, Sukhsagar Nagar, Kondhwa Budruk, Pune, Maharashtra 411048', '+91 98216 75395', 'jagdambalaundry1@gmail.com', 'https://www.google.com/maps/search/?api=1&query=Jagdamb%20Laundry,%20Sai%20Nagar,%20Sukhsagar%20Nagar,%20Kondhwa%20Budruk,%20Pune,%20Maharashtra%20411048', 'Open Now']);

    await pool.query(`
      INSERT INTO stores (id, name, short_name, address, phone, email, map_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name=EXCLUDED.name, short_name=EXCLUDED.short_name, address=EXCLUDED.address,
        phone=EXCLUDED.phone, email=EXCLUDED.email, map_url=EXCLUDED.map_url, status=EXCLUDED.status
    `, ['three-jewels', 'Jagdamb Laundry - Three Jewels', 'Three Jewels', 'Shop No. 5, Three Jewels Society, Kolte Patil Developers, Tilekar Nagar, Kondhwa Budruk, Pune, Maharashtra 411048', '+91 98216 75395', 'jagdambalaundry1@gmail.com', 'https://maps.app.goo.gl/nQ9tuvkAsnhJzGvE8', 'Open Now']);

    // Seed default services
    const services = [
      { name: 'Wash & Fold', desc: 'Daily wear cleaned, folded and packed.', price: 70, unit: '/kg' },
      { name: 'Wash & Iron', desc: 'Fresh wash with crisp ironing.', price: 90, unit: '/kg' },
      { name: 'Dry Cleaning', desc: 'Premium care for suits, sarees and delicate clothes.', price: 60, unit: '' },
      { name: 'Saree Ironing', desc: 'Sharp finish for office and occasion wear.', price: 60, unit: '' },
      { name: 'Starching', desc: 'Starching your clothes adds crispness and structure.', price: 60, unit: '' },
      { name: 'Bedsheet Cleaning', desc: 'Bedsheets, covers and blankets handled with care.', price: 100, unit: '' },
      { name: 'Shoes Cleaning', desc: 'Special handling for designer garments.', price: 200, unit: '' },
      { name: 'Curtain Cleaning', desc: 'Deep cleaning for home curtains.', price: 100, unit: '' },
    ];
    for (const s of services) {
      const check = await pool.query('SELECT 1 FROM services WHERE name = $1', [s.name]);
      if (check.rowCount === 0) {
        await pool.query(`
          INSERT INTO services (name, description, price, unit, active)
          VALUES ($1, $2, $3, $4, 1)
        `, [s.name, s.desc, s.price, s.unit]);
      }
    }

    // Seed default settings
    const settings = [
      { key: 'shop_name', value: 'Jagdamb Laundry & Drycleaners' },
      { key: 'shop_phone', value: '+91 79774 11572' },
      { key: 'whatsapp_link', value: '917977411572' },
      { key: 'inquiry_phone', value: '917977411572' },
      { key: 'upi_id', value: 'gawadeprasad03-2@okaxis' },
      { key: 'pickup_charge', value: '0' },
      { key: 'original_pickup_charge', value: '49' }
    ];
    for (const set of settings) {
      await pool.query(`
        INSERT INTO settings (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value
      `, [set.key, set.value]);
    }
    
    console.log('Database seeded with default values.');
  }
}

async function getNextOrderNumber() {
  const pool = getDb();
  const res = await pool.query('SELECT MAX(order_number) as "maxOrder" FROM orders');
  return (res.rows[0]?.maxOrder || 0) + 1;
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

async function createAdmin(username, password, displayName, storeId = '', role = 'admin') {
  const pool = getDb();
  const hash = bcrypt.hashSync(password, 10);
  return await pool.query(
    `INSERT INTO admins (username, password, display_name, store_id, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING`,
    [username, hash, displayName, storeId, role]
  );
}

async function getAdminByUsername(username) {
  const pool = getDb();
  const res = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
  return res.rows[0];
}

function verifyAdminPassword(admin, password) {
  return bcrypt.compareSync(password, admin.password);
}

async function getAllAdmins() {
  const pool = getDb();
  const res = await pool.query('SELECT id, username, display_name, store_id, role, created_at FROM admins');
  return res.rows;
}

async function updateAdminPassword(id, newPassword) {
  const pool = getDb();
  const hash = bcrypt.hashSync(newPassword, 10);
  return await pool.query('UPDATE admins SET password = $1 WHERE id = $2', [hash, id]);
}

async function deleteAdmin(id) {
  const pool = getDb();
  return await pool.query('DELETE FROM admins WHERE id = $1', [id]);
}

// ── Stores ───────────────────────────────────────────────────────────────────

async function upsertStore(store) {
  const pool = getDb();
  return await pool.query(`
    INSERT INTO stores (id, name, short_name, address, phone, email, map_url, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      name=EXCLUDED.name, short_name=EXCLUDED.short_name, address=EXCLUDED.address,
      phone=EXCLUDED.phone, email=EXCLUDED.email, map_url=EXCLUDED.map_url, status=EXCLUDED.status
  `, [store.id, store.name, store.shortName || store.short_name || '',
    store.address || '', store.phone || '', store.email || '',
    store.mapUrl || store.map_url || '', store.status || 'Open Now']);
}

async function getAllStores() {
  const pool = getDb();
  const res = await pool.query('SELECT * FROM stores ORDER BY created_at');
  return res.rows;
}

async function getStore(id) {
  const pool = getDb();
  const res = await pool.query('SELECT * FROM stores WHERE id = $1', [id]);
  return res.rows[0];
}

async function deleteStore(id) {
  const pool = getDb();
  return await pool.query('DELETE FROM stores WHERE id = $1', [id]);
}

// ── Services ─────────────────────────────────────────────────────────────────

async function upsertService(service) {
  const pool = getDb();
  if (service.id) {
    return await pool.query(`
      UPDATE services SET name=$1, description=$2, price=$3, unit=$4, icon=$5, active=$6 WHERE id=$7
    `, [service.name, service.description || service.desc || '',
      service.price || 0, service.unit || '', service.icon || '', service.active !== undefined ? service.active : 1, service.id]);
  } else {
    return await pool.query(`
      INSERT INTO services (name, description, price, unit, icon, active) VALUES ($1, $2, $3, $4, $5, $6)
    `, [service.name, service.description || service.desc || '',
      service.price || 0, service.unit || '', service.icon || '', 1]);
  }
}

async function getAllServices(activeOnly = false) {
  const pool = getDb();
  if (activeOnly) {
    const res = await pool.query('SELECT * FROM services WHERE active = 1 ORDER BY id');
    return res.rows;
  }
  const res = await pool.query('SELECT * FROM services ORDER BY id');
  return res.rows;
}

async function getService(id) {
  const pool = getDb();
  const res = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
  return res.rows[0];
}

async function deleteService(id) {
  const pool = getDb();
  return await pool.query('DELETE FROM services WHERE id = $1', [id]);
}

// ── Orders ───────────────────────────────────────────────────────────────────

async function createOrder(order) {
  const pool = getDb();
  const orderNumber = order.order_number || await getNextOrderNumber();
  const orderId = order.id || String(orderNumber).padStart(2, '0');
  const pickupDate = normalizeDate(order.pickupDate || order.pickup_date || '');

  await pool.query(`
    INSERT INTO orders (id, order_number, store_id, store_name, customer_name, phone, address,
      pickup_date, time_slot, payment_method, payment_status, order_status,
      subtotal, pickup_charge, total, location_lat, location_lng, location_map_url,
      notes, razorpay_order_id, razorpay_payment_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
  `, [
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
  ]);

  // Insert order items
  if (order.items && order.items.length) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of order.items) {
        await client.query(
          `INSERT INTO order_items (order_id, item_name, service, qty, price) VALUES ($1, $2, $3, $4, $5)`,
          [orderId, item.item || item.item_name || '', item.service || '', item.qty || 1, item.price || 0]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  return orderId;
}

async function getOrder(id) {
  const pool = getDb();
  let res = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  let order = res.rows[0];
  if (!order) {
    res = await pool.query('SELECT * FROM orders WHERE razorpay_order_id = $1', [id]);
    order = res.rows[0];
  }
  if (order) {
    const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    order.items = itemsRes.rows;
  }
  return order;
}

async function getAllOrders(filters = {}) {
  const pool = getDb();
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params = [];
  let index = 1;

  if (filters.status) {
    sql += ` AND order_status = $${index++}`;
    params.push(filters.status);
  }
  if (filters.store_id) {
    sql += ` AND store_id = $${index++}`;
    params.push(filters.store_id);
  }
  if (filters.payment_status) {
    sql += ` AND payment_status = $${index++}`;
    params.push(filters.payment_status);
  }
  if (filters.date_from) {
    sql += ` AND pickup_date >= $${index++}`;
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    sql += ` AND pickup_date <= $${index++}`;
    params.push(filters.date_to);
  }
  if (filters.search) {
    sql += ` AND (customer_name ILIKE $${index} OR phone LIKE $${index} OR id LIKE $${index})`;
    index++;
    const term = `%${filters.search}%`;
    params.push(term);
  }

  sql += ' ORDER BY created_at DESC';

  if (filters.limit) {
    sql += ` LIMIT $${index++}`;
    params.push(filters.limit);
  }

  const ordersRes = await pool.query(sql, params);
  const orders = ordersRes.rows;

  for (const order of orders) {
    const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    order.items = itemsRes.rows;
  }

  return orders;
}

async function updateOrderStatus(id, orderStatus) {
  const pool = getDb();
  return await pool.query('UPDATE orders SET order_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [orderStatus, id]);
}

async function updatePaymentStatus(id, paymentStatus, paymentId = '') {
  const pool = getDb();
  let sql = 'UPDATE orders SET payment_status = $1, updated_at = CURRENT_TIMESTAMP';
  const params = [paymentStatus];
  let index = 2;
  if (paymentId) {
    sql += `, razorpay_payment_id = $${index++}`;
    params.push(paymentId);
  }
  sql += ` WHERE id = $${index++}`;
  params.push(id);
  
  const result = await pool.query(sql, params);
  if (result.rowCount === 0 && paymentId) {
    return await pool.query('UPDATE orders SET payment_status = $1, updated_at = CURRENT_TIMESTAMP, razorpay_payment_id = $2 WHERE razorpay_order_id = $3',
      [paymentStatus, paymentId, id]);
  }
  return result;
}

async function updateRazorpayOrderId(id, razorpayOrderId) {
  const pool = getDb();
  return await pool.query('UPDATE orders SET razorpay_order_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [razorpayOrderId, id]);
}

async function updateOrderDelivery(id, deliveryDate, deliveryTimeSlot) {
  const pool = getDb();
  return await pool.query('UPDATE orders SET delivery_date = $1, delivery_time_slot = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [deliveryDate, deliveryTimeSlot, id]);
}

async function updateOrderNotes(id, notes) {
  const pool = getDb();
  return await pool.query('UPDATE orders SET notes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [notes, id]);
}

async function deleteOrder(id) {
  const pool = getDb();
  await pool.query('DELETE FROM order_items WHERE order_id = $1', [id]);
  return await pool.query('DELETE FROM orders WHERE id = $1', [id]);
}

// ── Customers (derived from orders) ──────────────────────────────────────────

async function getAllCustomers() {
  const pool = getDb();
  const res = await pool.query(`
    SELECT
      phone,
      customer_name,
      address,
      COUNT(*) as order_count,
      SUM(total) as total_spent,
      MAX(created_at) as last_order_date
    FROM orders
    GROUP BY phone, customer_name, address
    ORDER BY last_order_date DESC
  `);
  return res.rows;
}

async function getCustomerOrders(phone) {
  const pool = getDb();
  const res = await pool.query('SELECT * FROM orders WHERE phone = $1 ORDER BY created_at DESC', [phone]);
  const orders = res.rows;
  for (const order of orders) {
    const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    order.items = itemsRes.rows;
  }
  return orders;
}

// ── Reports ──────────────────────────────────────────────────────────────────

async function getDashboardSummary(storeId = null) {
  const pool = getDb();
  let where = '';
  const params = [];
  let index = 1;
  if (storeId) {
    where = ` WHERE store_id = $${index++}`;
    params.push(storeId);
  }

  const today = new Date().toISOString().slice(0, 10);

  const totalOrdersRes = await pool.query(`SELECT COUNT(*) as count FROM orders${where}`, params);
  const totalOrders = parseInt(totalOrdersRes.rows[0].count);

  const todayParams = [today, ...params];
  const todayOrdersRes = await pool.query(`SELECT COUNT(*) as count FROM orders WHERE CAST(created_at AS date) = $1${storeId ? ' AND store_id = $2' : ''}`, todayParams);
  const todayOrders = parseInt(todayOrdersRes.rows[0].count);

  const totalRevenueRes = await pool.query(`SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE payment_status = 'Paid'${storeId ? ' AND store_id = $1' : ''}`, params);
  const totalRevenue = parseFloat(totalRevenueRes.rows[0].sum);

  const todayRevenueRes = await pool.query(`SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE payment_status = 'Paid' AND CAST(created_at AS date) = $1${storeId ? ' AND store_id = $2' : ''}`, todayParams);
  const todayRevenue = parseFloat(todayRevenueRes.rows[0].sum);

  const pendingOrdersRes = await pool.query(`SELECT COUNT(*) as count FROM orders WHERE order_status NOT IN ('Delivered', 'Completed', 'Cancelled')${storeId ? ' AND store_id = $1' : ''}`, params);
  const pendingOrders = parseInt(pendingOrdersRes.rows[0].count);

  const totalCustomersRes = await pool.query(`SELECT COUNT(DISTINCT phone) as count FROM orders${where}`, params);
  const totalCustomers = parseInt(totalCustomersRes.rows[0].count);

  const byStatusRes = await pool.query(`SELECT order_status, COUNT(*) as count FROM orders${where} GROUP BY order_status`, params);
  const byStatus = byStatusRes.rows.map(r => ({ order_status: r.order_status, count: parseInt(r.count) }));

  const byPaymentStatusRes = await pool.query(`SELECT payment_status, COUNT(*) as count FROM orders${where} GROUP BY payment_status`, params);
  const byPaymentStatus = byPaymentStatusRes.rows.map(r => ({ payment_status: r.payment_status, count: parseInt(r.count) }));

  const pendingPaymentOrdersRes = await pool.query(`SELECT COUNT(*) as count FROM orders WHERE payment_status != 'Paid'${storeId ? ' AND store_id = $1' : ''}`, params);
  const pendingPaymentOrders = parseInt(pendingPaymentOrdersRes.rows[0].count);

  const byPaymentRes = await pool.query(`SELECT payment_method, COUNT(*) as count FROM orders${where} GROUP BY payment_method`, params);
  const byPayment = byPaymentRes.rows.map(r => ({ payment_method: r.payment_method, count: parseInt(r.count) }));

  const dailyRevenueRes = await pool.query(`
    SELECT CAST(created_at AS date) as date, COALESCE(SUM(total), 0) as revenue, COUNT(*) as orders
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '7 days'${storeId ? ' AND store_id = $1' : ''}
    GROUP BY CAST(created_at AS date)
    ORDER BY date
  `, params);
  const dailyRevenue = dailyRevenueRes.rows.map(r => ({
    date: new Date(r.date).toISOString().slice(0, 10),
    revenue: parseFloat(r.revenue),
    orders: parseInt(r.orders)
  }));

  let topServicesSql = `
    SELECT item_name, SUM(qty) as total_qty, SUM(price * qty) as total_revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
  `;
  if (storeId) {
    topServicesSql += ' WHERE o.store_id = $1';
  }
  topServicesSql += `
    GROUP BY item_name
    ORDER BY total_qty DESC
    LIMIT 10
  `;
  const topServicesRes = await pool.query(topServicesSql, params);
  const topServices = topServicesRes.rows.map(r => ({
    item_name: r.item_name,
    total_qty: parseInt(r.total_qty),
    total_revenue: parseFloat(r.total_revenue)
  }));

  const timeSlotsRes = await pool.query(`SELECT time_slot, COUNT(*) as count FROM orders${where} GROUP BY time_slot ORDER BY count DESC`, params);
  const timeSlots = timeSlotsRes.rows.map(r => ({ time_slot: r.time_slot, count: parseInt(r.count) }));

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

async function getRevenueData(period = '30', storeId = null) {
  const pool = getDb();
  let where = storeId ? ' AND store_id = $2' : '';
  const params = storeId ? [parseInt(period), storeId] : [parseInt(period)];

  const res = await pool.query(`
    SELECT CAST(created_at AS date) as date, COALESCE(SUM(total), 0) as revenue, COUNT(*) as orders
    FROM orders
    WHERE created_at >= NOW() - CAST($1 || ' days' AS INTERVAL) ${where}
    GROUP BY CAST(created_at AS date)
    ORDER BY date
  `, params);
  return res.rows.map(r => ({
    date: new Date(r.date).toISOString().slice(0, 10),
    revenue: parseFloat(r.revenue),
    orders: parseInt(r.orders)
  }));
}

// ── Settings ─────────────────────────────────────────────────────────────────

async function getSetting(key) {
  const pool = getDb();
  const res = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
  return res.rows[0] ? res.rows[0].value : null;
}

async function setSetting(key, value) {
  const pool = getDb();
  return await pool.query(`
    INSERT INTO settings (key, value) VALUES ($1, $2)
    ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value
  `, [key, String(value)]);
}

async function getAllSettings() {
  const pool = getDb();
  const res = await pool.query('SELECT * FROM settings');
  const result = {};
  for (const row of res.rows) {
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
