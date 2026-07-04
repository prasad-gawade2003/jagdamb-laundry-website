const shop = {
  name: "Jagdamb Laundry & Drycleaners",
  phone: "+91 79774 11572",
  // Can be a phone number (e.g. "919876543210") or a direct URL (e.g. "https://wa.link/xyz")
  whatsapp: "917977411572",
  // Inquiry contact (explicit api.whatsapp.com link should use this phone)
  inquiryPhone: "917977411572",
  inquiryMessage: "Hi Jagdamb Laundry & Drycleaners, could you please provide more details on your services and turnaround time? Thanks!",
  address: "Shop 12, Main Market Road, Your City",
  // pickupCharge is now free for customers; keep original for display as struck-through
  pickupCharge: 0,
  originalPickupCharge: 49,
  // UPI ID for the shop - used to prefill UPI app payment
  upiId: 'gawadeprasad03-2@okaxis',
};

let stores = [
  {
    id: "sai-nagar",
    name: "Jagdamb Laundry - Sai Nagar",
    shortName: "Sai Nagar",
    address: "Jagdamb Laundry, Sai Nagar, Sukhsagar Nagar, Kondhwa Budruk, Pune, Maharashtra 411048",
    phone: "+91 98216 75395",
    email: "jagdambalaundry1@gmail.com",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Jagdamb%20Laundry,%20Sai%20Nagar,%20Sukhsagar%20Nagar,%20Kondhwa%20Budruk,%20Pune,%20Maharashtra%20411048",
    status: "Open Now"
  },
  {
    id: "three-jewels",
    name: "Jagdamb Laundry - Three Jewels",
    shortName: "Three Jewels",
    address: "Shop No. 5, Three Jewels Society, Kolte Patil Developers, Tilekar Nagar, Kondhwa Budruk, Pune, Maharashtra ,411048",
    phone: "+91 98216 75395",
    email: "jagdambalaundry1@gmail.com",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Shop%20No.%205,%20Three%20Jewels%20Society,%20Kolte%20Patil%20Developers,%20Tilekar%20Nagar,%20Kondhwa%20Budruk,%20Pune,%20Maharashtra%20411048",
    status: "Open Now"
  }
];

let services = [
  {
    icon: `<svg viewBox="0 0 64 64" width="72" height="72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="12" r="3" fill="#a5f3fc" />
      <circle cx="56" cy="18" r="2" fill="#bae6fd" />
      <circle cx="44" cy="20" r="1.5" fill="#a5f3fc" />
      <rect x="14" y="16" width="36" height="42" rx="4" fill="#e0f2fe" stroke="#1e293b" stroke-width="2.5" />
      <rect x="18" y="20" width="12" height="6" rx="1" fill="#bae6fd" stroke="#1e293b" stroke-width="2" />
      <circle cx="42" cy="23" r="2.5" fill="#fbcfe8" stroke="#1e293b" stroke-width="2" />
      <circle cx="32" cy="42" r="12" fill="#bae6fd" stroke="#1e293b" stroke-width="2.5" />
      <circle cx="32" cy="42" r="8.5" fill="#a5f3fc" />
      <path d="M25 43c2 2 4 0 6-1s4-3 7-1" stroke="#0284c7" stroke-width="2" stroke-linecap="round" />
      <path d="M26 46c2 1 3 0 5-1s3-2 5-1" stroke="#0284c7" stroke-width="1.5" stroke-linecap="round" />
    </svg>`,
    name: "Wash & Fold",
    desc: "Daily wear cleaned, folded and packed.",
    price: 1,
    unit: "/kg"
  },
  {
    icon: `<svg viewBox="0 0 64 64" width="72" height="72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 24h24v30H12V24z" fill="#ccfbf1" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M18 24l6 8 8-8" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M30 24l-6 8-8-8" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="24" cy="38" r="1.5" fill="#1e293b" />
      <circle cx="24" cy="46" r="1.5" fill="#1e293b" />
      <path d="M28 48h22l2-6c-1-10-8-12-14-12H28v18z" fill="#fbcfe8" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M32 30v-4c0-2 2-3 4-3h8c2 0 4 1 4 3v4" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M54 36h4" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />
      <path d="M53 42h5" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />
    </svg>`,
    name: "Wash & Iron",
    desc: "Fresh wash with crisp ironing.",
    price: 90,
    unit: "/kg"
  },
  {
    icon: `<svg viewBox="0 0 64 64" width="72" height="72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M52 14l1.5 2.5 2.5 1.5-2.5 1.5-1.5 2.5-1.5-2.5-2.5-1.5 2.5-1.5L52 14z" fill="#facc15" />
      <path d="M12 36l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1 1-1.5z" fill="#facc15" />
      <path d="M32 20c0-4 3-5 5-3a3 3 0 01-2 5" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" />
      <path d="M22 24l10-4 10 4" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M18 25l6 5v24h16V30l6-5c-2 8-1 25-1 29H19c0-4 1-21-1-29z" fill="#dbeafe" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M24 25l4 10h8l4-10" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M30 25l2 6 2-6-2-2-2 2z" fill="#fbcfe8" stroke="#1e293b" stroke-width="2" />
    </svg>`,
    name: "Dry Cleaning",
    desc: "Premium care for suits, sarees and delicate clothes.",
    price: 60
  },
  {
    icon: `<svg viewBox="0 0 64 64" width="72" height="72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M48 10l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1 1-1.5z" fill="#facc15" />
      <path d="M32 16c0-3 2-4 4-3a2 2 0 01-1 4" stroke="#1e293b" stroke-width="2" stroke-linecap="round" />
      <path d="M20 20l12-4 12 4" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M20 20v28c0 4 4 6 12 6s12-2 12-6V20H20z" fill="#ffe4e6" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M24 20v33M28 20v34M40 20v33" stroke="#facc15" stroke-width="2.5" stroke-linecap="round" />
      <path d="M20 44h24" stroke="#1e293b" stroke-width="2" stroke-dasharray="3 3" />
      <path d="M20 48h24" stroke="#1e293b" stroke-width="2" stroke-dasharray="3 3" />
    </svg>`,
    name: "Saree Ironing",
    desc: "Sharp finish for office and occasion wear.",
    price: 60
  },
  {
    icon: `<svg viewBox="0 0 64 64" width="72" height="72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="20" r="1.5" fill="#38bdf8" />
      <circle cx="34" cy="16" r="2" fill="#38bdf8" />
      <circle cx="38" cy="22" r="1.5" fill="#38bdf8" />
      <path d="M12 28h24v26H12V28z" fill="#e0f2fe" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M18 28l6 8 8-8" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M30 28l-6 8-8-8" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="24" cy="40" r="1.5" fill="#1e293b" />
      <circle cx="24" cy="48" r="1.5" fill="#1e293b" />
      <path d="M42 32h10l-2 18H44l-2-18z" fill="#fbcfe8" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M44 32v-4h6v4M42 26h10" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M44 28l-4 4" stroke="#1e293b" stroke-width="2" stroke-linecap="round" />
      <path d="M14 14l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1 1-1.5z" fill="#facc15" />
    </svg>`,
    name: "Starching",
    desc: "Starching your clothes adds crispness and structure.",
    price: 60
  },
  {
    icon: `<svg viewBox="0 0 64 64" width="72" height="72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="18" r="3.5" fill="#a5f3fc" />
      <circle cx="48" cy="16" r="2.5" fill="#bae6fd" />
      <path d="M12 10l1.5 2.5 2.5 1.5-2.5 1.5-1.5 2.5-1.5-2.5-2.5-1.5 2.5-1.5L12 10z" fill="#facc15" />
      <rect x="12" y="44" width="40" height="10" rx="3" fill="#ffe4e6" stroke="#1e293b" stroke-width="2.5" />
      <rect x="14" y="34" width="36" height="10" rx="3" fill="#e0f2fe" stroke="#1e293b" stroke-width="2.5" />
      <rect x="16" y="24" width="32" height="10" rx="3" fill="#ccfbf1" stroke="#1e293b" stroke-width="2.5" />
      <path d="M48 29c-1 0-2 1-2 2h4c0-1-1-2-2-2zM46 39c-1 0-2 1-2 2h4c0-1-1-2-2-2z" fill="#1e293b" />
    </svg>`,
    name: "Bedsheet Cleaning",
    desc: "Bedsheets, covers and blankets handled with care.",
    price: 100
  },
  {
    icon: `<svg viewBox="0 0 64 64" width="72" height="72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M46 14l1.5 2.5 2.5 1.5-2.5 1.5-1.5 2.5-1.5-2.5-2.5-1.5 2.5-1.5L46 14z" fill="#facc15" />
      <path d="M14 22l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1 1-1.5z" fill="#facc15" />
      <path d="M16 48h22l2-8c-1-6-6-8-12-8H20l-4 8v8z" fill="#e0f2fe" stroke="#1e293b" stroke-width="2" stroke-linejoin="round" opacity="0.7" />
      <path d="M22 52h24l2-8c-1-6-6-8-12-8H26l-4 8v8z" fill="#ccfbf1" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M22 52h26v3.5a1.5 1.5 0 01-1.5 1.5H22v-5z" fill="#fbcfe8" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M34 38l4 4M36 36l4 4" stroke="#1e293b" stroke-width="2" stroke-linecap="round" />
    </svg>`,
    name: "Shoes Cleaning",
    desc: "Special handling for designer garments.",
    price: 200
  },
  {
    icon: `<svg viewBox="0 0 64 64" width="72" height="72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="18" r="2.5" fill="#a5f3fc" />
      <circle cx="14" cy="40" r="3.5" fill="#bae6fd" />
      <rect x="8" y="14" width="48" height="4" rx="2" fill="#bae6fd" stroke="#1e293b" stroke-width="2.5" />
      <circle cx="7" cy="16" r="3.5" fill="#facc15" stroke="#1e293b" stroke-width="2" />
      <circle cx="57" cy="16" r="3.5" fill="#facc15" stroke="#1e293b" stroke-width="2" />
      <path d="M12 18v32c4-2 8-2 10-6V18H12z" fill="#ccfbf1" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M42 18v28c2 4 6 4 10 6V18H42z" fill="#ccfbf1" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M12 34c2 0 6 1 10 1M42 34c4 0 8-1 10-1" stroke="#facc15" stroke-width="2" stroke-linecap="round" />
    </svg>`,
    name: "Curtain Cleaning",
    desc: "Deep cleaning for home curtains.",
    price: 100
  }
];

const priceItems = [];

let cart = [];
let locationData = null;
let lastOrder = null;
let pendingOrder = null;

// When the page is opened directly from the filesystem (file://), relative
// API calls like `/api/create-payment` won't reach the local server. Use an
// explicit localhost base in that case so the client talks to the dev server
// at http://localhost:3000.
const API_BASE = location.protocol === 'file:' ? 'http://localhost:3000' : '';

const currency = (amount) => `Rs ${amount}`;
const byId = (id) => document.getElementById(id);

function toast(message) {
  const toastEl = byId("toast");
  toastEl.textContent = message;
  toastEl.classList.add("show");
  window.setTimeout(() => toastEl.classList.remove("show"), 2800);
}

function buildWhatsAppLink(message) {
  // If `shop.whatsapp` is a full URL, return it directly (useful for shortlinks).
  try {
    const url = new URL(shop.whatsapp);
    // If a message is provided, append as `text` or `msg` query param when possible.
    if (message) {
      const separator = url.search ? "&" : "?";
      // Use `text` param which WhatsApp web supports for prefilled messages.
      url.href = url.href + separator + 'text=' + encodeURIComponent(message);
      return url.href;
    }
    return url.href;
  } catch (e) {
    // Not a full URL — assume it's a phone number and build a wa.me link with text.
    return `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(message)}`;
  }
}

function buildWhatsAppPhoneLink(phone, message) {
  const base = `https://api.whatsapp.com/send`;
  const params = [`phone=${encodeURIComponent(phone)}`];
  if (message) params.push(`text=${encodeURIComponent(message)}`);
  return `${base}?${params.join("&")}`;
}

// Normalize a customer phone to WhatsApp international format (91XXXXXXXXXX)
function normalizePhoneForWhatsApp(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/[^0-9]/g, '');
  // Remove leading 0 (local format)
  if (digits.startsWith('0')) digits = digits.slice(1);
  // Add India country code if not present
  if (!digits.startsWith('91')) digits = '91' + digits;
  // Ensure it's a valid length (91 + 10 digits)
  if (digits.length !== 12) return digits;
  return digits;
}

function normalizePickupDate(value) {
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
}

function formatDateForWhatsApp(isoDate) {
  const normalized = normalizePickupDate(isoDate);
  if (!normalized) return "";
  try {
    const d = new Date(normalized);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch (e) {
    return normalized;
  }
}

function formatOrderForWhatsApp(order) {
  const lines = [];
  lines.push(`Order ID: ${order.id}`);
  if (order.storeName) lines.push(`Store Location: ${order.storeName}`);
  lines.push(`Full name: ${order.customerName || ''}`);
  lines.push(`Phone number: ${order.phone || ''}`);
  lines.push(`Pickup date: ${formatDateForWhatsApp(order.pickupDate)}`);
  lines.push(`Time slot: ${order.timeSlot || ''}`);
  lines.push(`Payment method: ${order.paymentMethod || ''}`);
  lines.push(`Pickup address: ${order.address || ''}`);
  if (order.location && order.location.mapUrl) lines.push(`Location: ${order.location.mapUrl}`);
  lines.push('');
  lines.push('Items:');
  if (order.items && order.items.length) {
    order.items.forEach((it) => {
      lines.push(`- ${it.item} (${it.service}) x ${it.qty}: ${currency(it.price * it.qty)}`);
    });
  } else {
    lines.push('- No items');
  }
  lines.push('');
  lines.push(`Pickup charge: ${currency(order.pickup)}`);
  lines.push(`Total: ${currency(order.total)}`);
  lines.push('');
  lines.push(`Payment receipt: Amount to pay ${currency(order.total)} - ${order.paymentStatus || 'Pending'}`);
  // do not append a 'Sent from' footer
  return lines.join('\n');
}

// Receipt message for CUSTOMER (friendly, thank you message)
function formatReceiptForCustomer(order) {
  const lines = [];
  lines.push(`🧺 *${shop.name}*`);
  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`✅ *Order Confirmed!*`);
  lines.push('');
  lines.push(`📋 *Order ID:* ${order.id}`);
  if (order.storeName) lines.push(`🏪 *Store:* ${order.storeName}`);
  lines.push(`👤 *Name:* ${order.customerName || ''}`);
  lines.push(`📅 *Pickup Date:* ${formatDateForWhatsApp(order.pickupDate)}`);
  lines.push(`🕐 *Time Slot:* ${order.timeSlot || ''}`);
  lines.push(`📍 *Address:* ${order.address || ''}`);
  if (order.location && order.location.mapUrl) lines.push(`📌 *Location:* ${order.location.mapUrl}`);
  lines.push('');
  lines.push(`🛒 *Items:*`);
  if (order.items && order.items.length) {
    order.items.forEach((it) => {
      lines.push(`  • ${it.item} (${it.service}) x ${it.qty} — ${currency(it.price * it.qty)}`);
    });
  }
  lines.push('');
  lines.push(`🚚 Pickup charge: ${currency(order.pickup)}`);
  lines.push(`💰 *Total: ${currency(order.total)}*`);
  lines.push('');
  lines.push(`💳 *Payment:* ${order.paymentMethod || ''} — ${order.paymentStatus || 'Pending'}`);
  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`🙏 Thank you for choosing ${shop.name}!`);
  lines.push(`We will confirm your pickup shortly.`);
  lines.push(`📞 Contact: ${shop.phone}`);
  return lines.join('\n');
}

// Receipt message for LAUNDRY OWNER (order notification)
function formatReceiptForLaundry(order) {
  const lines = [];
  lines.push(`🔔 *NEW ORDER RECEIVED!*`);
  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`📋 *Order ID:* ${order.id}`);
  if (order.storeName) lines.push(`🏪 *Store:* ${order.storeName}`);
  lines.push('');
  lines.push(`👤 *Customer:* ${order.customerName || ''}`);
  lines.push(`📱 *Phone:* ${order.phone || ''}`);
  lines.push(`📍 *Address:* ${order.address || ''}`);
  if (order.location && order.location.mapUrl) lines.push(`📌 *Location:* ${order.location.mapUrl}`);
  lines.push(`📅 *Pickup:* ${formatDateForWhatsApp(order.pickupDate)}, ${order.timeSlot || ''}`);
  lines.push('');
  lines.push(`🛒 *Items:*`);
  if (order.items && order.items.length) {
    order.items.forEach((it) => {
      lines.push(`  • ${it.item} (${it.service}) x ${it.qty} — ${currency(it.price * it.qty)}`);
    });
  }
  lines.push('');
  lines.push(`🚚 Pickup charge: ${currency(order.pickup)}`);
  lines.push(`💰 *Total: ${currency(order.total)}*`);
  lines.push(`💳 *Payment:* ${order.paymentMethod || ''} — ${order.paymentStatus || 'Pending'}`);
  lines.push(`━━━━━━━━━━━━━━━━━━`);
  return lines.join('\n');
}

// Automatically send WhatsApp order receipt — opens WhatsApp to laundry.
// The sent message in customer's WhatsApp chat IS their proof of booking.
// Server-side WhatsApp API also sends auto receipt to customer's number.
function sendAutoWhatsAppReceipts(order) {
  const laundryPhone = shop.inquiryPhone;

  // Build a combined receipt that serves as proof for customer + notification for laundry
  const lines = [];
  lines.push(`🧺 *${shop.name}*`);
  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`✅ *ORDER RECEIPT*`);
  lines.push(``);
  lines.push(`📋 *Order ID:* ${order.id}`);
  if (order.storeName) lines.push(`🏪 *Store:* ${order.storeName}`);
  lines.push(`👤 *Name:* ${order.customerName || ''}`);
  lines.push(`📱 *Phone:* ${order.phone || ''}`);
  lines.push(`📅 *Pickup:* ${formatDateForWhatsApp(order.pickupDate)}, ${order.timeSlot || ''}`);
  lines.push(`📍 *Address:* ${order.address || ''}`);
  if (order.location && order.location.mapUrl) lines.push(`📌 *Location:* ${order.location.mapUrl}`);
  lines.push(``);
  lines.push(`🛒 *Items:*`);
  if (order.items && order.items.length) {
    order.items.forEach((it) => {
      lines.push(`  • ${it.item} (${it.service}) x ${it.qty} — ${currency(it.price * it.qty)}`);
    });
  }
  lines.push(``);
  lines.push(`🚚 Pickup charge: ${currency(order.pickup)}`);
  lines.push(`💰 *Total: ${currency(order.total)}*`);
  lines.push(`💳 *Payment:* ${order.paymentMethod || ''} — ${order.paymentStatus || 'Pending'}`);
  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`🙏 Thank you for choosing ${shop.name}!`);

  const msg = lines.join('\n');

  // Open WhatsApp to laundry — customer sends this, both have the receipt
  const link = buildWhatsAppPhoneLink(laundryPhone, msg);
  window.open(link, '_blank', 'noopener,noreferrer');

  toast("📱 WhatsApp receipt opened — tap Send to confirm your order!");
}

function quickMessage() {
  return `Hello ${shop.name}, I want to book a laundry pickup.`;
}

function renderStores() {
  const grid = byId("storesGrid");
  if (grid) {
    grid.innerHTML = stores
      .map(
        (store) => `
          <article class="store-card">
            <div class="store-card-header">
              <h3 class="store-card-name">${store.name}</h3>
              <span class="store-status-badge">${store.status}</span>
            </div>
            <p class="store-card-address">${store.address}</p>
            <a href="${store.mapUrl}" target="_blank" rel="noopener noreferrer" class="store-locate-link">Locate Now</a>
            <div class="store-card-contact">
              <div class="store-card-contact-item">
                <span>📞</span> <strong>Phone:</strong> ${store.phone}
              </div>
              <div class="store-card-contact-item">
                <span>✉️</span> <strong>Email:</strong> ${store.email}
              </div>
            </div>
            <div class="store-card-actions">
              <button class="btn primary select-store-btn" type="button" data-id="${store.id}">Schedule a Free Pickup</button>
            </div>
          </article>
        `,
      )
      .join("");
  }

  const storeSelectEl = byId("storeSelect");
  if (storeSelectEl) {
    storeSelectEl.innerHTML = `<option value="">Choose a store location</option>` + stores
      .map((store) => `<option value="${store.id}">${store.name}</option>`)
      .join("");
  }
}

function renderServices() {
  byId("serviceGrid").innerHTML = services
    .map(
      (service) => `
          <article class="service-card">
            <span class="service-icon">${service.icon}</span>
            <h3>${service.name}</h3>
            <p>${service.desc}</p>
            <strong>Starting ${currency(service.price)}${service.unit ? ' ' + service.unit : ''}</strong>
            <button class="btn soft add-service" type="button" data-name="${service.name}">Add to Order</button>
          </article>
        `,
    )
    .join("");
}

function renderPricing() {
  const pricingRowsEl = byId("pricingRows");
  if (pricingRowsEl) {
    pricingRowsEl.innerHTML = priceItems
      .map(
        (row) => `
        <tr>
          <td><strong>${row.item}</strong></td>
          <td>${row.service}</td>
          <td>${currency(row.price)}</td>
          <td><button class="btn soft add-price" type="button" data-item="${row.item}">Add</button></td>
        </tr>
      `,
      )
      .join("");
  }

  const itemSelectEl = byId("itemSelect");
  if (itemSelectEl) {
    itemSelectEl.innerHTML = services
      .map((service, index) => `<option value="${index}">${service.name} (${currency(service.price)}${service.unit || ''})</option>`)
      .join("");
  }
}

function addItem(item, qty = 1) {
  const quantity = Math.max(1, Number(qty) || 1);
  const existing = cart.find((entry) => entry.item === item.item && entry.service === item.service);
  if (existing) {
    existing.qty += quantity;
  } else {
    cart.push({ ...item, qty: quantity });
  }
  renderSummary();
  playLaundryDrop();
  toast(`${item.item} added to order`);
}

function totals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  return {
    subtotal,
    pickup: shop.pickupCharge,
    total: subtotal + shop.pickupCharge,
  };
}

function renderSummary() {
  const summaryItems = byId("summaryItems");
  if (!cart.length) {
    summaryItems.innerHTML = `<p class="summary-meta">No items added yet.</p>`;
  } else {
    summaryItems.innerHTML = cart
      .map(
        (item, index) => `
          <div class="summary-item">
            <div>
              <strong>${item.item}</strong>
              <span>${item.service} x ${item.qty} @ ${currency(item.price)}</span>
            </div>
            <div>
              <strong>${currency(item.price * item.qty)}</strong>
              <button class="remove-item" type="button" data-index="${index}" aria-label="Remove ${item.item}">Remove</button>
            </div>
          </div>
        `,
      )
      .join("");
  }

  const total = totals();
  // If pickup is free, show the old price struck-through in red and a 'Free' label beside it.
  if (shop.pickupCharge === 0 && typeof shop.originalPickupCharge === 'number') {
    byId("pickupCharge").innerHTML = `<del class="pickup-old">${currency(shop.originalPickupCharge)}</del> <span class="pickup-free">Free</span>`;
  } else {
    byId("pickupCharge").textContent = currency(total.pickup);
  }
  byId("grandTotal").textContent = currency(total.total);

  const name = byId("customerName").value.trim();
  const slot = byId("timeSlot").value;
  byId("summaryMeta").textContent = name || slot ? `${name || "Customer"} ${slot ? `pickup: ${slot}` : ""}` : "Add customer details to prepare order.";
}

// Render sample customer reviews into the marquee. Content is duplicated to create a seamless loop.
function renderReviews() {
  const reviews = [
    { name: 'Asha P.', text: 'Fast pickup and pristine ironing my shirts look new!', rating: 5 },
    { name: 'Ravi K.', text: 'Great service and friendly staff. Pickup was on time.', rating: 4 },
    { name: 'Sonal M.', text: 'Affordable prices and careful handling of delicate sarees.', rating: 5 },
    { name: 'Deepak T.', text: 'Very convenient online booking. Highly recommend.', rating: 4.5 },
    { name: 'Neha S.', text: 'Quick turnaround and excellent customer support.', rating: 5 },
    { name: 'Manish R.', text: 'Quality cleaning, no stains left. Will use again.', rating: 4 },
  ];

  const track = byId('reviewTrack');
  if (!track) return;
  const html = reviews.map(r => {
    const stars = '★★★★★'.slice(0, r.rating);
    return `
      <div class="review-card" role="article">
        <strong>${r.name}</strong>
        <small>${r.text}</small>
        <span class="stars" aria-label="${r.rating} out of 5 stars">${stars}</span>
      </div>
    `;
  }).join('');

  // Duplicate content so the marquee can scroll continuously
  track.innerHTML = html + html;
}

function getOrderData(status = "Pending") {
  const form = byId("orderForm");
  const data = new FormData(form);
  const total = totals();
  const storeId = data.get("storeSelect");
  const store = stores.find(s => s.id === storeId);
  return {
    id: lastOrder?.id || `FF-${Date.now().toString().slice(-6)}`,
    storeId: storeId || "",
    storeName: store ? store.name : "",
    customerName: data.get("customerName")?.trim(),
    phone: data.get("phone")?.trim(),
    address: data.get("address")?.trim(),
    pickupDate: normalizePickupDate(data.get("pickupDate")),
    timeSlot: data.get("timeSlot"),
    paymentMethod: data.get("paymentMethod"),
    paymentStatus: status,
    location: locationData,
    items: [...cart],
    ...total,
  };
}

function orderMessage(order) {
  const itemLines = order.items.map((item) => `- ${item.item} (${item.service}) x ${item.qty}: ${currency(item.price * item.qty)}`).join("\n");
  const mapLine = order.location ? `\nLocation: ${order.location.mapUrl}` : "";
  const storeLine = order.storeName ? `\nStore Location: ${order.storeName}` : "";
  return `New Laundry Order - ${shop.name}
Order ID: ${order.id}${storeLine}
Name: ${order.customerName}
Phone: ${order.phone}
Address: ${order.address}${mapLine}
Pickup: ${order.pickupDate}, ${order.timeSlot}
Items:
${itemLines}
Pickup charge: ${currency(order.pickup)}
Total: ${currency(order.total)}
Payment method: ${order.paymentMethod}
Payment status: ${order.paymentStatus}`;
}

function validateOrder() {
  const form = byId("orderForm");
  if (!form.reportValidity()) return false;
  if (!cart.length) {
    toast("Please add at least one laundry item.");
    return false;
  }
  return true;
}

function saveOrderToHistory(order) {
  if (!order || !order.id) return;
  let history = [];
  try {
    const raw = localStorage.getItem('jld_order_history');
    if (raw) history = JSON.parse(raw);
  } catch (e) {
    console.error("Error reading order history:", e);
  }

  // Check if order already exists to avoid duplicates
  const exists = history.some(item => item.id === order.id);
  if (!exists) {
    order.createdAt = Date.now();
    history.push(order);
    localStorage.setItem('jld_order_history', JSON.stringify(history));
  }

  // Also save to server database for admin panel
  if (order._serverOrderCreated) return;
  try {
    fetch(API_BASE + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    }).catch(err => console.warn('Could not save order to server:', err.message));
  } catch (e) {
    console.warn('Could not save order to server:', e);
  }
}

function showReceipt(order) {
  saveOrderToHistory(order);
  const receiptBody = byId("receiptBody");
  const mapLink = order.location
    ? `<a href="${order.location.mapUrl}" target="_blank" rel="noreferrer">Open pickup location</a>`
    : "Manual address only";

  const storeRow = order.storeName ? `<div class="receipt-row"><span>Store Location</span><strong>${order.storeName}</strong></div>` : "";
  receiptBody.innerHTML = `
    <div class="receipt-row"><span>Order ID</span><strong>${order.id}</strong></div>
    ${storeRow}
    <div class="receipt-row"><span>Customer</span><strong>${order.customerName}</strong></div>
    <div class="receipt-row"><span>Phone</span><strong>${order.phone}</strong></div>
    <div class="receipt-row"><span>Pickup</span><strong>${order.pickupDate}, ${order.timeSlot}</strong></div>
    <div class="receipt-row"><span>Address</span><strong>${order.address}</strong></div>
    <div class="receipt-row"><span>Location</span><strong>${mapLink}</strong></div>
    ${order.items
      .map(
        (item) => `
          <div class="receipt-row">
            <span>${item.item} - ${item.service} x ${item.qty}</span>
            <strong>${currency(item.price * item.qty)}</strong>
          </div>
        `,
      )
      .join("")}
    <div class="receipt-row"><span>Pickup charge</span><strong>${currency(order.pickup)}</strong></div>
    <div class="receipt-row"><span>Total</span><strong>${currency(order.total)}</strong></div>
    <div class="receipt-row"><span>Payment method</span><strong>${order.paymentMethod}</strong></div>
    <div class="receipt-row"><span>Payment status</span><strong>${order.paymentStatus}</strong></div>
    <p class="summary-meta">Thank you for choosing ${shop.name}. We will confirm pickup shortly.</p>
  `;

  byId("receiptStatus").textContent = order.paymentStatus;
  byId("receiptSection").hidden = false;
  byId("receiptSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function completeOrder(status) {
  const order = getOrderData(status);
  lastOrder = order;
  showReceipt(order);
  toast(status === "Paid" ? "Payment successful. Receipt generated." : "Order saved. Receipt generated.");

  // Auto-send WhatsApp receipts to both customer and laundry
  sendAutoWhatsAppReceipts(order);
}

function showPayment(order) {
  pendingOrder = order;
  lastOrder = order;
  byId("paymentAmount").textContent = currency(order.total);
  byId("paymentSection").hidden = false;
  byId("receiptSection").hidden = true;
  byId("paymentSection").scrollIntoView({ behavior: "smooth", block: "start" });
  toast("Scan QR and confirm after payment.");
}

function playLaundryDrop() {
  const scene = document.querySelector(".laundry-drop-scene");
  if (!scene) return;
  scene.classList.remove("play");
  scene.classList.remove("has-pile");
  void scene.offsetWidth;
  scene.classList.add("play");
  window.setTimeout(() => {
    scene.classList.add("has-pile");
    scene.classList.remove("play");
  }, 1750);
}

function setupEvents() {
  ["quickWhatsApp", "heroWhatsApp", "contactWhatsApp"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = buildWhatsAppPhoneLink(shop.inquiryPhone, shop.inquiryMessage || quickMessage());
  });

  // Store selector from card click
  const storesGrid = byId("storesGrid");
  if (storesGrid) {
    storesGrid.addEventListener("click", (event) => {
      const button = event.target.closest(".select-store-btn");
      if (!button) return;
      const storeId = button.dataset.id;
      const select = byId("storeSelect");
      if (select) {
        select.value = storeId;
        select.dispatchEvent(new Event("change"));
        const orderSection = byId("order");
        if (orderSection) {
          orderSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        toast(`Selected ${stores.find(s => s.id === storeId)?.shortName || 'Store'}`);
      }
    });
  }

  byId("serviceGrid").addEventListener("click", (event) => {
    const button = event.target.closest(".add-service");
    if (!button) return;
    const service = services.find((entry) => entry.name === button.dataset.name);
    addItem({ item: service.name, service: "Service Package", price: service.price }, 1);
  });

  const pricingRowsEl = byId("pricingRows");
  if (pricingRowsEl) {
    pricingRowsEl.addEventListener("click", (event) => {
      const button = event.target.closest(".add-price");
      if (!button) return;
      const item = priceItems.find((entry) => entry.item === button.dataset.item);
      if (!item) {
        toast("Item not available");
        return;
      }
      addItem(item, 1);
    });
  }

  const addItemBtn = byId("addItem");
  if (addItemBtn) {
    addItemBtn.addEventListener("click", () => {
      const sel = byId("itemSelect");
      const idx = sel ? Number(sel.value) : NaN;
      const service = Number.isFinite(idx) ? services[idx] : undefined;
      if (!service) {
        toast("No items available to add.");
        return;
      }
      addItem({ item: service.name, service: "Service Package", price: service.price }, byId("itemQty").value);
    });
  }

  byId("summaryItems").addEventListener("click", (event) => {
    const button = event.target.closest(".remove-item");
    if (!button) return;
    cart.splice(Number(button.dataset.index), 1);
    renderSummary();
  });

  ["storeSelect", "customerName", "timeSlot", "pickupDate", "paymentMethod"].forEach((id) => {
    const el = byId(id);
    if (el) {
      el.addEventListener("input", renderSummary);
      el.addEventListener("change", renderSummary);
    }
  });

  byId("useLocation").addEventListener("click", () => {
    if (!navigator.geolocation) {
      toast("Your browser does not support location sharing.");
      return;
    }
    byId("locationStatus").textContent = "Getting location...";
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        locationData = {
          lat,
          lng,
          mapUrl: `https://www.google.com/maps?q=${lat},${lng}`,
        };
        byId("locationStatus").innerHTML = `<a href="${locationData.mapUrl}" target="_blank" rel="noreferrer">Location added</a>`;
        toast("Pickup location added.");
      },
      () => {
        byId("locationStatus").textContent = "Location permission denied";
        toast("Please allow location or enter address manually.");
      },
    );
  });

  byId("sendWhatsApp").addEventListener("click", () => {
    if (!validateOrder()) return;
    const method = byId("paymentMethod").value;
    const status = method === "Online Payment" ? "Payment Waiting" : "COD Pending";
    const order = getOrderData(status);
    lastOrder = order;
    saveOrderToHistory(order);
    const msg = formatOrderForWhatsApp(order);
    window.open(buildWhatsAppPhoneLink(shop.inquiryPhone, msg), "_blank", "noopener,noreferrer");
  });

  byId("orderForm").addEventListener("submit", (event) => {
    event.preventDefault();
    (async () => {
      if (!validateOrder()) return;
      const method = byId("paymentMethod").value;
      const order = getOrderData("Payment Waiting");
      if (method === "Online Payment") {
        try {
          // create payment on backend which in turn calls Razorpay
          const payload = await createRazorpayOrderOnServer(order);
          // payload: { local_order_id, razorpay_order_id, amount, currency, key_id }
          pendingOrder = order;
          pendingOrder.id = payload.local_order_id;
          pendingOrder.razorpay_order_id = payload.razorpay_order_id;
          pendingOrder.paymentStatus = 'Payment Waiting';
          pendingOrder._serverOrderCreated = true;

          // Open Razorpay Checkout Modal
          const options = {
            key: payload.key_id,
            amount: payload.amount,
            currency: payload.currency,
            name: "Jagdamb Laundry",
            description: "Laundry Order Payment",
            order_id: payload.razorpay_order_id,
            handler: async function (response) {
              try {
                // Send payment credentials to verification endpoint
                const verifyResp = await fetch(API_BASE + '/api/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                  })
                });

                if (verifyResp.ok) {
                  if (pendingOrder) {
                    pendingOrder.paymentStatus = 'Paid';
                  }
                  completeOrder('Paid');
                } else {
                  const errData = await verifyResp.json();
                  toast("Payment verification failed: " + (errData.error || "Unknown error"));
                }
              } catch (verificationErr) {
                console.error("Verification call failed:", verificationErr);
                toast("Could not contact payment verification server.");
              }
            },
            prefill: {
              name: order.customerName || "",
              contact: order.phone || "",
            },
            theme: {
              color: "#1e3a8a",
            },
            modal: {
              ondismiss: function () {
                toast("Payment process cancelled by user.");
              }
            }
          };

          const rzp = new Razorpay(options);
          rzp.on('payment.failed', function (resp) {
            toast("Payment failed: " + resp.error.description);
          });
          rzp.open();

        } catch (e) {
          console.error(e);
        }
      } else {
        completeOrder("COD Pending");
      }
    })();
  });

  byId("confirmPayment").addEventListener("click", () => {
    if (!pendingOrder) return;
    const paidOrder = { ...pendingOrder, paymentStatus: "Paid" };
    lastOrder = paidOrder;
    pendingOrder = null;
    showReceipt(paidOrder);
    toast("Payment done. Receipt generated.");
  });

  byId("paymentWhatsApp").addEventListener("click", () => {
    if (!pendingOrder) return;
    const msg = formatOrderForWhatsApp(pendingOrder);
    window.open(buildWhatsAppPhoneLink(shop.inquiryPhone, msg), "_blank", "noopener,noreferrer");
  });

  // Allow users to click the QR image to open it in a new tab for easier scanning.
  const qrImg = document.querySelector('.qr-image');
  if (qrImg) {
    qrImg.addEventListener('click', () => {
      window.open(qrImg.src, '_blank', 'noopener,noreferrer');
    });
  }

  function loadImageAsDataUrl(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  async function generateReceiptPdf(order) {
    const jsPDFClass = window.jspdf?.jsPDF || window.jsPDF || window.jspdf;
    if (!jsPDFClass) {
      throw new Error('jsPDF is not loaded');
    }

    const doc = new jsPDFClass({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const margin = 15;
    const pageWidth = 210;
    const usableWidth = pageWidth - margin * 2;
    let y = 15;

    const logoUrl = `${window.location.origin}${window.location.pathname.replace(/\/[^\/]*$/, '')}/assets/jagdamblogo.png`;
    const logoData = await loadImageAsDataUrl(logoUrl);
    if (logoData) {
      doc.addImage(logoData, 'PNG', margin, y, 30, 30);
    }

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(shop.name, margin + (logoData ? 35 : 0), y + (logoData ? 12 : 10));
    y += 30;

    doc.setDrawColor(225, 230, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text('Receipt', pageWidth - margin, y, { align: 'right' });
    y += 10;

    const addField = (label, value) => {
      doc.setTextColor(100, 116, 139);
      doc.text(label, margin, y);
      doc.setTextColor(15, 23, 42);
      doc.text(value, pageWidth - margin, y, { align: 'right' });
      y += 7;
    };

    addField('Order ID', String(order.id));
    addField('Customer', order.customerName || 'N/A');
    addField('Phone', order.phone || 'N/A');
    addField('Pickup', `${order.pickupDate || 'N/A'} ${order.timeSlot || ''}`.trim());
    addField('Address', order.address || 'N/A');
    y += 4;

    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Items', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');

    const items = order.items || [];
    if (items.length === 0) {
      doc.text('No items listed', margin, y);
      y += 8;
    } else {
      items.forEach((item) => {
        const text = `${item.item} (${item.service}) x ${item.qty}`;
        const amount = currency(item.price * item.qty);
        doc.text(text, margin, y);
        doc.text(amount, pageWidth - margin, y, { align: 'right' });
        y += 7;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    }

    y += 8;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    addField('Pickup charge', currency(order.pickup));
    addField('Total', currency(order.total));
    addField('Payment method', order.paymentMethod || 'N/A');
    addField('Payment status', order.paymentStatus || 'N/A');
    y += 10;

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    if (doc.roundedRect) {
      doc.roundedRect(margin, y, usableWidth, 18, 3, 3, 'F');
    } else {
      doc.rect(margin, y, usableWidth, 18, 'F');
    }
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.text('Thank you for choosing ' + shop.name + '.', margin + 3, y + 6);
    doc.text('Contact +91 79774 11572 for support.', margin + 3, y + 13);

    return doc;
  }

  function openPrintableReceipt(order) {
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt ${order.id}</title>
        <style>
          body { margin: 0; padding: 24px; font-family: Inter, sans-serif; background: #f8fafc; color: #0f172a; }
          .receipt { max-width: 820px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; }
          .header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px; }
          .brand { display: flex; align-items: center; gap: 16px; }
          .brand img { height: 64px; width: auto; object-fit: contain; }
          .title { font-size: 1.65rem; font-weight: 700; margin: 0; }
          .subtitle { margin: 4px 0 0; color: #64748b; font-size: 0.95rem; }
          .status { text-align: right; }
          .status span { display: block; color: #64748b; font-size: 0.9rem; }
          .status strong { display: block; margin-top: 8px; font-size: 1.05rem; color: #111827; }
          .info { display: grid; gap: 10px; margin-bottom: 20px; }
          .info div { display: flex; justify-content: space-between; color: #475569; font-size: 0.95rem; }
          .divider { border-top: 1px solid #e2e8f0; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 10px 0; font-size: 0.95rem; color: #0f172a; }
          .totals { display: grid; gap: 10px; margin-top: 20px; color: #475569; font-size: 0.95rem; }
          .totals div { display: flex; justify-content: space-between; }
          .footer { margin-top: 28px; padding: 18px; background: #f8fafc; border-radius: 10px; color: #475569; font-size: 0.92rem; }
          @media print {
            body { background: #ffffff; }
            .receipt { box-shadow: none; border: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="brand">
              <img src="assets/jagdamblogo.png" alt="Logo" />
              <div>
                <div class="title">${shop.name}</div>
                <div class="subtitle">Laundry & Drycleaners</div>
              </div>
            </div>
            <div class="status">
              <span>Receipt</span>
              <strong>${order.paymentStatus || 'Paid'}</strong>
            </div>
          </div>
          <div class="info">
            <div><span>Order ID</span><strong>${order.id}</strong></div>
            <div><span>Customer</span><strong>${order.customerName}</strong></div>
            <div><span>Phone</span><strong>${order.phone}</strong></div>
            <div><span>Pickup</span><strong>${order.pickupDate}, ${order.timeSlot || ''}</strong></div>
            <div><span>Address</span><strong>${order.address || 'N/A'}</strong></div>
          </div>
          <div class="divider"></div>
          <table>
            ${((order.items || []).length > 0 ? order.items.map(item => `
              <tr>
                <td>${item.item} (${item.service}) x ${item.qty}</td>
                <td style="text-align:right;">${currency(item.price * item.qty)}</td>
              </tr>
            `).join('') : '<tr><td>No items listed</td><td></td></tr>')}
          </table>
          <div class="divider"></div>
          <div class="totals">
            <div><span>Pickup charge</span><strong>${currency(order.pickup)}</strong></div>
            <div><span>Total</span><strong>${currency(order.total)}</strong></div>
            <div><span>Payment method</span><strong>${order.paymentMethod || 'N/A'}</strong></div>
            <div><span>Payment status</span><strong>${order.paymentStatus || 'N/A'}</strong></div>
          </div>
          <div class="footer">Thank you for choosing ${shop.name}. Please keep this receipt for your records. Contact +91 79774 11572 for support.</div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow popups for printing the receipt.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  byId("printReceipt").addEventListener("click", async () => {
    if (!lastOrder) return;

    try {
      const pdf = await generateReceiptPdf(lastOrder);
      pdf.save(`Jagdamablaundryrecepit${lastOrder.id}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      openPrintableReceipt(lastOrder);
    }
  });

  byId("receiptWhatsApp").addEventListener("click", () => {
    if (!lastOrder) return;
    const msg = formatOrderForWhatsApp(lastOrder);
    window.open(buildWhatsAppPhoneLink(shop.inquiryPhone, msg), "_blank", "noopener,noreferrer");
    setTimeout(() => {
      window.location.reload();
    }, 500);
  });

  document.querySelector(".menu-toggle").addEventListener("click", (event) => {
    const nav = document.querySelector(".nav-links");
    nav.classList.toggle("open");
    event.currentTarget.setAttribute("aria-expanded", nav.classList.contains("open"));
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => document.querySelector(".nav-links").classList.remove("open"));
  });

  document.querySelectorAll('.hero-actions a[href="#order"]').forEach((link) => {
    link.addEventListener("click", () => {
      window.setTimeout(playLaundryDrop, 260);
    });
  });

  // Set floating button links (WhatsApp uses the shop link builder)
  const floatCall = byId('floatCall');
  if (floatCall) {
    const cleanPhone = shop.phone.replace(/[\s()]/g, '');
    floatCall.href = `tel:${cleanPhone}`;
  }

  const floatWA = byId('floatWhatsApp');
  if (floatWA) {
    floatWA.href = buildWhatsAppPhoneLink(shop.inquiryPhone, shop.inquiryMessage || quickMessage());
  }

  const floatIG = byId('floatInsta');
  if (floatIG) {
    floatIG.href = 'https://www.instagram.com/jagdamb.laundry?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';
  }

  const floatFB = byId('floatFB');
  if (floatFB) {
    floatFB.href = 'https://www.facebook.com/profile.php?id=61591488686870';
  }

  // Payment modal wiring
  const paymentModal = byId('paymentModal');
  const paymentBackdrop = byId('paymentBackdrop');
  const paymentClose = byId('paymentClose');
  const upiPayBtn = byId('upiPayBtn');
  const upiFallback = byId('upiFallback');
  const qrTimerEl = byId('qrTimer');
  const qrImgEl = byId('qrImg');
  const confirmPaymentModal = byId('confirmPaymentModal');
  const regenerateQr = byId('regenerateQr');

  function closeModal() {
    if (!paymentModal) return;
    paymentModal.setAttribute('aria-hidden', 'true');
  }

  function openModal() {
    if (!paymentModal) return;
    paymentModal.setAttribute('aria-hidden', 'false');
  }

  function buildUPILinkForOrder(order) {
    // UPI deep link: upi://pay?pa=payeeAddress&pn=payeeName&am=amount&cu=INR&tn=note
    const pa = shop.upiId || '';
    const pn = shop.name;
    const am = (order && typeof order.total !== 'undefined') ? Number(order.total).toFixed(2) : Number(totals().total).toFixed(2);
    const tn = `Order-${order ? order.id : Date.now().toString().slice(-6)}`;
    if (!pa) return '#';
    return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${encodeURIComponent(am)}&cu=INR&tn=${encodeURIComponent(tn)}`;
  }

  let qrTimerHandle = null;
  let qrExpiresAt = null;

  function startQrSession(order, minutes = 15) {
    const amount = order.total;
    // Build a UPI URI for the QR content
    const pa = shop.upiId || '';
    const pn = shop.name;
    const upiUri = pa ? `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent(order.id)}` : '';
    // Use Google Chart API to render QR from the URI; fallback to static QR if no pa
    const qrSrc = upiUri ? `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(upiUri)}` : (qrImgEl ? qrImgEl.src : 'assets/QR.jpeg');
    if (qrImgEl) qrImgEl.src = qrSrc;

    // Start timer
    qrExpiresAt = Date.now() + minutes * 60 * 1000;
    if (qrTimerHandle) clearInterval(qrTimerHandle);
    function tick() {
      const diff = Math.max(0, qrExpiresAt - Date.now());
      const mins = Math.floor(diff / 60000).toString().padStart(2, '0');
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      if (qrTimerEl) qrTimerEl.textContent = `${mins}:${secs}`;
      if (diff <= 0) {
        clearInterval(qrTimerHandle);
        qrTimerHandle = null;
        if (qrImgEl) qrImgEl.parentElement.classList.add('expired');
        if (qrTimerEl) qrTimerEl.classList.add('timer-expired');
      }
    }
    tick();
    qrTimerHandle = setInterval(tick, 1000);
  }

  // --- Server-backed payment flow -------------------------------------------------
  async function createRazorpayOrderOnServer(order) {
    try {
      const resp = await fetch(API_BASE + '/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Failed to create Razorpay order');
      }
      return await resp.json();
    } catch (err) {
      console.error(err);
      const msg = err && err.message && /ECONNREFUSED|Failed to fetch|connect ECONNREFUSED/i.test(err.message)
        ? 'Unable to create payment: local server not running. Start it with `npm start` and try again.'
        : `Unable to create payment: ${err.message || 'Try again.'}`;
      toast(msg);
      throw err;
    }
  }

  if (paymentBackdrop) paymentBackdrop.addEventListener('click', closeModal);
  if (paymentClose) paymentClose.addEventListener('click', closeModal);

  // Tab switching
  document.querySelectorAll('.payment-tabs .tab').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      const t = e.currentTarget;
      document.querySelectorAll('.payment-tabs .tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const which = t.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(p => p.hidden = p.dataset.panel !== which);
    });
  });

  if (upiFallback) upiFallback.addEventListener('click', () => {
    // switch to QR tab
    const qrTab = document.querySelector('.payment-tabs .tab[data-tab="qr"]');
    if (qrTab) qrTab.click();
  });

  if (regenerateQr) regenerateQr.addEventListener('click', () => {
    if (!pendingOrder) return;
    startQrSession(pendingOrder, 15);
    if (qrImgEl) qrImgEl.parentElement.classList.remove('expired');
    if (qrTimerEl) qrTimerEl.classList.remove('timer-expired');
  });

  if (upiPayBtn) {
    upiPayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!pendingOrder) return;
      const upiLink = buildUPILinkForOrder(pendingOrder);
      // Try opening the upi:// link. On desktop browsers this will do nothing; still provide QR.
      window.location.href = upiLink;
    });
  }

  if (confirmPaymentModal) confirmPaymentModal.addEventListener('click', () => {
    if (!pendingOrder) return;
    // Simulate verification and mark as paid
    const paid = { ...pendingOrder, paymentStatus: 'Paid' };
    lastOrder = paid;
    pendingOrder = null;
    closeModal();
    showReceipt(paid);
    // open WhatsApp to customer's number with the receipt
    const cust = paid.phone ? paid.phone.replace(/\D/g, '') : '';
    const phone = cust.length === 10 ? `91${cust}` : cust;
    if (phone) {
      const msg = formatOrderForWhatsApp(paid);
      window.open(buildWhatsAppPhoneLink(phone, msg), '_blank', 'noopener,noreferrer');
    }
    toast('Payment confirmed. Receipt sent to WhatsApp (if available).');
  });

  // When showPayment is called, open modal and start QR session
  const origShowPayment = showPayment;
  showPayment = function (order) {
    pendingOrder = order;
    lastOrder = order;
    // Update modal amount
    const amountEl = byId('modalAmount');
    if (amountEl) amountEl.textContent = currency(order.total);
    openModal();
    // prepare UPI link and QR
    if (upiPayBtn) {
      const upiLink = buildUPILinkForOrder(order);
      upiPayBtn.href = upiLink;
      if (!shop.upiId) upiPayBtn.classList.add('disabled');
    }
    if (qrImgEl) {
      qrImgEl.parentElement.classList.remove('expired');
    }
    startQrSession(order, 15);
    // also call original behaviour to keep paymentSection visible as fallback
    origShowPayment(order);
  };

  // --- Order History Modal Wiring ---
  const ordersModal = byId('ordersModal');
  const ordersBackdrop = byId('ordersBackdrop');
  const ordersClose = byId('ordersClose');
  const clearHistoryBtn = byId('clearHistoryBtn');

  function openOrdersModal() {
    if (ordersModal) {
      ordersModal.setAttribute('aria-hidden', 'false');
      loadOrders();
    }
  }

  function closeOrdersModal() {
    if (ordersModal) {
      ordersModal.setAttribute('aria-hidden', 'true');
    }
  }

  const navOrders = byId('navOrders');
  if (navOrders) {
    navOrders.addEventListener('click', (e) => {
      e.preventDefault();
      openOrdersModal();
    });
  }

  if (ordersBackdrop) ordersBackdrop.addEventListener('click', closeOrdersModal);
  if (ordersClose) ordersClose.addEventListener('click', closeOrdersModal);

  const clearHistoryConfirmGroup = byId('clearHistoryConfirmGroup');
  const clearHistoryConfirmBtn = byId('clearHistoryConfirmBtn');
  const clearHistoryCancelBtn = byId('clearHistoryCancelBtn');

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      clearHistoryBtn.style.display = 'none';
      if (clearHistoryConfirmGroup) clearHistoryConfirmGroup.style.display = 'flex';
    });
  }

  if (clearHistoryCancelBtn) {
    clearHistoryCancelBtn.addEventListener('click', () => {
      if (clearHistoryConfirmGroup) clearHistoryConfirmGroup.style.display = 'none';
      clearHistoryBtn.style.display = 'block';
    });
  }

  if (clearHistoryConfirmBtn) {
    clearHistoryConfirmBtn.addEventListener('click', () => {
      localStorage.removeItem('jld_order_history');
      toast("Order history cleared.");
      loadOrders();
    });
  }
}

function setMinDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  byId("pickupDate").min = `${yyyy}-${mm}-${dd}`;
}

renderStores();
renderServices();
renderPricing();
renderSummary();
renderReviews();
setMinDate();
setupEvents();

// Fetch latest services and stores from API (admin panel edits reflect here)
(async function loadFromApi() {
  try {
    const [apiServices, apiStores] = await Promise.all([
      fetch(API_BASE + '/api/services').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(API_BASE + '/api/stores').then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    if (apiServices && apiServices.length) {
      // Keep hardcoded SVG icons, update name/price/desc from DB
      const iconMap = {};
      services.forEach(s => { iconMap[s.name] = s.icon; });
      services = apiServices.map(s => ({
        icon: iconMap[s.name] || services[0]?.icon || '',
        name: s.name,
        desc: s.description || s.desc || '',
        price: s.price,
        unit: s.unit || ''
      }));
      renderServices();
      renderPricing();
    }

    if (apiStores && apiStores.length) {
      stores = apiStores.map(s => ({
        id: s.id,
        name: s.name,
        shortName: s.short_name || s.shortName || '',
        address: s.address || '',
        phone: s.phone || '',
        email: s.email || '',
        mapUrl: s.map_url || s.mapUrl || '',
        status: s.status || 'Open Now'
      }));
      renderStores();
    }
  } catch (e) {
    // API unavailable — hardcoded values are already rendered
    console.warn('Could not fetch from API, using default values:', e.message);
  }
})();

// Clean up old autofill local storage keys if they exist
localStorage.removeItem('jld_customerName');
localStorage.removeItem('jld_phone');
localStorage.removeItem('jld_address');

// --- Order History Modal Flow ----------------------------------------------------
function loadOrders() {
  const container = byId('ordersContainer');
  const clearBtn = byId('clearHistoryBtn');
  const confirmGroup = byId('clearHistoryConfirmGroup');
  if (!container) return;
  if (confirmGroup) confirmGroup.style.display = 'none';
  let history = [];

  try {
    const raw = localStorage.getItem('jld_order_history');
    if (raw) history = JSON.parse(raw);
  } catch (e) {
    console.error("Error reading order history:", e);
  }

  // Sort orders newest first
  history.reverse();

  if (history.length === 0) {
    if (clearBtn) clearBtn.style.display = 'none';
    container.innerHTML = `
      <div class="empty-state">
        <p>You haven't placed any orders yet.</p>
        <a class="btn primary" href="#order" id="bookFirstPickupBtn">Book Your First Pickup</a>
      </div>
    `;
    const bookBtn = byId('bookFirstPickupBtn');
    if (bookBtn) {
      bookBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const ordersModal = byId('ordersModal');
        if (ordersModal) ordersModal.setAttribute('aria-hidden', 'true');
        const orderSection = byId('order');
        if (orderSection) {
          orderSection.scrollIntoView({ behavior: 'smooth' });
          setTimeout(playLaundryDrop, 260);
        }
      });
    }
    return;
  }

  if (clearBtn) clearBtn.style.display = 'block';

  container.innerHTML = history.map((order, idx) => {
    const mapLink = order.location
      ? `<a href="${order.location.mapUrl}" target="_blank" rel="noreferrer">Open maps</a>`
      : "Manual address only";

    const itemsHtml = order.items && order.items.length
      ? `
        <div class="history-item-list">
          <div class="history-item-list-title">Items:</div>
          ${order.items.map(item => `
            <div class="receipt-row" style="margin: 4px 0; font-size: 0.9rem;">
              <span>${item.item} - ${item.service} x ${item.qty}</span>
              <strong>${currency(item.price * item.qty)}</strong>
            </div>
          `).join('')}
        </div>
      `
      : '';

    return `
      <div class="order-history-card">
        <div class="receipt-head" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>Order #${order.id}</strong>
            <span style="display: block; font-size: 0.8rem; color: var(--muted); margin-top: 4px;">
              Booked on ${new Date(order.createdAt || Date.now()).toLocaleDateString()}
            </span>
          </div>
          <b class="receipt-status" style="background: var(--soft); color: var(--blue); padding: 4px 8px; border-radius: 6px; font-size: 0.9rem;">
            ${order.paymentStatus}
          </b>
        </div>

        <div class="receipt-row"><span>Customer</span><strong>${order.customerName}</strong></div>
        <div class="receipt-row"><span>Phone</span><strong>${order.phone}</strong></div>
        <div class="receipt-row"><span>Pickup Details</span><strong>${order.pickupDate}, ${order.timeSlot}</strong></div>
        <div class="receipt-row"><span>Address</span><strong>${order.address}</strong></div>
        <div class="receipt-row"><span>Location</span><strong>${mapLink}</strong></div>

        ${itemsHtml}

        <div class="receipt-row" style="margin-top: 12px; border-top: 1px dashed var(--line); padding-top: 8px;">
          <span>Pickup charge</span>
          <strong>${currency(order.pickup)}</strong>
        </div>
        <div class="receipt-row">
          <span>Total Amount</span>
          <strong style="color: var(--blue); font-size: 1.1rem;">${currency(order.total)}</strong>
        </div>
        <div class="receipt-row"><span>Payment Method</span><strong>${order.paymentMethod}</strong></div>

        <div class="history-actions-row">
          <button class="btn whatsapp" onclick="shareOrder(${idx})">Share on WhatsApp</button>
          <button class="btn outline" onclick="downloadOrderPDF(${idx})">Download PDF</button>
        </div>
      </div>
    `;
  }).join('');

  window.loadedHistory = history;
}

window.shareOrder = function (renderIdx) {
  const order = window.loadedHistory[renderIdx];
  if (!order) return;
  const msg = formatOrderForWhatsApp(order);
  window.open(buildWhatsAppPhoneLink(shop.inquiryPhone, msg), "_blank", "noopener,noreferrer");
};

window.downloadOrderPDF = function (renderIdx) {
  const order = window.loadedHistory[renderIdx];
  if (!order) return;

  const tempDiv = document.createElement('div');
  tempDiv.className = 'receipt-card';
  tempDiv.style.padding = '24px';
  tempDiv.style.background = '#ffffff';
  tempDiv.style.color = '#0f172a';
  tempDiv.style.fontFamily = 'Inter, sans-serif';
  tempDiv.style.width = '600px';

  tempDiv.innerHTML = `
    <div class="receipt-head" style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
      <div>
        <strong style="font-size: 1.2rem; color: #0f172a; font-family: Inter, sans-serif;">${shop.name}</strong>
        <span style="display: block; font-size: 0.8rem; color: #64748b; font-family: Inter, sans-serif;">Payment Receipt</span>
      </div>
      <b style="color: #2563eb; font-size: 1.2rem; font-family: Inter, sans-serif;">${order.paymentStatus}</b>
    </div>
    <div class="receipt-row" style="display: flex; justify-content: space-between; margin: 8px 0; font-family: Inter, sans-serif;"><span>Order ID</span><strong style="color:#0f172a;">${order.id}</strong></div>
    <div class="receipt-row" style="display: flex; justify-content: space-between; margin: 8px 0; font-family: Inter, sans-serif;"><span>Customer</span><strong style="color:#0f172a;">${order.customerName}</strong></div>
    <div class="receipt-row" style="display: flex; justify-content: space-between; margin: 8px 0; font-family: Inter, sans-serif;"><span>Phone</span><strong style="color:#0f172a;">${order.phone}</strong></div>
    <div class="receipt-row" style="display: flex; justify-content: space-between; margin: 8px 0; font-family: Inter, sans-serif;"><span>Pickup</span><strong style="color:#0f172a;">${order.pickupDate}, ${order.timeSlot}</strong></div>
    <div class="receipt-row" style="display: flex; justify-content: space-between; margin: 8px 0; font-family: Inter, sans-serif;"><span>Address</span><strong style="color:#0f172a;">${order.address}</strong></div>

    <div style="background: #eef9ff; border-radius: 8px; padding: 12px; margin: 16px 0; font-family: Inter, sans-serif;">
      <strong style="display: block; margin-bottom: 8px; color: #0f172a;">Items:</strong>
      ${order.items.map(item => `
        <div class="receipt-row" style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 0.9rem;">
          <span>${item.item} - ${item.service} x ${item.qty}</span>
          <strong style="color:#0f172a;">${currency(item.price * item.qty)}</strong>
        </div>
      `).join('')}
    </div>

    <div class="receipt-row" style="display: flex; justify-content: space-between; margin: 8px 0; border-top: 1px dashed #dbe5f0; padding-top: 8px; font-family: Inter, sans-serif;"><span>Pickup charge</span><strong style="color:#0f172a;">${currency(order.pickup)}</strong></div>
    <div class="receipt-row" style="display: flex; justify-content: space-between; margin: 8px 0; font-family: Inter, sans-serif;"><span>Total</span><strong style="color:#0f172a;">${currency(order.total)}</strong></div>
    <div class="receipt-row" style="display: flex; justify-content: space-between; margin: 8px 0; font-family: Inter, sans-serif;"><span>Payment method</span><strong style="color:#0f172a;">${order.paymentMethod}</strong></div>
    <p style="text-align: center; color: #64748b; margin-top: 24px; font-size: 0.9rem; font-family: Inter, sans-serif;">Thank you for choosing ${shop.name}.</p>
  `;

  document.body.appendChild(tempDiv);

  const opt = {
    margin: 10,
    filename: `Jagdamablaundryrecepit${order.id}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(tempDiv).save().then(() => {
    document.body.removeChild(tempDiv);
  }).catch(err => {
    console.error("PDF download error:", err);
    document.body.removeChild(tempDiv);
  });
};

// --- Delivery Slot Booking Flow ---
(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  const orderId = urlParams.get('order_id');

  if (action === 'schedule-delivery' && orderId) {
    // Wait a brief moment to let other API data load before triggering modal
    setTimeout(() => {
      initDeliveryBooking(orderId);
    }, 500);
  }

  async function initDeliveryBooking(orderId) {
    const modal = byId('deliveryModal');
    if (!modal) return;

    try {
      const resp = await fetch(API_BASE + `/api/public/orders/${orderId}`);
      if (!resp.ok) {
        throw new Error('Order not found or invalid ID');
      }
      const order = await resp.json();

      // Populate form
      byId('deliveryOrderId').value = order.id;
      byId('deliveryCustomerName').value = order.customer_name;
      byId('deliveryPhone').value = order.phone;
      byId('deliveryAddress').value = order.address;

      // Set min date for delivery to today
      const today = new Date().toISOString().split('T')[0];
      const deliveryDateEl = byId('deliveryDate');
      if (deliveryDateEl) {
        deliveryDateEl.min = today;
        deliveryDateEl.value = order.delivery_date || today;
      }

      const deliveryTimeSlotEl = byId('deliveryTimeSlot');
      if (deliveryTimeSlotEl && order.delivery_time_slot) {
        deliveryTimeSlotEl.value = order.delivery_time_slot;
      }

      // Show modal
      modal.setAttribute('aria-hidden', 'false');
    } catch (err) {
      console.error(err);
      toast('Could not load order details for scheduling: ' + err.message);
    }
  }

  const deliveryClose = byId('deliveryClose');
  const deliveryBackdrop = byId('deliveryBackdrop');
  if (deliveryClose) {
    deliveryClose.addEventListener('click', () => {
      byId('deliveryModal').setAttribute('aria-hidden', 'true');
    });
  }
  if (deliveryBackdrop) {
    deliveryBackdrop.addEventListener('click', () => {
      byId('deliveryModal').setAttribute('aria-hidden', 'true');
    });
  }

  const deliveryForm = byId('deliveryForm');
  if (deliveryForm) {
    deliveryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = byId('deliveryOrderId').value;
      const delivery_date = byId('deliveryDate').value;
      const delivery_time_slot = byId('deliveryTimeSlot').value;

      try {
        const resp = await fetch(API_BASE + `/api/public/orders/${id}/schedule-delivery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delivery_date, delivery_time_slot })
        });

        if (!resp.ok) {
          const errData = await resp.json();
          throw new Error(errData.error || 'Failed to book slot');
        }

        toast('🎉 Delivery slot booked successfully! You will receive a WhatsApp confirmation shortly.');
        byId('deliveryModal').setAttribute('aria-hidden', 'true');
      } catch (err) {
        console.error(err);
        toast('Error: ' + err.message);
      }
    });
  }
})();
