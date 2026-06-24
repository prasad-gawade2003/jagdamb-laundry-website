const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const path = require('path');

// Serve frontend static files from project root so API and frontend share origin
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;

const crypto = require('crypto');
const Razorpay = require('razorpay');

// Razorpay config (set via env)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// In-memory store for payment sessions (replace with DB in production)
const payments = {};

// Create Razorpay Order
app.post('/api/create-order', async (req, res) => {
  try {
    const order = req.body || {};
    const totalAmount = Number(order.total || 0);
    // Amount in paise (1 INR = 100 paise)
    const amount = Math.round(totalAmount * 100);

    if (amount < 100) {
      return res.status(400).json({ error: 'Minimum amount must be 100 paise (Rs 1.00)' });
    }

    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save payment details in-memory
    payments[razorpayOrder.id] = {
      id: razorpayOrder.id,
      order: order,
      status: 'Pending',
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      createdAt: Date.now(),
    };

    res.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    if (err.statusCode === 401) {
      return res.status(401).json({ error: 'Razorpay authentication failed' });
    }
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

// Verify Razorpay Payment Signature
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
      if (payments[razorpay_order_id]) {
        payments[razorpay_order_id].status = 'Paid';
        payments[razorpay_order_id].paymentId = razorpay_payment_id;
      } else {
        payments[razorpay_order_id] = {
          id: razorpay_order_id,
          status: 'Paid',
          paymentId: razorpay_payment_id,
          createdAt: Date.now()
        };
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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Payment mock server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
