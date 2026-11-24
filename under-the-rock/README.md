# under the rock 🪨

Your personal news feed for **antitrust**, **government regulation**, and **railroad litigation**. Every story comes with a link to the original and a short overview. You can also search any topic.

## Run it on your computer (about 5 minutes)

1. Install **Node.js** (the "LTS" version) from https://nodejs.org
2. Open Terminal and go to this folder:
   ```
   cd path/to/under-the-rock
   ```
3. Install the app's parts (only needed once):
   ```
   npm install
   ```
4. *(Optional, recommended)* Turn on AI summaries:
   copy `.env.example` to a new file named `.env.local`, then paste your Anthropic API key after `ANTHROPIC_API_KEY=`.
   Without a key, the app still works and uses each source's own blurb as the overview.
5. Start it:
   ```
   npm run dev
   ```
6. Open **http://localhost:3000** in your browser.

**On your phone:** if your phone is on the same Wi-Fi, open `http://<your-computer's-IP>:3000`, then use Share → "Add to Home Screen".

## Put it online (free, with Vercel)

1. Make free accounts at https://github.com and https://vercel.com (sign in to Vercel *with* GitHub).
2. On GitHub, click **New repository**, name it `under-the-rock`, and set it to **Private**. On the next page, click **uploading an existing file**, drag in everything inside this folder, and click **Commit changes**.
3. On Vercel, click **Add New → Project**, pick `under-the-rock`, and open **Environment Variables**. Add:
   - `APP_PASSWORD`: any password you choose (keeps strangers out)
   - `ANTHROPIC_API_KEY`: your key, if you want AI summaries
4. Click **Deploy**. About a minute later you'll get a link like `under-the-rock-xyz.vercel.app`. Open it on your phone and use Share → **Add to Home Screen**.

When the browser asks you to sign in, type anything as the username and your `APP_PASSWORD` as the password.
Each time you upload changed files to GitHub, Vercel updates the site automatically.

## Where the news comes from

| Source | What it gives you | Cost |
|---|---|---|
| Google News search | Coverage from most outlets | Free |
| FTC press releases | Merger challenges, enforcement | Free |
| DOJ press releases | Antitrust Division actions (filtered from all DOJ news) | Free |
| Federal Register | Official proposed/final rules, STB filings | Free |
| CourtListener | New federal court dockets (e.g. railroad antitrust suits) | Free |
| Claude API (optional) | Overview + "why it matters" + relevance check | Fractions of a cent per story |

At the bottom of the feed, "Sources checked" shows which sources responded.

## Changing your interests

Open `src/config/categories.ts`. Each category is a list of keywords plus the searches to run. Copy a block to add a new one (for example "Data privacy"), and it shows up in the ⚙︎ settings toggles automatically.

## Swapping in real animations

`src/components/Mascot.tsx` is the animation slot. It has four moods: `idle` (header), `dig` (loading), `sleep` (empty), and `celebrate` (new stories). Replace the SVG inside it with a Lottie or Rive file later. The rest of the app won't need changes. The app respects the system's reduce-motion setting and has its own on/off toggle in settings.

## Check that it works

```
npm test
```
This runs every source parser and the full feed pipeline against saved sample data. You don't need internet for it.

## Project map

```
src/config/categories.ts     ← your interests
src/lib/sources/*            ← one file per news source
src/lib/relevance.ts         ← keyword scoring + duplicate merging
src/lib/summarize.ts         ← AI overviews (or fallback blurbs)
src/lib/pipeline.ts          ← ties it together; feed + search
src/app/api/*                ← /api/feed, /api/search, /api/categories
src/app/page.tsx             ← the screen
src/components/Mascot.tsx    ← animation slot
```

## Next steps (from the plan)

- Host it on Vercel so it works anywhere, not just on your Wi-Fi
- Add Supabase to save stories, read/unread status, and bookmarks
- A scheduled job that fetches news every few hours, plus push notifications
- Wrap with Expo for the App Store / Google Play
