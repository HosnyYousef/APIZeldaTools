# Hyrule Archive — The Legend of Zelda API

> *An atlas of the Legend of Zelda universe*

A vanilla JS fan site built on the [Zelda API](https://zelda.fanapis.com) — browsing games and characters from across the entire series.

---

## Features

**Games tab** — All released Zelda titles with name, description, developer, publisher, and release date. Click any row for the full detail modal.

**Characters tab** — Paginated character browser (12 per page) with live search by name. Click any card for the full character modal including race, gender, and game appearances (resolved to game names).

## API

Uses `zelda.fanapis.com/api` — free, open, no key required, CORS enabled.

Endpoints:
- `GET /games?limit=100` — all games
- `GET /characters?limit=12&page=N&name=query` — paginated + searchable characters
- `GET /games/:id` — single game lookup (used to resolve character appearance URLs)

## Design

Dark mystical aesthetic: deep indigo void, ancient triforce gold, sacred green accents. CSS-only animated triforce (no images). Procedural starfield generated in JS.

- Fonts: Cinzel (display), Crimson Pro (body), DM Mono (metadata)
- Animated starfield background
- Sticky nav with blur backdrop
- Debounced search (400ms)
- Lazy-loaded character tab (only fetches on first visit)

## Structure

```
zelda-api/
  index.html
  css/
    normalize.css
    style.css
  js/
    main.js
  README.md
```

## Run locally

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Deploy

Drag and drop the `zelda-api/` folder to [Netlify Drop](https://app.netlify.com/drop).

---

Built by [HosnyYousef](https://github.com/HosnyYousef) · Not affiliated with Nintendo
