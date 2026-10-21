# 🍽️ AHA Restaurant — Real-Time POS & Dining Web Application

[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.x-38bdf8.svg)](https://tailwindcss.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-f7df1e.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio-Synthesizer-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![BroadcastChannel](https://img.shields.io/badge/Real--Time-BroadcastChannel%20API-emerald.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)

> **A luxury, fine-dining web application featuring a real-time Point of Sale (POS), Kitchen Display System (KDS), interactive floor map, live order tracking, and an artisanal glassmorphism dark aesthetic.**

---

## 🌟 Executive Overview

**AHA Restaurant** is an end-to-end modern dining platform engineered for luxury hospitality. Designed with an ultra-premium dark glassmorphic palette accented by 24K gold tones, it bridges guest-facing digital dining with kitchen and floor staff operations in real-time.

With zero external backend dependencies, the platform uses modern Web APIs (**BroadcastChannel API**, **Web Audio API**, and **Reactive LocalStorage**) to deliver instant cross-tab synchronization between the patron's dining experience and the back-of-house operations portal.

---

## ✨ Key Highlights & Features

### 👤 1. Guest-Facing Experience
* **Artisanal Digital Menu (`menu.html`)**:
  * Real-time categorized catalog (Starters, Royal Dum Biryanis, Imperial Curries, Artisanal Breads, Desserts, and Smoked Elixirs).
  * Dietary classification tags (`Pure Veg`, `Non-Veg`, `Chef's Special`).
  * Live search and quick-filter bar.
  * Instant **"86'd (Sold Out)"** stock indicators synchronized dynamically with kitchen management.
* **Smart Order Tray & Drawer (`app.js`)**:
  * Multi-item cart with live GST/tax computation and quantity controls.
  * Context-aware destination selector: links automatically to assigned dine-in tables, takeaway, or online orders.
  * Open tab management: guests can append items to an active table tab seamlessly.
* **Real-Time Customer Live Status Tracker**:
  * Persistent floating glass pill displayed on the guest screen.
  * Live status progression from kitchen to table: `In Kitchen` ➔ `Plated` ➔ `Served / Dining` ➔ `Bill Requested` ➔ `Dining Completed`.
  * One-tap **"Request Bill"** call directly from the table to the server.
* **Table & Glass Chamber Reservations (`reservation.html`)**:
  * Booking engine supporting main hall tables, private glass chambers, and terrace seating.
  * Real-time dispatch into the Admin Operations floor map.
* **Sensory Web Audio Synthesizer**:
  * Harmonic luxury chimes synthesized via the native **Web Audio API** (no audio assets required) for orders, ticket updates, and table turnover.

---

### 👨‍🍳 2. Operations & Admin Management Portal (`admin.html`)
* **Live Operations Dashboard & Bento Metrics**:
  * Real-time synchronized counters: **Today's Revenue**, **Active Kitchen Tickets**, **Floor Occupancy Rate**, and **Total Sales Count**.
  * Dynamic analytics charts powered by Chart.js.
* **Interactive 12-Table Live Floor Plan Matrix**:
  * Color-coded status tiles across Main Hall (Tables 01–06), Glass Pods (01–02), Terrace (01–02), and Counter seats (01–02).
  * Status highlights: `Available` (Green), `Reserved` (Gold), `Dining / Occupied` (Cyan), and `Ready to Clear` (Amber).
  * Direct table inspection, manual order assignment, and single-click table release.
* **Kitchen Display System (KDS)**:
  * Kanban-style tickets with itemized order breakdowns and timestamps.
  * Quick-cycle order progression (`In Kitchen` ➔ `Plated` ➔ `Served` ➔ `Complete`).
* **Instant POS Settlement & Printable Invoices**:
  * Settlement modal supporting **Cash**, **Credit/Debit Card**, and **UPI / QR Code**.
  * Clean, formatted guest invoice generation with browser print stylesheet optimization (`window.print()`).
* **86'd Inventory & Stock Management**:
  * Instant toggle for menu items. Marking an item "86'd" immediately updates all open customer menus and grays out ordering buttons across active tabs.
* **Walk-In Registration Engine**:
  * Fast-track floor registration modal to assign tables and seat walk-in guests on demand.
* **Live POS Simulation Engine**:
  * Built-in toggle to simulate automatic incoming orders and dining churn every 14 seconds for demonstration and training.
* **System Reset (POS Wipe to Zero)**:
  * Full administrative reset modal to clear test tickets, wipe active orders, and reset revenue for a fresh shift.

---

## 🏗️ Real-Time Architecture

```
                   ┌───────────────────────────────────────┐
                   │        Customer Browser Window        │
                   │  (index.html / menu.html / etc.)      │
                   └──────────────────┬────────────────────┘
                                      │
                         BroadcastChannel ('aha_realtime_pos')
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │       Web Storage & Reactive Event Layer         │
             │       - aha_admin_orders                         │
             │       - aha_admin_reservations                   │
             │       - aha_86_list (Out of Stock)               │
             │       - aha_active_guest_order                   │
             └────────────────────────┬─────────────────────────┘
                                      │
                         BroadcastChannel ('aha_realtime_pos')
                                      │
                                      ▼
                   ┌───────────────────────────────────────┐
                   │         Admin & Kitchen Portal        │
                   │              (admin.html)             │
                   │   - Live Floor Map                    │
                   │   - Kitchen Display System (KDS)      │
                   │   - Billing & Cashier Settlement      │
                   └───────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
.
├── index.html          # Hero landing page, fine-dining storytelling & quick links
├── menu.html           # Artisanal digital menu with real-time stock sync & filters
├── reservation.html    # Table and VIP glass chamber booking interface
├── reviews.html        # Verified patron reviews, testimonials & press critique
├── about.html          # Restaurant heritage, culinary philosophy & chef profiles
├── admin.html          # Administrative POS, Kitchen Display System & Floor Map
├── app.js              # Core application engine, BroadcastChannel sync & Web Audio API
├── styles.css          # Glassmorphism design tokens, bespoke animations & print styles
├── test.js             # Tailwind design token configuration backup
├── package.json        # Project metadata and local development scripts
└── README.md           # Project documentation and developer guide
```

---

## 🎨 Design System & Aesthetics

* **Color Palette**:
  * **Primary (Gold Accent)**: `#f2ca50` / `#d4af37`
  * **Background & Dark Obsidian Surface**: `#16130b` / `#1f1b13`
  * **Text / Typography**: `#eae1d4` (warm ivory) with secondary variant `#d0c5af`
* **Glassmorphism**:
  * Layered frosted surfaces with `backdrop-filter: blur(16px - 24px)`.
  * Subtle 1px translucent borders (`rgba(255, 255, 255, 0.08 - 0.12)`).
  * Radiant ambient spotlights with smooth pulse animations.
* **Typography**:
  * Headings & Brand Display: *Playfair Display* (Editorial serif)
  * Body & Interactive UI: *Inter* (Clean sans-serif)
  * Icons: *Google Material Symbols Outlined*

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v16 or higher) installed on your system.

### Installation

1. Clone or download the repository to your local directory:
   ```bash
   git clone <repository-url>
   cd m2
   ```

2. Install local development dependencies:
   ```bash
   npm install
   ```

### Running Locally

To launch the local development server:

```bash
npm run dev
```

* The server will automatically start at **`http://localhost:8080`** and open in your default browser.
* To run without automatically opening the browser, run:
  ```bash
  npm start
  ```

---

## 🧪 Testing the Live Multi-Window Experience

To experience the full power of real-time synchronization between the guest and the kitchen:

1. **Window 1 (Patron)**: Open `http://localhost:8080/menu.html` (or `index.html`).
2. **Window 2 (Kitchen / POS)**: Open `http://localhost:8080/admin.html` side-by-side.
3. **Dispatch an Order**:
   - In Window 1, select dishes (e.g. *24K Gold Saffron Kebab*), choose **Table 01**, and checkout.
   - Observe Window 2 instantly emit an audio chime, pop up a real-time toast, update **Table 01** on the Live Floor Map to "Occupied", and render the new kitchen ticket on the KDS board.
4. **Update Status**:
   - In Window 2, advance the ticket from `In Kitchen` ➔ `Plated` ➔ `Served`.
   - Observe the floating customer status tracker pill in Window 1 update its step and color in real time.
5. **Request & Settle Bill**:
   - In Window 1, click **"Request Bill"** on the floating pill.
   - In Window 2, settle the bill via the cashier modal and print the receipt.
6. **Stock 86'ing**:
   - In Window 2, toggle any menu dish under **Menu 86'd Stock** to "Sold Out".
   - Window 1 will instantly grey out the item with a "Sold Out" badge.

---

## 🛠️ Built With

* **Markup & Structure**: HTML5 Semantic Elements
* **Styling**: [Tailwind CSS CDN](https://tailwindcss.com/) with customized configuration & vanilla CSS extensions
* **Scripting**: Modern Vanilla JavaScript (ES6 Modules, Promises, DOM API)
* **Real-Time Cross-Tab Communications**: Native [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)
* **Sound Generation**: [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) (OscillatorNode & GainNode)
* **Visualizations**: [Chart.js](https://www.chartjs.org/)
* **Typography & Icons**: [Google Fonts](https://fonts.google.com/) & [Google Material Symbols](https://fonts.google.com/icons)

---

## 📄 License

This project is licensed under the [ISC License](file:///c:/Users/MOHAN/OneDrive/Desktop/m2/package.json).
