// ── Category configuration ────────────────────────────────────────────
// Each field: { key, labelEn, labelTh, type, options, cascade, readonly }
// type: 'text' | 'number' | 'select' | 'textarea'
// cascade: { on: 'fieldKey', values: { OPTIONVALUE: [...] } }

const CATEGORIES = {
  cpu: {
    labelEn: 'CPU Stock', labelTh: 'คลังสินค้า CPU',
    addLabelEn: '+ Add CPU', addLabelTh: '+ เพิ่ม CPU',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'select', options: ['INTEL', 'AMD'] },
      {
        key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'select',
        cascade: {
          on: 'Brand',
          values: {
            INTEL: ['I3', 'I5', 'I7', 'I9', 'PENTIUM', 'CORE ULTRA 3', 'CORE ULTRA 5', 'CORE ULTRA 7', 'CORE ULTRA 9'],
            AMD: ['Ryzen 3', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9', 'Athlon'],
          },
        },
      },
      { key: 'Package', labelEn: 'Package', labelTh: 'แพ็กเกจ', type: 'select', options: ['Box', 'Tray', 'OEM'] },
      { key: 'Socket', labelEn: 'Socket', labelTh: 'ซ็อกเก็ต', type: 'select', options: ['LGA1700', 'LGA1200', 'AM5', 'AM4'] },
      { key: 'Codename', labelEn: 'Codename', labelTh: 'โค้ดเนม', type: 'text' },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
  ram: {
    labelEn: 'RAM Stock', labelTh: 'คลังสินค้า RAM',
    addLabelEn: '+ Add RAM', addLabelTh: '+ เพิ่ม RAM',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'text' },
      { key: 'Color', labelEn: 'Color', labelTh: 'สี', type: 'select', options: ['Black', 'White', 'Red', 'Blue', 'Silver'] },
      { key: 'RGB', labelEn: 'RGB', labelTh: 'RGB', type: 'select', options: ['Yes', 'No'] },
      { key: 'Package', labelEn: 'Package', labelTh: 'แพ็กเกจ', type: 'select', options: ['Box', 'Tray', 'OEM'] },
      { key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'text' },
      { key: 'MemoryType', labelEn: 'Memory Type', labelTh: 'ประเภทหน่วยความจำ', type: 'select', options: ['DDR4', 'DDR5'] },
      { key: 'BUS', labelEn: 'BUS (MHz)', labelTh: 'BUS (MHz)', type: 'number' },
      { key: 'MemorySize', labelEn: 'Memory Size', labelTh: 'ขนาดหน่วยความจำ', type: 'text' },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
  m2: {
    labelEn: 'M.2 Stock', labelTh: 'คลังสินค้า M.2',
    addLabelEn: '+ Add M.2', addLabelTh: '+ เพิ่ม M.2',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'text' },
      { key: 'Package', labelEn: 'Package', labelTh: 'แพ็กเกจ', type: 'select', options: ['Box', 'Tray', 'OEM'] },
      { key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'text' },
      { key: 'M2Type', labelEn: 'M.2 Type', labelTh: 'ขนาด M.2', type: 'select', options: ['2280', '2260', '2242'] },
      { key: 'Interface', labelEn: 'Interface', labelTh: 'อินเทอร์เฟส', type: 'select', options: ['PCIe 4.0 NVMe', 'PCIe 3.0 NVMe', 'SATA'] },
      { key: 'Capacity', labelEn: 'Capacity', labelTh: 'ความจุ', type: 'text' },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
  ssd: {
    labelEn: 'SSD Stock', labelTh: 'คลังสินค้า SSD',
    addLabelEn: '+ Add SSD', addLabelTh: '+ เพิ่ม SSD',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'text' },
      { key: 'Package', labelEn: 'Package', labelTh: 'แพ็กเกจ', type: 'select', options: ['Box', 'Tray', 'OEM'] },
      { key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'text' },
      { key: 'Interface', labelEn: 'Interface', labelTh: 'อินเทอร์เฟส', type: 'select', options: ['SATA III', 'PCIe 3.0', 'PCIe 4.0'] },
      { key: 'Capacity', labelEn: 'Capacity', labelTh: 'ความจุ', type: 'text' },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
  mainboard: {
    labelEn: 'Mainboard Stock', labelTh: 'คลังสินค้า เมนบอร์ด',
    addLabelEn: '+ Add Mainboard', addLabelTh: '+ เพิ่ม เมนบอร์ด',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'text' },
      { key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'text' },
      { key: 'Size', labelEn: 'Size', labelTh: 'ขนาด', type: 'select', options: ['ATX', 'mATX', 'ITX', 'E-ATX'] },
      { key: 'Socket', labelEn: 'Socket', labelTh: 'ซ็อกเก็ต', type: 'select', options: ['LGA1700', 'LGA1200', 'AM5', 'AM4'] },
      { key: 'Chipset', labelEn: 'Chipset', labelTh: 'ชิปเซ็ต', type: 'select', options: ['H610', 'B660', 'B760', 'Z690', 'Z790', 'A620', 'B650', 'X670', 'X670E'] },
      { key: 'SlotRAM', labelEn: 'RAM Slots', labelTh: 'สล็อต RAM', type: 'number' },
      { key: 'SupportRAM', labelEn: 'Support RAM', labelTh: 'รองรับ RAM', type: 'text' },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
  vga: {
    labelEn: 'VGA Stock', labelTh: 'คลังสินค้า การ์ดจอ',
    addLabelEn: '+ Add VGA', addLabelTh: '+ เพิ่ม VGA',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'text' },
      { key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'text' },
      { key: 'Chipset', labelEn: 'Chipset', labelTh: 'ชิปเซ็ต', type: 'select', options: ['NVIDIA', 'AMD', 'Intel'] },
      { key: 'FAN', labelEn: 'FAN (count)', labelTh: 'จำนวนพัดลม', type: 'select', options: ['1', '2', '3'] },
      { key: 'Series', labelEn: 'Series', labelTh: 'ซีรีส์', type: 'text' },
      { key: 'GPUModel', labelEn: 'GPU Model', labelTh: 'GPU Model', type: 'text' },
      { key: 'SizeGB', labelEn: 'VRAM (GB)', labelTh: 'VRAM (GB)', type: 'number' },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
  psu: {
    labelEn: 'PSU Stock', labelTh: 'คลังสินค้า PSU',
    addLabelEn: '+ Add PSU', addLabelTh: '+ เพิ่ม PSU',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'text' },
      { key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'text' },
      { key: 'Certification', labelEn: 'Certification', labelTh: 'การรับรอง', type: 'select', options: ['80+ White', '80+ Bronze', '80+ Silver', '80+ Gold', '80+ Platinum', '80+ Titanium'] },
      { key: 'Watt', labelEn: 'Watt', labelTh: 'วัตต์', type: 'number' },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
  monitor: {
    labelEn: 'Monitor Stock', labelTh: 'คลังสินค้า มอนิเตอร์',
    addLabelEn: '+ Add Monitor', addLabelTh: '+ เพิ่ม มอนิเตอร์',
    fields: [
      { key: 'Type', labelEn: 'Type (Product Name)', labelTh: 'ชื่อสินค้า', type: 'text' },
      { key: 'Brand', labelEn: 'Brand', labelTh: 'แบรนด์', type: 'text' },
      { key: 'Model', labelEn: 'Model', labelTh: 'รุ่น', type: 'text' },
      { key: 'Size', labelEn: 'Size', labelTh: 'ขนาด', type: 'text' },
      { key: 'Color', labelEn: 'Color', labelTh: 'สี', type: 'text' },
      { key: 'PanelType', labelEn: 'Panel Type', labelTh: 'ประเภทพาเนล', type: 'select', options: ['IPS', 'VA', 'TN', 'OLED'] },
      { key: 'MaxResolution', labelEn: 'Max Resolution', labelTh: 'ความละเอียดสูงสุด', type: 'select', options: ['1920×1080', '2560×1080', '2560×1440', '3440×1440', '3840×2160'] },
      { key: 'RefreshRate', labelEn: 'Refresh Rate', labelTh: 'อัตรารีเฟรช', type: 'select', options: ['60Hz', '75Hz', '100Hz', '144Hz', '165Hz', '180Hz', '240Hz', '360Hz'] },
      { key: 'Total', labelEn: 'Total (On Hand)', labelTh: 'คงเหลือ', type: 'number' },
      { key: 'Cost', labelEn: 'Cost/unit (฿)', labelTh: 'ต้นทุน/ชิ้น (฿)', type: 'number' },
      { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)', type: 'number', readonly: true },
      { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ', type: 'textarea' },
    ],
  },
};

// ── State ─────────────────────────────────────────────────────────────
let editingId = null;
let editingCategory = null;
const stockData = {}; // row cache per category for client-side search

// ── Table render ──────────────────────────────────────────────────────
async function renderStock(cat) {
  const cfg = CATEGORIES[cat];
  const container = document.getElementById(`page-${cat}`);

  const titleText = currentLang === 'en' ? cfg.labelEn : cfg.labelTh;
  const addText   = currentLang === 'en' ? cfg.addLabelEn : cfg.addLabelTh;

  const searchPlaceholder = currentLang === 'en' ? 'Search…' : 'ค้นหา…';
  container.innerHTML = `
    <div class="topbar">
      <h1>${titleText}</h1>
      <div class="spacer"></div>
      <input class="search-input" id="search-${cat}" type="text"
             placeholder="${searchPlaceholder}"
             oninput="filterTable('${cat}', this.value)">
      <button class="btn btn-outline" onclick="openImportModal('${cat}')"
              data-en="Import Excel" data-th="นำเข้า Excel">Import Excel</button>
      <button class="btn btn-primary" onclick="openItemModal('${cat}', null)"
              data-en="${cfg.addLabelEn}" data-th="${cfg.addLabelTh}">${addText}</button>
    </div>
    <div class="content">
      <div class="summary-bar" id="summary-${cat}"></div>
      <div class="table-wrap" id="tbl-${cat}">Loading…</div>
    </div>`;

  try {
    const rows = await fetch(`/api/${cat}`).then(r => r.json());
    stockData[cat] = rows;
    renderTable(cat, rows);
  } catch (e) {
    document.getElementById(`tbl-${cat}`).textContent = 'Error loading data.';
  }
}

function filterTable(cat, query) {
  const rows = stockData[cat] || [];
  if (!query.trim()) { renderTable(cat, rows); return; }
  const q = query.toLowerCase();
  renderTable(cat, rows.filter(row =>
    Object.values(row).some(v => String(v ?? '').toLowerCase().includes(q))
  ));
}

function renderTable(cat, rows) {
  const cfg = CATEGORIES[cat];

  // Update summary bar
  const totalQty  = rows.reduce((s, r) => s + (r.Total ?? 0), 0);
  const totalCost = rows.reduce((s, r) => s + (r.TotalCost ?? 0), 0);
  const summaryEl = document.getElementById(`summary-${cat}`);
  if (summaryEl) {
    const qtyLabel  = currentLang === 'en' ? 'Total Qty' : 'จำนวนรวม';
    const costLabel = currentLang === 'en' ? 'Total Value' : 'มูลค่ารวม';
    summaryEl.innerHTML =
      `<span class="summary-item"><span class="summary-label">${qtyLabel}</span><span class="summary-value">${totalQty.toLocaleString()}</span></span>` +
      `<span class="summary-sep">|</span>` +
      `<span class="summary-item"><span class="summary-label">${costLabel}</span><span class="summary-value">฿${totalCost.toLocaleString()}</span></span>`;
  }

  // Display columns: exclude TotalCost from headers (it's always last data col before Actions)
  const displayFields = cfg.fields.filter(f => f.key !== 'TotalCost' && f.key !== 'Note');

  const ths = [...displayFields, { key: 'TotalCost', labelEn: 'Total Cost (฿)', labelTh: 'มูลค่ารวม (฿)' }, { key: 'Note', labelEn: 'Note', labelTh: 'หมายเหตุ' }]
    .map(f => `<th data-en="${f.labelEn}" data-th="${f.labelTh}">${currentLang === 'en' ? f.labelEn : f.labelTh}</th>`)
    .join('');

  const trs = rows.map(row => {
    const tds = [...displayFields, { key: 'TotalCost' }, { key: 'Note' }].map(f => {
      if (f.key === 'Total') {
        const v = row.Total ?? 0;
        const cls = v >= 3 ? 'badge-ok' : v >= 1 ? 'badge-low' : 'badge-zero';
        return `<td><span class="badge ${cls}">${v}</span></td>`;
      }
      if (f.key === 'TotalCost') {
        return `<td class="cell-totalcost">${(row.TotalCost ?? 0).toLocaleString()}</td>`;
      }
      return `<td>${row[f.key] ?? '—'}</td>`;
    }).join('');

    return `<tr>
      ${tds}
      <td><div class="actions">
        <button class="btn btn-warning" onclick="openItemModal('${cat}', ${row.id})"
                data-en="Edit" data-th="แก้ไข">${currentLang === 'en' ? 'Edit' : 'แก้ไข'}</button>
        <button class="btn btn-danger" onclick="deleteItem('${cat}', ${row.id})">Del</button>
      </div></td>
    </tr>`;
  }).join('');

  document.getElementById(`tbl-${cat}`).innerHTML = `
    <table>
      <thead><tr>${ths}<th data-en="Actions" data-th="จัดการ">${currentLang === 'en' ? 'Actions' : 'จัดการ'}</th></tr></thead>
      <tbody>${trs || `<tr><td colspan="100" style="text-align:center;color:#8b949e;padding:20px">No data</td></tr>`}</tbody>
    </table>`;
}

// ── Add / Edit modal ──────────────────────────────────────────────────
async function openItemModal(cat, id) {
  editingCategory = cat;
  editingId = id;
  const cfg = CATEGORIES[cat];

  let existing = {};
  if (id) {
    const rows = await fetch(`/api/${cat}`).then(r => r.json());
    existing = rows.find(r => r.id === id) || {};
  }

  const titleEn = id ? `Edit ${cat.toUpperCase()}` : `Add ${cat.toUpperCase()}`;
  const titleTh = id ? `แก้ไข ${cat.toUpperCase()}` : `เพิ่ม ${cat.toUpperCase()}`;
  document.getElementById('modal-title').textContent = currentLang === 'en' ? titleEn : titleTh;

  const body = document.getElementById('modal-body');
  body.innerHTML = '<div class="form-grid">' + renderFormFields(cfg.fields, existing) + '</div>';

  // Wire up cascading dropdowns
  cfg.fields.filter(f => f.cascade).forEach(f => {
    const sourceEl = body.querySelector(`[data-field="${f.cascade.on}"]`);
    const targetEl = body.querySelector(`[data-field="${f.key}"]`);
    if (sourceEl && targetEl) {
      const updateCascade = () => {
        const opts = f.cascade.values[sourceEl.value] || [];
        targetEl.innerHTML = '<option value="">-- Select --</option>' +
          opts.map(o => `<option${o === existing[f.key] ? ' selected' : ''}>${o}</option>`).join('');
      };
      sourceEl.addEventListener('change', updateCascade);
      if (existing[f.cascade.on]) updateCascade();
    }
  });

  // Wire up TotalCost auto-compute
  const totalEl = body.querySelector('[data-field="Total"]');
  const costEl  = body.querySelector('[data-field="Cost"]');
  const tcEl    = body.querySelector('[data-field="TotalCost"]');
  if (totalEl && costEl && tcEl) {
    const update = () => { tcEl.value = (parseFloat(totalEl.value) || 0) * (parseFloat(costEl.value) || 0); };
    totalEl.addEventListener('input', update);
    costEl.addEventListener('input', update);
  }

  openModal('modal-item');
}

function renderFormFields(fields, existing) {
  const infoFields = fields.filter(f => !['Total', 'Cost', 'TotalCost', 'Note'].includes(f.key));
  const stockFields = fields.filter(f => ['Total', 'Cost', 'TotalCost'].includes(f.key));
  const noteField   = fields.find(f => f.key === 'Note');

  const renderField = (f) => {
    const label = currentLang === 'en' ? f.labelEn : f.labelTh;
    const value = existing[f.key] ?? '';

    let control;
    if (f.readonly) {
      control = `<input type="number" data-field="${f.key}" value="${value}" readonly>`;
    } else if (f.type === 'select' && !f.cascade) {
      const opts = (f.options || []).map(o =>
        `<option${o === value ? ' selected' : ''}>${o}</option>`
      ).join('');
      control = `<select data-field="${f.key}"><option value="">-- Select --</option>${opts}</select>`;
    } else if (f.cascade) {
      control = `<select data-field="${f.key}"><option value="">-- Select Brand first --</option></select>`;
    } else if (f.type === 'textarea') {
      control = `<textarea data-field="${f.key}">${value}</textarea>`;
    } else if (f.type === 'number') {
      control = `<input type="number" data-field="${f.key}" value="${value}">`;
    } else {
      control = `<input type="text" data-field="${f.key}" value="${value}">`;
    }

    const tag = f.readonly ? '<span class="tag-auto">auto</span>'
              : f.type === 'select' || f.cascade ? '<span class="tag-dropdown">dropdown</span>'
              : '';
    return `<div class="fg"><label>${label} ${tag}</label>${control}</div>`;
  };

  return `
    <div class="form-section">Product Info</div>
    ${infoFields.map(renderField).join('')}
    <div class="form-section">Stock &amp; Cost</div>
    ${stockFields.map(renderField).join('')}
    ${noteField ? `<div class="fg full">${renderField(noteField).replace('<div class="fg">', '').replace('</div>', '')}</div>` : ''}
  `;
}

// ── Save (POST / PUT) ─────────────────────────────────────────────────
async function saveItem() {
  const cat = editingCategory;
  const cfg = CATEGORIES[cat];
  const body = document.getElementById('modal-body');

  const payload = {};
  cfg.fields.filter(f => !f.readonly).forEach(f => {
    const el = body.querySelector(`[data-field="${f.key}"]`);
    if (!el) return;
    payload[f.key] = f.type === 'number' ? (parseFloat(el.value) || 0) : el.value;
  });

  const url = editingId ? `/api/${cat}/${editingId}` : `/api/${cat}`;
  const method = editingId ? 'PUT' : 'POST';

  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) { alert('Save failed'); return; }

  closeModal('modal-item');
  renderStock(cat);
}

// ── Delete ────────────────────────────────────────────────────────────
async function deleteItem(cat, id) {
  const msg = currentLang === 'en' ? 'Delete this item?' : 'ลบรายการนี้?';
  if (!confirm(msg)) return;
  await fetch(`/api/${cat}/${id}`, { method: 'DELETE' });
  renderStock(cat);
}

// ── Import Excel ──────────────────────────────────────────────────────
function openImportModal(cat) {
  editingCategory = cat;
  document.getElementById('import-result').textContent = '';
  document.getElementById('import-file').value = '';
  openModal('modal-import');
}

async function doImport() {
  const file = document.getElementById('import-file').files[0];
  if (!file) { alert('Please select a file'); return; }
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/api/${editingCategory}/import`, { method: 'POST', body: form });
  const data = await res.json();
  const result = document.getElementById('import-result');
  if (res.ok) {
    result.textContent = `✓ Imported ${data.imported} rows`;
    result.style.color = '#3fb950';
    renderStock(editingCategory);
  } else {
    result.textContent = `✗ ${data.error}`;
    result.style.color = '#f85149';
  }
}

function downloadTemplate() {
  window.location.href = `/api/${editingCategory}/template`;
}
