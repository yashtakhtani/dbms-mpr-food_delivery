let data = [];

const SORT_CFG = { idKey: 'driver_id', nameKey: 'driver_name' };
const EXPORT_COLS = [
  { header: 'ID', key: 'driver_id' },
  { header: 'Name', key: 'driver_name' },
  { header: 'Phone', key: 'driver_phone' }
];

function getDisplayRows() {
  const sortEl = document.getElementById('sortSelect');
  const mode = sortEl ? sortEl.value : 'default';
  return TableTools.sortRows(data, mode, SORT_CFG);
}

function renderTable() {
  const tbody = document.getElementById('tbody');
  const rows = getDisplayRows();
  tbody.innerHTML = rows.map(d => `
      <tr>
        <td><strong>${d.driver_id}</strong></td>
        <td>${d.driver_name}</td>
        <td>${d.driver_phone || '—'}</td>
        <td class="actions">
          <button class="btn btn-danger btn-sm" onclick="del('${String(d.driver_id).replace(/'/g, "\\'")}')"><i data-lucide="trash-2" style="width:14px"></i></button>
        </td>
      </tr>
    `).join('');
  if (window.lucide) lucide.createIcons();
}

async function save() {
  const body = {
    driver_id: document.getElementById('fId').value,
    driver_name: document.getElementById('fName').value,
    driver_phone: document.getElementById('fPhone').value,
    driver_address: ''
  };
  await api('/api/drivers', { method: 'POST', body });
  showToast('Driver added');
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
  document.getElementById('fPhone').value = '';
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
