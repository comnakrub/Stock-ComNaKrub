let diySpec = {};       // { [category]: { id, type, cost } }
let currentTxId = null;
let catalogData = [];

const DIY_CATEGORIES = ['cpu', 'ram', 'm2', 'ssd', 'mainboard', 'vga', 'psu', 'monitor'];
const DIY_LABELS = { cpu: 'CPU', ram: 'RAM', m2: 'M.2', ssd: 'SSD', mainboard: 'Mainboard', vga: 'VGA', psu: 'PSU', monitor: 'Monitor' };

async function loadDiyCatalog() {
  const page = document.getElementById('page-diy');
  page.innerHTML = buildDiyShell();

  try {
    catalogData = await fetch('/api/diy/catalog').then(r => r.json());
    renderDiyTab(DIY_CATEGORIES[0]);
  } catch (e) {
    page.innerHTML = '<p style="padding:20px;color:#f85149">Failed to load catalog</p>';
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
        <div class="diy-items" id="diy-items"></div>
      </div>
      <div class="diy-right">
        <div class="diy-spec-hdr" data-en="${selEn}" data-th="${selTh}">${currentLang === 'en' ? selEn : selTh}</div>
        <div class="diy-spec-list" id="diy-spec-list"></div>
        <div class="diy-foot">
          <div class="diy-total">
            <span style="color:#8b949e;font-size:12px" data-en="${tcEn}" data-th="${tcTh}">${currentLang === 'en' ? tcEn : tcTh}</span>
            <span style="color:#f0883e;font-size:17px;font-weight:700" id="diy-total-val">฿0</span>
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
  renderDiyTab(cat);
}

function renderDiyTab(cat) {
  const entry = catalogData.find(c => c.category === cat);
  const items = entry ? entry.items : [];
  const container = document.getElementById('diy-items');

  if (!items.length) {
    container.innerHTML = `<div class="diy-empty">${currentLang === 'en' ? 'No stock available' : 'ไม่มีสินค้าในคลัง'}</div>`;
    return;
  }

  container.innerHTML = items.map(item => {
    const selected = diySpec[cat] && diySpec[cat].id === item.id;
    return `
      <div class="diy-item" style="${selected ? 'border-color:#1f6feb' : ''}">
        <div>
          <div style="font-size:12px;color:#c9d1d9">${item.Type}</div>
          <div style="font-size:10px;color:#8b949e">Stock: ${item.Total} | Cost: ฿${item.Cost.toLocaleString()}/unit</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="color:#58a6ff;font-weight:500">฿${item.Cost.toLocaleString()}</span>
          <button class="btn btn-success" style="padding:3px 8px"
                  onclick="addToSpec('${cat}', ${item.id}, '${item.Type.replace(/'/g, "\\'")}', ${item.Cost})">+</button>
        </div>
      </div>`;
  }).join('');
}

function addToSpec(cat, id, type, cost) {
  diySpec[cat] = { id, type, cost };
  renderDiySpec();
  // Re-render current tab to show selection highlight
  const activeTab = document.querySelector('.diy-tab.active');
  if (activeTab && activeTab.textContent === DIY_LABELS[cat]) renderDiyTab(cat);
}

function removeFromSpec(cat) {
  delete diySpec[cat];
  renderDiySpec();
}

function clearDiySpec() {
  diySpec = {};
  renderDiySpec();
}

function renderDiySpec() {
  const list = document.getElementById('diy-spec-list');
  const total = Object.values(diySpec).reduce((s, i) => s + i.cost, 0);
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
      <span class="spec-price">฿${item.cost.toLocaleString()}</span>
      <button class="spec-rm" onclick="removeFromSpec('${cat}')">✕</button>
    </div>`).join('');
}

function showDiyPreview() {
  const entries = Object.entries(diySpec);
  if (!entries.length) {
    alert(currentLang === 'en' ? 'Please select at least one item' : 'กรุณาเลือกอย่างน้อย 1 รายการ');
    return;
  }
  const total = entries.reduce((s, [, i]) => s + i.cost, 0);
  const rows = entries.map(([cat, item]) => `
    <div class="prev-row">
      <span style="color:#8b949e">${DIY_LABELS[cat]}</span>
      <span>${item.type}</span>
      <span style="color:#58a6ff;font-weight:500">฿${item.cost.toLocaleString()}</span>
    </div>`).join('');
  const tcLabel = currentLang === 'en' ? 'Total Cost' : 'ต้นทุนรวม';
  document.getElementById('diy-preview-body').innerHTML =
    rows + `<div class="prev-total"><span>${tcLabel}</span><span>฿${total.toLocaleString()}</span></div>`;
  openModal('modal-diy-preview');
}

async function confirmOrder() {
  const selections = Object.entries(diySpec).map(([cat, item]) => ({ table: cat, id: item.id }));
  try {
    const res = await fetch('/api/diy/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selections),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    currentTxId = data.txId;

    // Show confirmed modal
    const total = Object.values(diySpec).reduce((s, i) => s + i.cost, 0);
    const tcLabel = currentLang === 'en' ? 'Total Cost' : 'ต้นทุนรวม';
    const rows = Object.entries(diySpec).map(([cat, item]) => `
      <div class="prev-row">
        <span style="color:#8b949e">${DIY_LABELS[cat]}</span>
        <span>${item.type}</span>
        <span style="color:#58a6ff;font-weight:500">฿${item.cost.toLocaleString()}</span>
      </div>`).join('');
    document.getElementById('diy-confirmed-body').innerHTML =
      rows + `<div class="prev-total"><span>${tcLabel}</span><span>฿${total.toLocaleString()}</span></div>`;

    closeModal('modal-diy-preview');
    openModal('modal-diy-confirmed');
  } catch (e) {
    alert('Confirm failed: ' + e.message);
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
