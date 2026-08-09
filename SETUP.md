# Go live — step by step

Times are one-off unless marked daily. Total setup: about an hour.

---

## 1 · Instagram account (15 min)

1. Instagram app → Settings → Account type → **switch to Business**.
2. Create a Facebook Page if you don't have one, and link it to the Instagram account.
   Instagram will not allow API posting without this. There is no way around it.
3. Note the Instagram handle — you'll need the numeric id in step 3.

## 2 · GitHub repo (10 min) — already done for `verda_ind`

All of this is already in place in this repo, `package.json` included, so nothing to upload.
Listed here for reference / if you ever fork this to a new repo:

   ```
   carousel-standalone.html
   news-fetch-rss.js
   render-slides.js
   post-instagram.js
   package.json
   .github/workflows/daily-carousel.yml
   ```

Two settings you still need to flip by hand on **this** repo (not scriptable via API):

1. Repo → Settings → Pages → Source: **GitHub Actions**.
2. Repo → Settings → Actions → General → Workflow permissions: **Read and write**.

## 3 · Meta access token (20 min)

1. developers.facebook.com → My Apps → **Create App** → type "Business".
2. Add the **Instagram Graph API** product.
3. Tools → **Graph API Explorer**. Pick your app. Add permissions:
   `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`.
4. Generate a token, then in the Explorer run `me/accounts` → find your Page →
   run `<page-id>?fields=instagram_business_account` → that numeric id is **IG_USER_ID**.
5. Tools → **Access Token Debugger** → paste the token → **Extend Access Token**.
   That gives you a 60-day token. Copy it — this is **IG_TOKEN**.

## 4 · Store the secrets (2 min)

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Name | Value |
|---|---|
| `IG_USER_ID` | numeric id from step 3.4 |
| `IG_TOKEN` | long-lived token from step 3.5 |

## 5 · Test run today (5 min)

Repo → **Actions** tab → `daily-carousel` → **Run workflow**.

Watch the log. The "Show what was picked" step prints the 7 stories in plain text —
read it. If the run finishes green, the post is live on your account.

If it fails, the step name tells you where: fetch, render, or publish.

---

## Daily, from tomorrow

Nothing. It runs at 06:00 IST on its own.

**The 60-second habit I recommend for the first month:** change the schedule to
`workflow_dispatch` only, run it by hand, read the "Show what was picked" output, and
press publish when it looks right. Once you trust the picks, put the cron back.

---

## Maintenance — the only recurring task

The Instagram token expires every **60 days**. Repeat step 3.5 and update the secret.
Put a calendar reminder at day 50. A missed refresh means posts silently stop.

## If something breaks

| Symptom | Cause | Fix |
|---|---|---|
| Fewer than 7 stories | feeds down or too slow a news day | add feeds in `news-fetch-rss.js` |
| Photos missing on slides | that feed gave no image | normal, the slot shows a gradient |
| `Instagram rejected the container` | Pages not live yet | raise the `sleep 45` |
| `OAuthException` | token expired | redo step 3.5 |
| Post never appears | account not Business, or Page unlinked | recheck step 1 |

## Limits that are Instagram's, not ours

- Max 10 images per carousel. You have 9. No room to grow past 10.
- Captions cannot contain clickable links. Traffic goes through link-in-bio only.
- 50 API posts per 24 hours. Far above what you need.
- Stories and Reels cannot be posted this way. Carousels and single posts only.
