# Daily carousel — automation

Everything here runs without any paid service and without the tool the template was designed in.
The design is frozen in `carousel-standalone.html` (one self-contained file, works offline forever).

## The three stages

| Stage | File | Cost |
|---|---|---|
| Fetch the day's stories | `news-fetch-rss.js` | free — public RSS, no key |
| Render 9 PNGs at 1080×1080 | `render-slides.js` | free — Playwright, local |
| Schedule it | `.github/workflows/daily-carousel.yml` | free — GitHub Actions public repo |
| Publish | Instagram Graph API | free — needs Business account + Page |

## Run it locally

```bash
node news-fetch-rss.js > today.json     # writes the 7 stories
node render-slides.js today.json out    # writes out/01.png … out/09.png
```

Review `today.json` before rendering. Editing a headline there is the whole editorial step.

## Editing the design later

Open `carousel-standalone.html` in any browser to see it. The layout is plain HTML with inline
styles — a text editor is enough. `News Carousel Template.dc.html` is the working source; the
standalone file is the frozen copy the pipeline renders.

## Changing the story count

Set `COUNT` in `news-fetch-rss.js`. The template has exactly 7 story slots — if you change the
count, add or remove `<section>` blocks and the `{{ hN }}` holes to match.

## Feeds

`FEEDS` at the top of `news-fetch-rss.js`. Add your own site's RSS first if you want your
articles to lead the edition. `spread()` guarantees no single newsroom fills the whole carousel.

## Instagram publishing

Requires: Instagram Business account, linked Facebook Page, a long-lived access token.
Carousel posting is 3 API calls — one per image (as `IMAGE` children), one to create the
carousel container, one to publish. Images must be at public HTTPS URLs, so the workflow needs
to upload the PNGs somewhere first (GitHub Pages on the same repo works and is free).

## Failure modes worth knowing

- A feed goes down: the script logs `skip <name>` and carries on with the rest.
- Fewer than 7 usable stories: it warns and outputs what it has. Add more feeds.
- A headline over ~72 chars: `clamp()` truncates it. Check `today.json` if wording matters.
