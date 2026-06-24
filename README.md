Payment backend (mock)
======================

This workspace includes a small Express server (`server.js`) that provides endpoints to create a dynamic UPI QR for an order, receive webhook notifications from a payment provider, and let the frontend poll for status.

Quick start
-----------

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and configure your `SHOP_UPI_ID` and `SHOP_NAME`.

3. Start server:

```bash
npm start
```

4. Open the site in your browser at http://localhost:3000

Endpoints
---------
- `POST /api/create-payment` — accepts order JSON and returns `{ orderId, qrUrl, expiresAt }`.
- `GET /api/payment-status/:orderId` — returns `{ orderId, status }` for polling.
- `POST /api/webhook/payment` — webhook endpoint the provider should call to update payment status.
- `POST /api/simulate-provider/:orderId` — helper to mark a payment as `Paid` for local testing.

Notes
-----
- Replace the in-memory `payments` store with a persistent DB in production.
- Implement provider-specific integration (Decentro/Setu/Cosmofeed) inside the `/api/create-payment` route and secure webhooks with signature verification.

Decentro setup
--------------
1. Set these env vars in your `.env`:

```
DECENTRO_BASE_URL=https://api.decentro.co
DECENTRO_API_KEY=YOUR_DECENTRO_API_KEY
DECENTRO_WEBHOOK_SECRET=your_webhook_secret
DECENTRO_WEBHOOK_HEADER=x-decentro-signature
PUBLIC_BASE_URL=https://your-public-domain
```

2. Configure the provider to call `https://your-public-domain/api/webhook/payment` for payment updates.

3. The server will verify the webhook HMAC if `DECENTRO_WEBHOOK_SECRET` is set.
