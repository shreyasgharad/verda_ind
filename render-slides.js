#!/usr/bin/env node
/**
 * Renders the carousel to nine 1080x1080 PNGs. No design tool involved.
 *
 * Setup once:  npm i playwright && npx playwright install chromium
 * Run:         node render-slides.js today.json ./out
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const [, , jsonPath = "today.json", outDir = "out"] = process.argv;
const TEMPLATE = path.resolve(__dirname, "carousel-standalone.html");

(async () => {
  const stories = fs.readFileSync(path.resolve(jsonPath), "utf8");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });

  // the template reads window.__NEWS_JSON when no tweak value is set
  await page.addInitScript((s) => { window.__NEWS_JSON = s; }, stories);
  await page.goto("file://" + TEMPLATE, { waitUntil: "networkidle" });
  await page.waitForSelector("section[data-document-role='page']");
  await page.waitForTimeout(1500); // webfonts

  const slides = await page.$$("section[data-document-role='page']");
  if (slides.length !== 9) console.error("expected 9 slides, found " + slides.length);

  for (let i = 0; i < slides.length; i++) {
    const file = path.join(outDir, String(i + 1).padStart(2, "0") + ".png");
    await slides[i].screenshot({ path: file });
    console.log(file);
  }
  await browser.close();
})();
