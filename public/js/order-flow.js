let wizardStep = 1;
let selectedRestaurant = null;
let restaurantsCache = [];
let menuCache = [];
let cart = [];
let customerInfo = { customer_name: '', phone: '', email: '', address: '' };
let selectedPayMethod = 'UPI';
let placingOrder = false;

function getSubtotal() {
  return cart.reduce((sum, i) => sum + (Number(i.price) * Number(i.qty)), 0);
}

function getDeliveryFee() {
  return cart.length > 0 ? 40 : 0;
}

function getGrandTotal() {
  return getSubtotal() + getDeliveryFee();
}

function resetWizardState() {
  wizardStep = 1;
  selectedRestaurant = null;
  restaurantsCache = [];
  menuCache = [];
  cart = [];
  customerInfo = { customer_name: '', phone: '', email: '', address: '' };
  selectedPayMethod = 'UPI';
  placingOrder = false;
}

function openOrderWizard() {
  resetWizardState();
  renderStep();
  openModal('orderWizardModal');
}

function closeOrderWizard() {
  closeModal('orderWizardModal');
}

function updateIndicators() {
  for (let i = 1; i <= 4; i += 1) {
    const el = document.getElementById(`stepIndicator${i}`);
    if (el) el.classList.toggle('active', i <= wizardStep);
  }
}

function renderStep() {
  const content = document.getElementById('wizardContent');
  const title = document.getElementById('wizardTitle');
  const nextBtn = document.getElementById('wizNextBtn');
  const prevBtn = document.getElementById('wizPrevBtn');
  if (!content || !title || !nextBtn || !prevBtn) return;

  updateIndicators();
  prevBtn.style.visibility = wizardStep === 1 ? 'hidden' : 'visible';
  nextBtn.disabled = placingOrder;
  nextBtn.textContent = wizardStep === 4 ? (placingOrder ? 'Processing...' : 'Pay & Place Order') : 'Next';

  if (wizardStep === 1) {
    title.textContent = 'Step 1: Choose Restaurant';
    renderRestaurantStep();
    return;
  }
  if (wizardStep === 2) {
    title.textContent = `Step 2: Build Cart (${selectedRestaurant.restaurant_name})`;
    renderMenuStep();
    return;
  }
  if (wizardStep === 3) {
    title.textContent = 'Step 3: Delivery Details';
    renderAddressStep();
    return;
  }
  title.textContent = 'Step 4: Payment & Confirm';
  renderPaymentStep();
}

async function renderRestaurantStep() {
  const content = document.getElementById('wizardContent');
  content.innerHTML = '<div class="loading">Loading restaurants...</div>';
  try {
    restaurantsCache = await api('/api/restaurants');
    if (!restaurantsCache.length) {
      content.innerHTML = '<div class="empty-state"><p>No restaurants found.</p></div>';
      return;
    }
    content.innerHTML = `
      <div class="restaurant-grid">
        ${restaurantsCache.map((r) => `
          <button type="button" class="selectable-card ${selectedRestaurant && selectedRestaurant.restaurant_id === r.restaurant_id ? 'selected' : ''}" onclick="selectRestaurant(${r.restaurant_id})">
            <i data-lucide="store" style="color:var(--accent)"></i>
            <strong>${r.restaurant_name}</strong>
            <span style="font-size:0.8rem;color:var(--text-secondary)">${r.location || 'Location unavailable'}</span>
            <div style="display:flex;align-items:center;gap:4px;font-size:0.8rem;color:var(--yellow)">
              <i data-lucide="star" style="width:12px;fill:currentColor"></i> ${Number(r.rating || 0).toFixed(1)}
            </div>
          </button>
        `).join('')}
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  } catch (_) {
    content.innerHTML = '<p class="error">Failed to load restaurants.</p>';
  }
}

function selectRestaurant(id) {
  const chosen = restaurantsCache.find((r) => Number(r.restaurant_id) === Number(id));
  if (!chosen) return;
  selectedRestaurant = chosen;
  menuCache = [];
  cart = [];
  renderStep();
}

function cartItemQty(foodName) {
  const item = cart.find((c) => c.food_name === foodName);
  return item ? item.qty : 0;
}

async function renderMenuStep() {
  const content = document.getElementById('wizardContent');
  if (!selectedRestaurant) {
    content.innerHTML = '<p class="error">Please select a restaurant first.</p>';
    return;
  }
  content.innerHTML = '<div class="loading">Loading menu...</div>';
  try {
    const allItems = await api('/api/food-items');
    menuCache = allItems.filter((i) => Number(i.restaurant_id) === Number(selectedRestaurant.restaurant_id));
    content.innerHTML = `
      <div class="menu-grid">
        ${menuCache.map((i) => `
          <div class="selectable-card">
            <strong>${i.food_name}</strong>
            <span>₹${Number(i.price).toLocaleString()}</span>
            <div style="display:flex;align-items:center;gap:10px;margin-top:10px">
              <button class="btn btn-sm" onclick="updateCartQty(${JSON.stringify(i.food_name)}, ${Number(i.price)}, -1)">-</button>
              <span>${cartItemQty(i.food_name)}</span>
              <button class="btn btn-sm btn-primary" onclick="updateCartQty(${JSON.stringify(i.food_name)}, ${Number(i.price)}, 1)">+</button>
            </div>
          </div>
        `).join('')}
      </div>
      ${renderCartSummaryHtml()}
    `;
    if (window.lucide) lucide.createIcons();
  } catch (_) {
    content.innerHTML = '<p class="error">Failed to load menu.</p>';
  }
}

function renderCartSummaryHtml() {
  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getGrandTotal();
  return `
    <div class="cart-summary" style="margin-top:1.5rem;padding:1rem;background:var(--bg);border-radius:var(--radius-md)">
      <h4>Your Cart</h4>
      ${cart.length === 0
    ? '<p>No items added yet.</p>'
    : `
          <div id="cartItemsList">
            ${cart.map((c) => `<div class="cart-item"><span>${c.food_name} x ${c.qty}</span><span>₹${(c.price * c.qty).toLocaleString()}</span></div>`).join('')}
          </div>
          <div class="cart-total"><span>Subtotal</span><span>₹${subtotal.toLocaleString()}</span></div>
          <div class="cart-total"><span>Delivery</span><span>₹${deliveryFee.toLocaleString()}</span></div>
          <div class="cart-total" style="font-weight:700"><span>Grand Total</span><span>₹${total.toLocaleString()}</span></div>
        `}
    </div>
  `;
}

function updateCartQty(foodName, price, delta) {
  const idx = cart.findIndex((c) => c.food_name === foodName);
  if (idx >= 0) {
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
  } else if (delta > 0) {
    cart.push({ food_name: foodName, price: Number(price), qty: 1 });
  }
  renderMenuStep();
}

function renderAddressStep() {
  const content = document.getElementById('wizardContent');
  content.innerHTML = `
    <div style="max-width:500px;margin:0 auto;display:flex;flex-direction:column;gap:1rem">
      <div class="form-group">
        <label>Mobile Number</label>
        <input type="text" id="wizPhone" placeholder="10-15 digit phone number" value="${customerInfo.phone || ''}">
      </div>
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="wizName" placeholder="Enter your name" value="${customerInfo.customer_name || ''}">
      </div>
      <div class="form-group">
        <label>Email (optional)</label>
        <input type="email" id="wizEmail" placeholder="you@example.com" value="${customerInfo.email || ''}">
      </div>
      <div class="form-group">
        <label>Delivery Address</label>
        <textarea id="wizAddress" placeholder="Flat, area, city, pincode" rows="3">${customerInfo.address || ''}</textarea>
      </div>
      ${renderCartSummaryHtml()}
    </div>
  `;
}

function paymentMethodCard(method, title, icon) {
  return `
    <button type="button" class="selectable-card ${selectedPayMethod === method ? 'selected' : ''}" onclick="selectPayMethod('${method}')">
      <i data-lucide="${icon}"></i>
      <strong>${title}</strong>
      <span style="font-size:0.8rem;color:var(--text-secondary)">Simulated secure payment</span>
    </button>
  `;
}

function renderPaymentStep() {
  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getGrandTotal();
  const content = document.getElementById('wizardContent');
  content.innerHTML = `
    <div style="display:grid;gap:1rem">
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0.75rem">
        ${paymentMethodCard('UPI', 'UPI', 'qr-code')}
        ${paymentMethodCard('CARD', 'Card', 'credit-card')}
        ${paymentMethodCard('COD', 'Cash on Delivery', 'banknote')}
      </div>
      <div class="cart-summary" style="padding:1rem;background:var(--bg);border-radius:var(--radius-md)">
        <h4>Review Order</h4>
        <div class="cart-item"><span>Restaurant</span><span>${selectedRestaurant ? selectedRestaurant.restaurant_name : '—'}</span></div>
        <div class="cart-item"><span>Phone</span><span>${customerInfo.phone || '—'}</span></div>
        <div class="cart-item"><span>Address</span><span style="max-width:300px;text-align:right">${customerInfo.address || '—'}</span></div>
        <div class="cart-item"><span>Subtotal</span><span>₹${subtotal.toLocaleString()}</span></div>
        <div class="cart-item"><span>Delivery fee</span><span>₹${deliveryFee.toLocaleString()}</span></div>
        <div class="cart-total" style="font-weight:700"><span>Total payable</span><span>₹${total.toLocaleString()}</span></div>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

function selectPayMethod(method) {
  selectedPayMethod = method;
  if (wizardStep === 4) renderPaymentStep();
}

function collectCustomerForm() {
  const phone = String(document.getElementById('wizPhone').value || '').replace(/\D/g, '');
  const customer_name = String(document.getElementById('wizName').value || '').trim();
  const email = String(document.getElementById('wizEmail').value || '').trim();
  const address = String(document.getElementById('wizAddress').value || '').trim();
  return { phone, customer_name, email, address };
}

function validateStep3() {
  const form = collectCustomerForm();
  if (!/^\d{10,15}$/.test(form.phone)) {
    showToast('Please enter a valid phone number (10-15 digits).', 'info');
    return null;
  }
  if (!form.customer_name) {
    showToast('Please enter your full name.', 'info');
    return null;
  }
  if (!form.address) {
    showToast('Please enter delivery address.', 'info');
    return null;
  }
  return form;
}

function wizBack() {
  if (placingOrder) return;
  if (wizardStep > 1) {
    wizardStep -= 1;
    renderStep();
  }
}

async function wizNext() {
  if (placingOrder) return;
  if (wizardStep === 1) {
    if (!selectedRestaurant) {
      showToast('Please select a restaurant.', 'info');
      return;
    }
    wizardStep += 1;
    renderStep();
    return;
  }
  if (wizardStep === 2) {
    if (!cart.length) {
      showToast('Please add at least one item to cart.', 'info');
      return;
    }
    wizardStep += 1;
    renderStep();
    return;
  }
  if (wizardStep === 3) {
    const validForm = validateStep3();
    if (!validForm) return;
    customerInfo = validForm;
    wizardStep += 1;
    renderStep();
    return;
  }
  await submitOrder();
}

async function submitOrder() {
  try {
    placingOrder = true;
    renderStep();

    const payload = {
      restaurant_id: selectedRestaurant.restaurant_id,
      items: cart.map((c) => ({ food_name: c.food_name, qty: c.qty })),
      customer: customerInfo,
      payment_method: selectedPayMethod
    };

    const res = await api('/api/checkout', { method: 'POST', body: payload });
    showToast(`Order #${res.order.order_id} placed successfully`, 'success');
    closeOrderWizard();
    if (typeof loadStats === 'function') loadStats();
  } catch (e) {
    showToast(`Checkout failed: ${e.message}`, 'error');
  } finally {
    placingOrder = false;
    renderStep();
  }
}

// Ensure inline onclick handlers always resolve in the browser.
if (typeof window !== 'undefined') {
  window.openOrderWizard = openOrderWizard;
  window.closeOrderWizard = closeOrderWizard;
  window.wizNext = wizNext;
  window.wizBack = wizBack;
  window.selectRestaurant = selectRestaurant;
  window.updateCartQty = updateCartQty;
  window.selectPayMethod = selectPayMethod;
}
