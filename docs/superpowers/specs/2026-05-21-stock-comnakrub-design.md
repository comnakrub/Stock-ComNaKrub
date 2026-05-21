# Stock ComNaKrub — System Design Spec
**Date:** 2026-05-21  
**Status:** Approved

---

## Overview

Back-office inventory management system for computer hardware (CPU, RAM, M.2, SSD, Mainboard, VGA, PSU, Monitor), with a built-in DIY PC Builder for assembling specs and deducting stock. Internal use only — not customer-facing.

---

## Decisions Made

| Topic | Decision |
|-------|----------|
| Authentication | None required |
| Backend | Node.js + Express |
| Database | SQLite (via better-sqlite3) |
| Frontend | Plain HTML + Vanilla JS (no framework, no build step) |
| Deployment | Single Docker container on QNAP Container Station |
| Port | 3000 (env configurable) |
| Language | Toggle EN / TH (stored in localStorage, switches without page reload) |
| Navigation | Sidebar (left panel, always visible) |
| Color Theme | Dark — GitHub-style (bg: #0d1117, sidebar: #161b22, accent: #1f6feb) |
| DIY Layout | Split Panel (left: catalog by category tab, right: selected spec + total) |
| Data Import | Excel (.xlsx) upload via UI per category + manual form entry |

---

## Architecture

Single Express app — serves both REST API and static HTML/JS/CSS from one process.

```
stock-comnakrub/
├── server.js               ← Express entry point (API + static serve)
├── db/
│   ├── schema.sql          ← SQLite schema for all 8 tables
│   └── database.js         ← better-sqlite3 connection + helpers
├── routes/
│   ├── cpu.js              ← GET/POST/PUT/DELETE + import
│   ├── ram.js
│   ├── m2.js
│   ├── ssd.js
│   ├── mainboard.js
│   ├── vga.js
│   ├── psu.js
│   ├── monitor.js
│   └── diy.js              ← GET all categories (type+cost), POST confirm, POST restore
├── public/
│   ├── index.html          ← Single HTML shell (sidebar + page containers)
│   ├── js/
│   │   ├── app.js          ← Router, language toggle, sidebar nav
│   │   ├── stock.js        ← Stock table render, CRUD modals, import modal
│   │   └── diy.js          ← Split panel, spec list, preview/confirm/restore
│   └── css/
│       └── theme.css       ← Dark GitHub theme, tables, modals, badges
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

**Request flow:** Browser → Express static → `index.html` → JS fetches `/api/*` → Express routes → SQLite → JSON response → JS re-renders table

---

## Data Models

`Total Cost` is always computed at query time: `Cost × Total`. It is never stored — only `Cost` and `Total` are stored.

### CPU
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | auto |
| Type | TEXT | Product name e.g. "INTEL I5 GEN14 14500" |
| Brand | TEXT | |
| Model | TEXT | |
| Package | TEXT | Box / Tray / OEM |
| Socket | TEXT | LGA1700 / AM5 / AM4 |
| Codename | TEXT | |
| List | INTEGER | Total units received (stock in) |
| Total | INTEGER | Current units on hand (auto: List − deducted) |
| Cost | REAL | Cost per unit (฿) |
| Note | TEXT | |

### RAM
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | |
| Type | TEXT | Product name e.g. "DDR5 32GB BUS5600 KINGSTON FURY" |
| Brand | TEXT | |
| Color | TEXT | |
| RGB | TEXT | Yes / No |
| Package | TEXT | |
| Model | TEXT | |
| MemoryType | TEXT | DDR4 / DDR5 |
| BUS | INTEGER | e.g. 3200, 5600, 6000 |
| MemorySize | TEXT | e.g. 8GB, 16GB, 32GB |
| List | INTEGER | |
| Total | INTEGER | |
| Cost | REAL | |
| Note | TEXT | |

### M.2
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | |
| Type | TEXT | Product name |
| Brand | TEXT | |
| Package | TEXT | |
| Model | TEXT | |
| M2Type | TEXT | 2280 / 2242 / etc. |
| Interface | TEXT | PCIe 4.0 NVMe / PCIe 3.0 NVMe / SATA |
| Capacity | TEXT | 500GB / 1TB / 2TB |
| List | INTEGER | |
| Total | INTEGER | |
| Cost | REAL | |
| Note | TEXT | |

### SSD
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | |
| Type | TEXT | Product name |
| Brand | TEXT | |
| Package | TEXT | |
| Model | TEXT | |
| Interface | TEXT | SATA III / PCIe |
| Capacity | TEXT | |
| List | INTEGER | |
| Total | INTEGER | |
| Cost | REAL | |
| Note | TEXT | |

### Mainboard
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | |
| Type | TEXT | Product name |
| Brand | TEXT | |
| Model | TEXT | |
| Size | TEXT | ATX / mATX / ITX |
| Socket | TEXT | LGA1700 / AM5 / AM4 |
| Chipset | TEXT | B760 / X670E / B550 |
| SlotRAM | INTEGER | Number of RAM slots |
| SupportRAM | TEXT | e.g. "DDR5 128GB" |
| List | INTEGER | |
| Total | INTEGER | |
| Cost | REAL | |
| Note | TEXT | |

### VGA
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | |
| Type | TEXT | Product name |
| Brand | TEXT | |
| Model | TEXT | |
| Chipset | TEXT | NVIDIA / AMD |
| FAN | INTEGER | Number of fans |
| Series | TEXT | DUAL / VENTUS / ROG STRIX / PULSE |
| GPUModel | TEXT | RTX 4060 / RX 7600 |
| SizeGB | INTEGER | VRAM in GB |
| List | INTEGER | |
| Total | INTEGER | |
| Cost | REAL | |
| Note | TEXT | |

### PSU
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | |
| Type | TEXT | Product name |
| Brand | TEXT | |
| Model | TEXT | |
| Certification | TEXT | 80+ Bronze / Gold / Platinum |
| Watt | INTEGER | |
| List | INTEGER | |
| Total | INTEGER | |
| Cost | REAL | |
| Note | TEXT | |

### Monitor
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | |
| Type | TEXT | Product name |
| Brand | TEXT | |
| Model | TEXT | |
| Size | TEXT | e.g. 27" |
| Color | TEXT | Black / White / Grey |
| PanelType | TEXT | IPS / VA / TN |
| MaxResolution | TEXT | 1920×1080 / 2560×1440 / 3840×2160 |
| RefreshRate | TEXT | 144Hz / 165Hz / 240Hz |
| List | INTEGER | |
| Total | INTEGER | |
| Cost | REAL | |
| Note | TEXT | |

---

## Part 1 — Stock Management

Each of the 8 categories follows an identical pattern:

**Table view**
- Columns: all schema fields + computed `Total Cost (฿)` = `Cost × Total` (read-only, blue)
- `Total` column shows colored badge: green (≥3), orange (1–2), red (0)
- Sticky table header, scrollable body

**Add / Edit**
- Modal form with all fields for that category
- `Total Cost` field is read-only in the form (shows computed value)
- On Add: `Total` = `List` (no deductions yet)
- On Edit: `Total` is editable directly if needed (manual correction)
- Fields with fixed options render as `<select>` dropdowns (see table below)

**Dropdown fields by category:**

| Category | Field | Options |
|----------|-------|---------|
| All | Package | Box, Tray, OEM |
| CPU | Socket | LGA1700, LGA1200, AM5, AM4 |
| RAM | MemoryType | DDR4, DDR5 |
| RAM | RGB | Yes, No |
| RAM | Color | Black, White, Red, Blue, Silver |
| M.2 | M2Type | 2280, 2260, 2242 |
| M.2 | Interface | PCIe 4.0 NVMe, PCIe 3.0 NVMe, SATA |
| SSD | Interface | SATA III, PCIe 3.0, PCIe 4.0 |
| Mainboard | Size | ATX, mATX, ITX, E-ATX |
| Mainboard | Socket | LGA1700, LGA1200, AM5, AM4 |
| Mainboard | Chipset | H610, B660, B760, Z690, Z790, A620, B650, X670, X670E |
| VGA | Chipset | NVIDIA, AMD, Intel |
| VGA | FAN | 1, 2, 3 |
| PSU | Certification | 80+ White, 80+ Bronze, 80+ Silver, 80+ Gold, 80+ Platinum, 80+ Titanium |
| Monitor | PanelType | IPS, VA, TN, OLED |
| Monitor | MaxResolution | 1920×1080, 2560×1080, 2560×1440, 3440×1440, 3840×2160 |
| Monitor | RefreshRate | 60Hz, 75Hz, 100Hz, 144Hz, 165Hz, 180Hz, 240Hz, 360Hz |

**Delete**
- Confirmation prompt before delete

**Import Excel**
- Upload `.xlsx` file via modal
- Server parses columns — headers must match field names exactly
- Downloadable template `.xlsx` per category
- Rows inserted in bulk; `Total` = `List` on import

---

## Part 2 — DIY PC Builder

**Layout:** Split panel
- **Left:** Category tabs (CPU / RAM / M.2 / SSD / Mainboard / VGA / PSU / Monitor)  
  Each tab shows list of items: `Type` + `Cost/unit (฿)` + stock count + `+` button  
  Only 1 item per category can be selected at a time (replacing previous selection)
- **Right:** Selected spec list (Category | Name | Cost/unit) + Total Cost sum + Confirm button

**Flow:**
1. User adds items from left panel → spec builds up on right
2. Press **Preview & Confirm** → Preview Modal shows full spec + Total Cost
3. Press **✓ Confirm & Deduct Stock** → API deducts `Total` by 1 for each item → success state shown
4. Success modal shows **↩ Restore Stock (Cancel Order)** button → API restores `Total` by 1 for each item
5. Press **Done** → spec clears, ready for next build

**API endpoints for DIY:**
- `GET /api/diy/catalog` — returns `{category, items: [{id, Type, Cost, Total}]}` for all 8 tables
- `POST /api/diy/confirm` — body: `[{table, id}]` — deducts Total by 1 each, returns transaction id
- `POST /api/diy/restore/:txId` — restores the deduction from that transaction

---

## Language Toggle

- Button `EN / TH` in sidebar footer
- All UI text elements use `data-en` / `data-th` HTML attributes
- JS `setLang(lang)` iterates all `[data-en]` elements and swaps text
- Preference saved to `localStorage` and applied on page load

---

## Computed Field: Total Cost

- `Total Cost = Cost × Total` — computed in SQL (`Cost * Total AS TotalCost`) on every GET
- Never stored in DB
- Shown in stock tables as a blue column (read-only)
- Shown in DIY Builder summary as "Total Cost" (sum of all selected items' Cost/unit)

---

## Stock Deduction Logic

```
On confirm DIY:
  BEGIN TRANSACTION
  For each selected item:
    UPDATE <table> SET Total = Total - 1 WHERE id = ? AND Total > 0
  Save deduction record (table, id, qty=1) for restore capability
  COMMIT

On restore:
  BEGIN TRANSACTION
  For each item in deduction record:
    UPDATE <table> SET Total = Total + 1 WHERE id = ?
  Delete deduction record
  COMMIT
```

---

## Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
services:
  app:
    image: stock-comnakrub
    ports: ["3000:3000"]
    volumes:
      - /share/homes/na/stock-data:/app/data
    environment:
      - DATABASE_PATH=/app/data/stock.db
    restart: unless-stopped
```

SQLite file persists at `/share/homes/na/stock-data/stock.db` on the QNAP NAS.
