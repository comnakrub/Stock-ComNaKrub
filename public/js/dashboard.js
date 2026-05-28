// ── Dashboard ──────────────────────────────────────────────────────────

const DASH_CATS = [
  { key: 'cpu',       label: 'CPU',       color: '#1e6aad', bg: '#d4e6f5' },
  { key: 'ram',       label: 'RAM',       color: '#3a9e6e', bg: '#ccf0e0' },
  { key: 'm2',        label: 'M.2',       color: '#7c52c8', bg: '#e8d8f8' },
  { key: 'ssd',       label: 'SSD',       color: '#1a8888', bg: '#c8eeee' },
  { key: 'mainboard', label: 'Mainboard', color: '#cc7a18', bg: '#fde5c0' },
  { key: 'vga',       label: 'VGA',       color: '#c04080', bg: '#f8d0e8' },
  { key: 'psu',       label: 'PSU',       color: '#5a7830', bg: '#d8ecc0' },
  { key: 'monitor',   label: 'Monitor',   color: '#2048a8', bg: '#ccd8f0' },
];

async function renderDashboard() {
  const page = document.getElementById('page-dashboard');
  page.innerHTML = `
    <div class="topbar">
      <h1 data-en="Dashboard" data-th="ภาพรวมสต็อก">${currentLang === 'en' ? 'Dashboard' : 'ภาพรวมสต็อก'}</h1>
    </div>
    <div class="content" id="dash-content">
      <div style="color:#6096c0;padding:20px;text-align:center;font-size:13px">กำลังโหลด…</div>
    </div>`;

  const keys = DASH_CATS.map(c => c.key);
  const results = await Promise.all(
    keys.map(k => fetch(`/api/${k}`).then(r => r.json()).catch(() => []))
  );

  const data = {};
  keys.forEach((k, i) => { data[k] = results[i]; });

  // Compute per-category stats
  let grandSKU = 0, grandQty = 0, grandValue = 0, grandAlerts = 0;
  const stats = {};
  DASH_CATS.forEach(({ key }) => {
    const rows = data[key] || [];
    const skus  = rows.length;
    const qty   = rows.reduce((s, r) => s + (r.Total    ?? 0), 0);
    const value = rows.reduce((s, r) => s + (r.TotalCost ?? 0), 0);
    const ok   = rows.filter(r => (r.Total ?? 0) >= 3).length;
    const low  = rows.filter(r => (r.Total ?? 0) >= 1 && (r.Total ?? 0) < 3).length;
    const zero = rows.filter(r => (r.Total ?? 0) === 0).length;
    stats[key] = { skus, qty, value, ok, low, zero, rows };
    grandSKU   += skus;
    grandQty   += qty;
    grandValue += value;
    grandAlerts += low + zero;
  });

  // Collect low/zero items for alert list
  const alerts = [];
  DASH_CATS.forEach(({ key, label }) => {
    (data[key] || []).forEach(r => {
      const t = r.Total ?? 0;
      if (t < 3) alerts.push({ cat: key, catLabel: label, row: r, total: t });
    });
  });
  alerts.sort((a, b) => a.total - b.total);

  // ── KPI cards ──
  const kpiHtml = `
    <div class="dash-kpi-row">
      <div class="dash-kpi">
        <div class="dash-kpi-val">${DASH_CATS.length}</div>
        <div class="dash-kpi-label">${currentLang === 'en' ? 'Categories' : 'หมวดหมู่'}</div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-val">${grandSKU.toLocaleString()}</div>
        <div class="dash-kpi-label">${currentLang === 'en' ? 'Total SKUs' : 'รายการสินค้า'}</div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-val">${grandQty.toLocaleString()}</div>
        <div class="dash-kpi-label">${currentLang === 'en' ? 'Total Units' : 'จำนวนรวม'}</div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-val" style="color:#1e6aad">฿${grandValue.toLocaleString()}</div>
        <div class="dash-kpi-label">${currentLang === 'en' ? 'Total Value' : 'มูลค่ารวม'}</div>
      </div>
      <div class="dash-kpi ${grandAlerts > 0 ? 'dash-kpi-warn' : ''}">
        <div class="dash-kpi-val" style="color:${grandAlerts > 0 ? '#cc7a18' : '#3a9e6e'}">${grandAlerts}</div>
        <div class="dash-kpi-label">${currentLang === 'en' ? 'Needs Restock' : 'ต้องเติมสต็อก'}</div>
      </div>
    </div>`;

  // ── Category cards ──
  const cardsHtml = `
    <div class="dash-section-label">${currentLang === 'en' ? 'BY CATEGORY' : 'แยกตามหมวดหมู่'}</div>
    <div class="dash-grid">
      ${DASH_CATS.map(({ key, label, color, bg }) => {
        const s = stats[key];
        const alertCount = s.low + s.zero;
        return `
          <div class="dash-card" onclick="goTo('${key}')" title="${currentLang === 'en' ? 'Go to ' + label : 'ไปที่ ' + label}">
            <div class="dash-card-top">
              <span class="dash-cat-chip" style="background:${bg};color:${color}">${label}</span>
              ${alertCount > 0 ? `<span class="dash-alert-dot" title="${alertCount} items need restock">⚠ ${alertCount}</span>` : ''}
            </div>
            <div class="dash-card-value" style="color:${color}">฿${s.value.toLocaleString()}</div>
            <div class="dash-card-meta">
              <span>${currentLang === 'en' ? 'SKUs' : 'รายการ'} <b>${s.skus}</b></span>
              <span>${currentLang === 'en' ? 'Units' : 'ชิ้น'} <b>${s.qty.toLocaleString()}</b></span>
            </div>
            <div class="dash-card-badges">
              ${s.ok   > 0 ? `<span class="badge badge-ok">OK ${s.ok}</span>`    : ''}
              ${s.low  > 0 ? `<span class="badge badge-low">Low ${s.low}</span>` : ''}
              ${s.zero > 0 ? `<span class="badge badge-zero">Zero ${s.zero}</span>` : ''}
              ${s.skus === 0 ? `<span style="color:#aaa;font-size:11px">—</span>` : ''}
            </div>
          </div>`;
      }).join('')}
    </div>`;

  // ── Alert table ──
  const alertHtml = alerts.length === 0 ? '' : `
    <div class="dash-section-label" style="margin-top:20px">
      ${currentLang === 'en' ? 'NEEDS RESTOCK' : 'ต้องเติมสต็อก'}
      <span class="dash-alert-count">${alerts.length}</span>
    </div>
    <div class="table-wrap" style="max-height:280px">
      <table>
        <thead><tr>
          <th>${currentLang === 'en' ? 'Category' : 'หมวด'}</th>
          <th>${currentLang === 'en' ? 'Product' : 'สินค้า'}</th>
          <th>${currentLang === 'en' ? 'Brand' : 'แบรนด์'}</th>
          <th>${currentLang === 'en' ? 'Qty' : 'คงเหลือ'}</th>
          <th>${currentLang === 'en' ? 'Unit Cost' : 'ต้นทุน/ชิ้น'}</th>
        </tr></thead>
        <tbody>
          ${alerts.map(({ catLabel, row, total }) => {
            const cls = total === 0 ? 'badge-zero' : 'badge-low';
            return `<tr>
              <td><b>${catLabel}</b></td>
              <td>${row.Type ?? '—'}</td>
              <td>${row.Brand ?? '—'}</td>
              <td><span class="badge ${cls}">${total}</span></td>
              <td style="color:#1e6aad">฿${(row.Cost ?? 0).toLocaleString()}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;

  document.getElementById('dash-content').innerHTML = kpiHtml + cardsHtml + alertHtml;
  setLang(currentLang);
}
