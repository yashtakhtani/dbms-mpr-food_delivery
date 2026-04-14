let data = [];

async function load() {
    data = await api('/api/orders');
    renderTable();
}

function statusBadge(s) {
    if (!s) return '—';
    const cls = s === 'SUCCESS' ? 'badge-success' : s === 'FAILED' ? 'badge-danger' : 'badge-warning';
    return `<span class="badge ${cls}">${s}</span>`;
}

function renderTable() {
    const q = document.getElementById('search').value.toLowerCase();
    const f = data.filter(o =>
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.restaurant_name || '').toLowerCase().includes(q) ||
        String(o.order_id).includes(q)
    );
    document.getElementById('tbody').innerHTML = f.map(o => `
    <tr>
      <td><strong>#${o.order_id}</strong></td>
      <td>${o.order_date ? new Date(o.order_date).toLocaleDateString('en-IN') : '—'}</td>
      <td>${o.customer_name || o.customer_id}</td>
      <td>${o.restaurant_name || o.restaurant_id}</td>
      <td>${o.driver_name || o.driver_id || '—'}</td>
      <td>₹${Number(o.amount).toLocaleString()}</td>
      <td>${statusBadge(o.payment_status)} ${o.payment_method ? '<span style="font-size:0.75rem;color:var(--text-secondary)">' + o.payment_method + '</span>' : ''}</td>
      <td class="actions">
        <button class="btn btn-danger btn-sm" onclick="del(${o.order_id})"><i data-lucide="trash-2" style="width:14px"></i></button>
      </td>
    </tr>
  `).join('');
    if (window.lucide) lucide.createIcons();
}

function openAdd() {
    ['fId', 'fDate', 'fAmount', 'fCust', 'fRest', 'fDriver', 'fPayment', 'fFoods'].forEach(id => document.getElementById(id).value = '');
    openModal('addModal');
}

async function save() {
    const body = {
        order_id: +document.getElementById('fId').value,
        order_date: document.getElementById('fDate').value,
        amount: +document.getElementById('fAmount').value,
        customer_id: document.getElementById('fCust').value,
        restaurant_id: +document.getElementById('fRest').value,
        driver_id: +document.getElementById('fDriver').value,
        payment_id: +document.getElementById('fPayment').value,
        foods: document.getElementById('fFoods').value.split(',').map(s => s.trim()).filter(Boolean)
    };
    await api('/api/orders', { method: 'POST', body });
    showToast('Order placed successfully');
    closeModal('addModal');
    load();
}

async function del(id) {
    if (!confirm('Delete this order?')) return;
    await api(`/api/orders/${id}`, { method: 'DELETE' });
    showToast('Order deleted');
    load();
}

document.querySelector('.modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('addModal');
});

load();
