// ==========================================================================
// AHA Premium Glassmorphism Restaurant - Real-Time POS & Application Engine
// ==========================================================================

// Global Realtime Broadcast Channel
const realTimeChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('aha_realtime_pos') : null;

// Global Cart State
let cart = JSON.parse(localStorage.getItem('aha_cart') || '[]');

// DOM Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initCartUI();
  highlightActiveNav();
  initReservationModal();
  initRealtimeListeners();
  renderCustomerLiveTracker();
  if (typeof renderDynamicMenu === 'function') renderDynamicMenu();
  syncMenuStock();
});

// Real-Time Audio Synthesizer (Web Audio API - No external dependencies)
function playRealtimeChime(type = 'notification') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'new_order') {
      // Harmonic luxury chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else if (type === 'status_update') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'table_cleared') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.2); // D5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {
    // Graceful fallback for strict autoplay policies
  }
}

// Broadcast Realtime Event to all open tabs
function broadcastRealtimeEvent(eventType, payload) {
  if (realTimeChannel) {
    realTimeChannel.postMessage({ type: eventType, payload, timestamp: Date.now() });
  }
}

// Setup Cross-Tab Synchronous Listeners
function initRealtimeListeners() {
  if (realTimeChannel) {
    realTimeChannel.onmessage = (event) => {
      handleIncomingRealtimeEvent(event.data);
    };
  }

  // Fallback for storage events
  window.addEventListener('storage', (e) => {
    if (e.key === 'aha_admin_orders' || e.key === 'aha_admin_reservations' || e.key === 'aha_active_guest_order') {
      renderCustomerLiveTracker();
      if (typeof renderAdminOrders === 'function') renderAdminOrders();
      if (typeof renderAdminReservations === 'function') renderAdminReservations();
      if (typeof renderFloorMap === 'function') renderFloorMap();
    }
    if (e.key === 'aha_86_list') {
      syncMenuStock();
    }
  });
}

function handleIncomingRealtimeEvent(data) {
  const { type, payload } = data;

  if (type === 'NEW_ORDER_PLACED') {
    playRealtimeChime('new_order');
    showToast(`🔔 Real-Time POS: New Order ${payload.id} received for ${payload.table}!`, 'info');
    if (typeof renderAdminOrders === 'function') renderAdminOrders();
    if (typeof renderFloorMap === 'function') renderFloorMap();
    if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
  } 
  else if (type === 'ORDER_STATUS_CHANGED') {
    playRealtimeChime('status_update');
    renderCustomerLiveTracker();
    if (typeof renderAdminOrders === 'function') renderAdminOrders();
    if (typeof renderFloorMap === 'function') renderFloorMap();
    if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
  }
  else if (type === 'MENU_UPDATED') {
    if (typeof renderDynamicMenu === 'function') renderDynamicMenu();
    if (typeof renderAdminInventory === 'function') renderAdminInventory();
  }
  else if (type === 'NEW_RESERVATION_PLACED') {
    playRealtimeChime('new_order');
    showToast(`📅 Real-Time POS: New Reservation ${payload.id} from ${payload.name}!`, 'info');
    if (typeof renderAdminReservations === 'function') renderAdminReservations();
    if (typeof renderFloorMap === 'function') renderFloorMap();
  }
  else if (type === 'TABLE_CLEARED_DELETED') {
    playRealtimeChime('table_cleared');
    renderCustomerLiveTracker();
    if (typeof renderAdminOrders === 'function') renderAdminOrders();
    if (typeof renderAdminReservations === 'function') renderAdminReservations();
    if (typeof renderFloorMap === 'function') renderFloorMap();
  }
  else if (type === 'STOCK_UPDATED') {
    syncMenuStock();
    showToast(`Inventory Alert: ${payload.itemName} is now ${payload.available ? 'Available' : "86'd (Sold Out)"}`, payload.available ? 'success' : 'error');
  }
  else if (type === 'POS_RESET') {
    cart = [];
    saveCart();
    updateCartUI();
    renderCustomerLiveTracker();
    if (typeof renderAdminOrders === 'function') renderAdminOrders();
    if (typeof renderAdminReservations === 'function') renderAdminReservations();
    if (typeof renderFloorMap === 'function') renderFloorMap();
    if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
    if (typeof renderAdminInventory === 'function') renderAdminInventory();
  }
}

function syncMenuStock() {
  const outOfStock = JSON.parse(localStorage.getItem('aha_86_list') || '[]');
  const menuItems = document.querySelectorAll('.menu-item');
  
  menuItems.forEach(item => {
    const titleEl = item.querySelector('[data-title]') || item.querySelector('h3');
    if(!titleEl) return;
    
    // Some elements have data-title attribute for exact match, or just use h3 text
    const title = item.getAttribute('data-title') || titleEl.textContent.trim();
    const btn = item.querySelector('button[onclick^="addToCart"]');
    
    if (outOfStock.includes(title)) {
      item.classList.add('opacity-50', 'pointer-events-none', 'grayscale');
      if (btn) {
        btn.textContent = 'Sold Out';
        btn.classList.replace('bg-primary/10', 'bg-red-500/10');
        btn.classList.replace('text-primary', 'text-red-400');
        btn.classList.replace('border-primary/50', 'border-red-500/50');
      }
    } else {
      item.classList.remove('opacity-50', 'pointer-events-none', 'grayscale');
      if (btn) {
        btn.textContent = '+ Add';
        btn.classList.replace('bg-red-500/10', 'bg-primary/10');
        btn.classList.replace('text-red-400', 'text-primary');
        btn.classList.replace('border-red-500/50', 'border-primary/50');
      }
    }
  });
}

// Mobile Navigation Toggle
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const closeBtn = document.getElementById('mobileMenuClose');

  if (toggleBtn && mobileMenu) {
    toggleBtn.addEventListener('click', () => {
      mobileMenu.classList.remove('hidden');
      mobileMenu.classList.add('flex');
    });
  }

  if (closeBtn && mobileMenu) {
    closeBtn.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      mobileMenu.classList.remove('flex');
    });
  }
}

// Highlight Current Page in Navigation
function highlightActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('header nav a, #mobileMenu a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html') || (currentPath === '/' && href === 'index.html')) {
      link.classList.remove('text-on-surface-variant', 'hover:bg-white/10');
      link.classList.add('bg-primary', 'text-on-primary', 'font-bold', 'shadow-md');
      const icon = link.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.add('text-on-primary');
    } else {
      link.classList.remove('bg-primary', 'text-on-primary', 'shadow-md');
      link.classList.add('text-on-surface-variant');
    }
  });
}

// Cart System
function addToCart(id, name, price, type = 'dish') {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, name, price: Number(price), quantity: 1, type });
  }
  saveCart();
  updateCartUI();
  showToast(`Added "${name}" to your order tray.`, 'success');
  openCartDrawer();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartUI();
}

function updateCartQuantity(id, delta) {
  const item = cart.find(item => item.id === id);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(id);
    } else {
      saveCart();
      updateCartUI();
    }
  }
}

function saveCart() {
  localStorage.setItem('aha_cart', JSON.stringify(cart));
}

function initCartUI() {
  const cartToggleButtons = document.querySelectorAll('.cart-toggle-btn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartClose = document.getElementById('cartClose');

  cartToggleButtons.forEach(btn => {
    btn.addEventListener('click', openCartDrawer);
  });

  if (cartClose) {
    cartClose.addEventListener('click', closeCartDrawer);
  }

  updateCartUI();
}

function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const cartBackdrop = document.getElementById('cartBackdrop');
  if (drawer) {
    drawer.classList.remove('translate-x-full');
    drawer.classList.add('translate-x-0');
  }
  if (cartBackdrop) {
    cartBackdrop.classList.remove('hidden');
  }

  // Dynamically update the Dining Destination dropdown based on Real-Time Occupancy
  const destinationEl = document.getElementById('cartOrderDestination');
  if (destinationEl) {
    const currentOrders = JSON.parse(localStorage.getItem('aha_admin_orders') || '[]');
    const currentReservations = JSON.parse(localStorage.getItem('aha_admin_reservations') || '[]');
    const floorTables = [
      'Table 01', 'Table 02', 'Table 03', 'Table 04', 'Table 05', 'Table 06',
      'Glass Pod 01', 'Glass Pod 02', 'Terrace 01', 'Terrace 02', 'Counter 01', 'Counter 02'
    ];

    let html = `
      <option value="Online Order" class="bg-[#16130b] text-blue-300">📱 Online Order (Delivery)</option>
      <option value="Walk-in (Takeaway)" class="bg-[#16130b] text-yellow-300">🚶 Walk-in (Takeaway)</option>
      <optgroup label="Dine-in Tables (Real-Time Status)">
    `;

    floorTables.forEach(tId => {
      const order = currentOrders.find(o => o.table === tId && o.status !== 'Dining Completed');
      const seatedRes = currentReservations.find(r => r.zone.includes(tId) && (r.status === 'Seated' || r.status === 'Seated & Dining'));
      
      if (order || seatedRes) {
        html += `<option value="${tId}" class="bg-amber-900/40 text-amber-300">🪑 ${tId} - Occupied (Add to Tab)</option>`;
      } else {
        html += `<option value="${tId}" class="bg-[#16130b] text-primary">🪑 ${tId} - Available Now</option>`;
      }
    });

    html += `</optgroup>`;
    destinationEl.innerHTML = html;
  }
}

function closeCartDrawer() {
  const cartDrawer = document.getElementById('cartDrawer');
  const cartBackdrop = document.getElementById('cartBackdrop');
  if (cartDrawer) {
    cartDrawer.classList.remove('translate-x-0');
    cartDrawer.classList.add('translate-x-full');
  }
  if (cartBackdrop) {
    cartBackdrop.classList.add('hidden');
  }
}

function updateCartUI() {
  const cartCountBadges = document.querySelectorAll('.cart-count-badge');
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  
  cartCountBadges.forEach(badge => {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
  });

  const cartItemsContainer = document.getElementById('cartItemsList');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartTaxesEl = document.getElementById('cartTaxes');
  const cartTotalEl = document.getElementById('cartTotal');

  if (!cartItemsContainer) return;

  const allItems = JSON.parse(localStorage.getItem('aha_menu_items') || '[]');
  let quickAddHtml = '';
  if (allItems.length > 0) {
    quickAddHtml = `
      <div class="mt-6 border-t border-white/10 pt-4">
        <h4 class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Quick Add Menu</h4>
        <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
          ${allItems.map(item => `
            <div class="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-transparent hover:border-primary/30 transition-colors">
              <div class="flex-1 pr-2 overflow-hidden">
                <p class="text-xs font-semibold text-on-surface truncate" title="${item.name}">${item.name}</p>
                <p class="text-[10px] text-primary font-bold">₹${item.price}</p>
              </div>
              <button onclick="addToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.price})" class="px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-on-primary text-[10px] font-bold transition-colors">
                + Add
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="py-8 text-center text-on-surface-variant flex flex-col items-center">
        <span class="material-symbols-outlined text-4xl mb-2 opacity-40">restaurant_menu</span>
        <p class="font-headline text-base mb-1 text-on-surface">Your tray is empty</p>
      </div>
      ${quickAddHtml}
    `;
    if (cartSubtotalEl) cartSubtotalEl.textContent = '₹0';
    if (cartTaxesEl) cartTaxesEl.textContent = '₹0';
    if (cartTotalEl) cartTotalEl.textContent = '₹0';
    return;
  }

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const total = subtotal + tax;

  const cartHtml = cart.map(item => `
    <div class="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 mb-3 hover:border-primary/30 transition-colors">
      <div class="flex-1 pr-2">
        <h4 class="font-medium text-on-surface text-sm">${item.name}</h4>
        <span class="text-xs text-primary font-bold">₹${item.price}</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center border border-white/20 rounded-full px-2.5 py-0.5 bg-black/50">
          <button onclick="updateCartQuantity('${item.id}', -1)" class="text-on-surface-variant hover:text-primary px-1 font-bold">-</button>
          <span class="text-xs font-bold px-2">${item.quantity}</span>
          <button onclick="updateCartQuantity('${item.id}', 1)" class="text-on-surface-variant hover:text-primary px-1 font-bold">+</button>
        </div>
        <button onclick="removeFromCart('${item.id}')" class="text-on-surface-variant hover:text-error text-xs p-1" title="Remove">
          <span class="material-symbols-outlined text-base">delete</span>
        </button>
      </div>
    </div>
  `).join('');

  cartItemsContainer.innerHTML = cartHtml + quickAddHtml;

  if (cartSubtotalEl) cartSubtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (cartTaxesEl) cartTaxesEl.textContent = `₹${tax.toLocaleString('en-IN')}`;
  if (cartTotalEl) cartTotalEl.textContent = `₹${total.toLocaleString('en-IN')}`;

  // Smart Cart Routing: Lock destination to existing table if tab is open
  const activeOrderRaw = localStorage.getItem('aha_active_guest_order');
  const destEl = document.getElementById('cartOrderDestination');
  const checkoutBtn = document.querySelector('button[onclick="checkoutOrder()"]');
  
  if (destEl) {
    if (activeOrderRaw) {
      try {
        const activeOrder = JSON.parse(activeOrderRaw);
        destEl.value = activeOrder.table;
        destEl.disabled = true;
        destEl.classList.add('opacity-60', 'cursor-not-allowed', 'bg-primary/10');
        if (checkoutBtn) checkoutBtn.innerHTML = `Add to Existing Tab <span class="material-symbols-outlined align-middle text-sm">receipt_long</span>`;
      } catch (e) {}
    } else {
      destEl.disabled = false;
      destEl.classList.remove('opacity-60', 'cursor-not-allowed', 'bg-primary/10');
      if (checkoutBtn) checkoutBtn.innerHTML = `Checkout <span class="material-symbols-outlined align-middle text-sm">arrow_forward</span>`;
    }
  }
}

// Check Table Occupancy
function isTableOccupied(tableName) {
  if (!tableName || tableName === 'Parcel (Takeaway)') return false;
  const currentOrders = JSON.parse(localStorage.getItem('aha_admin_orders') || '[]');
  return currentOrders.some(o => o.table === tableName && o.status !== 'Dining Completed');
}

// Payment Modal Logic
function openPaymentModal() {
  let modal = document.getElementById('paymentModeModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'paymentModeModal';
    // The user requested top right corner for the modal
    modal.className = 'fixed top-4 right-4 bg-surface-dark border border-white/20 rounded-2xl shadow-2xl p-6 z-50 w-80 backdrop-blur-xl';
    modal.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-on-surface font-headline text-lg">Select Payment Mode</h3>
        <button onclick="closePaymentModal()" class="text-on-surface-variant hover:text-white transition-colors">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="space-y-3">
        <button onclick="processOrder('Cash')" class="w-full glass-card hover:bg-primary/20 hover:text-primary text-on-surface py-3.5 rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 font-semibold">
          <span class="material-symbols-outlined">payments</span> Cash
        </button>
        <button onclick="processOrder('Card')" class="w-full glass-card hover:bg-primary/20 hover:text-primary text-on-surface py-3.5 rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 font-semibold">
          <span class="material-symbols-outlined">credit_card</span> Credit/Debit Card
        </button>
        <button onclick="processOrder('UPI')" class="w-full glass-card hover:bg-primary/20 hover:text-primary text-on-surface py-3.5 rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 font-semibold">
          <span class="material-symbols-outlined">qr_code_scanner</span> UPI / QR Code
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.classList.remove('hidden');
}

function closePaymentModal() {
  const modal = document.getElementById('paymentModeModal');
  if (modal) modal.classList.add('hidden');
}

// Trigger Checkout Validation
function checkoutOrder() {
  if (cart.length === 0) {
    showToast('Your order tray is empty!', 'error');
    return;
  }

  const destinationEl = document.getElementById('cartOrderDestination');
  const assignedTable = destinationEl ? destinationEl.value : 'Parcel (Takeaway)';

  if (assignedTable.includes('Table') || assignedTable.includes('Pod') || assignedTable.includes('Terrace') || assignedTable.includes('Counter')) {
    // It's a dine-in table, skip payment upfront and open a tab
    processTableOrder(assignedTable);
  } else {
    // Takeaway or Online - needs upfront payment
    openPaymentModal();
  }
}

// Process Dine-in Table Open Tab
function processTableOrder(assignedTable) {
  const currentOrders = JSON.parse(localStorage.getItem('aha_admin_orders') || '[]');
  // Check if an open tab already exists for this table
  let existingOrderIndex = currentOrders.findIndex(o => o.table === assignedTable && o.status !== 'Dining Completed');

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + taxes;

  if (existingOrderIndex !== -1) {
    // Append to existing open tab
    let existingOrder = currentOrders[existingOrderIndex];
    
    // Check if items already exist to increase quantity, otherwise add
    cart.forEach(cartItem => {
      let found = existingOrder.items.find(i => i.id === cartItem.id);
      if (found) {
        found.quantity += cartItem.quantity;
      } else {
        existingOrder.items.push(cartItem);
      }
    });

    // Recalculate total for the existing order
    const newSubtotal = existingOrder.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const newTotal = newSubtotal + Math.round(newSubtotal * 0.05);
    existingOrder.total = `₹ ${newTotal.toLocaleString('en-IN')}`;
    existingOrder.status = 'In Kitchen'; // Reset status so kitchen knows new items arrived
    existingOrder.timestamp = Date.now();
    existingOrder.time = 'Just updated';
    
    currentOrders[existingOrderIndex] = existingOrder;
    localStorage.setItem('aha_admin_orders', JSON.stringify(currentOrders));
    localStorage.setItem('aha_active_guest_order', JSON.stringify(existingOrder));
    broadcastRealtimeEvent('ORDER_UPDATED', existingOrder);
    playRealtimeChime('new_order');
    showToast(`✨ Added new items to the open tab for ${assignedTable}!`, 'success');

  } else {
    // Create new open tab
    const newOrder = {
      id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
      table: assignedTable,
      orderType: 'Table',
      items: [...cart],
      total: `₹ ${total.toLocaleString('en-IN')}`,
      status: 'In Kitchen',
      timestamp: Date.now(),
      time: 'Just now',
      paymentMode: 'Unpaid (Open Tab)'
    };
    currentOrders.unshift(newOrder);
    localStorage.setItem('aha_admin_orders', JSON.stringify(currentOrders));
    localStorage.setItem('aha_active_guest_order', JSON.stringify(newOrder));
    broadcastRealtimeEvent('NEW_ORDER_PLACED', newOrder);
    playRealtimeChime('new_order');
    showToast(`✨ Ticket ${newOrder.id} dispatched to Kitchen for ${assignedTable} on an Open Tab!`, 'success');
  }

  // Clear cart
  cart = [];
  saveCart();
  updateCartUI();
  closeCartDrawer();
  renderCustomerLiveTracker();
}

// Process Upfront Payment Orders (Takeaway)
function processOrder(paymentMode) {
  closePaymentModal();
  
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal + Math.round(subtotal * 0.05);

  const destinationEl = document.getElementById('cartOrderDestination');
  const assignedTable = destinationEl ? destinationEl.value : 'Parcel (Takeaway)';

  let orderType = 'Walk-in';
  if (assignedTable.includes('Online')) orderType = 'Online';

  const newOrder = {
    id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
    table: assignedTable,
    orderType: orderType,
    items: [...cart],
    total: `₹ ${total.toLocaleString('en-IN')}`,
    status: 'In Kitchen',
    timestamp: Date.now(),
    time: 'Just now',
    paymentMode: paymentMode
  };

  // Save to Admin Orders List
  const currentOrders = JSON.parse(localStorage.getItem('aha_admin_orders') || '[]');
  currentOrders.unshift(newOrder);
  localStorage.setItem('aha_admin_orders', JSON.stringify(currentOrders));
  localStorage.setItem('aha_active_guest_order', JSON.stringify(newOrder));

  // Update Total Revenue and Sales Count (Paid Upfront)
  let totalRevenue = parseInt(localStorage.getItem('aha_total_revenue') || '0');
  let totalSales = parseInt(localStorage.getItem('aha_total_sales') || '0');
  totalRevenue += total;
  totalSales += 1;
  localStorage.setItem('aha_total_revenue', totalRevenue);
  localStorage.setItem('aha_total_sales', totalSales);

  broadcastRealtimeEvent('NEW_ORDER_PLACED', newOrder);
  playRealtimeChime('new_order');

  cart = [];
  saveCart();
  updateCartUI();
  closeCartDrawer();
  renderCustomerLiveTracker();

  showToast(`✨ Ticket ${newOrder.id} dispatched to Kitchen for ${newOrder.table} via ${paymentMode}!`, 'success');
}

// Real-Time Customer Live Status Tracking Pill
function renderCustomerLiveTracker() {
  // Prevent customer tracker from showing up on the admin dashboard
  if (document.getElementById('adminPortalBody')) return;

  const activeOrderRaw = localStorage.getItem('aha_active_guest_order');
  let trackerEl = document.getElementById('liveCustomerTracker');

  if (!activeOrderRaw) {
    if (trackerEl) trackerEl.remove();
    return;
  }

  const activeOrder = JSON.parse(activeOrderRaw);

  // Check if admin has updated or deleted this order
  const allOrders = JSON.parse(localStorage.getItem('aha_admin_orders') || '[]');
  const latestOrderState = allOrders.find(o => o.id === activeOrder.id);

  if (!latestOrderState) {
    // Order was completed and cleared by admin!
    if (trackerEl) {
      trackerEl.innerHTML = `
        <div class="glass-card-elevated p-4 rounded-2xl border border-green-500/50 flex items-center justify-between gap-4 shadow-2xl bg-surface/95 backdrop-blur-2xl">
          <div class="flex items-center gap-3">
            <span class="w-3 h-3 rounded-full bg-green-500"></span>
            <div>
              <p class="text-xs font-bold text-on-surface">Dining Completed • ${activeOrder.table}</p>
              <p class="text-[11px] text-green-400">Thank you for dining at AHA! Table cleared.</p>
            </div>
          </div>
          <button onclick="dismissCustomerTracker()" class="text-on-surface-variant hover:text-primary p-1">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      `;
    }
    return;
  }

  if (!trackerEl) {
    trackerEl = document.createElement('div');
    trackerEl.id = 'liveCustomerTracker';
    trackerEl.className = 'fixed bottom-6 left-6 z-40 max-w-sm w-full animate-fade-in pointer-events-auto';
    document.body.appendChild(trackerEl);
  }

  const status = latestOrderState.status;
  let statusIcon = 'soup_kitchen';
  let statusColor = 'text-amber-400';
  let statusText = 'Chef is preparing your courses in the kitchen.';

  if (status === 'Plated') {
    statusIcon = 'room_service';
    statusColor = 'text-blue-400';
    statusText = 'Plated with 24K gold foil & ready for table delivery.';
  } else if (status === 'Served' || status === 'Dining') {
    statusIcon = 'restaurant';
    statusColor = 'text-cyan-400';
    statusText = 'Served at your table. Bon Appétit!';
  } else if (status === 'Bill Requested') {
    statusIcon = 'receipt_long';
    statusColor = 'text-purple-400';
    statusText = 'Bill requested. The waiter is on their way.';
  } else if (status === 'Dining Completed') {
    statusIcon = 'check_circle';
    statusColor = 'text-green-400';
    statusText = 'Dining completed. Bill ready & settled.';
  }

  trackerEl.innerHTML = `
    <div class="glass-card-elevated p-4 rounded-2xl border border-primary/40 shadow-2xl flex flex-col gap-3 bg-surface/95 backdrop-blur-2xl">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center ${statusColor}">
            <span class="material-symbols-outlined text-xl">${statusIcon}</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-xs text-primary">${latestOrderState.id}</span>
              <span class="text-[10px] text-on-surface-variant font-mono">• ${latestOrderState.table}</span>
            </div>
            <p class="text-xs font-semibold text-on-surface">${status}</p>
            <p class="text-[11px] text-on-surface-variant line-clamp-1">${statusText}</p>
          </div>
        </div>
        <button onclick="dismissCustomerTracker()" class="text-on-surface-variant hover:text-primary p-1">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
      ${(status === 'Served' || status === 'Dining') ? `
      <div class="border-t border-white/10 pt-3">
        <button onclick="requestCustomerBill('${latestOrderState.id}')" class="w-full bg-white/5 hover:bg-primary/20 text-on-surface hover:text-primary py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-white/10">
          <span class="material-symbols-outlined text-sm">receipt_long</span> Request Bill
        </button>
      </div>
      ` : ''}
    </div>
  `;
}

function requestCustomerBill(orderId) {
  const currentOrders = JSON.parse(localStorage.getItem('aha_admin_orders') || '[]');
  const orderIndex = currentOrders.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    currentOrders[orderIndex].status = 'Bill Requested';
    localStorage.setItem('aha_admin_orders', JSON.stringify(currentOrders));
    localStorage.setItem('aha_active_guest_order', JSON.stringify(currentOrders[orderIndex]));
    broadcastRealtimeEvent('ORDER_UPDATED', currentOrders[orderIndex]);
    playRealtimeChime('chime');
    renderCustomerLiveTracker();
  }
}

function dismissCustomerTracker() {
  localStorage.removeItem('aha_active_guest_order');
  const trackerEl = document.getElementById('liveCustomerTracker');
  if (trackerEl) trackerEl.remove();
}

// Global Reservation Modal Handler
function initReservationModal() {
  const modal = document.getElementById('reservationModal');
  const openButtons = document.querySelectorAll('.open-reservation-modal-btn');
  const closeBtn = document.getElementById('reservationModalClose');

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      } else {
        window.location.href = 'reservation.html';
      }
    });
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });
  }
}

// Toast Notification Engine
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const isSuccess = type === 'success';
  const isError = type === 'error';
  
  toast.className = `glass-card-elevated px-5 py-3.5 rounded-full flex items-center gap-3 text-xs md:text-sm shadow-2xl transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-auto border backdrop-blur-2xl ${
    isSuccess ? 'border-primary/60 text-on-surface' : isError ? 'border-red-500/60 text-red-200' : 'border-white/30 text-on-surface'
  }`;
  
  const icon = isSuccess ? 'check_circle' : isError ? 'error' : 'info';
  const iconColor = isSuccess ? 'text-primary' : isError ? 'text-red-400' : 'text-primary';

  toast.innerHTML = `
    <span class="material-symbols-outlined text-lg ${iconColor}">${icon}</span>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Dynamic Menu Renderer (Used on menu.html)
function renderDynamicMenu() {
  const container = document.getElementById('menuItemsContainer');
  if (!container) return; // Only execute if we are on menu.html

  // Initialize with premium data once if it has never been initialized
  const isInitialized = localStorage.getItem('aha_menu_initialized');
  let items = JSON.parse(localStorage.getItem('aha_menu_items') || 'null');
  
  if (!isInitialized && (!items || items.length === 0)) {
    items = [
      { id: 'm-def-1', name: '24K Gold Saffron Kebab', price: 899, category: 'starters', dietary: 'non-veg special', desc: 'Prime lamb marinated in saffron, topped with edible 24K gold leaf.' },
      { id: 'm-def-2', name: 'Truffle Edamame Dumplings', price: 549, category: 'starters', dietary: 'veg', desc: 'Steamed translucent dumplings filled with edamame and black truffle.' },
      { id: 'm-def-3', name: 'Royal Awadhi Biryani', price: 999, category: 'biryani', dietary: 'non-veg special', desc: 'Slow-cooked basmati with tender mutton, sealed with dough.' },
      { id: 'm-def-4', name: 'Smoked Dal AHA', price: 449, category: 'mains', dietary: 'veg special', desc: 'Black lentils slow-cooked for 48 hours over charcoal embers.' },
      { id: 'm-def-5', name: 'Artisanal Garlic Naan', price: 149, category: 'breads', dietary: 'veg', desc: 'Wood-fired naan brushed with burnt garlic butter.' },
      { id: 'm-def-6', name: 'Rose Petal Phirni', price: 299, category: 'desserts', dietary: 'veg', desc: 'Classic rice pudding infused with fresh Damascus rose petals.' },
      { id: 'm-def-7', name: 'Smoked Amber Elixir', price: 349, category: 'drinks', dietary: 'veg special', desc: 'Smoked cinnamon and apple botanical mocktail.' }
    ];
    localStorage.setItem('aha_menu_items', JSON.stringify(items));
    localStorage.setItem('aha_menu_initialized', 'true');
  } else if (!items) {
    items = [];
  }
  
  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center glass-card rounded-3xl border border-white/10">
        <span class="material-symbols-outlined text-5xl mb-4 opacity-40 text-primary">restaurant_menu</span>
        <h2 class="font-headline text-3xl text-on-surface mb-2">Menu Coming Soon</h2>
        <p class="text-sm text-on-surface-variant max-w-md mx-auto">
          Our master chefs are currently curating an exquisite culinary experience. Please check back shortly for our live menu.
        </p>
      </div>`;
    return;
  }

  // Group items by category
  const categories = {
    starters: { title: 'Signature Starters & Royal Kebabs', subtitle: 'Course 01' },
    biryani: { title: 'Royal Dum Biryanis', subtitle: 'Course 02' },
    mains: { title: 'Imperial Curries & Dal', subtitle: 'Course 03' },
    breads: { title: 'Artisanal Breads', subtitle: 'Accompaniments' },
    desserts: { title: 'Sweet Finales', subtitle: 'Desserts' },
    drinks: { title: 'Smoked Elixirs & Bar', subtitle: 'Beverages' }
  };

  const currentFilter = window.currentCategoryFilter || 'all';
  const dietaryFilter = window.currentDietaryFilter || 'all';
  const searchTerm = (window.currentSearchTerm || '').toLowerCase();

  let html = '';

  for (const [catKey, catMeta] of Object.entries(categories)) {
    // Apply filters
    const catItems = items.filter(item => {
      if (item.category !== catKey) return false;
      if (currentFilter !== 'all' && currentFilter !== catKey) return false;
      if (dietaryFilter !== 'all' && !item.dietary.split(' ').includes(dietaryFilter)) return false;
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && !item.desc.toLowerCase().includes(searchTerm)) return false;
      return true;
    });

    if (catItems.length === 0) continue;

    html += `
      <div class="menu-section" data-section="${catKey}">
        <div class="flex items-center justify-between border-b border-white/15 pb-3 mb-6">
          <h2 class="font-headline text-2xl md:text-3xl text-on-surface flex items-center gap-3">
            <span class="w-3 h-3 rounded-full bg-primary"></span>
            ${catMeta.title}
          </h2>
          <span class="text-xs uppercase tracking-wider text-primary font-bold bg-primary/10 px-3 py-1 rounded-full border border-primary/20">${catMeta.subtitle}</span>
        </div>
        <div class="space-y-6">
    `;

    catItems.forEach(item => {
      const isVeg = item.dietary.includes('veg') && !item.dietary.includes('non-veg');
      const iconClass = isVeg ? 'veg-indicator' : 'non-veg-indicator';
      const iconTitle = isVeg ? 'Vegetarian' : 'Non-Vegetarian';
      
      let badges = `<span class="px-2.5 py-0.5 rounded-full ${isVeg ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} border text-[11px] font-semibold">${isVeg ? 'Pure Veg' : 'Non-Veg'}</span>`;
      
      if (item.dietary.includes('special')) {
        badges += ` <span class="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 text-[11px] font-bold">Chef's Special</span>`;
      }

      html += `
        <div class="menu-item glass-card p-5 rounded-2xl flex items-start justify-between group border border-transparent hover:border-primary/30 transition-all" data-title="${item.name}">
          <div class="flex-1 pr-4">
            <div class="flex items-center w-full mb-1">
              <span class="${iconClass} mr-2.5 flex-shrink-0" title="${iconTitle}"></span>
              <h3 class="font-headline text-lg sm:text-xl text-on-surface font-semibold group-hover:text-primary transition-colors">${item.name}</h3>
              <div class="dashed-separator"></div>
              <span class="font-display text-xl text-primary font-bold whitespace-nowrap">₹ ${item.price}</span>
            </div>
            <p class="text-on-surface-variant text-xs sm:text-sm leading-relaxed mb-3">
              ${item.desc}
            </p>
            <div class="flex flex-wrap items-center gap-2">
              ${badges}
            </div>
          </div>
          <button onclick="addToCart('${item.id}', '${item.name}', ${item.price})" class="mt-2 px-5 py-2.5 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-on-primary border border-primary/50 text-xs font-bold whitespace-nowrap transition-all shadow-sm">
            + Add
          </button>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  if (html === '') {
    html = `
      <div id="noResultsNotice" class="text-center py-16 glass-card rounded-3xl border border-white/10">
        <span class="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">search_off</span>
        <h3 class="font-headline text-xl text-on-surface mb-2">No Matching Dishes Found</h3>
        <p class="text-xs text-on-surface-variant max-w-sm mx-auto mb-6">Try adjusting your search terms or resetting the classification filters.</p>
        <button onclick="resetFilters()" class="bg-primary text-on-primary px-6 py-2 rounded-full text-xs font-bold">Reset Filters</button>
      </div>`;
  }

  container.innerHTML = html;
  
  // Re-sync stock overlay to immediately gray out 86'd items
  if (typeof syncMenuStock === 'function') syncMenuStock();
}
