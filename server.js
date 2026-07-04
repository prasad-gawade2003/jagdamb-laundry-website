const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const db = require('./db/database');

dotenv.config();

// Initialize database tables
db.initTables();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'jld-admin-secret-key-change-in-production';

// Serve frontend static files from project root
app.use(express.static(path.join(__dirname)));

// ── Razorpay config ─────────────────────────────────────────────────────────

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  console.warn('WARNING: Razorpay credentials missing. Checkout will fail until configured.');
}

// ── WhatsApp Cloud API config ───────────────────────────────────────────────

const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || '';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_LAUNDRY_PHONE = process.env.WHATSAPP_LAUNDRY_PHONE || '917977411572';

// ── WAHA (WhatsApp HTTP API) config ────────────────────────────────────────
// Example WAHA API: a simple HTTP endpoint that accepts `{ to, message }` JSON.
const WAHA_ENABLED = (process.env.WAHA_ENABLED === 'true') || false;
const WAHA_API_URL = process.env.WAHA_API_URL || '';
const WAHA_API_TOKEN = process.env.WAHA_API_TOKEN || '';
const WAHA_FROM_PHONE = process.env.WAHA_FROM_PHONE || '';

function isWhatsAppConfigured() {
  return !!(WHATSAPP_API_TOKEN && WHATSAPP_PHONE_ID);
}

// Normalize phone to 91XXXXXXXXXX format for WhatsApp API
function normalizePhone(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!digits.startsWith('91')) digits = '91' + digits;
  return digits;
}

// Format order receipt for WhatsApp text message
function formatWhatsAppReceipt(order, forLaundry = false) {
  const items = order.items || [];
  const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const lines = [];

  if (forLaundry) {
    lines.push('🔔 *NEW ORDER RECEIVED!*');
  } else {
    lines.push('🧺 *Jagdamb Laundry & Drycleaners*');
    lines.push('✅ *Order Confirmed!*');
  }
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push(`📋 *Order ID:* ${order.id || order.order_number || ''}`);
  if (order.storeName || order.store_name) lines.push(`🏪 *Store:* ${order.storeName || order.store_name}`);
  lines.push('');
  lines.push(`👤 *Customer:* ${order.customerName || order.customer_name || ''}`);
  lines.push(`📱 *Phone:* ${order.phone || ''}`);
  lines.push(`📍 *Address:* ${order.address || ''}`);
  if (order.location?.mapUrl || order.location_map_url) {
    lines.push(`📌 *Location:* ${order.location?.mapUrl || order.location_map_url}`);
  }
  const pickupDate = order.pickupDate || order.pickup_date || '';
  const timeSlot = order.timeSlot || order.time_slot || '';
  lines.push(`📅 *Pickup:* ${pickupDate}${timeSlot ? ', ' + timeSlot : ''}`);
  lines.push('');
  lines.push('🛒 *Items:*');
  if (items.length) {
    items.forEach(it => {
      const name = it.item || it.item_name || '';
      const svc = it.service || '';
      const qty = it.qty || 1;
      const price = it.price || 0;
      lines.push(`  • ${name} (${svc}) x ${qty} — ${currency(price * qty)}`);
    });
  } else {
    lines.push('  • No items listed');
  }
  lines.push('');
  const pickup = order.pickup !== undefined ? order.pickup : (order.pickup_charge || 0);
  lines.push(`🚚 Pickup charge: ${currency(pickup)}`);
  lines.push(`💰 *Total: ${currency(order.total)}*`);
  const paymentMethod = order.paymentMethod || order.payment_method || '';
  const paymentStatus = order.paymentStatus || order.payment_status || 'Pending';
  lines.push(`💳 *Payment:* ${paymentMethod} — ${paymentStatus}`);
  lines.push('━━━━━━━━━━━━━━━━━━');

  if (!forLaundry) {
    lines.push('🙏 Thank you for choosing Jagdamb Laundry!');
    lines.push('We will confirm your pickup shortly.');
    lines.push('📞 Contact: +91 79774 11572');
  }

  return lines.join('\n');
}

// Send a WhatsApp text message via Cloud API
async function sendWhatsAppMessage(toPhone, message) {
  if (!isWhatsAppConfigured()) return false;
  const phone = normalizePhone(toPhone);
  if (!phone) return false;

  try {
    const url = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`;
    const body = JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { preview_url: false, body: message }
    });

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body
    });

    if (resp.ok) {
      console.log(`✅ WhatsApp receipt sent to ${phone}`);
      return true;
    } else {
      const errData = await resp.json().catch(() => ({}));
      console.warn(`⚠️ WhatsApp send failed for ${phone}:`, errData.error?.message || resp.status);
      return false;
    }
  } catch (err) {
    console.warn('⚠️ WhatsApp API error:', err.message);
    return false;
  }
}

// Send receipts to both customer and laundry owner
async function sendOrderReceipts(order) {
  if (!isWhatsAppConfigured()) {
    console.log('ℹ️ WhatsApp API not configured — skipping auto receipts');
    return;
  }
  // If WAHA is enabled and configured, use it first
  if (WAHA_ENABLED && WAHA_API_URL) {
    try {
      const body = JSON.stringify({ to: phone, message });
      const headers = { 'Content-Type': 'application/json' };
      if (WAHA_API_TOKEN) headers['Authorization'] = `Bearer ${WAHA_API_TOKEN}`;

      const resp = await fetch(WAHA_API_URL, {
        method: 'POST',
        headers,
        body
      });

      if (resp.ok) {
        console.log(`✅ WAHA message sent to ${phone}`);
        return true;
      } else {
        const err = await resp.text().catch(() => '');
        console.warn(`⚠️ WAHA send failed for ${phone}:`, err || resp.status);
        // fall through to try Cloud API if available
      }
    } catch (err) {
      console.warn('⚠️ WAHA API error:', err.message || err);
      // fall through to try Cloud API if available
    }
  }


  // Send receipt to CUSTOMER
  const customerMsg = formatWhatsAppReceipt(order, false);
  sendWhatsAppMessage(order.phone, customerMsg);

  // Send notification to LAUNDRY OWNER
  const laundryMsg = formatWhatsAppReceipt(order, true);
  sendWhatsAppMessage(WHATSAPP_LAUNDRY_PHONE, laundryMsg);
}

// ── Auth Middleware ──────────────────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — token required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── Admin Auth Routes ───────────────────────────────────────────────────────

app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const admin = db.getAdminByUsername(username);

// Test route for verifying WAHA / Cloud API configuration
app.post('/api/test-whatsapp', (req, res) => {
  const { to, message } = req.body || {};
  const target = to || WAHA_FROM_PHONE || WHATSAPP_LAUNDRY_PHONE || '';
  if (!target) return res.status(400).json({ error: 'No target phone configured' });

  sendWhatsAppMessage(target, message || 'Test message from Jagdamb Laundry').then(ok => {
    if (ok) return res.json({ success: true });
    return res.status(500).json({ success: false, error: 'Failed to send via configured WhatsApp provider' });
  }).catch(err => {
    console.error('Test send error:', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  });
});
    if (!admin || !db.verifyAdminPassword(admin, password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = jwt.sign(
      { id: admin.id, username: admin.username, displayName: admin.display_name, storeId: admin.store_id, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        displayName: admin.display_name,
        storeId: admin.store_id,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/me', authMiddleware, (req, res) => {
  res.json({ admin: req.admin });
});

// ── Admin Management ────────────────────────────────────────────────────────

app.get('/api/admin/admins', authMiddleware, (req, res) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmin can manage admins' });
  }
  res.json(db.getAllAdmins());
});

app.post('/api/admin/admins', authMiddleware, (req, res) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmin can create admins' });
  }
  const { username, password, displayName, storeId, role } = req.body;
  if (!username || !password || !displayName) {
    return res.status(400).json({ error: 'username, password and displayName are required' });
  }
  db.createAdmin(username, password, displayName, storeId || '', role || 'admin');
  res.json({ success: true });
});

app.put('/api/admin/admins/:id/password', authMiddleware, (req, res) => {
  const targetId = parseInt(req.params.id);
  if (req.admin.role !== 'superadmin' && req.admin.id !== targetId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  db.updateAdminPassword(targetId, password);
  res.json({ success: true });
});

app.delete('/api/admin/admins/:id', authMiddleware, (req, res) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmin can delete admins' });
  }
  db.deleteAdmin(parseInt(req.params.id));
  res.json({ success: true });
});

// ── Orders Routes ───────────────────────────────────────────────────────────

// Customer places order (public endpoint)
app.post('/api/orders', (req, res) => {
  try {
    const order = req.body;
    if (!order.customerName && !order.customer_name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }
    if (!order.phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    const orderId = db.createOrder(order);

    // Auto-send WhatsApp receipts to customer and laundry
    const receiptOrder = { ...order, id: orderId };
    sendOrderReceipts(receiptOrder).catch(err => {
      console.warn('WhatsApp receipt sending failed:', err.message);
    });

    res.json({ success: true, orderId });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Admin: Get all orders
app.get('/api/admin/orders', authMiddleware, (req, res) => {
  try {
    const filters = {
      status: req.query.status || '',
      store_id: req.admin.role !== 'superadmin' ? req.admin.storeId : (req.query.store_id || ''),
      payment_status: req.query.payment_status || '',
      date_from: req.query.date_from || '',
      date_to: req.query.date_to || '',
      search: req.query.search || '',
      limit: req.query.limit ? parseInt(req.query.limit) : 0
    };
    // Clean empty filters
    Object.keys(filters).forEach(k => { if (!filters[k]) delete filters[k]; });
    const orders = db.getAllOrders(filters);
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin: Get single order
app.get('/api/admin/orders/:id', authMiddleware, (req, res) => {
  const order = db.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// Admin: Update order status
app.put('/api/admin/orders/:id/status', authMiddleware, (req, res) => {
  const { order_status } = req.body;
  if (!order_status) return res.status(400).json({ error: 'order_status required' });
  db.updateOrderStatus(req.params.id, order_status);
  res.json({ success: true });
});

// Admin: Update payment status
app.put('/api/admin/orders/:id/payment', authMiddleware, (req, res) => {
  const { payment_status, payment_id } = req.body;
  if (!payment_status) return res.status(400).json({ error: 'payment_status required' });
  db.updatePaymentStatus(req.params.id, payment_status, payment_id || '');
  res.json({ success: true });
});

// Admin: Update order notes
app.put('/api/admin/orders/:id/notes', authMiddleware, (req, res) => {
  const { notes } = req.body;
  db.updateOrderNotes(req.params.id, notes || '');
  res.json({ success: true });
});

// Admin: Delete order
app.delete('/api/admin/orders/:id', authMiddleware, (req, res) => {
  db.deleteOrder(req.params.id);
  res.json({ success: true });
});

// ── Customers Routes ────────────────────────────────────────────────────────

app.get('/api/admin/customers', authMiddleware, (req, res) => {
  res.json(db.getAllCustomers());
});

app.get('/api/admin/customers/:phone/orders', authMiddleware, (req, res) => {
  res.json(db.getCustomerOrders(req.params.phone));
});

// ── Services Routes ─────────────────────────────────────────────────────────

// Public: get active services (for customer site)
app.get('/api/services', (req, res) => {
  res.json(db.getAllServices(true));
});

// Admin: get all services
app.get('/api/admin/services', authMiddleware, (req, res) => {
  res.json(db.getAllServices(false));
});

app.post('/api/admin/services', authMiddleware, (req, res) => {
  try {
    db.upsertService(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

app.put('/api/admin/services/:id', authMiddleware, (req, res) => {
  try {
    db.upsertService({ ...req.body, id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating service:', err);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

app.delete('/api/admin/services/:id', authMiddleware, (req, res) => {
  db.deleteService(parseInt(req.params.id));
  res.json({ success: true });
});

// ── Stores Routes ───────────────────────────────────────────────────────────

// Public: get stores (for customer site)
app.get('/api/stores', (req, res) => {
  res.json(db.getAllStores());
});

// Admin: get all stores
app.get('/api/admin/stores', authMiddleware, (req, res) => {
  res.json(db.getAllStores());
});

app.post('/api/admin/stores', authMiddleware, (req, res) => {
  try {
    db.upsertStore(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('Error creating store:', err);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

app.put('/api/admin/stores/:id', authMiddleware, (req, res) => {
  try {
    db.upsertStore({ ...req.body, id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating store:', err);
    res.status(500).json({ error: 'Failed to update store' });
  }
});

app.delete('/api/admin/stores/:id', authMiddleware, (req, res) => {
  db.deleteStore(req.params.id);
  res.json({ success: true });
});

// ── Reports Routes ──────────────────────────────────────────────────────────

app.get('/api/admin/reports/summary', authMiddleware, (req, res) => {
  const storeId = req.admin.role !== 'superadmin' ? req.admin.storeId : (req.query.store_id || null);
  res.json(db.getDashboardSummary(storeId));
});

app.get('/api/admin/reports/revenue', authMiddleware, (req, res) => {
  const period = req.query.period || '30';
  const storeId = req.admin.role !== 'superadmin' ? req.admin.storeId : (req.query.store_id || null);
  res.json(db.getRevenueData(period, storeId));
});

// ── Settings Routes ─────────────────────────────────────────────────────────

app.get('/api/admin/settings', authMiddleware, (req, res) => {
  res.json(db.getAllSettings());
});

app.put('/api/admin/settings', authMiddleware, (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      db.setSetting(key, value);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ── Razorpay Payment Routes (existing) ──────────────────────────────────────

app.post('/api/create-order', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({ error: 'Razorpay keys are not configured on the server. Please add them to your Environment Variables.' });
    }

    const order = req.body || {};
    const totalAmount = Number(order.total || 0);
    const amount = Math.round(totalAmount * 100);

    if (amount < 100) {
      return res.status(400).json({ error: 'Minimum amount must be 100 paise (Rs 1.00)' });
    }

    const localOrderId = db.createOrder({
      ...order,
      paymentStatus: 'Payment Waiting',
      orderStatus: 'New',
    });

    const options = {
      amount: amount,
      currency: 'INR',
      receipt: localOrderId,
    };

    try {
      const razorpayOrder = await razorpay.orders.create(options);
      await db.updatePaymentStatus(localOrderId, 'Payment Waiting', undefined);

      res.json({
        local_order_id: localOrderId,
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID
      });
    } catch (razorpayErr) {
      db.deleteOrder(localOrderId);
      throw razorpayErr;
    }
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    if (err.statusCode === 401) {
      return res.status(401).json({ error: 'Razorpay authentication failed' });
    }
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment verification fields' });
    }

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // Update payment status in database if the order exists
      let orderData = null;
      try {
        db.updatePaymentStatus(razorpay_order_id, 'Paid', razorpay_payment_id);
        // Fetch full order to send WhatsApp receipt
        orderData = db.getOrder(razorpay_order_id);
      } catch (e) {
        // Order might not exist in DB yet (old flow), that's ok
      }

      // Send WhatsApp receipts after successful payment
      if (orderData) {
        const paidOrder = { ...orderData, paymentStatus: 'Paid', payment_status: 'Paid' };
        sendOrderReceipts(paidOrder).catch(err => {
          console.warn('WhatsApp receipt sending failed:', err.message);
        });
      }

      res.json({ status: 'Paid', message: 'Payment verified successfully' });
    } else {
      console.warn('Signature mismatch for order:', razorpay_order_id);
      res.status(400).json({ error: 'Invalid payment signature' });
    }
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ error: 'Internal server error during verification' });
  }
});

// ── Start Server ────────────────────────────────────────────────────────────

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🧺 Jagdamb Laundry server running on http://localhost:${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/admin/`);
  });
}

module.exports = app;
