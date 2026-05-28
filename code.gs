// ============================================================
//  SILENT AUCTION — Google Apps Script Backend (Code.gs)
//  Paste this entire file into your Apps Script project.
//  Deploy as: Execute as ME, Anyone can access (or Anyone with link)
// ============================================================

const SS = SpreadsheetApp.getActiveSpreadsheet();

// ── Sheet helpers ────────────────────────────────────────────
function getSheet(name) { return SS.getSheetByName(name); }

// ── CORS / Response helper ───────────────────────────────────
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  GET dispatcher
// ============================================================
function doGet(e) {
  const action = e.parameter.action || '';
  try {
    switch (action) {
      case 'getItems':          return jsonResponse(getItems());
      case 'getItem':           return jsonResponse(getItem(e.parameter.id));
      case 'getWinners':        return jsonResponse(getWinners());
      case 'ping':              return jsonResponse({ ok: true });
      case 'getConfig':         return jsonResponse(getPublicConfig());
      case 'getTop3':           return jsonResponse(getTop3());
      case 'getTombolaItems':   return jsonResponse(getTombolaItems());
      case 'getTombolaTickets': return jsonResponse(getTombolaTickets(e.parameter.bidderId));
      case 'getSponsorVideo':   return jsonResponse(getSponsorVideo());
      case 'getSponsorVideosAdmin': return jsonResponse(getSponsorVideosAdmin());
      case 'getTombolaWinners': return jsonResponse(getTombolaWinners());
      case 'getTombolaConfig':  return jsonResponse(getTombolaConfig());
      default:                  return jsonResponse({ error: 'Unknown GET action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ============================================================
//  POST dispatcher
// ============================================================
function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (_) {}
  const action = body.action || '';
  try {
    switch (action) {
      case 'register':            return jsonResponse(registerBidder(body));
      case 'placeBid':            return jsonResponse(placeBid(body));
      case 'adminLogin':          return jsonResponse(adminLogin(body));
      case 'addItem':             return jsonResponse(addItem(body));
      case 'updateItem':          return jsonResponse(updateItem(body));
      case 'closeItem':           return jsonResponse(closeItem(body));
      case 'deleteItem':          return jsonResponse(deleteItem(body));
      case 'closeAll':            return jsonResponse(closeAll(body));
      case 'setup':               return jsonResponse(setupSheets());
      case 'claimTicket':         return jsonResponse(claimTicket(body));
      case 'drawPrize':           return jsonResponse(drawPrize(body));
      case 'drawAll':             return jsonResponse(drawAll(body));
      case 'addTombolaItem':      return jsonResponse(addTombolaItem(body));
      case 'updateTombolaItem':   return jsonResponse(updateTombolaItem(body));
      case 'deleteTombolaItem':   return jsonResponse(deleteTombolaItem(body));
      case 'addSponsorVideo':     return jsonResponse(addSponsorVideo(body));
      case 'toggleSponsorVideo':  return jsonResponse(toggleSponsorVideo(body));
      default:                    return jsonResponse({ error: 'Unknown POST action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ============================================================
//  CONFIG helpers
// ============================================================
function getConfig(key) {
  const prop = PropertiesService.getScriptProperties().getProperty(key);
  if (prop !== null) return prop;
  const sheet = getSheet('Config');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return null;
}

function setConfig(key, value) {
  const sheet = getSheet('Config');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) { sheet.getRange(i + 1, 2).setValue(value); return; }
  }
  sheet.appendRow([key, value]);
}

function getPublicConfig() {
  return {
    ok:          true,
    auctionName: getConfig('AuctionName') || 'Silent Auction',
    auctionEnd:  getConfig('AuctionEnd')  || '',
    waNumber:    getConfig('WhatsAppNum') || '',
    siteUrl:     getConfig('SiteURL')     || ''
  };
}

function getTombolaConfig() {
  return {
    ok:            true,
    tombolaName:   getConfig('TombolaName')   || 'Community Tombola',
    tombolaEnd:    getConfig('TombolaEnd')    || '',
    tombolaActive: getConfig('TombolaActive') || 'FALSE',
    ticketsPerView:Number(getConfig('TicketsPerView')) || 1,
    siteUrl:       getConfig('SiteURL')       || ''
  };
}

// ============================================================
//  AUTH
// ============================================================
function adminLogin(body) {
  const pin = getConfig('AdminPIN');
  if (!pin) return { error: 'AdminPIN not configured' };
  if (String(body.pin) === String(pin).trim()) return { ok: true };
  return { error: 'Invalid PIN' };
}

function authAdmin(body) {
  if (String(body.adminPin) !== String(getConfig('AdminPIN')).trim()) {
    throw new Error('Unauthorized');
  }
}

// ============================================================
//  BIDDERS
// ============================================================
function generateBidderId() {
  return 'BID-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function registerBidder(body) {
  const { name, phone, email } = body;
  if (!name || !phone) return { error: 'Name and phone are required' };
  const sheet = getSheet('Bidders');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === phone) {
      return { ok: true, bidderId: data[i][0], name: data[i][1], existing: true };
    }
  }
  const bidderId = generateBidderId();
  sheet.appendRow([bidderId, name, phone, email || '', new Date().toLocaleString()]);
  return { ok: true, bidderId, name };
}

function getBidder(bidderId) {
  const sheet = getSheet('Bidders');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === bidderId) return { id: data[i][0], name: data[i][1], phone: data[i][2] };
  }
  return null;
}

// ============================================================
//  AUCTION ITEMS
// ============================================================
function getItems() {
  const sheet = getSheet('Items');
  const data  = sheet.getDataRange().getValues();
  const items = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    items.push(rowToItem(data[i]));
  }
  return { ok: true, items };
}

function getItem(id) {
  const sheet = getSheet('Items');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return { ok: true, item: rowToItem(data[i]) };
  }
  return { error: 'Item not found' };
}

function rowToItem(row) {
  return {
    id:                String(row[0]),
    name:              String(row[1]),
    description:       String(row[2] || ''),
    imageUrl:          String(row[3] || ''),
    startingBid:       Number(row[4]) || 0,
    currentBid:        Number(row[5]) || 0,
    highestBidder:     String(row[6] || ''),
    highestBidderName: String(row[7] || ''),
    status:            String(row[8] || 'open'),
    minIncrement:      Number(row[9]) || 1
  };
}

function addItem(body) {
  authAdmin(body);
  const { name, description, imageUrl, startingBid, minIncrement } = body;
  if (!name) return { error: 'Item name required' };
  const sheet = getSheet('Items');
  const id = Date.now();
  sheet.appendRow([id, name, description || '', imageUrl || '', Number(startingBid) || 0, Number(startingBid) || 0, '', '', 'open', Number(minIncrement) || 1]);
  return { ok: true, id };
}

function updateItem(body) {
  authAdmin(body);
  const sheet = getSheet('Items');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) {
      if (body.name         !== undefined) sheet.getRange(i+1,2).setValue(body.name);
      if (body.description  !== undefined) sheet.getRange(i+1,3).setValue(body.description);
      if (body.imageUrl     !== undefined) sheet.getRange(i+1,4).setValue(body.imageUrl);
      if (body.startingBid  !== undefined) sheet.getRange(i+1,5).setValue(Number(body.startingBid));
      if (body.minIncrement !== undefined) sheet.getRange(i+1,10).setValue(Number(body.minIncrement));
      return { ok: true };
    }
  }
  return { error: 'Item not found' };
}

function closeItem(body) {
  authAdmin(body);
  return setItemStatus(body.id, 'closed');
}

function deleteItem(body) {
  authAdmin(body);
  const sheet = getSheet('Items');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) { sheet.deleteRow(i+1); return { ok: true }; }
  }
  return { error: 'Item not found' };
}

function setItemStatus(id, status) {
  const sheet = getSheet('Items');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.getRange(i+1, 9).setValue(status);
      return { ok: true };
    }
  }
  return { error: 'Item not found' };
}

// ============================================================
//  BIDS
// ============================================================
function placeBid(body) {
  const { bidderId, itemId, amount } = body;
  if (!bidderId || !itemId || !amount) return { error: 'bidderId, itemId and amount required' };
  const bidder = getBidder(bidderId);
  if (!bidder) return { error: 'Bidder ID not found. Please register first.' };
  const itemSheet = getSheet('Items');
  const data      = itemSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(itemId)) continue;
    if (data[i][8] === 'closed') return { error: 'Bidding on this item is closed.' };
    const currentBid   = Number(data[i][5]) || 0;
    const minIncrement = Number(data[i][9]) || 1;
    const minBid       = currentBid + minIncrement;
    if (Number(amount) < minBid) {
      return { error: 'Minimum bid is R ' + minBid.toFixed(2) + ' (current R ' + currentBid.toFixed(2) + ' + R ' + minIncrement + ' increment)' };
    }
    itemSheet.getRange(i+1, 6).setValue(Number(amount));
    itemSheet.getRange(i+1, 7).setValue(bidderId);
    itemSheet.getRange(i+1, 8).setValue(bidder.name);
    getSheet('Bids').appendRow([new Date().toLocaleString(), itemId, data[i][1], bidderId, bidder.name, Number(amount)]);
    return { ok: true, newBid: Number(amount), itemName: data[i][1], bidderName: bidder.name };
  }
  return { error: 'Item not found' };
}

// ============================================================
//  CLOSE ALL & AUCTION WINNERS
// ============================================================
function closeAll(body) {
  authAdmin(body);
  const itemSheet    = getSheet('Items');
  const winnersSheet = getSheet('Winners');
  const biddersSheet = getSheet('Bidders');
  const itemData     = itemSheet.getDataRange().getValues();
  const bidderData   = biddersSheet.getDataRange().getValues();
  const bidderMap    = {};
  for (let i = 1; i < bidderData.length; i++) {
    bidderMap[bidderData[i][0]] = { name: bidderData[i][1], phone: bidderData[i][2] };
  }
  winnersSheet.clearContents();
  winnersSheet.appendRow(['Item ID','Item Name','Winner ID','Winner Name','Winner Phone','Winning Bid','Timestamp']);
  for (let i = 1; i < itemData.length; i++) {
    if (!itemData[i][0]) continue;
    itemSheet.getRange(i+1, 9).setValue('closed');
    const highestBidderId = itemData[i][6];
    if (highestBidderId) {
      const b = bidderMap[highestBidderId] || { name: itemData[i][7], phone: '' };
      winnersSheet.appendRow([
        String(itemData[i][0]), String(itemData[i][1]),
        String(highestBidderId), String(b.name), String(b.phone),
        Number(itemData[i][5]), new Date().toLocaleString()
      ]);
    }
  }
  return { ok: true };
}

function getWinners() {
  const sheet = getSheet('Winners');
  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) return { ok: true, winners: [] };
  const winners = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    winners.push({
      itemId:      String(data[i][0]),
      itemName:    String(data[i][1]),
      winnerId:    String(data[i][2]),
      winnerName:  String(data[i][3]),
      winnerPhone: String(data[i][4]),
      winningBid:  Number(data[i][5]) || 0,
      timestamp:   String(data[i][6])
    });
  }
  return { ok: true, winners };
}

function getTop3() {
  const itemSheet = getSheet('Items');
  const bidSheet  = getSheet('Bids');
  const itemData  = itemSheet.getDataRange().getValues();
  const bidData   = bidSheet.getDataRange().getValues();
  const bidCount  = {};
  for (let i = 1; i < bidData.length; i++) {
    const itemId = String(bidData[i][1]);
    bidCount[itemId] = (bidCount[itemId] || 0) + 1;
  }
  const items = [];
  for (let i = 1; i < itemData.length; i++) {
    if (!itemData[i][0] || itemData[i][8] === 'closed') continue;
    const item = rowToItem(itemData[i]);
    item.bidCount = bidCount[String(item.id)] || 0;
    items.push(item);
  }
  items.sort((a, b) => b.bidCount - a.bidCount);
  return {
    ok: true, items: items.slice(0, 3),
    auctionEnd: getConfig('AuctionEnd') || '',
    auctionName: getConfig('AuctionName') || 'Silent Auction',
    siteUrl: getConfig('SiteURL') || ''
  };
}

// ============================================================
//  TOMBOLA — ITEMS
// ============================================================
function rowToTombolaItem(row) {
  return {
    id:           String(row[0]),
    name:         String(row[1]),
    description:  String(row[2] || ''),
    imageUrl:     String(row[3] || ''),
    sponsorName:  String(row[4] || ''),
    totalTickets: Number(row[5]) || 0,
    ticketsSold:  Number(row[6]) || 0,
    status:       String(row[7] || 'open'),
    winnerTicket: String(row[8] || ''),
    winnerBidderId: String(row[9] || ''),
    winnerName:   String(row[10] || '')
  };
}

function getTombolaItems() {
  const sheet = getSheet('TombolaItems');
  if (!sheet) return { ok: true, items: [] };
  const data  = sheet.getDataRange().getValues();
  const items = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    items.push(rowToTombolaItem(data[i]));
  }
  return { ok: true, items };
}

function addTombolaItem(body) {
  authAdmin(body);
  const { name, description, imageUrl, sponsorName, totalTickets } = body;
  if (!name) return { error: 'Prize name required' };
  const sheet = getSheet('TombolaItems');
  const id    = 'TP-' + Date.now();
  sheet.appendRow([id, name, description || '', imageUrl || '', sponsorName || '', Number(totalTickets) || 0, 0, 'open', '', '', '']);
  return { ok: true, id };
}

function updateTombolaItem(body) {
  authAdmin(body);
  const sheet = getSheet('TombolaItems');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) {
      if (body.name         !== undefined) sheet.getRange(i+1,2).setValue(body.name);
      if (body.description  !== undefined) sheet.getRange(i+1,3).setValue(body.description);
      if (body.imageUrl     !== undefined) sheet.getRange(i+1,4).setValue(body.imageUrl);
      if (body.sponsorName  !== undefined) sheet.getRange(i+1,5).setValue(body.sponsorName);
      if (body.totalTickets !== undefined) sheet.getRange(i+1,6).setValue(Number(body.totalTickets));
      return { ok: true };
    }
  }
  return { error: 'Prize not found' };
}

function deleteTombolaItem(body) {
  authAdmin(body);
  const sheet = getSheet('TombolaItems');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) { sheet.deleteRow(i+1); return { ok: true }; }
  }
  return { error: 'Prize not found' };
}

// ============================================================
//  TOMBOLA — SPONSOR VIDEOS
// ============================================================
function getSponsorVideo() {
  const sheet = getSheet('SponsorVideos');
  if (!sheet) return { error: 'SponsorVideos sheet not found' };
  const data  = sheet.getDataRange().getValues();
  const active = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    if (String(data[i][3]).toUpperCase() === 'TRUE') {
      active.push({ rowIndex: i+1, id: String(data[i][0]), sponsorName: String(data[i][1]), youtubeId: String(data[i][2]) });
    }
  }
  if (!active.length) return { error: 'No active sponsor videos configured' };
  const pick  = active[Math.floor(Math.random() * active.length)];
  const token = 'TK-' + Utilities.getUuid().replace(/-/g,'').substring(0,16).toUpperCase();
  const issuedAt = new Date().toISOString();
  // Log pending token row in TombolaTickets
  getSheet('TombolaTickets').appendRow(['', '', '', '', '', '', pick.youtubeId, token, issuedAt, 'pending']);
  // Increment views
  const viewsCell = sheet.getRange(pick.rowIndex, 5);
  viewsCell.setValue((Number(viewsCell.getValue()) || 0) + 1);
  return { ok: true, youtubeId: pick.youtubeId, sponsorName: pick.sponsorName, token, issuedAt };
}

function addSponsorVideo(body) {
  authAdmin(body);
  const { sponsorName, youtubeId } = body;
  if (!youtubeId) return { error: 'YouTube video ID required' };
  const sheet = getSheet('SponsorVideos');
  const id    = 'SV-' + Date.now();
  sheet.appendRow([id, sponsorName || '', youtubeId, 'TRUE', 0]);
  return { ok: true, id };
}

function toggleSponsorVideo(body) {
  authAdmin(body);
  const sheet = getSheet('SponsorVideos');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) {
      const current = String(data[i][3]).toUpperCase() === 'TRUE';
      sheet.getRange(i+1, 4).setValue(current ? 'FALSE' : 'TRUE');
      return { ok: true, active: !current };
    }
  }
  return { error: 'Video not found' };
}

function deleteSponsorVideo(body) {
  authAdmin(body);
  const sheet = getSheet('SponsorVideos');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) { sheet.deleteRow(i+1); return { ok: true }; }
  }
  return { error: 'Video not found' };
}

function getSponsorVideosAdmin() {
  const sheet = getSheet('SponsorVideos');
  if (!sheet) return { ok: true, videos: [] };
  const data   = sheet.getDataRange().getValues();
  const videos = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    videos.push({
      id:          String(data[i][0]),
      sponsorName: String(data[i][1]),
      youtubeId:   String(data[i][2]),
      active:      String(data[i][3]).toUpperCase() === 'TRUE',
      views:       Number(data[i][4]) || 0
    });
  }
  return { ok: true, videos };
}

// ============================================================
//  TOMBOLA — TICKETS & CLAIM
// ============================================================
function getTombolaTickets(bidderId) {
  if (!bidderId) return { error: 'bidderId required' };
  const sheet = getSheet('TombolaTickets');
  if (!sheet) return { ok: true, tickets: [] };
  const data    = sheet.getDataRange().getValues();
  const tickets = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    if (String(data[i][1]) === String(bidderId)) {
      tickets.push({
        ticketId:   String(data[i][0]),
        bidderId:   String(data[i][1]),
        bidderName: String(data[i][2]),
        prizeId:    String(data[i][3]),
        prizeName:  String(data[i][4]),
        earnedAt:   String(data[i][5]),
        youtubeId:  String(data[i][6])
      });
    }
  }
  return { ok: true, tickets };
}

function generateTicketId() {
  const sheet  = getSheet('TombolaTickets');
  const count  = Math.max(0, sheet.getLastRow() - 1);
  return 'T-' + String(count + 1).padStart(5, '0');
}

function claimTicket(body) {
  const { token, bidderId, prizeId } = body;
  if (!token || !bidderId || !prizeId) return { error: 'token, bidderId and prizeId required' };

  // Use LockService to prevent concurrent claims
  const lock = LockService.getScriptLock();
  try {
    lock.tryLock(8000);
  } catch(e) {
    return { error: 'Server busy — please try again in a moment' };
  }

  try {
    const ticketSheet = getSheet('TombolaTickets');
    const ticketData  = ticketSheet.getDataRange().getValues();
    const tokenExpiry = Number(getConfig('TokenExpiry')) || 45;

    // Find the pending token row
    let tokenRow = -1;
    let issuedAt = null;
    for (let i = 1; i < ticketData.length; i++) {
      if (String(ticketData[i][7]) === String(token) && String(ticketData[i][9]) === 'pending') {
        tokenRow = i + 1;
        issuedAt = ticketData[i][8];
        break;
      }
    }
    if (tokenRow === -1) return { error: 'Invalid or already used token' };

    // Validate timing
    const now       = new Date();
    const issued    = new Date(issuedAt);
    const elapsed   = (now - issued) / 1000;
    if (elapsed < 5)           return { error: 'Video not completed — please watch the full ad' };
    if (elapsed > tokenExpiry)  return { error: 'Token expired — please watch a new ad' };

    // Validate bidder
    const bidder = getBidder(bidderId);
    if (!bidder) return { error: 'Bidder ID not found — please register first' };

    // Validate prize exists and is open
    const prizeSheet = getSheet('TombolaItems');
    const prizeData  = prizeSheet.getDataRange().getValues();
    let prizeRow = -1;
    let prizeName = '';
    let totalTickets = 0;
    let ticketsSold  = 0;
    for (let i = 1; i < prizeData.length; i++) {
      if (String(prizeData[i][0]) === String(prizeId)) {
        if (String(prizeData[i][7]) !== 'open') return { error: 'This prize is no longer accepting entries' };
        prizeRow     = i + 1;
        prizeName    = String(prizeData[i][1]);
        totalTickets = Number(prizeData[i][5]) || 0;
        ticketsSold  = Number(prizeData[i][6]) || 0;
        break;
      }
    }
    if (prizeRow === -1) return { error: 'Prize not found' };

    // Check ticket limit if set
    if (totalTickets > 0 && ticketsSold >= totalTickets) {
      return { error: 'Sorry — all tickets for this prize have been claimed' };
    }

    // Award ticket — update token row with full details
    const ticketId = generateTicketId();
    const earnedAt = now.toLocaleString();
    ticketSheet.getRange(tokenRow, 1).setValue(ticketId);
    ticketSheet.getRange(tokenRow, 2).setValue(bidderId);
    ticketSheet.getRange(tokenRow, 3).setValue(bidder.name);
    ticketSheet.getRange(tokenRow, 4).setValue(prizeId);
    ticketSheet.getRange(tokenRow, 5).setValue(prizeName);
    ticketSheet.getRange(tokenRow, 6).setValue(earnedAt);
    ticketSheet.getRange(tokenRow, 10).setValue('used');

    // Increment prize tickets sold
    prizeSheet.getRange(prizeRow, 7).setValue(ticketsSold + 1);

    // Count this bidder's total tickets for this prize
    let bidderPrizeCount = 0;
    for (let i = 1; i < ticketData.length; i++) {
      if (String(ticketData[i][1]) === bidderId && String(ticketData[i][3]) === prizeId && String(ticketData[i][9]) === 'used') {
        bidderPrizeCount++;
      }
    }
    bidderPrizeCount++; // include the one just awarded

    return { ok: true, ticketId, prizeName, bidderName: bidder.name, ticketsForPrize: bidderPrizeCount };

  } finally {
    lock.releaseLock();
  }
}

// ============================================================
//  TOMBOLA — DRAW
// ============================================================
function drawPrize(body) {
  authAdmin(body);
  const { prizeId } = body;
  if (!prizeId) return { error: 'prizeId required' };

  const ticketSheet = getSheet('TombolaTickets');
  const prizeSheet  = getSheet('TombolaItems');
  const ticketData  = ticketSheet.getDataRange().getValues();
  const prizeData   = prizeSheet.getDataRange().getValues();

  // Find prize
  let prizeRow = -1; let prizeName = '';
  for (let i = 1; i < prizeData.length; i++) {
    if (String(prizeData[i][0]) === String(prizeId)) {
      if (String(prizeData[i][7]) !== 'open') return { error: 'Prize is not open for draw' };
      prizeRow  = i + 1;
      prizeName = String(prizeData[i][1]);
      break;
    }
  }
  if (prizeRow === -1) return { error: 'Prize not found' };

  // Collect all used tickets for this prize
  const eligible = [];
  for (let i = 1; i < ticketData.length; i++) {
    if (String(ticketData[i][3]) === String(prizeId) && String(ticketData[i][9]) === 'used') {
      eligible.push({ ticketId: String(ticketData[i][0]), bidderId: String(ticketData[i][1]), bidderName: String(ticketData[i][2]) });
    }
  }
  if (!eligible.length) return { error: 'No tickets entered for this prize yet' };

  // Random draw
  const winner = eligible[Math.floor(Math.random() * eligible.length)];
  const bidder = getBidder(winner.bidderId) || { name: winner.bidderName, phone: '' };

  // Update prize row
  prizeSheet.getRange(prizeRow, 8).setValue('drawn');
  prizeSheet.getRange(prizeRow, 9).setValue(winner.ticketId);
  prizeSheet.getRange(prizeRow, 10).setValue(winner.bidderId);
  prizeSheet.getRange(prizeRow, 11).setValue(bidder.name);

  // Write to TombolaWinners
  getSheet('TombolaWinners').appendRow([
    String(prizeId), String(prizeName),
    String(winner.ticketId), String(winner.bidderId),
    String(bidder.name), String(bidder.phone),
    new Date().toLocaleString()
  ]);

  return { ok: true, prizeName, winnerName: bidder.name, winnerPhone: bidder.phone, winningTicket: winner.ticketId, totalEntered: eligible.length };
}

function drawAll(body) {
  authAdmin(body);
  const prizeSheet = getSheet('TombolaItems');
  const prizeData  = prizeSheet.getDataRange().getValues();
  const results    = [];
  for (let i = 1; i < prizeData.length; i++) {
    if (!prizeData[i][0] || String(prizeData[i][7]) !== 'open') continue;
    const r = drawPrize({ adminPin: body.adminPin, prizeId: String(prizeData[i][0]) });
    results.push({ prizeId: String(prizeData[i][0]), prizeName: String(prizeData[i][1]), result: r });
  }
  return { ok: true, results };
}

function getTombolaWinners() {
  const sheet = getSheet('TombolaWinners');
  if (!sheet) return { ok: true, winners: [] };
  const data    = sheet.getDataRange().getValues();
  if (data.length < 2) return { ok: true, winners: [] };
  const winners = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    winners.push({
      prizeId:       String(data[i][0]),
      prizeName:     String(data[i][1]),
      winningTicket: String(data[i][2]),
      winnerId:      String(data[i][3]),
      winnerName:    String(data[i][4]),
      winnerPhone:   String(data[i][5]),
      drawnAt:       String(data[i][6])
    });
  }
  return { ok: true, winners };
}

// ============================================================
//  ONE-TIME SETUP
// ============================================================
function setupSheets() {
  const sheets = {
    Items:          ['ID','Name','Description','Image URL','Starting Bid','Current Bid','Highest Bidder ID','Highest Bidder Name','Status','Min Increment'],
    Bids:           ['Timestamp','Item ID','Item Name','Bidder ID','Bidder Name','Amount'],
    Bidders:        ['Bidder ID','Name','Phone','Email','Registered At'],
    Config:         ['Key','Value'],
    Winners:        ['Item ID','Item Name','Winner ID','Winner Name','Winner Phone','Winning Bid','Timestamp'],
    TombolaItems:   ['ID','Name','Description','Image URL','Sponsor Name','Total Tickets','Tickets Sold','Status','Winner Ticket','Winner Bidder ID','Winner Name'],
    TombolaTickets: ['Ticket ID','Bidder ID','Bidder Name','Prize ID','Prize Name','Earned At','YouTube ID','Token','Token Issued','Status'],
    TombolaWinners: ['Prize ID','Prize Name','Winning Ticket','Winner ID','Winner Name','Winner Phone','Drawn At'],
    SponsorVideos:  ['ID','Sponsor Name','YouTube ID','Active','Views']
  };
  for (const [name, headers] of Object.entries(sheets)) {
    let sheet = SS.getSheetByName(name);
    if (!sheet) sheet = SS.insertSheet(name);
    if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  }
  const configSheet = getSheet('Config');
  const configData  = configSheet.getDataRange().getValues().map(r => r[0]);
  const defaults = [
    ['AdminPIN','1234'], ['AuctionName','Auction'], ['WhatsAppNum',''],
    ['AuctionEnd',''], ['SiteURL',''], ['TombolaName','Community Tombola'],
    ['TombolaEnd',''], ['TombolaActive','FALSE'], ['TicketsPerView','1'], ['TokenExpiry','45']
  ];
  defaults.forEach(([k,v]) => { if (!configData.includes(k)) configSheet.appendRow([k,v]); });
  return { ok: true, message: 'All sheets created including Tombola tabs.' };
}

function debugPin() {
  const all = PropertiesService.getScriptProperties().getProperties();
  Logger.log(JSON.stringify(all));
}
