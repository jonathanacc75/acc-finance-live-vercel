// Vercel serverless function:  GET /api/stock-feed
// Reads the anycolourcar stock sheet server-side and returns the picker's
// STOCK list as JSON. Same project as the page => no CORS, no keys to manage.
// Requires the Google Sheet to be shared "Anyone with the link (Viewer)".

const SHEET_ID = "1kDM8KmvBfRH9LNULUIhhbmwllibVliw6_PnLltaIy-Y";
const GID = "0";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
const PLACEHOLDER = ["624dc0946857472e85fdd210087ab290"]; // "photo coming soon" assets

function parseCSV(text) {
  const rows = []; let row = [], field = "", inQ = false, i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } inQ = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const clean = (s) => (s == null ? "" : String(s)).trim();
const toInt = (s) => { const v = clean(s).replace(/[,£]/g, ""); if (!v) return null; const n = parseFloat(v); return Number.isFinite(n) ? Math.round(n) : null; };

function buildStock(text) {
  const rows = parseCSV(text);
  const header = rows.shift().map((h) => h.trim());
  const idx = {}; header.forEach((h, k) => (idx[h] = k));
  const get = (row, name) => (idx[name] == null ? "" : row[idx[name]]);
  const stock = [];
  for (const row of rows) {
    if (!row.length || row.every((c) => clean(c) === "")) continue;
    const title = clean(get(row, "title")); if (!title) continue;
    const avail = clean(get(row, "availability")).toLowerCase();
    if (avail && !["in_stock", "instock", "available", ""].includes(avail)) continue;
    const year = clean(get(row, "year"));
    const name = (year + " " + title).trim();
    const price = toInt(get(row, "suppliedPrice")) ?? toInt(get(row, "price"));
    if (!price) continue;
    const m = toInt(get(row, "lowest_monthly_payment_amount"));
    const d = clean(get(row, "lowest_monthly_payment_type")).toLowerCase();
    const ready = clean(get(row, "custom_label_0")).toLowerCase() === "photo_ready";
    // Build a small gallery from the feed's pipe-separated photos column.
    // First usable shot is the hero; keep a few extras so the team can switch.
    let imgs = [];
    if (ready) {
      const raw = clean(get(row, "photos"));
      imgs = (raw ? raw.split("|") : [])
        .map((u) => clean(u).replace("{resize}", "w800h600"))
        .filter((u) => u && /^https?:\/\//.test(u) && !PLACEHOLDER.some((p) => u.includes(p)));
      // de-dupe, keep order, cap to keep the payload light
      imgs = [...new Set(imgs)].slice(0, 6);
      // fall back to image_link if the photos column was empty
      if (!imgs.length) {
        const il = clean(get(row, "image_link"));
        if (il && !PLACEHOLDER.some((p) => il.includes(p))) imgs = [il];
      }
    }
    const img = imgs[0] || "";
    const miles = toInt(get(row, "miles")) ?? toInt(get(row, "odometerReadingMiles"));
    const trans = clean(get(row, "transmissionType"));
    const fuel = clean(get(row, "fuelType"));
    const body = clean(get(row, "bodyType"));
    const vtype = clean(get(row, "vehicleType"));
    const bhp = toInt(get(row, "enginePowerBHP"));
    const owners = toInt(get(row, "owners"));
    const parts = [];
    if (miles !== null) parts.push(miles.toLocaleString("en-GB") + " miles");
    if (trans) parts.push(trans);
    if (bhp) parts.push(bhp + " BHP");
    if (fuel) parts.push(fuel);
    if (vtype && vtype.toLowerCase() !== "car" && body) parts.push(body);
    if (owners) parts.push(owners + " owner" + (owners === 1 ? "" : "s"));
    stock.push({ n: name, p: price, m, t: 60, d, r: "none", hl: parts.join(" \u00b7 "), img, imgs });
  }
  stock.sort((a, b) => a.n.localeCompare(b.n));
  return stock;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  try {
    const r = await fetch(CSV_URL, { headers: { "User-Agent": "acc-slide-builder" }, redirect: "follow" });
    if (!r.ok) throw new Error("sheet " + r.status);
    const stock = buildStock(await r.text());
    res.status(200).json({ updated: new Date().toISOString(), count: stock.length, stock });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
};
module.exports.buildStock = buildStock;
