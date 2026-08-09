#!/usr/bin/env node
/**
 * ZERO-COST news fetch. No API key, no account, no rate limit, no vendor.
 * Reads public RSS feeds that every major newsroom publishes.
 *
 * Run:  node news-fetch-rss.js > today.json
 * Needs: Node 18+ (built-in fetch). No npm install.
 */

const COUNT = 7;

/* Feeds are read in order; earlier feeds outrank later ones when picking.
   Add or remove freely — nothing else in the script needs to change. */
const FEEDS = [
  { name: "BBC",          url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "Al Jazeera",   url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "The Guardian", url: "https://www.theguardian.com/world/rss" },
  { name: "NPR",          url: "https://feeds.npr.org/1004/rss.xml" },
  { name: "DW",           url: "https://rss.dw.com/rdf/rss-en-world" },
  { name: "France 24",    url: "https://www.france24.com/en/rss" },
  // Google News search feed — use for a beat you always want covered:
  // { name: "Google News", url: "https://news.google.com/rss/search?q=india+economy&hl=en-IN&gl=IN&ceid=IN:en" },
];

const strip = (s) => String(s || "")
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/<[^>]*>/g, "")
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(d))
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/\s+/g, " ").trim();

const tag = (block, name) => {
  const m = block.match(new RegExp("<" + name + "[^>]*>([\\s\\S]*?)</" + name + ">", "i"));
  return m ? strip(m[1]) : "";
};

function parseFeed(xml, sourceName) {
  // handles both RSS <item> and Atom <entry>
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) || [];
  return blocks.map((b) => {
    const img = b.match(/<(?:media:content|media:thumbnail|enclosure)[^>]*url="([^"]+)"/i);
    const linkAttr = b.match(/<link[^>]*href="([^"]+)"/i);
    return {
      headline: tag(b, "title"),
      summary: tag(b, "description") || tag(b, "summary") || tag(b, "content:encoded"),
      category: tag(b, "category") || "World",
      source: sourceName,
      image: img ? img[1] : "",
      link: tag(b, "link") || (linkAttr ? linkAttr[1] : ""),
      published: tag(b, "pubDate") || tag(b, "updated") || tag(b, "published"),
    };
  });
}

async function readFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { "user-agent": "Mozilla/5.0 (newsletter-bot)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return parseFeed(await res.text(), feed.name);
  } catch (e) {
    console.error("skip " + feed.name + ": " + e.message);
    return [];
  }
}

const HOURS = 30; // ignore anything older than this
function isFresh(s) {
  const t = Date.parse(s.published);
  return !t || (Date.now() - t) / 36e5 < HOURS;
}

function dedupe(list) {
  const seen = new Set();
  return list.filter((s) => {
    if (!s.headline || s.summary.length < 40) return false;
    const key = s.headline.toLowerCase().replace(/[^a-z ]/g, "")
      .split(/\s+/).filter((w) => w.length > 3).slice(0, 4).sort().join(" ");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* One story per source first, so seven slides never come from one newsroom. */
function spread(list, n) {
  const out = [], used = {};
  for (let round = 0; round < 4 && out.length < n; round++) {
    for (const s of list) {
      if (out.length >= n) break;
      if (out.includes(s)) continue;
      if ((used[s.source] || 0) > round) continue;
      used[s.source] = (used[s.source] || 0) + 1;
      out.push(s);
    }
  }
  return out;
}

const clamp = (text, max) => {
  const t = strip(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.]$/, "") + "…";
};

const toSlide = (s) => ({
  headline: clamp(s.headline, 72),
  summary: clamp(s.summary, 180),
  category: clamp(s.category, 18).toUpperCase(),
  source: "Source · " + s.source,
  _link: s.link,
  _image: s.image,
});

async function main() {
  const all = (await Promise.all(FEEDS.map(readFeed))).flat();
  const picked = spread(dedupe(all.filter(isFresh)), COUNT).map(toSlide);
  if (picked.length < COUNT) console.error("WARNING: only " + picked.length + " stories today");
  process.stdout.write(JSON.stringify(picked, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
