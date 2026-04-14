let data = [];

async function load() {
  data = await api('/api/customers');
  renderTable();
}

function renderTable() {
  const q = document.getElementById('search').value.toLowerCase();
  const filtered = data.filter(c =>
    c.customer_id.toLowerCase().includes(q) ||
    c.customer_name.toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q)
  );
  document.getElementById('tbody').innerHTML = filtered.map(c => `
    <tr>
      <td><strong>${c.customer_id}</strong></td>
      <td>${c.customer_name}</td>
      <td>${c.email || '—'}</td>
      <td>${c.address || '—'}</td>
      <td>${c.phones || '—'}</td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" onclick="edit('${c.customer_id}')"><i data-lucide="edit-2" style="width:14px"></i></button>
        <button class="btn btn-danger btn-sm" onclick="del('${c.customer_id}')"><i data-lucide="trash-2" style="width:14px"></i></button>
      </td>
    </tr>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

function edit(id) {
  const c = data.find(x => x.customer_id === id);
  document.getElementById('modalTitle').textContent = 'Edit Customer';
  document.getElementById('editId').value = id;
  document.getElementById('fId').value = c.customer_id;
  document.getElementById('fId').disabled = true;
  document.getElementById('fName').value = c.customer_name;
  document.getElementById('fEmail').value = c.email || '';
  document.getElementById('fAddress').value = c.address || '';
  document.getElementById('fPhone').value = c.phones || '';
  openModal('addModal');
}

async function save() {
  const editId = document.getElementById('editId').value;
  const body = {
    customer_id: document.getElementById('fId').value,
    customer_name: document.getElementById('fName').value,
    email: document.getElementById('fEmail').value,
    address: document.getElementById('fAddress').value,
    phones: document.getElementById('fPhone').value.split(',').map(p => p.trim()).filter(Boolean)
  };
  if (editId) {
    await api(`/api/customers/${editId}`, { method: 'PUT', body });
    showToast('Customer updated');
  } else {
    await api('/api/customers', { method: 'POST', body });
    showToast('Customer added');
  }
  closeModal('addModal');
  resetForm();
  load();
}

async function del(id) {
  if (!confirm('Delete this customer?')) return;
  await api(`/api/customers/${id}`, { method: 'DELETE' });
  showToast('Customer deleted');
  load();
}

function resetForm() {
  document.getElementById('editId').value = '';
  document.getElementById('fId').value = '';
  document.getElementById('fId').disabled = false;
  document.getElementById('fName').value = '';
  document.getElementById('fEmail').value = '';
  document.getElementById('fAddress').value = '';
  document.getElementById('fPhone').value = '';
  document.getElementById('modalTitle').textContent = 'Add Customer';
}

document.querySelector('.modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) { closeModal('addModal'); resetForm(); }
});

load();
