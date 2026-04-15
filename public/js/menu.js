let data = [];

const SORT_CFG = {
  idKey: (r) => r.food_id || r.food_name,
  nameKey: 'food_name'
};
const EXPORT_COLS = [
  { header: 'ID', accessor: (r) => r.food_id || r.food_name || '' },
  { header: 'Name', key: 'food_name' },
  { header: 'Price', key: 'price' },
  { header: 'Rating', key: 'rating' }
];

function getDisplayRows() {
  const sortEl = document.getElementById('sortSelect');
  const mode = sortEl ? sortEl.value : 'default';
  return TableTools.sortRows(data, mode, SORT_CFG);
}

function renderTable() {
  const tbody = document.getElementById('tbody');
  const rows = getDisplayRows();
  tbody.innerHTML = rows.map(i => `
    <tr>
      <td><strong>${i.food_id || i.food_name}</strong></td>
      <td>${i.food_name}</td>
      <td>\u20B9${Number(i.price).toLocaleString()}</td>
      <td><span class="rating">${'\u2605'.repeat(Math.round(i.rating || 0))}${'\u2606'.repeat(5 - Math.round(i.rating || 0))}</span></td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" onclick="edit(${JSON.stringify(String(i.food_id || i.food_name))})"><i data-lucide="edit-2" style="width:14px"></i></button>
        <button class="btn btn-danger btn-sm" onclick="del(${JSON.stringify(String(i.food_id || i.food_name))})"><i data-lucide="trash-2" style="width:14px"></i></button>
      </td>
    </tr>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

function edit(id) {
  const i = data.find(x => (x.food_id || x.food_name) === id);
  document.getElementById('modalTitle').textContent = 'Edit Food Item';
  document.getElementById('editId').value = id;
  document.getElementById('fId').value = i.food_id || '';
  document.getElementById('fId').disabled = !!i.food_id;
  document.getElementById('fName').value = i.food_name;
  document.getElementById('fPrice').value = i.price;
  document.getElementById('fRating').value = i.rating || '';
  openModal('addModal');
}

async function save() {
  const editId = document.getElementById('editId').value;
  const body = {
    food_id: document.getElementById('fId').value,
    food_name: document.getElementById('fName').value,
    price: Number(document.getElementById('fPrice').value),
    rating: Number(document.getElementById('fRating').value)
  };
  if (editId) {
    await api(`/api/food-items/${encodeURIComponent(editId)}`, { method: 'PUT', body });
    showToast('Item updated');
  } else {
    await api('/api/food-items', { method: 'POST', body });
    showToast('Item added');
  }
  closeModal('addModal');
  resetForm();
  load();
}

async function del(id) {
  if (!confirm('Delete this item?')) return;
  await api(`/api/food-items/${encodeURIComponent(id)}`, { method: 'DELETE' });
  showToast('Item deleted');
  load();
}

function resetForm() {
  document.getElementById('editId').value = '';
  document.getElementById('fId').value = '';
  document.getElementById('fId').disabled = false;
  document.getElementById('fName').value = '';
  document.getElementById('fPrice').value = '';
  document.getElementById('fRating').value = '';
  document.getElementById('modalTitle').textContent = 'Add Food Item';
}

document.querySelector('.modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) { closeModal('addModal'); resetForm(); }
});

TableTools.wireExportButtons({
  getRows: getDisplayRows,
  columns: EXPORT_COLS,
  baseFilename: 'menu_items',
  pdfTitle: 'FoodFlow — Menu items'
});

async function load() {
  data = await api('/api/food-items');
  renderTable();
}

load();
