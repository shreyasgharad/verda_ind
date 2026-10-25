# Instagram content skills

Thirteen Claude skills for writing Instagram content (reels, captions, carousels,
comments, DMs, profile scoring, weekly planning, a post-mortem audit, and a
humanizer that strips AI-sounding text before anything ships). These are
content-writing aids only — nothing here posts, fetches, or touches the
Instagram API. They complement the posting pipeline in this repo
(`news-fetch-rss.js` → `render-slides.js` → `post-instagram.js`), which stays
untouched.

Source: https://github.com/Jakeschincariol/instagram-agent-skill (MIT license,
included as `LICENSE-instagram-agent-skill`). Installed as project-local
skills under `.claude/skills/ig-*`.

## Before using these

Fill in `voice.md.template` (copy it to `voice.md` in this same folder) with
your actual voice — three example reels/captions and how you talk. Every
skill reads it. Skipping this step is why generic AI-sounding output happens.

## Commands

| command | what it does |
|---|---|
| `/ig-reel` | Idea → Reel: scored hooks, script, on-screen text, timed beat sheet |
| `/ig-viral` | Finds what's working in your niche right now, ranked by outlier multiple |
| `/ig-caption` | Writes + lints the caption against the feed's "... more" truncation |
| `/ig-carousel` | Cover + slide copy for swipe posts |
| `/ig-story` | Daily Stories sequence + DM funnel |
| `/ig-profile` | Scores your profile out of 100, rewrites what's losing points |
| `/ig-plan` | The week: what to post, when, who to engage |
| `/ig-human` | Strips em dashes / AI slop / invisible watermark chars before anything ships |
| `/ig-comment` | Comments on other people's posts |
| `/ig-reply` | Replies to comments under your own posts |
| `/ig-dm` | Outreach / follow-up DMs |
| `/ig-repurpose` | One long asset → a week of reels/carousels |
| `/ig-audit` | Post-mortem on what you already posted |
