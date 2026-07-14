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
(async () => {
  try {
    await db.initTables();
    console.log('Database tables verified/initialized.');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
})();

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
  return !!(WHATSAPP_API_TOKEN && WHATSAPP_PHONE_ID) || !!(WAHA_ENABLED && WAHA_API_URL);
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

// Format order completed notification message for WhatsApp
function formatCompletedMessage(order, req) {
  // Determine base URL dynamically from request, fallback to localhost:3000
  let baseUrl = 'http://localhost:3000';
  if (req && req.headers && req.get) {
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    baseUrl = `${protocol}://${req.get('host')}`;
  }

  return [
    `🧺 *Jagdamb Laundry & Drycleaners*`,
    ``,
    `Dear *${order.customer_name || 'Customer'}*,`,
    ``,
    `Your order *#${order.id || order.order_number || ''}* is now *Completed* & ready! 🎉`,
    ``,
    `💰 *Total Bill:* ₹${order.total || 0}`,
    `💳 *Payment Status:* ${order.payment_status || order.paymentStatus || 'Pending'}`,
    `🏪 *Pick-up Store:* ${order.store_name || order.storeName || 'Jagdamb Laundry'}`,
    `🔗 Book delivery: ${baseUrl}/?action=schedule-delivery&order_id=${order.id}`,
    ``,
    `We hope you love our service! If you have any questions, feel free to contact us.`,
    ``,
    `📞 *Contact:* +91 79774 11572`,
    ``,
    `Have a great day! ✨`
  ].join('\n');
}

// Send a WhatsApp text message via WAHA or Cloud API
async function sendWhatsAppMessage(toPhone, message) {
  if (!isWhatsAppConfigured()) return false;
  const phone = normalizePhone(toPhone);
  if (!phone) return false;

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

  // Otherwise try Meta Cloud API
  if (WHATSAPP_API_TOKEN && WHATSAPP_PHONE_ID) {
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
        console.log(`✅ WhatsApp message sent to ${phone}`);
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

  return false;
}

// Send receipts to both customer and laundry owner
async function sendOrderReceipts(order) {
  if (!isWhatsAppConfigured()) {
    console.log('ℹ️ WhatsApp API not configured — skipping auto receipts');
    return;
  }

  // Send receipt to CUSTOMER
  const customerMsg = formatWhatsAppReceipt(order, false);
  sendWhatsAppMessage(order.phone, customerMsg).catch(err => {
    console.warn('Error sending customer receipt:', err.message);
  });

  // Send notification to LAUNDRY OWNER
  const laundryMsg = formatWhatsAppReceipt(order, true);
  sendWhatsAppMessage(WHATSAPP_LAUNDRY_PHONE, laundryMsg).catch(err => {
    console.warn('Error sending laundry receipt:', err.message);
  });
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

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const admin = await db.getAdminByUsername(username);
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

app.get('/api/admin/me', authMiddleware, (req, res) => {
  res.json({ admin: req.admin });
});

// ── Admin Management ────────────────────────────────────────────────────────

app.get('/api/admin/admins', authMiddleware, async (req, res) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmin can manage admins' });
  }
  try {
    res.json(await db.getAllAdmins());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/admins', authMiddleware, async (req, res) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmin can create admins' });
  }
  const { username, password, displayName, storeId, role } = req.body;
  if (!username || !password || !displayName) {
    return res.status(400).json({ error: 'username, password and displayName are required' });
  }
  try {
    await db.createAdmin(username, password, displayName, storeId || '', role || 'admin');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/admins/:id/password', authMiddleware, async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (req.admin.role !== 'superadmin' && req.admin.id !== targetId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  try {
    await db.updateAdminPassword(targetId, password);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/admins/:id', authMiddleware, async (req, res) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmin can delete admins' });
  }
  try {
    await db.deleteAdmin(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Orders Routes ───────────────────────────────────────────────────────────

// Customer places order (public endpoint)
app.post('/api/orders', async (req, res) => {
  try {
    const order = req.body;
    if (!order.customerName && !order.customer_name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }
    if (!order.phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    const orderId = await db.createOrder(order);

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
app.get('/api/admin/orders', authMiddleware, async (req, res) => {
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
    const orders = await db.getAllOrders(filters);
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin: Get single order
app.get('/api/admin/orders/:id', authMiddleware, async (req, res) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Admin: Update order status
app.put('/api/admin/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const { order_status } = req.body;
    if (!order_status) return res.status(400).json({ error: 'order_status required' });
    await db.updateOrderStatus(req.params.id, order_status);

    if (order_status === 'Completed') {
      try {
        const order = await db.getOrder(req.params.id);
        if (order && order.phone) {
          const msg = formatCompletedMessage(order);
          sendWhatsAppMessage(order.phone, msg).catch(err => {
            console.warn('Failed to send order completed WhatsApp:', err.message);
          });
        }
      } catch (err) {
        console.warn('Error sending completed notification:', err);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Admin: Send manual order completed WhatsApp notification
app.post('/api/admin/orders/:id/send-completed-notification', authMiddleware, async (req, res) => {
  try {
    const order = db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!order.phone) return res.status(400).json({ error: 'Customer phone number is missing' });

    const msg = formatCompletedMessage(order);

    const ok = await sendWhatsAppMessage(order.phone, msg);
    if (ok) {
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send WhatsApp message via provider' });
    }
  } catch (err) {
    console.error('Error sending manual notification:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Admin: Update payment status
app.put('/api/admin/orders/:id/payment', authMiddleware, async (req, res) => {
  try {
    const { payment_status, payment_id } = req.body;
    if (!payment_status) return res.status(400).json({ error: 'payment_status required' });
    await db.updatePaymentStatus(req.params.id, payment_status, payment_id || '');
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating payment status:', err);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Admin: Update order notes
app.put('/api/admin/orders/:id/notes', authMiddleware, async (req, res) => {
  try {
    const { notes } = req.body;
    await db.updateOrderNotes(req.params.id, notes || '');
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating order notes:', err);
    res.status(500).json({ error: 'Failed to update order notes' });
  }
});

// Admin: Delete order
app.delete('/api/admin/orders/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteOrder(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// ── Customers Routes ────────────────────────────────────────────────────────

app.get('/api/admin/customers', authMiddleware, async (req, res) => {
  try {
    res.json(await db.getAllCustomers());
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.get('/api/admin/customers/:phone/orders', authMiddleware, async (req, res) => {
  try {
    res.json(await db.getCustomerOrders(req.params.phone));
  } catch (err) {
    console.error('Error fetching customer orders:', err);
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
});

// ── Services Routes ─────────────────────────────────────────────────────────

// Public: get active services (for customer site)
app.get('/api/services', async (req, res) => {
  try {
    res.json(await db.getAllServices(true));
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Public: get basic order details for delivery scheduling
app.get('/api/public/orders/:id', async (req, res) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({
      id: order.id,
      customer_name: order.customer_name,
      phone: order.phone,
      address: order.address,
      order_status: order.order_status,
      delivery_date: order.delivery_date || '',
      delivery_time_slot: order.delivery_time_slot || '',
      payment_status: order.payment_status,
      total: order.total
    });
  } catch (err) {
    console.error('Error fetching public order details:', err);
    res.status(500).json({ error: 'Failed to retrieve order details' });
  }
});

// Public: schedule delivery slot for a completed order
app.post('/api/public/orders/:id/schedule-delivery', async (req, res) => {
  try {
    const { delivery_date, delivery_time_slot } = req.body;
    if (!delivery_date || !delivery_time_slot) {
      return res.status(400).json({ error: 'delivery_date and delivery_time_slot are required' });
    }

    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Update order with delivery schedule
    await db.updateOrderDelivery(req.params.id, delivery_date, delivery_time_slot);

    // Send confirmation message to customer via WhatsApp
    const msg = `🧺 *Jagdamb Laundry & Drycleaners*\n\nYour delivery slot has been successfully booked! 🎉\n\n📋 *Order ID:* #${order.id}\n📅 *Delivery Date:* ${delivery_date}\n⏰ *Time Slot:* ${delivery_time_slot}\n\nWe will deliver your fresh clothes at the scheduled time! \n\n📞 *Contact:* +91 79774 11572`;
    sendWhatsAppMessage(order.phone, msg).catch(err => {
      console.warn('Failed to send delivery confirmation WhatsApp:', err.message);
    });

    res.json({ success: true, message: 'Delivery slot scheduled successfully' });
  } catch (err) {
    console.error('Error scheduling delivery:', err);
    res.status(500).json({ error: 'Failed to schedule delivery' });
  }
});

// Admin: get all services
app.get('/api/admin/services', authMiddleware, async (req, res) => {
  try {
    res.json(await db.getAllServices(false));
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.post('/api/admin/services', authMiddleware, async (req, res) => {
  try {
    await db.upsertService(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

app.put('/api/admin/services/:id', authMiddleware, async (req, res) => {
  try {
    await db.upsertService({ ...req.body, id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating service:', err);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

app.delete('/api/admin/services/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteService(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting service:', err);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// ── Stores Routes ───────────────────────────────────────────────────────────

// Public: get stores (for customer site)
app.get('/api/stores', async (req, res) => {
  try {
    res.json(await db.getAllStores());
  } catch (err) {
    console.error('Error fetching stores:', err);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Admin: get all stores
app.get('/api/admin/stores', authMiddleware, async (req, res) => {
  try {
    res.json(await db.getAllStores());
  } catch (err) {
    console.error('Error fetching stores:', err);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

app.post('/api/admin/stores', authMiddleware, async (req, res) => {
  try {
    await db.upsertStore(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('Error creating store:', err);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

app.put('/api/admin/stores/:id', authMiddleware, async (req, res) => {
  try {
    await db.upsertStore({ ...req.body, id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating store:', err);
    res.status(500).json({ error: 'Failed to update store' });
  }
});

app.delete('/api/admin/stores/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteStore(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting store:', err);
    res.status(500).json({ error: 'Failed to delete store' });
  }
});

// ── Reports Routes ──────────────────────────────────────────────────────────

app.get('/api/admin/reports/summary', authMiddleware, async (req, res) => {
  try {
    const storeId = req.admin.role !== 'superadmin' ? req.admin.storeId : (req.query.store_id || null);
    res.json(await db.getDashboardSummary(storeId));
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

app.get('/api/admin/reports/revenue', authMiddleware, async (req, res) => {
  try {
    const period = req.query.period || '30';
    const storeId = req.admin.role !== 'superadmin' ? req.admin.storeId : (req.query.store_id || null);
    res.json(await db.getRevenueData(period, storeId));
  } catch (err) {
    console.error('Error fetching revenue data:', err);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

// ── Settings Routes ─────────────────────────────────────────────────────────

app.get('/api/admin/settings', authMiddleware, async (req, res) => {
  try {
    res.json(await db.getAllSettings());
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/admin/settings', authMiddleware, async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await db.setSetting(key, value);
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

    const localOrderId = await db.createOrder({
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
      await db.updateRazorpayOrderId(localOrderId, razorpayOrder.id);
      await db.updatePaymentStatus(localOrderId, 'Payment Waiting', undefined);

      res.json({
        local_order_id: localOrderId,
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID
      });
    } catch (razorpayErr) {
      await db.deleteOrder(localOrderId);
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

app.post('/api/verify-payment', async (req, res) => {
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
        await db.updatePaymentStatus(razorpay_order_id, 'Paid', razorpay_payment_id);
        // Fetch full order to send WhatsApp receipt
        orderData = await db.getOrder(razorpay_order_id);
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

// Public endpoint for front-end to get Supabase config (for Realtime subscription)
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  });
});

// ── Start Server ────────────────────────────────────────────────────────────

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🧺 Jagdamb Laundry server running on http://localhost:${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/admin/`);
  });
}

module.exports = app;
