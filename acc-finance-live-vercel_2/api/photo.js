// Vercel serverless function:  GET /api/photo?u=<atcdn image url>
// Re-serves a vehicle photo from your own domain so it embeds cleanly into
// downloaded slides (the browser won't treat a same-origin image as foreign).
// Locked to AutoTrader's image host so it can't be used as an open proxy.

function isAllowed(u) {
  try {
    const h = new URL(u).hostname;
    return /(^|\.)atcdn\.co\.uk$/i.test(h);
  } catch {
    return false;
  }
}

async function handler(req, res) {
  const u = (req.query && req.query.u) || "";
  if (!u) { res.status(400).send("missing url"); return; }
  if (!isAllowed(u)) { res.status(403).send("host not allowed"); return; }
  try {
    const r = await fetch(u, { headers: { "User-Agent": "acc-slide-builder" }, redirect: "follow" });
    if (!r.ok) { res.status(502).send("upstream " + r.status); return; }
    const ct = r.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", ct);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    res.status(200).send(buf);
  } catch (e) {
    res.status(502).send("error");
  }
}

module.exports = handler;
module.exports.isAllowed = isAllowed;
