# Silent Auction + Tombola Platform

A fully functional silent auction and tombola web platform built entirely on free-tier services. No backend servers, no monthly costs, no third-party auth — Google Sheets as a database, Google Apps Script as a REST API, and vanilla HTML/JS pages hosted on Cloudflare Pages.

---

## Live Platform

| Page | URL |
|------|-----|
| 🏺 **Public Auction & Tombola** | [silentauction.morneydeetlefs.workers.dev](https://silentauction.morneydeetlefs.workers.dev/) |
| ⚙️ **Admin Dashboard** | [silentauction.morneydeetlefs.workers.dev/admin.html](https://silentauction.morneydeetlefs.workers.dev/admin.html) |
| 📖 **Admin Help Guide** | [silentauction.morneydeetlefs.workers.dev/admin-help.html](https://silentauction.morneydeetlefs.workers.dev/admin-help.html) |
| 📄 **Sponsor Proposal Generator** | [silentauction.morneydeetlefs.workers.dev/proposal-generator.html](https://silentauction.morneydeetlefs.workers.dev/proposal-generator.html) |

---

## Overview

| | |
|---|---|
| **Type** | Web App (Static Frontend + Serverless Backend) |
| **Stack** | HTML · CSS · Vanilla JS · Google Apps Script · Google Sheets |
| **Hosting** | Cloudflare Pages (frontend) · Google Apps Script (API) |
| **Cost** | R 0 / $0 — 100% free tier |
| **Auth** | PIN-based admin · Bidder ID registration |
| **Notifications** | WhatsApp deep links via wa.me |
| **Video** | YouTube Unlisted (sponsor ads for tombola) |

---

## Features

### Public Page (`index.html`) — 3 tabs

**Register**
- Bidder registration with unique auto-generated Bidder ID (`BID-XXXXXX`)
- Phone-based duplicate detection — returning bidders get their existing ID
- Persistent session via `localStorage`

**Auction**
- Live item grid with current bids, leader names and open/closed status
- Minimum bid increment enforcement per item
- Live countdown timer to auction close
- Bid modal with WhatsApp contact link to organiser
- Auction name and end date pulled live from Config sheet

**Tombola**
- Prize grid with ticket counts and sponsor attribution
- Earn tickets by watching 30-second sponsor video ads (YouTube IFrame)
- Video cannot be skipped — ticket only awarded on genuine completion
- Server-side token validation with timing check (anti-cheat)
- My Tickets panel showing all earned tickets grouped by prize
- Tombola active/inactive controlled from Config sheet

### Admin Dashboard (`admin.html`) — 4 sections

**Items**
- Add, edit, delete auction items
- Drag-and-drop image upload via ImgBB API with URL fallback
- Live stats — total items, open, closed, total raised
- Close bidding per item or all at once
- Share individual items or Top 3 to WhatsApp

**Live Bids**
- Current leader and highest bid per item
- Manual refresh

**Auction Winners**
- Auto-generated on Close All
- One-click WhatsApp notification per winner with pre-filled congratulations message

**Tombola** — 3 sub-tabs
- *Prizes* — add, edit, delete prizes; draw winners per prize or all at once; share prizes to WhatsApp
- *Sponsor Videos* — add YouTube video IDs, activate/deactivate, track view counts
- *Winners* — tombola draw results with one-click WhatsApp notification per winner

### Sponsor Proposal Generator (`proposal-generator.html`)
- Interactive HTML form — fill in event and sponsor details, live preview updates instantly
- Professional PDF-ready proposal layout
- Calculates cost-per-view automatically from participant estimates
- Export via browser Print → Save as PDF

### Admin Help Guide (`admin-help.html`)
- 13-section human-readable guide covering every feature
- Sticky sidebar navigation with scroll-spy
- Troubleshooting table for common issues
- Event day checklist

### WhatsApp Integration
- All messages use WhatsApp markdown (`*bold*`, `_italic_`) — no emoji, works on Android and Windows Chrome
- Auction: share item, share Top 3, notify auction winner
- Tombola: share prize, share Top 3 tombola prizes, notify tombola winner
- Contact organiser link from bid modal

### Backend (`Code.gs` — Google Apps Script)
- RESTful GET/POST dispatcher pattern
- 22 endpoints covering auction and tombola
- `LockService` concurrency protection on ticket claims
- Token-based anti-cheat for tombola video completion
- Google Sheets as database — 9 tabs total
- Script Properties for secure PIN storage
- One-time `setupSheets()` creates all structure automatically
- Explicit type casting on all sheet reads — no silent serialisation failures

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                           │
│                                                               │
│  index.html          admin.html                               │
│  (Register/Auction/  (PIN-gated organiser dashboard)          │
│   Tombola)                                                    │
│                                                               │
│  admin-help.html     proposal-generator.html                  │
│  (Help guide)        (Sponsor PDF tool)                       │
└──────────┬──────────────────────────┬────────────────────────┘
           │  fetch() REST            │  fetch() REST
           ▼                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Google Apps Script Web App                       │
│                      Code.gs                                  │
│                                                               │
│  doGet()  ──►  action dispatcher  ──►  auction handlers       │
│  doPost() ──►  action dispatcher  ──►  tombola handlers       │
│                                   ──►  token validation       │
└──────────────────────────┬───────────────────────────────────┘
                           │  SpreadsheetApp
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                     Google Sheets                             │
│                                                               │
│  Auction:  Items │ Bids │ Bidders │ Config │ Winners          │
│  Tombola:  TombolaItems │ TombolaTickets │ TombolaWinners     │
│            SponsorVideos                                      │
└──────────────────────────┬───────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
┌─────────────────┐ ┌───────────┐ ┌──────────────────────────┐
│  wa.me links    │ │  ImgBB    │ │  YouTube IFrame API       │
│  Winner alerts  │ │  Images   │ │  Sponsor video ads        │
│  Share posts    │ │           │ │  Completion detection     │
└─────────────────┘ └───────────┘ └──────────────────────────┘
```

---

## Google Sheets Schema

### Auction Sheets

**Items**
| Column | Description |
|--------|-------------|
| ID | Timestamp-based unique ID |
| Name | Item name |
| Description | Short description |
| Image URL | ImgBB hosted URL |
| Starting Bid | Opening bid amount (ZAR) |
| Current Bid | Highest bid so far |
| Highest Bidder ID | Bidder ID of current leader |
| Highest Bidder Name | Display name of current leader |
| Status | `open` or `closed` |
| Min Increment | Minimum raise per bid |

**Supporting sheets:** Bids · Bidders · Winners

### Tombola Sheets

**TombolaItems**
| Column | Description |
|--------|-------------|
| ID | `TP-` prefixed timestamp ID |
| Name | Prize name |
| Description | Short description |
| Image URL | ImgBB hosted URL |
| Sponsor Name | Donating business |
| Total Tickets | Cap (0 = unlimited) |
| Tickets Sold | Running count |
| Status | `open`, `closed`, or `drawn` |
| Winner Ticket | Winning ticket ID after draw |
| Winner Bidder ID | Winner's Bidder ID |
| Winner Name | Winner's display name |

**Supporting sheets:** TombolaTickets · TombolaWinners · SponsorVideos

### Config Sheet

| Key | Description |
|-----|-------------|
| `AuctionName` | Displayed in header and WA messages |
| `AuctionEnd` | ISO 8601 datetime — `2025-11-30T20:00:00` |
| `WhatsAppNum` | Organiser number — digits only with country code |
| `SiteURL` | Public URL for WA share messages |
| `TombolaName` | Tombola display name |
| `TombolaEnd` | ISO 8601 datetime |
| `TombolaActive` | `TRUE` or `FALSE` — master on/off switch |
| `TicketsPerView` | Tickets earned per completed video (usually `1`) |
| `TokenExpiry` | Seconds token stays valid after issue (default `45`) |

### Script Properties (secure — not in sheet)

| Key | Description |
|-----|-------------|
| `AdminPIN` | Admin dashboard PIN |

---

## Getting Started

> **New to this?** See the [plain-English setup guide](SETUP.md) — no technical experience needed.

### Prerequisites
- Google account
- Cloudflare account (free) or any static file host
- ImgBB account (free) — [imgbb.com](https://imgbb.com)
- YouTube account for uploading sponsor videos as Unlisted

### 1 — Set up Google Sheet and Apps Script

1. Create a new Google Sheet
2. Go to **Extensions → Apps Script**
3. Paste `Code.gs` into the editor and save
4. Run `setupSheets()` once — creates all 9 tabs with headers and seeds default config

### 2 — Set Admin PIN securely

Apps Script → **⚙ Project Settings → Script Properties → Add script property:**

| Property | Value |
|----------|-------|
| `AdminPIN` | Your chosen PIN |

### 3 — Fill the Config sheet

| Key | Example |
|-----|---------|
| `AuctionName` | `Harvest Festival Auction 2025` |
| `AuctionEnd` | `2025-11-30T20:00:00` |
| `WhatsAppNum` | `27831234567` |
| `SiteURL` | `https://yoursite.pages.dev/` |
| `TombolaActive` | `TRUE` |
| `TombolaName` | `Community Tombola` |
| `TombolaEnd` | `2025-11-30T21:00:00` |
| `TicketsPerView` | `1` |
| `TokenExpiry` | `45` |

### 4 — Deploy Apps Script Web App

1. **Deploy → New deployment**
2. Type: **Web App**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Click Deploy → copy the Web App URL

### 5 — Configure frontend files

In both `index.html` and `admin.html`:
```javascript
const API = 'YOUR_APPS_SCRIPT_WEB_APP_URL';
```

In `admin.html`:
```javascript
const IMGBB_KEY = 'YOUR_IMGBB_API_KEY';
```

### 6 — Add sponsor videos (Tombola)

1. Upload sponsor MP4 to YouTube → set visibility to **Unlisted**
2. Copy the video ID from the URL (the part after `?v=`)
3. In Admin → Tombola → Sponsor Videos → Add Sponsor Video

### 7 — Host on Cloudflare Pages

1. Push all files to a GitHub repo
2. Cloudflare Pages → New project → Connect to Git → select repo
3. No build command needed — pure static files
4. Deploy

---

## Redeploying After Code Changes

> Every change to `Code.gs` requires a new deployment version to take effect.

**Deploy → Manage deployments → Edit → Version: New version → Deploy**

---

## Security Notes

- Admin PIN stored in **Script Properties** — never visible to Sheet viewers or editors
- Apps Script Web App executes as the owner — participants never have Sheet access
- `localStorage` stores only Bidder ID and display name — no sensitive data
- Tombola token validation runs server-side — client cannot self-award tickets
- `LockService` prevents concurrent ticket double-claims

---

## Project Structure

```
silent-auction/
├── index.html               # Public page — Register / Auction / Tombola
├── admin.html               # Admin dashboard — PIN-gated
├── admin-help.html          # Human-readable admin guide
├── proposal-generator.html  # Interactive sponsor proposal PDF tool
├── Code.gs                  # Google Apps Script backend (all endpoints)
└── README.md
```

---

## Roadmap

- [ ] Auto-refresh bids every 30 seconds on public page
- [ ] Email confirmation via Apps Script `MailApp`
- [ ] Printable QR code for event signage
- [ ] WhatsApp Business API for auto-send to groups
- [ ] Bid history modal per item
- [ ] Reserve price (hidden minimum) support
- [ ] Multi-event / multi-sheet support
- [ ] Tombola ticket QR code for physical events

---

## Built With

- [Google Apps Script](https://developers.google.com/apps-script)
- [Google Sheets](https://developers.google.com/sheets)
- [Cloudflare Pages](https://pages.cloudflare.com)
- [ImgBB API](https://api.imgbb.com)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [wa.me WhatsApp Links](https://wa.me)
- [Google Fonts](https://fonts.google.com) — Cinzel · Cormorant Garamond · Raleway · Syne · IBM Plex

---

## License

MIT — free to use, modify, and deploy for personal or commercial projects.

---

## Author

Built with care for small community and charity events that deserve a polished experience without enterprise costs.

> *Bid with grace. Win with honour.*
