const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
// capture rawBody for webhook signature verification
app.use(express.json({ limit: '1mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
const path = require('path');

// Serve frontend static files from project root so API and frontend share origin
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;

const crypto = require('crypto');

// Decentro provider config (set via env)
const DECENTRO_BASE_URL = process.env.DECENTRO_BASE_URL || '';
const DECENTRO_API_KEY = process.env.DECENTRO_API_KEY || '';
const DECENTRO_WEBHOOK_SECRET = process.env.DECENTRO_WEBHOOK_SECRET || '';
const DECENTRO_WEBHOOK_HEADER = process.env.DECENTRO_WEBHOOK_HEADER || 'x-decentro-signature';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;

// In-memory store for payment sessions (replace with DB in production)
const payments = {};

function makeOrderId() {
  return `ORD-${Date.now().toString().slice(-8)}`;
}

// Create payment: server generates a UPI link / dynamic QR and returns it
app.post('/api/create-payment', (req, res) => {
  (async () => {
    const order = req.body || {};
    const orderId = order.id || makeOrderId();
    const amount = Number(order.total || 0).toFixed(2);
    let qrUrl = process.env.FALLBACK_QR || '/assets/QR.jpeg';
    let expiresAt = Date.now() + 15 * 60 * 1000; // default 15 minutes

    // default payment session stored
    payments[orderId] = {
      id: orderId,
      order: order,
      status: 'Pending',
      qrUrl,
      expiresAt,
      createdAt: Date.now(),
    };

    // If Decentro config is present, call Decentro API to create a dynamic UPI collect/QR
    if (DECENTRO_BASE_URL && DECENTRO_API_KEY) {
      try {
        const providerUrl = `${DECENTRO_BASE_URL.replace(/\/$/, '')}/v1/upi/collect`;
        const callbackUrl = `${PUBLIC_BASE_URL}/api/webhook/payment`;
        const providerPayload = {
          amount: amount,
          currency: 'INR',
          merchant_order_id: orderId,
          expires_in: 15 * 60, // seconds
          callback_url: callbackUrl,
          metadata: {
            shop: process.env.SHOP_NAME || 'Merchant',
            customerName: order.customerName || '',
            customerPhone: order.phone || '',
          },
        };

        const resp = await fetch(providerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DECENTRO_API_KEY}`,
          },
          body: JSON.stringify(providerPayload),
        });

        if (resp.ok) {
          const j = await resp.json();
          // provider may return different shapes; try common fields
          if (j.qr_url) qrUrl = j.qr_url;
          else if (j.qr_base64) qrUrl = `data:image/png;base64,${j.qr_base64}`;
          else if (j.upi_uri) qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=400x400&chl=${encodeURIComponent(j.upi_uri)}`;

          if (j.expires_in) expiresAt = Date.now() + Number(j.expires_in) * 1000;
          if (j.id) payments[orderId].providerId = j.id;
          if (j.status) payments[orderId].status = j.status;
          payments[orderId].qrUrl = qrUrl;
          payments[orderId].expiresAt = expiresAt;
        } else {
          console.warn('Decentro create-payment failed', resp.status);
        }
      } catch (err) {
        console.error('Error calling Decentro provider', err);
      }
    }

    res.json({ orderId, qrUrl, expiresAt });
  })();
});

// Polling endpoint for frontend to check payment status
app.get('/api/payment-status/:orderId', (req, res) => {
  const { orderId } = req.params;
  const session = payments[orderId];
  if (!session) return res.status(404).json({ error: 'Not found' });
  // If expired, mark expired
  if (session.expiresAt && Date.now() > session.expiresAt && session.status === 'Pending') {
    session.status = 'Expired';
  }
  res.json({ orderId: session.id, status: session.status });
});

// Webhook endpoint that provider will call to notify payment status
app.post('/api/webhook/payment', (req, res) => {
  // Verify webhook signature if secret and header configured
  try {
    const headerName = DECENTRO_WEBHOOK_HEADER.toLowerCase();
    const sig = req.headers[headerName];
    if (DECENTRO_WEBHOOK_SECRET) {
      if (!sig) {
        console.warn('Webhook missing signature header');
        return res.status(400).json({ error: 'signature missing' });
      }
      const computed = crypto.createHmac('sha256', DECENTRO_WEBHOOK_SECRET).update(req.rawBody || '').digest('hex');
      if (computed !== sig && computed !== sig.replace(/^sha256=/, '')) {
        console.warn('Webhook signature mismatch', { computed, sig });
        return res.status(401).json({ error: 'invalid signature' });
      }
    }

    const { orderId, status } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId required' });
    const session = payments[orderId];
    if (!session) return res.status(404).json({ error: 'Unknown orderId' });
    session.status = status || 'Paid';
    console.log('Webhook updated', orderId, session.status);
    res.json({ ok: true });
  } catch (err) {
    console.error('Webhook handling error', err);
    res.status(500).json({ error: 'internal' });
  }
});

// Testing helper: simulate provider callback
app.post('/api/simulate-provider/:orderId', (req, res) => {
  const { orderId } = req.params;
  const session = payments[orderId];
  if (!session) return res.status(404).json({ error: 'Unknown orderId' });
  session.status = 'Paid';
  res.json({ ok: true, orderId });
});

app.listen(PORT, () => {
  console.log(`Payment mock server listening on http://localhost:${PORT}`);
});
