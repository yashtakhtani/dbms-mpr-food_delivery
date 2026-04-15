let data = [];

const SORT_CFG = { idKey: 'driver_id', nameKey: 'driver_name' };
const EXPORT_COLS = [
  { header: 'ID', key: 'driver_id' },
  { header: 'Name', key: 'driver_name' },
  { header: 'Vehicle', key: 'vehicle_details' },
  { header: 'Phone', key: 'driver_phone' },
  { header: 'Status', key: 'status' }
];

function getDisplayRows() {
  const sortEl = document.getElementById('sortSelect');
  const mode = sortEl ? sortEl.value : 'default';
  return TableTools.sortRows(data, mode, SORT_CFG);
}

function renderTable() {
  const tbody = document.getElementById('tbody');
  const rows = getDisplayRows();
  tbody.innerHTML = rows.map(d => {
    const statusClass = d.status === 'Available' ? 'success' : d.status === 'On Delivery' ? 'warning' : 'danger';
    return `
      <tr>
        <td><strong>${d.driver_id}</strong></td>
        <td>${d.driver_name}</td>
        <td>${d.vehicle_details || '—'}</td>
        <td>${d.driver_phone || '—'}</td>
        <td><span class="badge badge-${statusClass}">${d.status || 'Offline'}</span></td>
        <td class="actions">
          <button class="btn btn-secondary btn-sm" onclick="edit('${String(d.driver_id).replace(/'/g, "\\'")}')"><i data-lucide="edit-2" style="width:14px"></i></button>
          <button class="btn btn-danger btn-sm" onclick="del('${String(d.driver_id).replace(/'/g, "\\'")}')"><i data-lucide="trash-2" style="width:14px"></i></button>
        </td>
      </tr>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

function edit(id) {
  const d = data.find(x => x.driver_id === id);
  document.getElementById('modalTitle').textContent = 'Edit Driver';
  document.getElementById('editId').value = id;
  document.getElementById('fId').value = d.driver_id;
  document.getElementById('fId').disabled = true;
  document.getElementById('fName').value = d.driver_name;
  document.getElementById('fVehicle').value = d.vehicle_details || '';
  document.getElementById('fPhone').value = d.driver_phone || '';
  document.getElementById('fStatus').value = d.status || 'Offline';
  openModal('addModal');
}

async function save() {
  const editId = document.getElementById('editId').value;
  const body = {
    driver_id: document.getElementById('fId').value,
    driver_name: document.getElementById('fName').value,
    vehicle_details: document.getElementById('fVehicle').value,
    driver_phone: document.getElementById('fPhone').value,
    status: document.getElementById('fStatus').value
  };
  if (editId) {
    await api(`/api/drivers/${editId}`, { method: 'PUT', body });
    showToast('Driver updated');
  } else {
    await api('/api/drivers', { method: 'POST', body });
    showToast('Driver added');
  }
  closeModal('addModal');
  resetForm();
  load();
}

async function del(id) {
  if (!confirm('Delete this driver?')) return;
  await api(`/api/drivers/${id}`, { method: 'DELETE' });
  showToast('Driver deleted');
  load();
}

function resetForm() {
  document.getElementById('editId').value = '';
  document.getElementById('fId').value = '';
  document.getElementById('fId').disabled = false;
  document.getElementById('fName').value = '';
  document.getElementById('fVehicle').value = '';
  document.getElementById('fPhone').value = '';
  document.getElementById('fStatus').value = 'Available';
  document.getElementById('modalTitle').textContent = 'Add Driver';
}

document.querySelector('.modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) { closeModal('addModal'); resetForm(); }
});

TableTools.wireExportButtons({
  getRows: getDisplayRows,
  columns: EXPORT_COLS,
  baseFilename: 'drivers',
  pdfTitle: 'FoodFlow — Drivers'
});

async function load() {
  data = await api('/api/drivers');
  renderTable();
}

load();
