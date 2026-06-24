const shop = {
  name: "Jagdamb Laundry & Drycleaners",
  phone: "+91 98216 75395",
  // Can be a phone number (e.g. "919876543210") or a direct URL (e.g. "https://wa.link/xyz")
  whatsapp: "https://wa.link/ag0klr",
  // Inquiry contact (explicit api.whatsapp.com link should use this phone)
  inquiryPhone: "919821675395",
  inquiryMessage: "Hi Jagdamb Laundry & Drycleaners, could you please provide more details on your services and turnaround time? Thanks!",
  address: "Shop 12, Main Market Road, Your City",
  // pickupCharge is now free for customers; keep original for display as struck-through
  pickupCharge: 0,
  originalPickupCharge: 49,
  // UPI ID for the shop - used to prefill UPI app payment
  upiId: 'gawadeprasad03-2@okaxis',
};

const services = [
  { icon: "W", name: "Wash & Fold", desc: "Daily wear cleaned, folded and packed.", price: 70, unit: "/kg" },
  { icon: "I", name: "Wash & Iron", desc: "Fresh wash with crisp ironing.", price: 90, unit: "/kg" },
  { icon: "D", name: "Dry Cleaning", desc: "Premium care for suits, sarees and delicate clothes.", price: 60 },
  { icon: "S", name: "Saree Ironing", desc: "Sharp finish for office and occasion wear.", price: 60 },
  { icon: "B", name: "Bedsheet Cleaning", desc: "Bedsheets, covers and blankets handled with care.", price: 100 },
  { icon: "P", name: "Shoes Cleaning", desc: "Special handling for designer garments.", price: 200 },
  { icon: "C", name: "Curtain Cleaning", desc: "Deep cleaning for home curtains.", price: 100 },
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

function formatDateForWhatsApp(isoDate) {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch (e) {
    return isoDate;
  }
}

function formatOrderForWhatsApp(order) {
  const lines = [];
  lines.push(`Order ID: ${order.id}`);
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

function quickMessage() {
  return `Hello ${shop.name}, I want to book a laundry pickup.`;
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
    itemSelectEl.innerHTML = priceItems
      .map((row, index) => `<option value="${index}">${row.item} - ${row.service} (${currency(row.price)})</option>`)
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
  return {
    id: lastOrder?.id || `FF-${Date.now().toString().slice(-6)}`,
    customerName: data.get("customerName")?.trim(),
    phone: data.get("phone")?.trim(),
    address: data.get("address")?.trim(),
    pickupDate: data.get("pickupDate"),
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
  return `New Laundry Order - ${shop.name}
Order ID: ${order.id}
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

function showReceipt(order) {
  const receiptBody = byId("receiptBody");
  const mapLink = order.location
    ? `<a href="${order.location.mapUrl}" target="_blank" rel="noreferrer">Open pickup location</a>`
    : "Manual address only";

  receiptBody.innerHTML = `
    <div class="receipt-row"><span>Order ID</span><strong>${order.id}</strong></div>
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
      const item = Number.isFinite(idx) ? priceItems[idx] : undefined;
      if (!item) {
        toast("No priced items available to add.");
        return;
      }
      addItem(item, byId("itemQty").value);
    });
  }

  byId("summaryItems").addEventListener("click", (event) => {
    const button = event.target.closest(".remove-item");
    if (!button) return;
    cart.splice(Number(button.dataset.index), 1);
    renderSummary();
  });

  ["customerName", "timeSlot", "pickupDate", "paymentMethod"].forEach((id) => {
    byId(id).addEventListener("input", renderSummary);
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
          // create payment on backend which in turn calls provider
          const payload = await createPaymentOnServer(order);
          // payload: { orderId, qrUrl, expiresAt }
          pendingOrder = order;
          pendingOrder.id = payload.orderId || pendingOrder.id;
          // update modal and UI
          const amountEl = byId('modalAmount');
          if (amountEl) amountEl.textContent = currency(order.total);
          openModal();
          startServerQrSession(payload.orderId, payload.qrUrl, payload.expiresAt);
          // ensure paymentSection visible as fallback
          origShowPayment(order);
          // start polling for status
          startPaymentPolling(payload.orderId, () => {
            // on success
            stopPaymentPolling();
            if (pendingOrder) {
              pendingOrder.paymentStatus = 'Paid';
            }
            closeModal();
            completeOrder('Paid');
          });
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

  byId("printReceipt").addEventListener("click", () => window.print());

  byId("receiptWhatsApp").addEventListener("click", () => {
    if (!lastOrder) return;
    const msg = formatOrderForWhatsApp(lastOrder);
    window.open(buildWhatsAppPhoneLink(shop.inquiryPhone, msg), "_blank", "noopener,noreferrer");
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
  const floatWA = byId('floatWhatsApp');
  if (floatWA) {
    floatWA.href = buildWhatsAppPhoneLink(shop.inquiryPhone, shop.inquiryMessage || quickMessage());
  }

  const floatIG = byId('floatInsta');
  if (floatIG) {
    floatIG.href = 'https://www.instagram.com/jagdamb.laundry?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';
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
  let serverPollHandle = null;

  async function createPaymentOnServer(order) {
    try {
      const resp = await fetch(API_BASE + '/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!resp.ok) throw new Error('Failed to create payment');
      return await resp.json();
    } catch (err) {
      console.error(err);
      // Provide more actionable guidance when the local payment server is unreachable
      const msg = err && err.message && /ECONNREFUSED|Failed to fetch|connect ECONNREFUSED/i.test(err.message)
        ? 'Unable to create payment: local payment server not running. Start it with `npm start` and try again.'
        : 'Unable to create payment. Try again.';
      toast(msg);
      throw err;
    }
  }

  function startServerQrSession(orderId, qrUrl, expiresAtMs) {
    // Use returned QR URL and expiry timestamp from server
    if (qrImgEl) {
      qrImgEl.src = qrUrl;
      qrImgEl.parentElement.classList.remove('expired');
    }
    if (qrTimerEl) qrTimerEl.classList.remove('timer-expired');

    qrExpiresAt = expiresAtMs;
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
        stopPaymentPolling();
        toast('QR expired. Please regenerate.');
      }
    }
    tick();
    qrTimerHandle = setInterval(tick, 1000);
  }

  function stopPaymentPolling() {
    if (serverPollHandle) clearInterval(serverPollHandle);
    serverPollHandle = null;
  }

  function startPaymentPolling(orderId, onSuccess) {
    stopPaymentPolling();
    serverPollHandle = setInterval(async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/payment-status/${encodeURIComponent(orderId)}`);
        if (!resp.ok) return;
        const data = await resp.json();
        if (data && data.status === 'Paid') {
          stopPaymentPolling();
          // fetch latest order from pendingOrder and mark paid
          if (pendingOrder) {
            pendingOrder.paymentStatus = 'Paid';
          }
          if (typeof onSuccess === 'function') onSuccess(data);
        }
      } catch (e) {
        console.error('poll err', e);
      }
    }, 4500);
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
}

function setMinDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  byId("pickupDate").min = `${yyyy}-${mm}-${dd}`;
}

renderServices();
renderPricing();
renderSummary();
renderReviews();
setMinDate();
setupEvents();
