/**
 * Builds the 7-story JSON for News Carousel Template.dc.html
 *
 * Run:  NEWS_API_KEY=xxxx node news-fetch.js > today.json
 * Then paste today.json into the template's `newsJson` tweak field.
 *
 * PROVIDER: newsdata.io — free tier allows commercial use (unlike NewsAPI/GNews).
 * Swap fetchNewsdata() for fetchGuardian() if you want editorial quality over breadth.
 */

const API_KEY = process.env.NEWS_API_KEY;
const COUNT = 7;

// Categories to pull from, in priority order. First N unique stories win.
const CATEGORIES = ["top", "world", "business", "technology", "health"];

// Publishers you trust. Stories from these rank first. Empty = no preference.
const PREFERRED = ["reuters", "apnews", "bbc", "aljazeera", "ft", "bloomberg"];

async function fetchNewsdata() {
  const url = new URL("https://newsdata.io/api/1/latest");
  url.searchParams.set("apikey", API_KEY);
  url.searchParams.set("language", "en");
  url.searchParams.set("category", CATEGORIES.join(","));
  url.searchParams.set("size", "50");
  url.searchParams.set("removeduplicate", "1");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`newsdata ${res.status}: ${await res.text()}`);
  const body = await res.json();

  return (body.results || []).map((a) => ({
    headline: a.title,
    summary: a.description,
    category: (a.category && a.category[0]) || "World",
    source: a.source_name || a.source_id,
    image: a.image_url,
    link: a.link,
    published: a.pubDate,
  }));
}

/** Alternative: The Guardian Open Platform. Free, no commercial-use clause. */
async function fetchGuardian() {
  const url = new URL("https://content.guardianapis.com/search");
  url.searchParams.set("api-key", API_KEY);
  url.searchParams.set("order-by", "newest");
  url.searchParams.set("page-size", "40");
  url.searchParams.set("show-fields", "trailText,thumbnail,headline");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`guardian ${res.status}`);
  const body = await res.json();

  return (body.response.results || []).map((a) => ({
    headline: a.fields?.headline || a.webTitle,
    summary: stripTags(a.fields?.trailText || ""),
    category: a.sectionName,
    source: "The Guardian",
    image: a.fields?.thumbnail,
    link: a.webUrl,
    published: a.webPublicationDate,
  }));
}

const stripTags = (s) => s.replace(/<[^>]*>/g, "").trim();

/** Trim to what fits the slide design. Long strings break the layout. */
function fitToSlide(story) {
  return {
    headline: clamp(story.headline, 72),
    summary: clamp(story.summary, 180),
    category: (story.category || "World").toUpperCase().slice(0, 18),
    source: `Source · ${story.source}`,
    // kept for the caption / link-in-bio page, not shown on the slides:
    _link: story.link,
    _image: story.image,
  };
}

function clamp(text, max) {
  if (!text) return "";
  const clean = stripTags(String(text)).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, clean.lastIndexOf(" ", max - 1)).replace(/[,;:]$/, "") + "…";
}

function rank(a, b) {
  const score = (s) => {
    const src = (s.source || "").toLowerCase();
    const pref = PREFERRED.findIndex((p) => src.includes(p));
    return pref === -1 ? 99 : pref;
  };
  return score(a) - score(b) || new Date(b.published) - new Date(a.published);
}

function dedupe(stories) {
  const seen = new Set();
  return stories.filter((s) => {
    if (!s.headline || !s.summary) return false;
    // crude near-duplicate check: first 5 significant words
    const key = s.headline.toLowerCase().split(/\s+/).slice(0, 5).join(" ");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  if (!API_KEY) throw new Error("Set NEWS_API_KEY");
  const raw = await fetchNewsdata();
  const picked = dedupe(raw).sort(rank).slice(0, COUNT).map(fitToSlide);

  if (picked.length < COUNT) {
    console.error(`WARNING: only ${picked.length} usable stories today`);
  }
  process.stdout.write(JSON.stringify(picked, null, 2));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
