# Puzzle World

A 100% browser-based online puzzle gaming website featuring **100 progressive levels** across four playable puzzle modes:

- **Number Puzzle** (3x3, 4x4, 5x5 sliding tile puzzle with multi-tile slide and keyboard support)
- **Block Puzzle** (8x8, 9x9, 10x10 polyomino grid with drag-and-drop & tap placement)
- **Picture / Jigsaw Puzzle** (3x3, 4x4, 5x5 illustrated artwork tiles with reference peek)
- **Match-3 Puzzle** (6x6, 7x7, 8x8 cascading gem swap puzzle with combo multipliers)

All progress, unlocked levels, stars, best scores, and Music/SFX preferences are saved locally in the player's browser (`localStorage`). No server, database, login, or paid cloud account is required.

---

## Local Build

```bash
npm install
npm run build
```

This generates the complete, self-contained static website inside the `dist/` folder.

---

## Free Public Web Hosting Options (No Credit Card / No Billing Required)

### Option 1: Netlify Drop (Fastest — No Git Required)
1. Run `npm install` and `npm run build` locally (or download the project and build it).
2. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop) and sign in with a free Netlify account (no credit card required).
3. Drag and drop the generated **`dist/`** folder onto the page.
4. Netlify immediately gives you a free public `https://<site-name>.netlify.app` URL ready to share.

### Option 2: Cloudflare Pages (Free Unlimited Bandwidth)
1. Push this project to a free GitHub repository.
2. Sign in to [https://dash.cloudflare.com](https://dash.cloudflare.com) (free tier, no billing setup required) and open **Workers & Pages -> Create -> Pages -> Connect to Git**.
3. Select your repository and configure:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy** to publish at `https://<project-name>.pages.dev`.

### Option 3: Vercel (Free Hobby Tier)
1. Push this project to GitHub.
2. Sign in to [https://vercel.com](https://vercel.com) with GitHub (free Hobby plan, no credit card required).
3. Click **Add New -> Project**, import your repository, and keep the auto-detected Vite settings (`vercel.json` is already included).
4. Click **Deploy** to publish at `https://<project-name>.vercel.app`.

### Option 4: GitHub Pages (100% Free with GitHub)
1. Push this project to a public GitHub repository.
2. Add a GitHub Actions workflow or publish the `dist/` folder to the `gh-pages` branch.
3. Because `vite.config.ts` uses `base: './'`, all assets and images resolve cleanly even on subpath URLs like `https://<username>.github.io/<repo-name>/`.
