FINANCE SLIDE BUILDER — LIVE (Vercel)
=====================================

This folder is a complete, self-hosting version of the tool with a live
stock feed. Deploy it once and the team just opens the URL — the picker
shows current stock automatically, with the built-in list as a fallback
if the feed is ever unreachable.

  index.html            the tool (opens at your site root)
  api/stock-feed.js     reads your stock sheet server-side -> JSON

WHY THIS INSTEAD OF SUPABASE
  Your Supabase projects are paused and can't be restored, and free projects
  re-pause after ~a week idle. A Vercel function lives in the same project as
  the page, doesn't pause, needs no API key, and has no cross-site issues.

DEPLOY (about 2 minutes, no command line needed)
  1. Make the Google Sheet readable: Share -> "Anyone with the link" (Viewer).
  2. Go to https://vercel.com/new  ->  drag this whole folder in (or "Deploy"
     a folder). No build settings needed; it's static + one function.
  3. When it finishes, open the URL. The line under the picker should say
     "Live from your stock feed". Done.

  Prefer the CLI?  Install Node, then in this folder:  npx vercel --prod

POINT A SUBDOMAIN AT IT (optional)
  In Vercel -> Project -> Settings -> Domains, add e.g. finance.anycolourcar.com
  and follow the DNS instructions at Fasthosts (a CNAME, same as your other apps).

NOTES
  - Photo: only used when the feed marks a car "photo_ready", else a clean
    background. Car photos load from AutoTrader's CDN; if a download ever comes
    out without the photo, upload that photo in the tool to embed it.
  - The representative example is fixed to your site's standard wording.
  - To change which sheet it reads, edit SHEET_ID at the top of api/stock-feed.js.
