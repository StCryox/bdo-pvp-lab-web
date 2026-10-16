# Deploy on Netlify

The app is a static build (`dist/`) that calls the API from the browser. Netlify builds it from the GitHub repository with the settings in `netlify.toml`.

## 1. Connect the repository

1. In Netlify: **Add new site → Import an existing project → GitHub**, then pick `bdo-pvp-lab-web`.
2. Leave the build settings empty in the UI: `netlify.toml` sets them (`npm ci && npm run build`, publish `dist`, Node 24).

## 2. Point the app at the API

1. **Site configuration → Environment variables → Add a variable**: `VITE_API_BASE_URL` = the public API URL, e.g. `https://bdo-pvp-lab-api.example.com` (no trailing slash, no `/api/v1`).
2. Trigger a deploy. Vite inlines the variable at build time: changing it needs a new deploy, not a restart.

The build fails with `VITE_API_BASE_URL must be the absolute API URL` when the variable is missing or invalid. That is deliberate: the Content-Security-Policy is built from the API origin.

## 3. Allow the Netlify origin on the API

The API answers the browser only for the origins it lists. In the API environment, add the Netlify URL (and the custom domain, if any) to `BDO_API_CORS_ORIGINS`, as a JSON list:

```bash
BDO_API_CORS_ORIGINS='["https://bdo-pvp-lab.netlify.app"]'
```

Then restart the API. Without it, every page shows a network error and the browser console reports a CORS error.

## What the deployment does

| Concern | Where |
|---|---|
| Deep links (`/classes/mystic` on refresh) | `netlify.toml` redirect `/*` → `/index.html` (200) |
| `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` | `netlify.toml` |
| Content-Security-Policy (`connect-src` = self + the API origin) | generated into `dist/_headers` at build time by `config/netlifyHeaders.ts` |
| API cold start | after 3 s of loading, pages say the server is waking up (up to a minute); queries retry twice on network errors |

No analytics and no cookies: the app needs no consent banner.

## Check a production build locally

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run build
npx vite preview          # http://localhost:4173
```

`vite preview` serves on port 4173: start the API with `BDO_API_CORS_ORIGINS='["http://localhost:4173"]'` so it accepts the preview origin. The preview server does not apply `_headers`; only Netlify does.
