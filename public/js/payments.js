let data = [];

const SORT_CFG = { idKey: 'payment_id', nameKey: 'payment_method' };
const EXPORT_COLS = [
  { header: 'ID', key: 'payment_id' },
  { header: 'Status', key: 'payment_status' },
  { header: 'Amount', key: 'amount' },
  { header: 'Date', accessor: (p) => (p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : '') },
  { header: 'Method', key: 'payment_method' }
];

function statusBadge(s) {
  const cls = s === 'SUCCESS' ? 'badge-success' : s === 'FAILED' ? 'badge-danger' : 'badge-warning';
  return `<span class="badge ${cls}">${s}</span>`;
}

function getDisplayRows() {
  const q = document.getElementById('search').value.toLowerCase();
  let filtered = data.filter(p =>
    String(p.payment_id).includes(q) ||
    (p.payment_method || '').toLowerCase().includes(q) ||
    (p.payment_status || '').toLowerCase().includes(q)
  );
  const sortEl = document.getElementById('sortSelect');
  const mode = sortEl ? sortEl.value : 'default';
  return TableTools.sortRows(filtered, mode, SORT_CFG);
}

function renderTable() {
  const f = getDisplayRows();
  document.getElementById('tbody').innerHTML = f.map(p => `
    <tr>
      <td><strong>#${p.payment_id}</strong></td>
      <td>${statusBadge(p.payment_status)}</td>
      <td>\u20B9${Number(p.amount).toLocaleString()}</td>
      <td>${p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : '—'}</td>
      <td><span class="badge badge-info">${p.payment_method}</span></td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" onclick="edit(${p.payment_id})"><i data-lucide="edit-2" style="width:14px"></i></button>
        <button class="btn btn-danger btn-sm" onclick="del(${p.payment_id})"><i data-lucide="trash-2" style="width:14px"></i></button>
      </td>
    </tr>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

function edit(id) {
  const p = data.find(x => String(x.payment_id) === String(id));
  if (!p) return showToast('Payment not found', 'error');
  document.getElementById('modalTitle').textContent = 'Edit Payment';
  document.getElementById('editId').value = id;
  document.getElementById('fId').value = p.payment_id;
  document.getElementById('fId').disabled = true;
  document.getElementById('fStatus').value = p.payment_status;
  document.getElementById('fAmount').value = p.amount;
  document.getElementById('fDate').value = p.payment_date ? p.payment_date.split('T')[0] : '';
  document.getElementById('fMethod').value = p.payment_method;
  openModal('addModal');
}

async function save() {
  const editId = document.getElementById('editId').value;
  const idValue = document.getElementById('fId').value;
  const statusValue = document.getElementById('fStatus').value;
  const amountValue = Number(document.getElementById('fAmount').value);
  const dateValue = document.getElementById('fDate').value;
  const methodValue = document.getElementById('fMethod').value;

  if (!editId && !idValue) return showToast('Enter Payment ID for new payment', 'info');
  if (!statusValue || !methodValue) return showToast('Select status and method', 'info');
  if (!Number.isFinite(amountValue) || amountValue <= 0) return showToast('Enter a valid amount', 'info');

  const body = {
    payment_id: idValue ? Number(idValue) : undefined,
    payment_status: statusValue,
    amount: amountValue,
    payment_date: dateValue || undefined,
    payment_method: methodValue
  };
  if (editId) {
    await api(`/api/payments/${editId}`, { method: 'PUT', body });
    showToast('Payment updated');
  } else {
    await api('/api/payments', { method: 'POST', body });
    showToast('Payment added');
  }
  closeModal('addModal');
  resetForm();
  load();
}

async function del(id) {
  if (!confirm('Delete this payment?')) return;
  await api(`/api/payments/${id}`, { method: 'DELETE' });
  showToast('Payment deleted');
  load();
}

document.querySelector('.modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) { closeModal('addModal'); resetForm(); }
});

function resetForm() {
  document.getElementById('editId').value = '';
  document.getElementById('fId').value = '';
  document.getElementById('fId').disabled = false;
  document.getElementById('fStatus').value = 'SUCCESS';
  document.getElementById('fAmount').value = '';
  document.getElementById('fDate').value = '';
  document.getElementById('fMethod').value = 'UPI';
  document.getElementById('modalTitle').textContent = 'Add Payment';
}

TableTools.wireExportButtons({
  getRows: getDisplayRows,
  columns: EXPORT_COLS,
  baseFilename: 'payments',
  pdfTitle: 'FoodFlow — Payments'
});

async function load() {
  data = await api('/api/payments');
  renderTable();
}

load();
