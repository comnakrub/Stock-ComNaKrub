// diySpec: { [category]: { id, type, cost, qty, maxQty } }
let diySpec = {};
let currentTxId = null;
let catalogData = [];
let isConfirming = false;
let diySearchQuery = {};

const DIY_CATEGORIES = ['cpu', 'ram', 'm2', 'ssd', 'mainboard', 'vga', 'psu', 'monitor', 'pccase'];
const DIY_LABELS = { cpu: 'CPU', ram: 'RAM', m2: 'M.2', ssd: 'SSD', mainboard: 'Mainboard', vga: 'VGA', psu: 'PSU', monitor: 'Monitor', pccase: 'CASE' };

async function loadDiyCatalog() {
  const page = document.getElementById('page-diy');
  page.innerHTML = buildDiyShell();
  try {
    catalogData = await fetch('/api/diy/catalog').then(r => r.json());
    renderDiyTab(DIY_CATEGORIES[0]);
  } catch (e) {
    page.innerHTML = '<p style="padding:20px;color:#d85050">Failed to load catalog</p>';
  }
}

function buildDiyShell() {
  const tabs = DIY_CATEGORIES.map((cat, i) =>
    `<div class="diy-tab${i === 0 ? ' active' : ''}" onclick="selectDiyTab(this,'${cat}')">${DIY_LABELS[cat]}</div>`
  ).join('');

  const titleEn = 'DIY PC Builder'; const titleTh = 'ประกอบสเปคคอม';
  const clearEn = 'Clear All';      const clearTh = 'ล้างทั้งหมด';
  const prevEn  = 'Preview &amp; Confirm'; const prevTh = 'ดูสรุปและยืนยัน';
  const selEn   = 'Selected Spec';  const selTh = 'สเปคที่เลือก';
  const tcEn    = 'Total Cost';     const tcTh = 'ต้นทุนรวม';

  return `
    <div class="topbar">
      <h1 data-en="${titleEn}" data-th="${titleTh}">${currentLang === 'en' ? titleEn : titleTh}</h1>
      <div class="spacer"></div>
      <button class="btn btn-outline" onclick="clearDiySpec()"
              data-en="${clearEn}" data-th="${clearTh}">${currentLang === 'en' ? clearEn : clearTh}</button>
      <button class="btn btn-success" onclick="showDiyPreview()"
              data-en="${prevEn}" data-th="${prevTh}">${currentLang === 'en' ? prevEn : prevTh}</button>
    </div>
    <div class="diy-body">
      <div class="diy-left">
        <div class="diy-tabs">${tabs}</div>
        <input class="search-input" id="diy-search" type="text"
               placeholder="${currentLang === 'en' ? 'Search…' : 'ค้นหา…'}"
               oninput="filterDiyTab(this.value)" style="margin:8px;box-sizing:border-box;width:calc(100% - 16px)">
        <div class="diy-items" id="diy-items"></div>
      </div>
      <div class="diy-right">
        <div class="diy-spec-hdr" data-en="${selEn}" data-th="${selTh}">${currentLang === 'en' ? selEn : selTh}</div>
        <div class="diy-spec-list" id="diy-spec-list"></div>
        <div class="diy-foot">
          <div class="diy-total">
            <span style="color:#6096c0;font-size:12px" data-en="${tcEn}" data-th="${tcTh}">${currentLang === 'en' ? tcEn : tcTh}</span>
            <span style="color:#d97538;font-size:17px;font-weight:700" id="diy-total-val">฿0</span>
          </div>
          <button class="btn btn-success" style="width:100%;padding:8px" onclick="showDiyPreview()"
                  data-en="${prevEn}" data-th="${prevTh}">${currentLang === 'en' ? prevEn : prevTh}</button>
        </div>
      </div>
    </div>`;
}

function selectDiyTab(el, cat) {
  document.querySelectorAll('.diy-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const searchInput = document.getElementById('diy-search');
  if (searchInput) { searchInput.value = ''; diySearchQuery = {}; }
  renderDiyTab(cat);
}

function renderDiyTab(cat, query) {
  const entry = catalogData.find(c => c.category === cat);
  let items = entry ? entry.items : [];
  const container = document.getElementById('diy-items');

  if (query) {
    const q = query.toLowerCase();
    items = items.filter(item => item.Type.toLowerCase().includes(q) || (item.Brand && item.Brand.toLowerCase().includes(q)));
  }

  if (!items.length) {
    container.innerHTML = `<div class="diy-empty">${query ? (currentLang === 'en' ? 'No results' : 'ไม่พบผลลัพธ์') : (currentLang === 'en' ? 'No stock available' : 'ไม่มีสินค้าในคลัง')}</div>`;
    return;
  }

  container.innerHTML = items.map(item => {
    const sel = diySpec[cat] && diySpec[cat].id === item.id;
    const qty = sel ? diySpec[cat].qty : 0;
    const atMax = sel && qty >= item.Total;
    const borderStyle = sel ? 'border-color:#2b8abf;background:#f0f8ff' : '';
    const qtyBadge = sel
      ? `<span class="diy-item-qty-badge">×${qty}</span>`
      : '';
    return `
      <div class="diy-item" style="${borderStyle}">
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;color:#1a3352;font-weight:500">${item.Type}</div>
          <div style="font-size:10px;color:#6096c0;margin-top:2px">
            ${currentLang === 'en' ? 'Stock' : 'คงเหลือ'}: ${item.Total} &nbsp;|&nbsp; ฿${item.Cost.toLocaleString()}/unit
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          ${qtyBadge}
          <span style="color:#1e6aad;font-weight:600;font-size:12px">฿${item.Cost.toLocaleString()}</span>
          <button class="btn btn-success" style="padding:3px 10px;font-size:13px;border-radius:20px"
                  ${atMax ? 'disabled style="opacity:0.4;cursor:not-allowed;padding:3px 10px"' : ''}
                  onclick="addToSpec('${cat}', ${item.id}, '${item.Type.replace(/'/g, "\\'")}', ${item.Cost}, ${item.Total})">+</button>
        </div>
      </div>`;
  }).join('');
}

function filterDiyTab(query) {
  const activeTab = document.querySelector('.diy-tab.active');
  if (!activeTab) return;
  const activeCat = DIY_CATEGORIES.find(c => DIY_LABELS[c] === activeTab.textContent);
  diySearchQuery[activeCat] = query;
  renderDiyTab(activeCat, query);
}

function addToSpec(cat, id, type, cost, maxQty) {
  if (diySpec[cat] && diySpec[cat].id === id) {
    if (diySpec[cat].qty < maxQty) diySpec[cat].qty++;
  } else {
    diySpec[cat] = { id, type, cost, qty: 1, maxQty };
  }
  renderDiySpec();
  const activeTab = document.querySelector('.diy-tab.active');
  if (activeTab && activeTab.textContent === DIY_LABELS[cat]) renderDiyTab(cat, diySearchQuery[cat]);
}

function changeQty(cat, delta) {
  if (!diySpec[cat]) return;
  const newQty = diySpec[cat].qty + delta;
  if (newQty < 1) { removeFromSpec(cat); return; }
  if (newQty > diySpec[cat].maxQty) return;
  diySpec[cat].qty = newQty;
  renderDiySpec();
  const activeTab = document.querySelector('.diy-tab.active');
  if (activeTab && activeTab.textContent === DIY_LABELS[cat]) renderDiyTab(cat, diySearchQuery[cat]);
}

function removeFromSpec(cat) {
  delete diySpec[cat];
  renderDiySpec();
  const activeTab = document.querySelector('.diy-tab.active');
  if (activeTab) {
    const activeCat = DIY_CATEGORIES.find(c => DIY_LABELS[c] === activeTab.textContent);
    if (activeCat === cat) renderDiyTab(cat, diySearchQuery[cat]);
  }
}

function clearDiySpec() {
  diySpec = {};
  renderDiySpec();
}

function renderDiySpec() {
  const list = document.getElementById('diy-spec-list');
  if (!list) return;
  const total = Object.values(diySpec).reduce((s, i) => s + i.cost * i.qty, 0);
  document.getElementById('diy-total-val').textContent = '฿' + total.toLocaleString();

  const entries = Object.entries(diySpec);
  if (!entries.length) {
    list.innerHTML = `<div class="diy-empty">${currentLang === 'en' ? 'No items selected' : 'ยังไม่มีรายการ'}</div>`;
    return;
  }
  list.innerHTML = entries.map(([cat, item]) => `
    <div class="spec-row">
      <span class="spec-cat">${DIY_LABELS[cat]}</span>
      <span class="spec-name" title="${item.type}">${item.type}</span>
      <div class="spec-qty-ctrl">
        <button class="spec-qty-btn" onclick="changeQty('${cat}', -1)">−</button>
        <span class="spec-qty-val">${item.qty}</span>
        <button class="spec-qty-btn" onclick="changeQty('${cat}', 1)" ${item.qty >= item.maxQty ? 'disabled' : ''}>+</button>
      </div>
      <div style="text-align:right">
        <div class="spec-price">฿${(item.cost * item.qty).toLocaleString()}</div>
        ${item.qty > 1 ? `<div style="font-size:9px;color:#6096c0">฿${item.cost.toLocaleString()}/unit</div>` : ''}
      </div>
      <button class="spec-rm" onclick="removeFromSpec('${cat}')">✕</button>
    </div>`).join('');
}

function showDiyPreview() {
  const entries = Object.entries(diySpec);
  if (!entries.length) {
    alert(currentLang === 'en' ? 'Please select at least one item' : 'กรุณาเลือกอย่างน้อย 1 รายการ');
    return;
  }
  const total = entries.reduce((s, [, i]) => s + i.cost * i.qty, 0);
  const qtyLabel  = currentLang === 'en' ? 'qty' : 'ชิ้น';
  const unitLabel = currentLang === 'en' ? 'Cost/unit' : 'ราคา/ชิ้น';
  const rows = entries.map(([cat, item]) => `
    <div class="prev-row">
      <span style="color:#6096c0;min-width:76px">${DIY_LABELS[cat]}</span>
      <span style="flex:1">${item.type}</span>
      <span style="color:#6096c0;margin:0 8px">×${item.qty}</span>
      <div style="text-align:right">
        <div style="color:#1e6aad;font-weight:600">฿${(item.cost * item.qty).toLocaleString()}</div>
        ${item.qty > 1 ? `<div style="font-size:10px;color:#6096c0">฿${item.cost.toLocaleString()}/${currentLang === 'en' ? 'unit' : 'ชิ้น'}</div>` : ''}
      </div>
    </div>`).join('');
  const tcLabel = currentLang === 'en' ? 'Total Cost' : 'ต้นทุนรวม';
  document.getElementById('diy-preview-body').innerHTML =
    rows + `<div class="prev-total"><span>${tcLabel}</span><span style="color:#1e6aad">฿${total.toLocaleString()}</span></div>`;
  openModal('modal-diy-preview');
}

async function confirmOrder() {
  if (isConfirming) return;
  isConfirming = true;
  const btn = document.querySelector('#modal-diy-preview .btn-success');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  const selections = Object.entries(diySpec).map(([cat, item]) => ({
    table: cat, id: item.id, qty: item.qty,
  }));
  try {
    const res = await fetch('/api/diy/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selections),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    currentTxId = data.txId;

    const total = Object.values(diySpec).reduce((s, i) => s + i.cost * i.qty, 0);
    const tcLabel  = currentLang === 'en' ? 'Total Cost' : 'ต้นทุนรวม';
    const qtyLabel = currentLang === 'en' ? 'qty' : 'ชิ้น';
    const rows = Object.entries(diySpec).map(([cat, item]) => `
      <div class="prev-row">
        <span style="color:#6096c0;min-width:76px">${DIY_LABELS[cat]}</span>
        <span style="flex:1">${item.type}</span>
        <span style="color:#6096c0;margin:0 8px">×${item.qty}</span>
        <div style="text-align:right">
          <div style="color:#1e6aad;font-weight:600">฿${(item.cost * item.qty).toLocaleString()}</div>
          ${item.qty > 1 ? `<div style="font-size:10px;color:#6096c0">฿${item.cost.toLocaleString()}/${currentLang === 'en' ? 'unit' : 'ชิ้น'}</div>` : ''}
        </div>
      </div>`).join('');
    document.getElementById('diy-confirmed-body').innerHTML =
      rows + `<div class="prev-total"><span>${tcLabel}</span><span style="color:#1e6aad">฿${total.toLocaleString()}</span></div>`;

    closeModal('modal-diy-preview');
    openModal('modal-diy-confirmed');
  } catch (e) {
    alert('Confirm failed: ' + e.message);
  } finally {
    isConfirming = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = currentLang === 'en' ? '✓ Confirm & Deduct Stock' : '✓ ยืนยันและตัด Stock';
    }
  }
}

async function restoreOrder() {
  if (!currentTxId) return;
  try {
    const res = await fetch(`/api/diy/restore/${currentTxId}`, { method: 'POST' });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    alert(currentLang === 'en' ? 'Stock restored!' : 'คืน Stock เรียบร้อยแล้ว!');
    closeModal('modal-diy-confirmed');
    diyDone();
  } catch (e) {
    alert('Restore failed: ' + e.message);
  }
}

function diyDone() {
  currentTxId = null;
  clearDiySpec();
  closeModal('modal-diy-confirmed');
  loadDiyCatalog();
}
