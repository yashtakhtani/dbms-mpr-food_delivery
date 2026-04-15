let data = [];

const SORT_CFG = { idKey: 'restaurant_id', nameKey: 'restaurant_name' };
const EXPORT_COLS = [
  { header: 'ID', key: 'restaurant_id' },
  { header: 'Name', key: 'restaurant_name' },
  { header: 'Rating', key: 'rating' },
  { header: 'Phone', key: 'phone' },
  { header: 'Location', key: 'location' }
];

function getDisplayRows() {
  const q = document.getElementById('search').value.toLowerCase();
  let filtered = data.filter(r =>
    r.restaurant_name.toLowerCase().includes(q) || (r.location || '').toLowerCase().includes(q)
  );
  const sortEl = document.getElementById('sortSelect');
  const mode = sortEl ? sortEl.value : 'default';
  return TableTools.sortRows(filtered, mode, SORT_CFG);
}

function renderTable() {
  const f = getDisplayRows();
  document.getElementById('tbody').innerHTML = f.map(r => `
    <tr>
      <td><strong>${r.restaurant_id}</strong></td>
      <td>${r.restaurant_name}</td>
      <td>
        <span class="rating">${'\u2605'.repeat(Math.round(r.rating || 0))}${'\u2606'.repeat(5 - Math.round(r.rating || 0))}</span>
        <span style="font-size:0.8rem; color:var(--text-secondary); margin-left:4px">${r.rating || 0}</span>
      </td>
      <td>${r.phone || '—'}</td>
      <td>${r.location || '—'}</td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" onclick="edit(${r.restaurant_id})"><i data-lucide="edit-2" style="width:14px"></i></button>
        <button class="btn btn-danger btn-sm" onclick="del(${r.restaurant_id})"><i data-lucide="trash-2" style="width:14px"></i></button>
      </td>
    </tr>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

function edit(id) {
  const r = data.find(x => x.restaurant_id === id);
  document.getElementById('modalTitle').textContent = 'Edit Restaurant';
  document.getElementById('editId').value = id;
  document.getElementById('fId').value = r.restaurant_id;
  document.getElementById('fId').disabled = true;
  document.getElementById('fName').value = r.restaurant_name;
  document.getElementById('fRating').value = r.rating || '';
  document.getElementById('fPhone').value = r.phone || '';
  document.getElementById('fLocation').value = r.location || '';
  openModal('addModal');
}

async function save() {
  const editId = document.getElementById('editId').value;
  const body = {
    restaurant_id: +document.getElementById('fId').value,
    restaurant_name: document.getElementById('fName').value,
    rating: +document.getElementById('fRating').value,
    phone: document.getElementById('fPhone').value,
    location: document.getElementById('fLocation').value
  };
  if (editId) {
    await api(`/api/restaurants/${editId}`, { method: 'PUT', body });
    showToast('Restaurant updated');
  } else {
    await api('/api/restaurants', { method: 'POST', body });
    showToast('Restaurant added');
  }
  closeModal('addModal');
  load();
}

async function del(id) {
  if (!confirm('Delete this restaurant?')) return;
  await api(`/api/restaurants/${id}`, { method: 'DELETE' });
  showToast('Restaurant deleted');
  load();
}

document.querySelector('.modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal('addModal');
});

TableTools.wireExportButtons({
  getRows: getDisplayRows,
  columns: EXPORT_COLS,
  baseFilename: 'restaurants',
  pdfTitle: 'FoodFlow — Restaurants'
});

async function load() {
  data = await api('/api/restaurants');
  renderTable();
}

load();
