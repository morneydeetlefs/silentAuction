# Setup Guide — Your Own Silent Auction & Tombola Platform

**No technical experience needed. Follow these steps in order and you will have a fully working platform in about 30 minutes.**

Everything used in this guide is completely free. You will need:
- A Google account (Gmail)
- A Cloudflare account (free at cloudflare.com)
- An ImgBB account (free at imgbb.com)
- A GitHub account (free at github.com)

---

## Before You Start

This platform has two parts that work together:

| Part | What it is | Where it lives |
|------|-----------|----------------|
| **The website** | The pages your users see | Cloudflare Pages (free hosting) |
| **The backend** | The database and logic | Google Sheets + Apps Script (free) |

Think of it like this: the website is the shop front, and Google Sheets is the stockroom. They talk to each other automatically.

---

## Step 1 — Copy the Files from GitHub

1. Go to **https://github.com/morneydeetlefs/silentAuction**
2. Click the green **Code** button
3. Click **Download ZIP**
4. Unzip the downloaded file on your computer — you will see these files:
   - `index.html`
   - `admin.html`
   - `admin-help.html`
   - `proposal-generator.html`
   - `code.gs`
   - `README.md`

Keep this folder open — you will need it throughout this guide.

---

## Step 2 — Create Your Google Sheet

This is where all your auction data will be stored.

1. Go to **sheets.google.com** and sign in with your Google account
2. Click the big **+** button to create a new blank spreadsheet
3. Give it a name at the top — something like **"My Auction 2025"**
4. Leave it open in your browser

---

## Step 3 — Set Up the Apps Script Backend

This is the engine that powers everything. It sounds technical but you are mostly just copying and pasting.

1. In your Google Sheet, click **Extensions** in the top menu
2. Click **Apps Script** — a new tab opens with a code editor
3. You will see some default code — **select all of it and delete it**
4. Open the `code.gs` file from the folder you downloaded in Step 1
   - On Windows: right-click the file → Open with → Notepad
   - On Mac: right-click → Open with → TextEdit
5. **Select all the text** (Ctrl+A on Windows, Cmd+A on Mac) and **copy it**
6. Go back to the Apps Script tab and **paste** the code there
7. Click the **Save** button (the floppy disk icon, or Ctrl+S)
8. Name the project something like **"Auction Backend"** when asked

### Run the one-time setup

1. In Apps Script, find the dropdown at the top that says **"Select function"**
2. Click it and choose **setupSheets**
3. Click the **Run** button (the triangle/play icon)
4. A popup will ask you to authorise — click **Review permissions**
5. Choose your Google account
6. You may see a warning that says "Google hasn't verified this app" — click **Advanced** then **Go to Auction Backend (unsafe)**
   > This warning appears because it's your own private script, not a published app. It is safe.
7. Click **Allow**
8. Go back to your Google Sheet — you will now see 9 new tabs at the bottom: Items, Bids, Bidders, Config, Winners, TombolaItems, TombolaTickets, TombolaWinners, SponsorVideos

---

## Step 4 — Set Your Admin PIN Securely

Your admin PIN is stored separately from the spreadsheet so it stays private.

1. In Apps Script, click the **⚙ (gear/cog) icon** on the left sidebar — this opens Project Settings
2. Scroll down to the bottom — you will see **Script Properties**
3. Click **Add script property**
4. In the **Property** field type exactly: `AdminPIN`
5. In the **Value** field type your chosen PIN (e.g. `mySecret2025`)
6. Click **Save script properties**

> Write your PIN down somewhere safe — you will need it to log into the admin dashboard.

---

## Step 5 — Deploy Your Backend as a Web App

This makes your Apps Script accessible from the website.

1. In Apps Script, click the blue **Deploy** button in the top right
2. Click **New deployment**
3. Click the **gear icon** next to "Select type" and choose **Web app**
4. Fill in the settings:
   - Description: `My Auction API`
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**
6. Another permission popup may appear — click **Authorise access** and follow the same steps as before
7. **Copy the Web App URL** — it looks like:
   `https://script.google.com/macros/s/LONG-STRING-OF-LETTERS/exec`
   > Save this URL — you will need it in the next steps

---

## Step 6 — Fill In Your Config Sheet

1. Go back to your Google Sheet
2. Click the **Config** tab at the bottom
3. You will see a list of settings. Fill in the **Value** column (column B) for each:

| Key | What to put here |
|-----|-----------------|
| `AuctionName` | Your event name, e.g. `Charity Gala Auction 2025` |
| `AuctionEnd` | When bidding closes, e.g. `2025-11-30T20:00:00` (year-month-dayThour:minute:second) |
| `WhatsAppNum` | Your WhatsApp number — **digits only, with country code, no spaces**. South Africa example: `27831234567` (not `083 123 4567`) |
| `SiteURL` | Leave blank for now — you will fill this in after Step 8 |
| `TombolaName` | Your tombola name, e.g. `Community Tombola` |
| `TombolaEnd` | When tombola closes (same format as AuctionEnd) |
| `TombolaActive` | Type `TRUE` to show tombola, `FALSE` to hide it |
| `TicketsPerView` | Type `1` |
| `TokenExpiry` | Type `45` |

---

## Step 7 — Add Your Web App URL to the HTML Files

You need to tell the website files where to find your backend. You will do this in two files.

### In `index.html`

1. Open `index.html` in Notepad (Windows) or TextEdit (Mac)
2. Press **Ctrl+F** (Windows) or **Cmd+F** (Mac) to open Find
3. Search for: `YOUR_APPS_SCRIPT_WEB_APP_URL`
4. Replace it with the URL you copied in Step 5
5. Save the file

### In `admin.html`

1. Open `admin.html` the same way
2. Search for `YOUR_APPS_SCRIPT_WEB_APP_URL` and replace with your URL
3. While you have the file open, also search for `YOUR_IMGBB_API_KEY` — see Step 7b below
4. Save the file

### Step 7b — Get a Free ImgBB Key (for uploading images)

This lets you upload photos of your auction items.

1. Go to **imgbb.com** and create a free account
2. After signing in, go to **api.imgbb.com**
3. Copy your API key
4. In `admin.html`, replace `YOUR_IMGBB_API_KEY` with your key
5. Save the file

---

## Step 8 — Put Your Files on Cloudflare Pages

This is where your website will live — for free.

### First: put your files on GitHub

1. Go to **github.com** and sign in (or create a free account)
2. Click the **+** button in the top right → **New repository**
3. Name it something like `my-auction`
4. Set it to **Public**
5. Click **Create repository**
6. On the next page, click **uploading an existing file**
7. Drag and drop these files into the upload area:
   - `index.html`
   - `admin.html`
   - `admin-help.html`
   - `proposal-generator.html`
8. Scroll down and click **Commit changes**

### Then: connect to Cloudflare Pages

1. Go to **cloudflare.com** and create a free account (or sign in)
2. In the left sidebar click **Workers & Pages**
3. Click **Create** → **Pages** → **Connect to Git**
4. Click **Connect GitHub** and follow the prompts to link your account
5. Select your `my-auction` repository
6. Leave all the build settings blank — no build command needed
7. Click **Save and Deploy**
8. Wait about 30 seconds — Cloudflare will give you a URL like `my-auction.pages.dev`

### Update your Config sheet

1. Go back to your Google Sheet → Config tab
2. Find the `SiteURL` row and paste your new Cloudflare URL in column B
   e.g. `https://my-auction.pages.dev`

---

## Step 9 — Test Everything

Open your Cloudflare URL in a browser and check each of these:

- [ ] The public page loads and shows your auction name
- [ ] You can register as a bidder and get a Bidder ID
- [ ] Open `yoursite.pages.dev/admin.html` — the PIN screen appears
- [ ] Enter your PIN — the dashboard loads
- [ ] Add a test item in the admin — it appears on the public page

If anything doesn't work, see the **Troubleshooting** section below.

---

## Step 10 — Add Tombola Sponsor Videos (Optional)

If you want to run the tombola:

1. Ask your sponsor for a short video (MP4 format, 30 seconds or less)
2. Upload it to **YouTube** — when uploading, set the visibility to **Unlisted** (not Public)
3. After uploading, copy the video ID from the URL
   - The URL looks like: `youtube.com/watch?v=dQw4w9WgXcQ`
   - The ID is the part after `?v=` — in this example: `dQw4w9WgXcQ`
4. In your admin dashboard → **Tombola** → **Sponsor Videos** → **+ Add Sponsor Video**
5. Enter the sponsor name and paste the YouTube ID
6. Make sure `TombolaActive` is set to `TRUE` in your Config sheet

---

## You're Done!

Share these links with people involved in your event:

| Link | Share with |
|------|-----------|
| `yoursite.pages.dev` | Everyone — bidders and participants |
| `yoursite.pages.dev/admin.html` | Yourself and any co-organisers (keep the PIN private) |
| `yoursite.pages.dev/admin-help.html` | Co-organisers who need a guide |
| `yoursite.pages.dev/proposal-generator.html` | Anyone approaching local sponsors |

---

## On the Day of Your Event

1. Log into the admin dashboard
2. Make sure all your items are added with photos and starting bids
3. If running tombola — make sure at least one sponsor video is Active
4. Share the public link to your WhatsApp groups
5. Use the **Share Top 3** button during the event to keep people engaged
6. When bidding closes — click **Close All Bidding**
7. Go to **Winners** and use **Notify on WA** to message each winner

---

## Troubleshooting

**The page loads but shows "Could not load items"**
→ Your Web App URL in the HTML files may be wrong. Double-check Step 7.
→ You may need to redeploy Apps Script. In Apps Script: Deploy → Manage deployments → Edit → New version → Deploy.

**Incorrect PIN when logging into admin**
→ In Apps Script, click the ⚙ gear icon → Script Properties. Check that `AdminPIN` exists with no spaces before or after the value.

**Tombola shows "not open yet"**
→ In your Google Sheet → Config tab, make sure `TombolaActive` says exactly `TRUE` (all capitals).

**Images aren't uploading**
→ Check your ImgBB API key in `admin.html`. Get a new one at api.imgbb.com.

**WhatsApp link opens but the message looks wrong**
→ Make sure your WhatsApp number in Config is digits only with country code: `27831234567` not `083 123 4567`.

**I made a change and nothing updated**
→ Every change to `code.gs` needs a new deployment in Apps Script.
→ Every change to HTML files needs to be re-uploaded to GitHub (Cloudflare will auto-update).

---

## Keeping Your Platform Updated

When a newer version of this platform is released on GitHub:

1. Download the new ZIP from the GitHub repo
2. Replace your HTML files in GitHub (upload the new ones)
3. If `code.gs` changed, paste the new code into Apps Script and redeploy
4. Your data in Google Sheets is untouched — only the code updates

---

## Need Help?

If you get stuck, the best places to look are:

1. **The built-in help guide** at `yoursite.pages.dev/admin-help.html` — covers every feature
2. **The GitHub repo** — github.com/morneydeetlefs/silentAuction — check the Issues tab for known problems
3. **Open a GitHub Issue** — describe your problem and someone may be able to help

---

*This platform was built to be shared freely with community organisations.
All it costs to run is your time setting it up.*

