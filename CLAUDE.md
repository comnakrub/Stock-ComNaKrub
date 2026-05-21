# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Stock-ComNaKrub** is a web-based inventory management system for computer hardware components (CPU, RAM, M.2, SSD, Mainboard, VGA, PSU, Monitor), with a built-in PC configuration builder (DIY spec tool).

Deployment target: **QNAP TS-853DU-RP** at `192.168.99.105`, user `na` — run via Docker (QNAP Container Station).

---

## System Architecture

### Part 1 — Stock Management
Full CRUD (add / edit / delete) per hardware category, with automatic stock quantity deduction. Each category has its own data schema (see below).

### Part 2 — DIY PC Builder
Pulls live data from all Part 1 categories, displaying only `Type` and `price` columns per category. Allows assembling a PC spec list (CPU, RAM, M.2, SSD, Mainboard, VGA, PSU, Monitor), with add/remove items and automatic stock deduction on confirm.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Plain HTML + Vanilla JS (no framework, no build step) |
| Backend | Node.js + Express |
| Database | SQLite (file-based, suited for NAS) |
| Deployment | Docker container on QNAP Container Station |
| Port | `3000` (configurable via env) |

---

## Data Models

### CPU
`Type, Brand, Model, Package, Socket, Codename, Total, Cost, Note`

### RAM
`Type, Brand, Color, RGB, Package, Model, MemoryType, BUS, MemorySize, Total, Cost, Note`

### M.2
`Type, Brand, Package, Model, M2Type, Interface, Capacity, Total, Cost, Note`

### SSD
`Type, Brand, Package, Model, Interface, Capacity, Total, Cost, Note`

### Mainboard
`Type, Brand, Model, Size, Socket, Chipset, SlotRAM, SupportRAM, Total, Cost, Note`

### VGA
`Type, Brand, Model, Chipset, FAN, Series, GPUModel, SizeGB, Total, Cost, Note`

### PSU
`Type, Brand, Model, Certification, Watt, Total, Cost, Note`

### Monitor
`Type, Brand, Model, Size, Color, PanelType, MaxResolution, RefreshRate, Total, Cost, Note`

**Common fields across all tables:**
- `Total` — current stock on hand (จำนวนคงเหลือปัจจุบัน)
- `Cost` — cost per unit (ราคาทุนต่อชิ้น)
- `Note` — free text

---

## Development Commands

```bash
# Install dependencies
npm install          # or: pip install -r requirements.txt

# Run dev server
npm run dev          # or: uvicorn main:app --reload

# Build for production
npm run build

# Run with Docker (local test)
docker build -t stock-comnakrub .
docker run -p 3000:3000 stock-comnakrub

# Deploy to QNAP (via SSH)
ssh na@192.168.99.105
# then pull image or copy files and start container via Container Station
```

---

## Deployment Notes

- The app runs in a Docker container on QNAP Container Station.
- SQLite database file should be mounted as a Docker volume so data persists across container restarts.
- Suggested volume mount: `/share/homes/na/stock-data:/app/data`
- Environment variable `DATABASE_PATH=/app/data/stock.db` controls DB location.
