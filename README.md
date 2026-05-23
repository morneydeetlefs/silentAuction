# Silent Auction Platform

A lightweight, fully functional silent auction web platform built entirely on free-tier services. No backend servers, no monthly costs, no third-party auth — just Google Sheets as a database, Google Apps Script as an API, and two vanilla HTML/JS pages.

---

## Live Demo

> Deploy your own in under 15 minutes — see [Getting Started](#getting-started)

---

## Overview

| | |
|---|---|
| **Type** | Web App (Static Frontend + Serverless Backend) |
| **Stack** | HTML · CSS · Vanilla JS · Google Apps Script · Google Sheets |
| **Hosting** | GitHub Pages / Netlify Drop (frontend) · Google Apps Script (API) |
| **Cost** | R 0 / $0 — 100% free tier |
| **Auth** | PIN-based admin · Bidder ID registration |
| **Notifications** | WhatsApp deep links via wa.me |

---

## Features

### Public Auction Page (`index.html`)
- Bidder registration with unique auto-generated Bidder ID (`BID-XXXXXX`)
- Live item grid with current bids, leader names and status chips
- Minimum bid increment enforcement
- Live countdown timer to auction close
- Bid modal with WhatsApp contact link to organiser
- Auction name and end date pulled live from config
- Mobile-first responsive design — dark gold luxury aesthetic
- Persistent session via `localStorage`

### Admin Dashboard (`admin.html`)
- PIN-based login (stored securely in Google Apps Script Script Properties)
- Item management — add, edit, delete, open/close per item
- Image upload via ImgBB (drag & drop or click) with URL fallback
- Live stats — total items, open, closed, total raised
- Live bids view — current leader per item
- Close All Bidding — locks auction and generates winners list
- Winners list with one-click WhatsApp notification per winner
- Share individual items to WhatsApp (pre-formatted message)
- Share Top 3 most popular items to WhatsApp

### WhatsApp Integration
- Pre-formatted share messages with bold/italic WhatsApp markdown
- Single item share — name, description, current bid, leader, close date, URL
- Top 3 share — ranked by most bids placed, with bid counts
- Winner notification — pre-filled congratulations message per winner
- Contact organiser link from bid modal
- Compatible with Android and desktop Chrome

### Backend (`Code.gs` — Google Apps Script)
- RESTful GET/POST dispatcher
- Endpoints: `getItems`, `getItem`, `getConfig`, `getTop3`, `getWinners`, `register`, `placeBid`, `adminLogin`, `addItem`, `updateItem`, `closeItem`, `deleteItem`, `closeAll`
- Google Sheets as database — 5 tabs: Items, Bids, Bidders, Config, Winners
- Script Properties for secure credential storage
- One-time `setupSheets()` function creates all structure automatically
- Date serialisation handling for all Google Sheets date formats

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Static Hosting                     │
│         GitHub Pages / Netlify / Any CDN             │
│                                                      │
│   index.html          admin.html                     │
│   (Public Bidders)    (Organiser)                    │
└──────────────┬───────────────────┬───────────────────┘
               │  fetch() REST     │  fetch() REST
               ▼                   ▼
┌─────────────────────────────────────────────────────┐
│           Google Apps Script Web App                 │
│                   Code.gs                            │
│                                                      │
│   doGet()  ──►  action dispatcher                    │
│   doPost() ──►  action dispatcher                    │
└──────────────────────────┬──────────────────────────┘
                           │  SpreadsheetApp
                           ▼
┌─────────────────────────────────────────────────────┐
│                  Google Sheets                       │
│                                                      │
│   Items │ Bids │ Bidders │ Config │ Winners          │
└─────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│              WhatsApp  (wa.me)                       │
│                                                      │
│   Share items · Notify winners · Contact organiser   │
└─────────────────────────────────────────────────────┘
```

---

## Google Sheets Schema

### Items
| Column | Description |
|--------|-------------|
| ID | Timestamp-based unique ID |
| Name | Item name |
| Description | Short description |
| Image URL | Hosted image URL (ImgBB) |
| Starting Bid | Opening bid amount |
| Current Bid | Highest bid so far |
| Highest Bidder ID | Bidder ID of current leader |
| Highest Bidder Name | Display name of current leader |
| Status | `open` or `closed` |
| Min Increment | Minimum raise per bid |

### Config
| Key | Description |
|-----|-------------|
| `AuctionName` | Displayed in header and WA messages |
| `AuctionEnd` | ISO 8601 datetime — drives countdown timer |
| `WhatsAppNum` | Organiser WA number (digits only, with country code) |
| `SiteURL` | Public URL included in WA share messages |

### Script Properties (secure)
| Key | Description |
|-----|-------------|
| `AdminPIN` | Admin dashboard PIN — never stored in the sheet |

---

## Getting Started

### Prerequisites
- Google account
- GitHub account (for hosting) or any static file host
- ImgBB account (free) for image uploads — [imgbb.com](https://imgbb.com)

### 1 — Set up the Google Sheet

1. Create a new Google Sheet
2. Go to **Extensions → Apps Script**
3. Paste the contents of `Code.gs` into the editor
4. Run the `setupSheets` function once — this creates all 5 tabs with headers and seeds default config values

### 2 — Configure Script Properties

In Apps Script → **⚙ Project Settings → Script Properties**, add:

| Property | Value |
|----------|-------|
| `AdminPIN` | Your chosen PIN |

### 3 — Update the Config sheet

Open your Google Sheet → Config tab and fill in:

| Key | Value |
|-----|-------|
| `AuctionName` | Your auction name |
| `AuctionEnd` | e.g. `2025-11-30T20:00:00` |
| `WhatsAppNum` | e.g. `27831234567` |
| `SiteURL` | Your hosted public page URL |

### 4 — Deploy the Apps Script Web App

1. Click **Deploy → New deployment**
2. Type: **Web App**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Click **Deploy** and copy the Web App URL

### 5 — Configure the frontend files

In both `index.html` and `admin.html`, replace:

```javascript
const API = 'YOUR_APPS_SCRIPT_WEB_APP_URL';
```

In `admin.html`, replace:

```javascript
const IMGBB_KEY = 'YOUR_IMGBB_API_KEY';
```

### 6 — Add Open Graph meta tags (optional but recommended)

In `index.html` `<head>`, update:

```html
<meta property="og:title"       content="Your Auction Name"/>
<meta property="og:description" content="Place your bids before time runs out."/>
<meta property="og:image"       content="https://your-banner-image.jpg"/>
<meta property="og:url"         content="https://yoursite.com"/>
```

This enables rich WhatsApp link previews when your URL is shared.

### 7 — Host the frontend

Upload `index.html` and `admin.html` to any static host:

- **GitHub Pages** — push to a repo, enable Pages in settings
- **Netlify Drop** — drag and drop at [app.netlify.com/drop](https://app.netlify.com/drop)
- **Google Sites** — embed via iframe

---

## Redeploying After Code Changes

> Every change to `Code.gs` requires a new deployment version to take effect on the live URL.

**Deploy → Manage deployments → Edit → Version: New version → Deploy**

---

## Security Notes

- Admin PIN is stored in **Script Properties** — not visible to Google Sheet viewers or editors
- The Apps Script Web App runs as the owner — bidders never have Sheet access
- No sensitive data is stored in `localStorage` — only Bidder ID and display name
- For production use, consider adding rate limiting in `placeBid` to prevent bid flooding

---

## Project Structure

```
silent-auction/
├── index.html          # Public bidder page (register + browse + bid)
├── admin.html          # Admin dashboard (PIN-gated)
├── Code.gs             # Google Apps Script backend
└── README.md
```

---

## Roadmap / Possible Extensions

- [ ] Auto-refresh bids every 30 seconds on public page
- [ ] Email confirmation via Apps Script `MailApp`
- [ ] QR code linking to public page (printable for events)
- [ ] WhatsApp Business API integration for auto-send to groups
- [ ] Bid history modal per item
- [ ] Reserve price (hidden minimum) support
- [ ] Multi-event / multi-sheet support

---

## Built With

- [Google Apps Script](https://developers.google.com/apps-script)
- [Google Sheets API](https://developers.google.com/sheets)
- [ImgBB API](https://api.imgbb.com)
- [wa.me WhatsApp Links](https://wa.me)
- [Google Fonts — Cinzel, Cormorant Garamond, Raleway, Syne](https://fonts.google.com)

---

## License

MIT — free to use, modify, and deploy for personal or commercial projects.

---

## Author

Built with care for small community and charity events that deserve a polished experience without enterprise costs.

> *Bid with grace. Win with honour.*
