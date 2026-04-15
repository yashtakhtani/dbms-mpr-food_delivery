try {
  if (localStorage.getItem('foodflow-theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  const savedVariant = localStorage.getItem('foodflow-ui-variant');
  if (savedVariant === 'minimal' || savedVariant === 'neon') {
    document.documentElement.setAttribute('data-ui-variant', savedVariant);
  } else {
    document.documentElement.setAttribute('data-ui-variant', 'minimal');
  }
} catch (e) { /* ignore */ }

const API = '';
const ACTIVITY_KEY = 'foodflow_activity';
const ACTIVITY_MAX = 50;

async function api(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  try {
    const res = await fetch(API + url, {
      ...options,
      headers: { ...headers, ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (res.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  }
}

function getActivityList() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
  } catch (_) {
    return [];
  }
}

function pushActivity(message) {
  try {
    const list = getActivityList();
    list.unshift({
      id: Date.now(),
      message,
      at: new Date().toISOString()
    });
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(list.slice(0, ACTIVITY_MAX)));
    updateNotifBadge();
    renderNotifList();
  } catch (e) { /* ignore */ }
}

function clearActivities() {
  try {
    localStorage.removeItem(ACTIVITY_KEY);
    updateNotifBadge();
    renderNotifList();
  } catch (e) { /* ignore */ }
}

function updateNotifBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  const n = getActivityList().length;
  badge.textContent = n > 99 ? '99+' : String(n);
  badge.hidden = n === 0;
}

function formatNotifTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (_) {
    return '';
  }
}

function renderNotifList() {
  const ul = document.getElementById('notifList');
  if (!ul) return;
  const items = getActivityList();
  if (items.length === 0) {
    ul.innerHTML = '<li class="sidebar-notif-empty">No activity yet. Saves and deletes appear here.</li>';
    return;
  }
  ul.innerHTML = items.slice(0, 30).map((it) => `
    <li class="sidebar-notif-row">
      <span class="sidebar-notif-msg">${escapeHtml(it.message)}</span>
      <span class="sidebar-notif-time">${formatNotifTime(it.at)}</span>
    </li>
  `).join('');
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function setTheme(mode) {
  if (mode === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  try {
    localStorage.setItem('foodflow-theme', mode);
  } catch (e) { /* ignore */ }
  syncThemeToggleIcons();
}

function syncThemeToggleIcons() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.querySelectorAll('.theme-icon-light').forEach((el) => {
    el.style.display = dark ? 'none' : '';
  });
  document.querySelectorAll('.theme-icon-dark').forEach((el) => {
    el.style.display = dark ? '' : 'none';
  });
}

function getUiVariant() {
  const v = document.documentElement.getAttribute('data-ui-variant');
  return v === 'neon' ? 'neon' : 'minimal';
}

function syncUiVariantToggle() {
  const variant = getUiVariant();
  document.querySelectorAll('.variant-icon-minimal').forEach((el) => {
    el.style.display = variant === 'minimal' ? '' : 'none';
  });
  document.querySelectorAll('.variant-icon-neon').forEach((el) => {
    el.style.display = variant === 'neon' ? '' : 'none';
  });
  const btn = document.getElementById('variantToggle');
  if (btn) {
    btn.title = variant === 'minimal' ? 'Switch to Premium Neon Glass' : 'Switch to Super Minimal';
    btn.setAttribute('aria-label', btn.title);
  }
}

function setUiVariant(variant) {
  const next = variant === 'neon' ? 'neon' : 'minimal';
  document.documentElement.setAttribute('data-ui-variant', next);
  try {
    localStorage.setItem('foodflow-ui-variant', next);
  } catch (e) { /* ignore */ }
  syncUiVariantToggle();
}

function initDashboardChrome() {
  const top = document.querySelector('.top-bar');
  if (!top || top.dataset.chromeInit) return;
  top.dataset.chromeInit = '1';

  const chrome = document.createElement('div');
  chrome.className = 'top-bar-chrome';
  chrome.innerHTML = `
    <button type="button" class="icon-btn" id="variantToggle" title="Switch visual style" aria-label="Switch visual style">
      <i data-lucide="panel-top" class="variant-icon-minimal"></i>
      <i data-lucide="sparkles" class="variant-icon-neon" style="display:none"></i>
    </button>
    <button type="button" class="icon-btn" id="themeToggle" title="Light / dark mode" aria-label="Toggle theme">
      <i data-lucide="sun" class="theme-icon-light"></i>
      <i data-lucide="moon" class="theme-icon-dark" style="display:none"></i>
    </button>
  `;
  top.insertBefore(chrome, top.firstChild);

  document.getElementById('variantToggle').addEventListener('click', () => {
    const next = getUiVariant() === 'minimal' ? 'neon' : 'minimal';
    setUiVariant(next);
    if (window.lucide) lucide.createIcons();
  });

  document.getElementById('themeToggle').addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(dark ? 'light' : 'dark');
    if (window.lucide) lucide.createIcons();
  });

  syncUiVariantToggle();
  syncThemeToggleIcons();
  if (window.lucide) lucide.createIcons();
}

function initSidebarNotifications() {
  const sidebar = document.querySelector('.app-container .sidebar');
  if (!sidebar || document.getElementById('sidebarNotifSection')) return;
  const footer = sidebar.querySelector('.sidebar-footer');
  if (!footer) return;

  const block = document.createElement('div');
  block.className = 'sidebar-notifications';
  block.id = 'sidebarNotifSection';
  block.innerHTML = `
    <div class="sidebar-notif-head">
      <span class="sidebar-notif-label"><i data-lucide="bell"></i> Activity</span>
      <span class="sidebar-notif-badge" id="notifBadge" hidden>0</span>
    </div>
    <button type="button" class="sidebar-notif-clear" id="sidebarNotifClear">Clear all</button>
    <ul class="sidebar-notif-list" id="notifList"></ul>
  `;
  sidebar.insertBefore(block, footer);

  document.getElementById('sidebarNotifClear').addEventListener('click', (e) => {
    e.preventDefault();
    clearActivities();
  });

  renderNotifList();
  updateNotifBadge();
  if (window.lucide) lucide.createIcons();
}

function showToast(msg, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'check-circle' : type === 'info' ? 'info' : 'alert-circle';
  toast.innerHTML = `<i data-lucide="${icon}" style="width:16px"></i> ${msg}`;
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => toast.remove(), 3000);

  if (type === 'success') {
    pushActivity(msg);
  }
}

const toast = showToast;

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

function checkAuth() {
  const path = window.location.pathname;
  const publicPages = ['/login', '/signup'];
  const token = localStorage.getItem('token');

  if (!token && !publicPages.includes(path)) {
    window.location.href = '/login';
  } else if (token && publicPages.includes(path)) {
    window.location.href = '/';
  }
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.sidebar-link[href]').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === path);
  });
}

function hydrateUserChip() {
  const nameEl = document.getElementById('userName');
  const avEl = document.getElementById('userAvatar');
  if (!nameEl || !avEl) return;
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    const name = u.full_name || u.username || 'Account';
    nameEl.textContent = name;
    avEl.textContent = String(name).trim().charAt(0).toUpperCase() || '?';
  } catch (_) {
    avEl.textContent = '?';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setActiveNav();
  hydrateUserChip();
  initSidebarNotifications();
  initDashboardChrome();
  if (window.lucide) lucide.createIcons();
});
