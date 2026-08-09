#!/usr/bin/env node
/**
 * Publishes the 9 rendered PNGs to Instagram as one carousel.
 *
 * Run:  node post-instagram.js out today.json
 *
 * Needs in env (GitHub repo Secrets):
 *   IG_USER_ID   Instagram Business account id (numeric)
 *   IG_TOKEN     long-lived access token
 *   IMAGE_BASE   public https base where the PNGs are reachable,
 *                e.g. https://<user>.github.io/<repo>/slides
 *
 * Instagram fetches the images from IMAGE_BASE itself — they MUST be on a
 * public https URL before this runs. Local files will not work.
 */

const fs = require("fs");
const path = require("path");

const API = "https://graph.facebook.com/v21.0";
const { IG_USER_ID, IG_TOKEN, IMAGE_BASE } = process.env;
const [, , outDir = "out", jsonPath = "today.json"] = process.argv;

const post = async (url, params) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...params, access_token: IG_TOKEN }),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(JSON.stringify(body.error || body));
  return body;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Caption is built from the same JSON the slides used. */
function buildCaption(stories) {
  const d = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const lines = stories.map((s, i) => `${String(i + 1).padStart(2, "0")}  ${s.headline}`);
  return [
    `This week in the world — ${d}`,
    "",
    ...lines,
    "",
    "Every story checked against its original source.",
    "Full reports: link in bio.",
    "",
    "Which of these will still matter in six months?",
    "",
    "#worldnews #news #currentaffairs #globalnews #newsdigest",
  ].join("\n");
}

async function main() {
  if (!IG_USER_ID || !IG_TOKEN || !IMAGE_BASE) throw new Error("Missing IG_USER_ID / IG_TOKEN / IMAGE_BASE");

  const stories = JSON.parse(fs.readFileSync(path.resolve(jsonPath), "utf8"));
  const files = fs.readdirSync(outDir).filter((f) => f.endsWith(".png")).sort();
  if (files.length < 2) throw new Error("need at least 2 slides");
  if (files.length > 10) throw new Error("Instagram allows max 10 carousel items");

  // 1. one container per image
  const children = [];
  for (const f of files) {
    const { id } = await post(`${API}/${IG_USER_ID}/media`, {
      image_url: `${IMAGE_BASE.replace(/\/$/, "")}/${f}`,
      is_carousel_item: "true",
    });
    console.log("child", f, id);
    children.push(id);
  }

  // 2. the carousel container
  const { id: containerId } = await post(`${API}/${IG_USER_ID}/media`, {
    media_type: "CAROUSEL",
    children: children.join(","),
    caption: buildCaption(stories),
  });
  console.log("carousel", containerId);

  // 3. wait for Instagram to finish downloading, then publish
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${API}/${containerId}?fields=status_code&access_token=${IG_TOKEN}`);
    const { status_code } = await res.json();
    if (status_code === "FINISHED") break;
    if (status_code === "ERROR") throw new Error("Instagram rejected the container");
    await sleep(3000);
  }

  const published = await post(`${API}/${IG_USER_ID}/media_publish`, { creation_id: containerId });
  console.log("PUBLISHED", published.id);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
