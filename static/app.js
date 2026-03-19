'use strict';

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatEur(amount) {
  const abs  = Math.abs(amount).toLocaleString('de-AT', { minimumFractionDigits: 2 });
  return (amount < 0 ? '−' : '') + '€' + abs;
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  el.style.animation = 'none'; void el.offsetHeight; el.style.animation = '';
  el.classList.add('active');
}

function showAlert(id, message, type = 'error') {
  const el   = document.getElementById(id);
  const icon = type === 'error' ? '⚠' : type === 'success' ? '✓' : 'ℹ';
  el.className = 'alert show is-' + type;
  el.innerHTML = `<span class="alert-icon">${icon}</span><span>${escHtml(message)}</span>`;
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.className = 'alert';
}

async function api(method, path, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function doRegister() {
  hideAlert('reg-alert');
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const cc       = document.getElementById('reg-cc').value;

  if (!name || !email || !password || !cc)
    return showAlert('reg-alert', 'Please fill in all fields.');

  const { ok, data } = await api('POST', '/api/register', { name, email, password, credit_card: cc });
  if (!ok) return showAlert('reg-alert', data.error || 'Registration failed.');

  ['reg-name','reg-email','reg-password','reg-cc'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('login-email').value = email;
  showScreen('login');
}

async function doLogin() {
  hideAlert('login-alert');
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password)
    return showAlert('login-alert', 'Please enter your email and password.');

  const { ok, data } = await api('POST', '/api/login', { email, password });

  if (!ok) {
    if (data.locked) {
      showAlert('login-alert', data.error || 'Account locked.');
      document.getElementById('attempts-badge').style.display = 'none';
      return;
    }
    showAlert('login-alert', 'Incorrect password. Please try again.');
    const badge = document.getElementById('attempts-badge');
    if (typeof data.remaining === 'number') {
      badge.style.display = 'inline-block';
      badge.textContent   = `${data.remaining} attempt${data.remaining === 1 ? '' : 's'} remaining`;
    }
    document.getElementById('login-password').value = '';
    return;
  }

  document.getElementById('login-password').value = '';
  document.getElementById('attempts-badge').style.display = 'none';
  openDashboard(data);
}

function openDashboard(userData) {
  document.getElementById('sb-name').textContent   = userData.name;
  document.getElementById('sb-avatar').textContent = userData.name[0].toUpperCase();
  document.getElementById('sb-card').textContent   = userData.credit_card;
  loadBalance();
  showScreen('dashboard');
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-add').classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-panel="panel-add"]').classList.add('active');
}

async function loadBalance() {
  const { ok, data } = await api('GET', '/api/transactions');
  if (!ok) return;
  const el  = document.getElementById('sb-balance');
  const bal = data.balance ?? 0;
  el.textContent = formatEur(bal);
  el.className   = 'balance-amount' + (bal < 0 ? ' is-negative' : '');
}

async function doLogout() {
  await api('POST', '/api/logout');
  showScreen('register');
}

function switchPanel(btn) {
  const panelId = btn.dataset.panel;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(panelId).classList.add('active');
  if (panelId === 'panel-list') renderTransactions();
}

async function doAddTx() {
  hideAlert('tx-alert');
  const amount      = parseFloat(document.getElementById('tx-amount').value);
  const category    = document.getElementById('tx-cat').value.trim();
  const description = document.getElementById('tx-desc').value.trim();

  if (isNaN(amount)) return showAlert('tx-alert', 'Please enter a valid amount.');

  const { ok, data } = await api('POST', '/api/transactions', { amount, category, description });
  if (!ok) return showAlert('tx-alert', data.error || 'Could not add transaction.');

  document.getElementById('tx-amount').value = '';
  document.getElementById('tx-cat').value    = '';
  document.getElementById('tx-desc').value   = '';

  const el  = document.getElementById('sb-balance');
  const bal = data.balance ?? 0;
  el.textContent = formatEur(bal);
  el.className   = 'balance-amount' + (bal < 0 ? ' is-negative' : '');

  showAlert('tx-alert', 'Transaction added successfully.', 'success');
  setTimeout(() => hideAlert('tx-alert'), 2600);
}

async function renderTransactions() {
  const container = document.getElementById('tx-tbody');
  container.innerHTML = '<div class="empty-state"><p>Loading…</p></div>';

  const { ok, data } = await api('GET', '/api/transactions');
  if (!ok) { container.innerHTML = '<div class="empty-state"><p>Could not load transactions.</p></div>'; return; }

  const txs = data.transactions ?? [];
  if (!txs.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <rect x="3.5" y="3.5" width="13" height="13" rx="2"/>
            <line x1="6.5" y1="7.5" x2="13.5" y2="7.5"/>
            <line x1="6.5" y1="10"  x2="13.5" y2="10"/>
            <line x1="6.5" y1="12.5" x2="10"  y2="12.5"/>
          </svg>
        </div>
        <p>No transactions yet</p>
      </div>`;
    return;
  }

  container.innerHTML = txs.map(t => {
    const cls = t.amount >= 0 ? 'is-positive' : 'is-negative';
    return `
      <div class="tx-row">
        <div><div class="tx-desc">${escHtml(t.description)}</div></div>
        <div><span class="tx-badge">${escHtml(t.category)}</span></div>
        <div class="tx-date">${escHtml(t.date)}</div>
        <div class="tx-amount ${cls}">${formatEur(t.amount)}</div>
      </div>`;
  }).join('');
}

async function doFilterCat() {
  const cat = document.getElementById('cat-input').value.trim();
  if (!cat) return;

  const { ok, data } = await api('GET', `/api/transactions/category?name=${encodeURIComponent(cat)}`);
  const result = document.getElementById('cat-result');
  if (!ok) { result.classList.remove('show'); return; }

  result.innerHTML = `
    <p class="cat-result-label">Total for &ldquo;${escHtml(data.category)}&rdquo;</p>
    <p class="cat-result-amount">${formatEur(data.total)}</p>`;
  result.classList.add('show');
}