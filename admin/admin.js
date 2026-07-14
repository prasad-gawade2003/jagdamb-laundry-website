/* ═══════════════════════════════════════════════════════════════════════════
   Jagdamb Laundry — Admin Panel JavaScript
   ═══════════════════════════════════════════════════════════════════════════ */

const API_BASE = (location.protocol === 'file:' || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') && location.port !== '3000'))
  ? 'http://localhost:3000'
  : '';
const token = localStorage.getItem('jld_admin_token');
const adminUser = JSON.parse(localStorage.getItem('jld_admin_user') || '{}');

// Redirect if not logged in
if (!token) { window.location.href = 'index.html'; }

const $ = (id) => document.getElementById(id);
const currency = (amt) => `Rs ${Number(amt || 0).toLocaleString('en-IN')}`;
function formatDateTime(value) {
  const date = new Date(value);
  if (isNaN(date)) return value || '';
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}
function formatPickupDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (!isNaN(date)) {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return value;
}

// ── API Helper ──────────────────────────────────────────────────────────────

async function api(path, options = {}) {
  const resp = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (resp.status === 401) {
    localStorage.removeItem('jld_admin_token');
    localStorage.removeItem('jld_admin_user');
    window.location.href = 'index.html';
    return;
  }
  return resp.json();
}

// ── Toast ────────────────────────────────────────────────────────────────────

function toast(msg) {
  const t = $('adminToast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Supabase Realtime ────────────────────────────────────────────────────────

let supabaseClient = null;

async function setupRealtime() {
  try {
    const resp = await fetch(API_BASE + '/api/config');
    const config = await resp.json();
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      console.log('Supabase credentials not configured. Skipping Realtime updates.');
      return;
    }

    // Initialize Supabase Client
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

    // Subscribe to public.orders table inserts and updates
    supabaseClient.channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Received Realtime Order Change:', payload);

        let title = 'Order Update';
        if (payload.eventType === 'INSERT') {
          title = 'New Order Placed! 🔔';
        } else if (payload.eventType === 'UPDATE') {
          title = `Order Status: ${payload.new.order_status}`;
        }
        
        toast(`${title} (Order #${payload.new.order_number || payload.new.id})`);

        // Dynamic refresh
        const activeSection = document.querySelector('.nav-item.active');
        if (activeSection) {
          const section = activeSection.dataset.section;
          if (section === 'overview') loadOverview();
          if (section === 'orders') loadOrders();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to Supabase Realtime.');
        } else {
          console.log('Realtime subscription status:', status);
        }
      });
  } catch (err) {
    console.error('Error during Supabase Realtime setup:', err);
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────

function init() {
  // Set admin info
  $('adminName').textContent = adminUser.displayName || 'Admin';
  $('adminStore').textContent = adminUser.storeId ? adminUser.storeId.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All Stores';
  $('adminAvatar').textContent = (adminUser.displayName || 'A')[0].toUpperCase();
  $('sidebarRole').textContent = adminUser.role === 'superadmin' ? 'Super Admin' : 'Store Admin';

  // Date
  const today = new Date();
  $('todayDate').textContent = today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Navigation
  setupNav();
  setupLogout();
  setupMobile();

  // Load overview first
  loadOverview();
  updateMobileHeader('overview');
  loadStoreFilters();

  // Setup live updates via Supabase
  setupRealtime();

  // Polling for new orders every 30s (backup fallback)
  setInterval(() => {
    const activeSection = document.querySelector('.nav-item.active');
    if (activeSection) {
      const section = activeSection.dataset.section;
      if (section === 'overview') loadOverview();
      if (section === 'orders') loadOrders();
    }
  }, 30000);
}

// ── Navigation ───────────────────────────────────────────────────────────────

function updateMobileHeader(section) {
  const mobileHeaderTitle = document.querySelector('.mobile-header h2');
  if (mobileHeaderTitle) {
    const titles = {
      overview: 'Overview',
      orders: 'Orders',
      customers: 'Customers',
      services: 'Services & Pricing',
      stores: 'Stores',
      payments: 'Payments',
      reports: 'Reports',
      settings: 'Settings'
    };
    const storePrefix = adminUser.storeId ? adminUser.storeId.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
    const sectionTitle = titles[section] || 'JLD Admin';
    mobileHeaderTitle.textContent = storePrefix ? `${storePrefix} - ${sectionTitle}` : sectionTitle;
  }
}

function setupNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
      $(`sec-${section}`).classList.add('active');

      // Update mobile header title dynamically
      updateMobileHeader(section);

      // Close mobile sidebar
      $('sidebar').classList.remove('open');

      // Load section data
      switch (section) {
        case 'overview': loadOverview(); break;
        case 'orders': loadOrders(); break;
        case 'customers': loadCustomers(); break;
        case 'services': loadServices(); break;
        case 'stores': loadStoresAdmin(); break;
        case 'payments': loadPayments(); break;
        case 'reports': loadReports(); break;
        case 'settings': loadSettings(); break;
      }
    });
  });
}

function setupLogout() {
  const logout = () => {
    localStorage.removeItem('jld_admin_token');
    localStorage.removeItem('jld_admin_user');
    window.location.href = 'index.html';
  };
  $('logoutBtn').addEventListener('click', logout);
  $('logoutBtnMobile').addEventListener('click', logout);
}

function setupMobile() {
  $('menuToggle').addEventListener('click', () => {
    $('sidebar').classList.toggle('open');
  });
}

// ── Store Filters ────────────────────────────────────────────────────────────

async function loadStoreFilters() {
  try {
    const stores = await api('/api/admin/stores');
    const filterStore = $('filterStore');
    if (filterStore) {
      filterStore.innerHTML = '<option value="">All Stores</option>' +
        stores.map(s => `<option value="${s.id}">${s.short_name || s.name}</option>`).join('');
    }
    const newAdminStore = $('newAdminStore');
    if (newAdminStore) {
      newAdminStore.innerHTML = '<option value="">All Stores (Super Admin)</option>' +
        stores.map(s => `<option value="${s.id}">${s.short_name || s.name}</option>`).join('');
    }
  } catch (e) { console.error(e); }
}

// ══════════════════════════════════════════════════════════════════════════════
// OVERVIEW SECTION
// ══════════════════════════════════════════════════════════════════════════════

async function loadOverview() {
  try {
    const data = await api('/api/admin/reports/summary');

    // Stats cards
    $('statsGrid').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
        </div>
        <div class="stat-value">${data.totalOrders}</div>
        <div class="stat-label">Total Orders</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
        <div class="stat-value">${currency(data.totalRevenue)}</div>
        <div class="stat-label">Total Revenue</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon cyan">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
        </div>
        <div class="stat-value">${data.todayOrders}</div>
        <div class="stat-label">Today's Orders</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
        <div class="stat-value">${currency(data.todayRevenue)}</div>
        <div class="stat-label">Today's Revenue</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        </div>
        <div class="stat-value">${data.pendingOrders}</div>
        <div class="stat-label">Pending Orders</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon pink">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <div class="stat-value">${data.totalCustomers}</div>
        <div class="stat-label">Total Customers</div>
      </div>
    `;

    // Update badge to show unpaid / pending payment orders
    const pendingPaymentsCount = data.pendingPaymentOrders ??
      (data.byPaymentStatus ? data.byPaymentStatus.filter(s => String(s.payment_status).trim().toLowerCase() !== 'paid').reduce((sum, item) => sum + item.count, 0) : 0);
    const badge = $('ordersBadge');
    if (pendingPaymentsCount > 0) {
      badge.textContent = pendingPaymentsCount;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }

    // Revenue chart
    drawRevenueChart(data.dailyRevenue);

    // Recent orders
    const orders = await api('/api/admin/orders?limit=5');
    $('recentOrders').innerHTML = orders.length ? orders.map(o => `
      <div class="recent-order-item">
        <div class="recent-order-info">
          <strong>${o.customer_name}</strong>
          <small>${o.id} · ${formatDateTime(o.created_at)}</small>
        </div>
        <span class="status-badge ${getStatusClass(o.order_status)}">${o.order_status}</span>
        <span class="recent-order-amount">${currency(o.total)}</span>
      </div>
    `).join('') : '<p style="color:var(--text-dim);font-size:0.85rem;">No orders yet</p>';

    // Top services
    $('topServices').innerHTML = data.topServices.length ? data.topServices.map((s, i) => {
      const maxQty = data.topServices[0].total_qty || 1;
      const colors = ['blue', 'green', 'accent', 'yellow', 'pink', 'orange', 'cyan', 'red'];
      return `
        <div class="bar-chart-row">
          <span class="bar-chart-label">${s.item_name}</span>
          <div class="bar-chart-bar">
            <div class="bar-chart-fill ${colors[i % colors.length]}" style="width:${(s.total_qty / maxQty * 100)}%"></div>
          </div>
          <span class="bar-chart-value">${s.total_qty}</span>
        </div>
      `;
    }).join('') : '<p style="color:var(--text-dim);font-size:0.85rem;">No data yet</p>';

    // Status breakdown
    $('statusBreakdown').innerHTML = data.byStatus.length ? data.byStatus.map((s, i) => {
      const maxCount = Math.max(...data.byStatus.map(x => x.count));
      const colors = ['blue', 'cyan', 'yellow', 'green', 'accent', 'pink', 'red'];
      return `
        <div class="bar-chart-row">
          <span class="bar-chart-label">${s.order_status}</span>
          <div class="bar-chart-bar">
            <div class="bar-chart-fill ${colors[i % colors.length]}" style="width:${(s.count / maxCount * 100)}%"></div>
          </div>
          <span class="bar-chart-value">${s.count}</span>
        </div>
      `;
    }).join('') : '<p style="color:var(--text-dim);font-size:0.85rem;">No data yet</p>';

  } catch (e) {
    console.error('Error loading overview:', e);
  }
}

// ── Revenue Chart (Canvas) ───────────────────────────────────────────────────

function drawRevenueChart(data) {
  const canvas = $('revenueChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);

  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  const pad = { top: 20, right: 20, bottom: 40, left: 60 };

  ctx.clearRect(0, 0, w, h);

  if (!data || data.length === 0) {
    ctx.fillStyle = '#4a5578';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No revenue data yet', w / 2, h / 2);
    return;
  }

  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#4a5578';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(currency(Math.round(maxVal - (maxVal / 4) * i)), pad.left - 8, y + 4);
  }

  // Bars
  const barW = Math.min(40, (chartW / data.length) * 0.6);
  const gap = chartW / data.length;

  data.forEach((d, i) => {
    const barH = (d.revenue / maxVal) * chartH;
    const x = pad.left + gap * i + (gap - barW) / 2;
    const y = pad.top + chartH - barH;

    // Bar gradient
    const grad = ctx.createLinearGradient(x, y, x, y + barH);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(1, '#818cf8');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();

    // Date label
    ctx.fillStyle = '#7c8db5';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    const dateStr = d.date.slice(5); // MM-DD
    ctx.fillText(dateStr, x + barW / 2, h - pad.bottom + 16);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// ORDERS SECTION
// ══════════════════════════════════════════════════════════════════════════════

let ordersData = [];

async function loadOrders() {
  try {
    const params = new URLSearchParams();
    const search = $('orderSearch')?.value;
    const status = $('filterStatus')?.value;
    const payment = $('filterPayment')?.value;
    const store = $('filterStore')?.value;

    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (payment) params.set('payment_status', payment);
    if (store) params.set('store_id', store);

    ordersData = await api(`/api/admin/orders?${params.toString()}`);
    renderOrdersTable(ordersData);
  } catch (e) {
    console.error('Error loading orders:', e);
  }
}

function renderOrdersTable(orders) {
  const body = $('ordersBody');
  const empty = $('ordersEmpty');

  if (!orders.length) {
    body.innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  body.innerHTML = orders.map(o => `
    <tr>
      <td><span class="order-id" onclick="showOrderDetail('${o.id}')">${o.id}</span></td>
      <td>${o.customer_name}</td>
      <td>${o.phone}</td>
      <td>${o.store_name || '—'}</td>
      <td>${o.items ? o.items.length + ' items' : '0'}</td>
      <td><strong>${currency(o.total)}</strong></td>
      <td><span class="status-badge ${getPaymentClass(o.payment_status)}">${o.payment_status}</span></td>
      <td>
        <select class="status-select" onchange="changeOrderStatus('${o.id}', this.value)">
          ${['New','Picked Up','In Process','Ready','Delivered','Completed','Cancelled'].map(s =>
            `<option value="${s}" ${o.order_status === s ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </td>
      <td><small>${formatDateTime(o.created_at)}</small></td>
      <td>
        <div class="action-btns">
          <button class="btn-outline" onclick="showOrderDetail('${o.id}')" title="View">👁</button>
          <button class="btn-whatsapp" onclick="whatsappOrder('${o.id}')" title="WhatsApp">💬</button>
          <button class="btn-danger" onclick="deleteOrderAdmin('${o.id}')" title="Delete">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Order filters
['orderSearch', 'filterStatus', 'filterPayment', 'filterStore'].forEach(id => {
  const el = $(id);
  if (el) {
    el.addEventListener(id === 'orderSearch' ? 'input' : 'change', debounce(loadOrders, 300));
  }
});

$('refreshOrders')?.addEventListener('click', loadOrders);

// Change order status
window.changeOrderStatus = async function(id, status) {
  await api(`/api/admin/orders/${id}/status`, { method: 'PUT', body: { order_status: status } });
  toast(`Order ${id} → ${status}`);
};

// Delete order
window.deleteOrderAdmin = async function(id) {
  if (!confirm(`Delete order ${id}? This cannot be undone.`)) return;
  await api(`/api/admin/orders/${id}`, { method: 'DELETE' });
  toast('Order deleted');
  loadOrders();
};

// WhatsApp order
window.whatsappOrder = function(id) {
  const order = ordersData.find(o => o.id === id);
  if (!order) return;
  const phone = order.phone.replace(/\D/g, '');
  const fullPhone = phone.length === 10 ? `91${phone}` : phone;
  const msg = `Hi ${order.customer_name}! Your order #${order.id} status: *${order.order_status}*\nTotal: ${currency(order.total)}\n\n— Jagdamb Laundry`;
  window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(msg)}`, '_blank');
};

// Send completed notification via backend (WAHA / Cloud API)
window.sendCompletedNotification = async function(id) {
  try {
    const res = await api(`/api/admin/orders/${id}/send-completed-notification`, { method: 'POST' });
    if (res.success) {
      toast('Completed notification sent successfully!');
    } else {
      toast('Failed to send completed notification: ' + (res.error || 'Unknown error'));
    }
  } catch (err) {
    console.error(err);
    toast('Error sending notification.');
  }
};

// Order detail modal
window.showOrderDetail = async function(id) {
  try {
    const order = await api(`/api/admin/orders/${id}`);
    const modal = $('orderModal');

    const mapLink = order.location_map_url
      ? `<a href="${order.location_map_url}" target="_blank" rel="noreferrer" style="color:var(--accent);">Open Map</a>`
      : 'Manual address';

    $('orderModalContent').innerHTML = `
      <div class="order-detail-header">
        <div>
          <h2>Order #${order.id}</h2>
          <div class="date">${formatDateTime(order.created_at)}</div>

      <div class="order-detail-grid">
        <div class="detail-item"><label>Customer</label><span>${order.customer_name}</span></div>
        <div class="detail-item"><label>Phone</label><span>${order.phone}</span></div>
        <div class="detail-item"><label>Store</label><span>${order.store_name || '—'}</span></div>
        <div class="detail-item"><label>Pickup Date</label><span>${order.pickup_date ? `${formatPickupDate(order.pickup_date)}, ${order.time_slot}` : order.time_slot}</span></div>
        <div class="detail-item"><label>Delivery Scheduled</label><span style="font-weight:bold;color:var(--accent);">${order.delivery_date ? `${formatPickupDate(order.delivery_date)}, ${order.delivery_time_slot}` : 'Not scheduled yet'}</span></div>
        <div class="detail-item"><label>Address</label><span>${order.address}</span></div>
        <div class="detail-item"><label>Location</label><span>${mapLink}</span></div>
        <div class="detail-item"><label>Payment Method</label><span>${order.payment_method}</span></div>
        <div class="detail-item"><label>Payment Status</label><span class="status-badge ${getPaymentClass(order.payment_status)}">${order.payment_status}</span></div>
      </div>

      <div class="order-items-list">
        <h4>Order Items</h4>
        ${(order.items || []).map(item => `
          <div class="order-item-row">
            <span>${item.item_name} (${item.service}) × ${item.qty}</span>
            <strong>${currency(item.price * item.qty)}</strong>
          </div>
        `).join('') || '<p style="color:var(--text-dim);">No items</p>'}
        <div class="order-item-row">
          <span>Pickup charge</span>
          <span>${currency(order.pickup_charge)}</span>
        </div>
        <div class="order-total-row">
          <span>Total</span>
          <span style="color:var(--green);">${currency(order.total)}</span>
        </div>
      </div>

      <div class="order-notes-section">
        <label style="font-size:0.8rem;font-weight:600;color:var(--text-muted);margin-bottom:6px;display:block;">Internal Notes</label>
        <textarea id="orderNotesInput" placeholder="Add notes about this order...">${order.notes || ''}</textarea>
        <button class="btn-primary btn-sm" style="margin-top:8px;" onclick="saveOrderNotes('${order.id}')">Save Notes</button>
      </div>

      <div class="order-detail-actions">
        <select class="status-select" id="detailStatusSelect">
          ${['New','Picked Up','In Process','Ready','Delivered','Completed','Cancelled'].map(s =>
            `<option value="${s}" ${order.order_status === s ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>
        <button class="btn-primary btn-sm" onclick="updateDetailStatus('${order.id}')">Update Status</button>
        <button class="btn-whatsapp" onclick="whatsappOrder('${order.id}')">WhatsApp Customer</button>
        ${order.order_status === 'Completed' ? `<button class="btn-whatsapp" onclick="sendCompletedNotification('${order.id}')" title="Send automatic notification from business account">Notify Completed (WhatsApp)</button>` : ''}
        ${order.payment_status !== 'Paid' ? `<button class="btn-outline" onclick="markPaid('${order.id}')">Mark Paid</button>` : ''}
      </div>
    `;

    modal.setAttribute('aria-hidden', 'false');
  } catch (e) {
    console.error(e);
    toast('Failed to load order details');
  }
};

window.saveOrderNotes = async function(id) {
  const notes = $('orderNotesInput')?.value || '';
  await api(`/api/admin/orders/${id}/notes`, { method: 'PUT', body: { notes } });
  toast('Notes saved');
};

window.updateDetailStatus = async function(id) {
  const status = $('detailStatusSelect')?.value;
  await api(`/api/admin/orders/${id}/status`, { method: 'PUT', body: { order_status: status } });
  toast(`Status updated to ${status}`);
  $('orderModal').setAttribute('aria-hidden', 'true');
  loadOrders();
};

window.markPaid = async function(id) {
  await api(`/api/admin/orders/${id}/payment`, { method: 'PUT', body: { payment_status: 'Paid' } });
  toast('Marked as Paid');
  $('orderModal').setAttribute('aria-hidden', 'true');
  loadOrders();
};

// Modal close
$('orderModalBackdrop')?.addEventListener('click', () => $('orderModal').setAttribute('aria-hidden', 'true'));
$('orderModalClose')?.addEventListener('click', () => $('orderModal').setAttribute('aria-hidden', 'true'));
$('formModalBackdrop')?.addEventListener('click', () => $('formModal').setAttribute('aria-hidden', 'true'));
$('formModalClose')?.addEventListener('click', () => $('formModal').setAttribute('aria-hidden', 'true'));

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOMERS SECTION
// ══════════════════════════════════════════════════════════════════════════════

let customersData = [];

async function loadCustomers() {
  try {
    customersData = await api('/api/admin/customers');
    renderCustomersTable(customersData);
  } catch (e) { console.error(e); }
}

function renderCustomersTable(customers) {
  const search = $('customerSearch')?.value?.toLowerCase() || '';
  const filtered = search
    ? customers.filter(c => c.customer_name.toLowerCase().includes(search) || c.phone.includes(search))
    : customers;

  $('customersEmpty').hidden = filtered.length > 0;
  $('customersBody').innerHTML = filtered.map(c => `
    <tr>
      <td><strong>${c.customer_name}</strong></td>
      <td>${c.phone}</td>
      <td><span class="status-badge ${c.order_count >= 3 ? 'paid' : 'pending'}">${c.order_count} orders</span></td>
      <td><strong>${currency(c.total_spent)}</strong></td>
      <td><small>${formatDateTime(c.last_order_date)}</small></td>
      <td>
        <div class="action-btns">
          <button class="btn-whatsapp" onclick="whatsappCustomer('${c.phone}', '${c.customer_name}')" title="WhatsApp">💬</button>
          <button class="btn-outline" onclick="viewCustomerOrders('${c.phone}')" title="Orders">📋</button>
        </div>
      </td>
    </tr>
  `).join('');
}

$('customerSearch')?.addEventListener('input', debounce(() => renderCustomersTable(customersData), 300));

window.whatsappCustomer = function(phone, name) {
  const cleanPhone = phone.replace(/\D/g, '');
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const msg = `Hi ${name}! This is Jagdamb Laundry. Thank you for being a valued customer!`;
  window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(msg)}`, '_blank');
};

window.viewCustomerOrders = async function(phone) {
  const orders = await api(`/api/admin/customers/${phone}/orders`);
  // Navigate to orders section with search filter
  $('orderSearch').value = phone;
  document.querySelector('.nav-item[data-section="orders"]').click();
};

// ══════════════════════════════════════════════════════════════════════════════
// SERVICES SECTION
// ══════════════════════════════════════════════════════════════════════════════

let servicesData = [];

async function loadServices() {
  try {
    servicesData = await api('/api/admin/services');
    renderServicesGrid(servicesData);
  } catch (e) { console.error(e); }
}

function renderServicesGrid(services) {
  $('servicesGrid').innerHTML = services.map(s => `
    <div class="service-admin-card">
      <h4>${s.name}</h4>
      <p class="service-desc">${s.description}</p>
      <div class="service-price">Rs ${s.price}${s.unit ? ` <small>${s.unit}</small>` : ''}</div>
      <span class="service-status ${s.active ? 'active' : 'inactive'}">${s.active ? 'Active' : 'Inactive'}</span>
      <div class="card-actions">
        <button class="btn-outline" onclick="editService(${s.id})">Edit</button>
        <button class="btn-outline" onclick="toggleService(${s.id}, ${s.active ? 0 : 1})">${s.active ? 'Disable' : 'Enable'}</button>
        <button class="btn-danger" onclick="deleteServiceAdmin(${s.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

$('addServiceBtn')?.addEventListener('click', () => showServiceForm());

function showServiceForm(service = null) {
  $('formModalTitle').textContent = service ? 'Edit Service' : 'Add New Service';
  $('formModalContent').innerHTML = `
    <form id="serviceFormInner">
      <div class="form-group">
        <label>Service Name</label>
        <input type="text" id="sfName" required value="${service?.name || ''}" />
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="sfDesc" rows="2">${service?.description || ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Price (Rs)</label>
          <input type="number" id="sfPrice" min="0" required value="${service?.price || 0}" />
        </div>
        <div class="form-group">
          <label>Unit (e.g., /kg)</label>
          <input type="text" id="sfUnit" value="${service?.unit || ''}" />
        </div>
      </div>
      <button type="submit" class="btn-primary">${service ? 'Update' : 'Create'} Service</button>
    </form>
  `;
  $('formModal').setAttribute('aria-hidden', 'false');

  $('serviceFormInner').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      name: $('sfName').value,
      description: $('sfDesc').value,
      price: parseFloat($('sfPrice').value),
      unit: $('sfUnit').value
    };
    if (service) {
      await api(`/api/admin/services/${service.id}`, { method: 'PUT', body });
    } else {
      await api('/api/admin/services', { method: 'POST', body });
    }
    $('formModal').setAttribute('aria-hidden', 'true');
    toast(service ? 'Service updated' : 'Service created');
    loadServices();
  });
}

window.editService = function(id) {
  const service = servicesData.find(s => s.id === id);
  if (service) showServiceForm(service);
};

window.toggleService = async function(id, active) {
  const service = servicesData.find(s => s.id === id);
  if (!service) return;
  await api(`/api/admin/services/${id}`, { method: 'PUT', body: { ...service, active } });
  toast(active ? 'Service enabled' : 'Service disabled');
  loadServices();
};

window.deleteServiceAdmin = async function(id) {
  if (!confirm('Delete this service?')) return;
  await api(`/api/admin/services/${id}`, { method: 'DELETE' });
  toast('Service deleted');
  loadServices();
};

// ══════════════════════════════════════════════════════════════════════════════
// STORES SECTION
// ══════════════════════════════════════════════════════════════════════════════

let storesData = [];

async function loadStoresAdmin() {
  try {
    storesData = await api('/api/admin/stores');
    renderStoresAdmin(storesData);
  } catch (e) { console.error(e); }
}

function renderStoresAdmin(stores) {
  $('storesAdminGrid').innerHTML = stores.map(s => `
    <div class="store-admin-card">
      <h4>${s.name}</h4>
      <span class="status-badge ${s.status === 'Open Now' ? 'paid' : 'cancelled'}">${s.status}</span>
      <div class="store-detail"><strong>Address</strong>${s.address}</div>
      <div class="store-detail"><strong>Phone</strong>${s.phone}</div>
      <div class="store-detail"><strong>Email</strong>${s.email}</div>
      <div class="card-actions">
        <button class="btn-outline" onclick="editStore('${s.id}')">Edit</button>
        <button class="btn-outline" onclick="toggleStoreStatus('${s.id}', '${s.status === 'Open Now' ? 'Closed' : 'Open Now'}')">${s.status === 'Open Now' ? 'Close' : 'Open'}</button>
        <button class="btn-danger" onclick="deleteStoreAdmin('${s.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

$('addStoreBtn')?.addEventListener('click', () => showStoreForm());

function showStoreForm(store = null) {
  $('formModalTitle').textContent = store ? 'Edit Store' : 'Add New Store';
  $('formModalContent').innerHTML = `
    <form id="storeFormInner">
      <div class="form-row">
        <div class="form-group">
          <label>Store ID (slug)</label>
          <input type="text" id="stfId" required value="${store?.id || ''}" ${store ? 'readonly' : ''} placeholder="e.g., new-branch" />
        </div>
        <div class="form-group">
          <label>Short Name</label>
          <input type="text" id="stfShort" value="${store?.short_name || ''}" placeholder="e.g., New Branch" />
        </div>
      </div>
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="stfName" required value="${store?.name || ''}" />
      </div>
      <div class="form-group">
        <label>Address</label>
        <textarea id="stfAddress" rows="2">${store?.address || ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Phone</label>
          <input type="text" id="stfPhone" value="${store?.phone || ''}" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="stfEmail" value="${store?.email || ''}" />
        </div>
      </div>
      <div class="form-group">
        <label>Google Maps URL</label>
        <input type="text" id="stfMap" value="${store?.map_url || ''}" />
      </div>
      <button type="submit" class="btn-primary">${store ? 'Update' : 'Create'} Store</button>
    </form>
  `;
  $('formModal').setAttribute('aria-hidden', 'false');

  $('storeFormInner').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      id: $('stfId').value,
      name: $('stfName').value,
      shortName: $('stfShort').value,
      address: $('stfAddress').value,
      phone: $('stfPhone').value,
      email: $('stfEmail').value,
      mapUrl: $('stfMap').value,
      status: store?.status || 'Open Now'
    };
    if (store) {
      await api(`/api/admin/stores/${store.id}`, { method: 'PUT', body });
    } else {
      await api('/api/admin/stores', { method: 'POST', body });
    }
    $('formModal').setAttribute('aria-hidden', 'true');
    toast(store ? 'Store updated' : 'Store created');
    loadStoresAdmin();
    loadStoreFilters();
  });
}

window.editStore = function(id) {
  const store = storesData.find(s => s.id === id);
  if (store) showStoreForm(store);
};

window.toggleStoreStatus = async function(id, status) {
  const store = storesData.find(s => s.id === id);
  if (!store) return;
  await api(`/api/admin/stores/${id}`, { method: 'PUT', body: { ...store, status } });
  toast(`Store ${status}`);
  loadStoresAdmin();
};

window.deleteStoreAdmin = async function(id) {
  if (!confirm('Delete this store?')) return;
  await api(`/api/admin/stores/${id}`, { method: 'DELETE' });
  toast('Store deleted');
  loadStoresAdmin();
  loadStoreFilters();
};

// ══════════════════════════════════════════════════════════════════════════════
// PAYMENTS SECTION
// ══════════════════════════════════════════════════════════════════════════════

async function loadPayments() {
  try {
    const orders = await api('/api/admin/orders');
    const summary = await api('/api/admin/reports/summary');

    // Payment stats
    const paidCount = orders.filter(o => o.payment_status === 'Paid').length;
    const pendingCount = orders.filter(o => o.payment_status !== 'Paid').length;
    const paidAmount = orders.filter(o => o.payment_status === 'Paid').reduce((s, o) => s + o.total, 0);
    const pendingAmount = orders.filter(o => o.payment_status !== 'Paid').reduce((s, o) => s + o.total, 0);

    $('paymentStats').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon green">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
        <div class="stat-value">${currency(paidAmount)}</div>
        <div class="stat-label">Collected</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        </div>
        <div class="stat-value">${currency(pendingAmount)}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="stat-value">${paidCount}</div>
        <div class="stat-label">Paid Orders</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <div class="stat-value">${pendingCount}</div>
        <div class="stat-label">Pending Payments</div>
      </div>
    `;

    // Payment table
    $('paymentsBody').innerHTML = orders.map(o => `
      <tr>
        <td><span class="order-id" onclick="showOrderDetail('${o.id}')">${o.id}</span></td>
        <td>${o.customer_name}</td>
        <td><strong>${currency(o.total)}</strong></td>
        <td>${o.payment_method}</td>
        <td><span class="status-badge ${getPaymentClass(o.payment_status)}">${o.payment_status}</span></td>
        <td><small>${formatDateTime(o.created_at)}</small></td>
        <td>
          <div class="action-btns">
            ${o.payment_status !== 'Paid' ? `<button class="btn-outline" onclick="markPaid('${o.id}')">Mark Paid</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) { console.error(e); }
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTS SECTION
// ══════════════════════════════════════════════════════════════════════════════

async function loadReports() {
  try {
    const period = $('reportPeriod')?.value || '30';
    const revenueData = await api(`/api/admin/reports/revenue?period=${period}`);
    const summary = await api('/api/admin/reports/summary');

    drawRevenueTrendChart(revenueData);

    // Payment methods
    $('paymentMethodsReport').innerHTML = summary.byPayment.length ? summary.byPayment.map((p, i) => {
      const maxCount = Math.max(...summary.byPayment.map(x => x.count));
      const colors = ['blue', 'green', 'yellow', 'orange', 'accent'];
      return `
        <div class="bar-chart-row">
          <span class="bar-chart-label">${p.payment_method || 'Unknown'}</span>
          <div class="bar-chart-bar">
            <div class="bar-chart-fill ${colors[i % colors.length]}" style="width:${(p.count / maxCount * 100)}%"></div>
          </div>
          <span class="bar-chart-value">${p.count}</span>
        </div>
      `;
    }).join('') : '<p style="color:var(--text-dim);">No data yet</p>';

    // Time slots
    $('timeSlotsReport').innerHTML = summary.timeSlots.length ? summary.timeSlots.map((t, i) => {
      const maxCount = Math.max(...summary.timeSlots.map(x => x.count));
      const colors = ['accent', 'blue', 'green', 'cyan', 'yellow', 'pink'];
      return `
        <div class="bar-chart-row">
          <span class="bar-chart-label">${t.time_slot || 'No slot'}</span>
          <div class="bar-chart-bar">
            <div class="bar-chart-fill ${colors[i % colors.length]}" style="width:${(t.count / maxCount * 100)}%"></div>
          </div>
          <span class="bar-chart-value">${t.count}</span>
        </div>
      `;
    }).join('') : '<p style="color:var(--text-dim);">No data yet</p>';

  } catch (e) { console.error(e); }
}

$('reportPeriod')?.addEventListener('change', loadReports);

function drawRevenueTrendChart(data) {
  const canvas = $('revenueTrendChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);

  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  const pad = { top: 20, right: 20, bottom: 50, left: 70 };

  ctx.clearRect(0, 0, w, h);

  if (!data || data.length === 0) {
    ctx.fillStyle = '#4a5578';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data for selected period', w / 2, h / 2);
    return;
  }

  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#4a5578'; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(currency(Math.round(maxVal - (maxVal / 4) * i)), pad.left - 8, y + 4);
  }

  // Area + Line
  const points = data.map((d, i) => ({
    x: pad.left + (chartW / (data.length - 1 || 1)) * i,
    y: pad.top + chartH - (d.revenue / maxVal) * chartH
  }));

  // Area gradient
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
  grad.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
  grad.addColorStop(1, 'rgba(99, 102, 241, 0)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, pad.top + chartH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // Dots
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1';
    ctx.fill();
    ctx.strokeStyle = '#0c0e14';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Date labels
  ctx.fillStyle = '#7c8db5';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  const skip = Math.max(1, Math.floor(data.length / 10));
  data.forEach((d, i) => {
    if (i % skip === 0 || i === data.length - 1) {
      const x = pad.left + (chartW / (data.length - 1 || 1)) * i;
      ctx.fillText(d.date.slice(5), x, h - pad.bottom + 18);
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS SECTION
// ══════════════════════════════════════════════════════════════════════════════

async function loadSettings() {
  try {
    const settings = await api('/api/admin/settings');
    $('setShopName').value = settings.shop_name || '';
    $('setShopPhone').value = settings.shop_phone || '';
    $('setWhatsApp').value = settings.whatsapp_link || '';
    $('setInquiryPhone').value = settings.inquiry_phone || '';
    $('setUpiId').value = settings.upi_id || '';
    $('setPickupCharge').value = settings.pickup_charge || '0';
    $('setOrigPickupCharge').value = settings.original_pickup_charge || '49';

    // Load admin accounts (superadmin only)
    if (adminUser.role === 'superadmin') {
      const admins = await api('/api/admin/admins');
      $('adminAccountsList').innerHTML = admins.map(a => `
        <div class="admin-account-item">
          <div class="admin-account-info">
            <div class="mini-avatar">${(a.display_name || 'A')[0].toUpperCase()}</div>
            <div>
              <strong>${a.display_name}</strong>
              <small>@${a.username} · ${a.store_id || 'All Stores'} · ${a.role}</small>
            </div>
          </div>
          ${a.id !== adminUser.id ? `<button class="btn-danger" onclick="deleteAdminAccount(${a.id})">Remove</button>` : '<span style="color:var(--text-dim);font-size:0.75rem;">You</span>'}
        </div>
      `).join('');
      $('addAdminSection').style.display = 'block';
    } else {
      $('adminAccountsList').innerHTML = '<p style="color:var(--text-dim);font-size:0.85rem;">Only super admin can manage accounts.</p>';
      $('addAdminSection').style.display = 'none';
    }
  } catch (e) { console.error(e); }
}

// Save shop settings
$('shopSettingsForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  await api('/api/admin/settings', {
    method: 'PUT',
    body: {
      shop_name: $('setShopName').value,
      shop_phone: $('setShopPhone').value,
      whatsapp_link: $('setWhatsApp').value,
      inquiry_phone: $('setInquiryPhone').value,
      upi_id: $('setUpiId').value,
      pickup_charge: $('setPickupCharge').value,
      original_pickup_charge: $('setOrigPickupCharge').value
    }
  });
  toast('Settings saved successfully');
});

// Add admin
$('addAdminForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  await api('/api/admin/admins', {
    method: 'POST',
    body: {
      username: $('newAdminUser').value,
      password: $('newAdminPass').value,
      displayName: $('newAdminName').value,
      storeId: $('newAdminStore').value,
      role: $('newAdminStore').value ? 'admin' : 'superadmin'
    }
  });
  toast('Admin account created');
  $('addAdminForm').reset();
  loadSettings();
});

// Delete admin
window.deleteAdminAccount = async function(id) {
  if (!confirm('Delete this admin account?')) return;
  await api(`/api/admin/admins/${id}`, { method: 'DELETE' });
  toast('Admin removed');
  loadSettings();
};

// Change password
$('changePasswordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = $('newPassword').value;
  const confirm = $('confirmPassword').value;
  if (pw !== confirm) { toast('Passwords do not match'); return; }
  await api(`/api/admin/admins/${adminUser.id}/password`, { method: 'PUT', body: { password: pw } });
  toast('Password updated. Please login again.');
  setTimeout(() => {
    localStorage.removeItem('jld_admin_token');
    window.location.href = 'index.html';
  }, 1500);
});

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function getStatusClass(status) {
  const map = {
    'New': 'new', 'Picked Up': 'picked', 'In Process': 'process',
    'Ready': 'ready', 'Delivered': 'delivered', 'Completed': 'completed', 'Cancelled': 'cancelled'
  };
  return map[status] || 'pending';
}

function getPaymentClass(status) {
  if (status === 'Paid') return 'paid';
  if (status === 'COD Pending') return 'cod';
  return 'pending';
}

function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// ── Start ────────────────────────────────────────────────────────────────────

init();
