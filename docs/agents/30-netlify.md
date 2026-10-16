# Brief — Web: Wave Orb fix and Netlify deployment

Save as `docs/agents/30-netlify.md` in `bdo-pvp-lab-web` (branch `feat/pyspark-stack`). Start the session with:

> Read `CLAUDE.md` and `docs/agents/30-netlify.md`, then do part 1. Stop at the end of each part, report the gates, and wait for me.

The OpenAPI contract does not change: no `sync:contract` needed unless the API repo changed it.

## Part 1 — Fix the Wave Orb III numbers
- Search the repo (WireMock mappings, test fixtures, tests) for `2706.32`, `340.74`, `78.76`.
- Use the variant values: total damage multiplier **193.96**, PvP damage multiplier **41.45**, estimate **1424.25** for variant 1 (**1282.07** for variant 2). Variants are alternatives, never summed (BR-PVP-05).
- Commit: `fix(test): use variant 1 values for Wave Orb III`.

## Part 2 — Ready for Netlify
- The API base URL comes only from `VITE_API_BASE_URL` (build-time); check there is no hardcoded `localhost:8000` outside `.env.development`.
- `netlify.toml`:
  ```toml
  [build]
    command = "npm ci && npm run build"
    publish = "dist"
  [build.environment]
    NODE_VERSION = "22"
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```
  (the redirect makes React Router deep links work on refresh).
- Cold start: the API host may sleep. Show a clear loading state ("waking up the server, up to a minute") when the first request takes more than 3 s, instead of a blank page; TanStack Query `retry` 2 on network errors only.
- Security headers in `netlify.toml` (`X-Content-Type-Options`, `Referrer-Policy`, a CSP allowing only self and the API origin).
- No analytics, no cookies (no consent banner needed).
- Write `docs/DEPLOY.md`: connect the GitHub repo in Netlify, set `VITE_API_BASE_URL` to the API URL, and add the Netlify URL to the API's `BDO_API_CORS_ORIGINS`.
- **Done when:** all gates green and `npm run build && npx vite preview` works with `VITE_API_BASE_URL` pointing to the local API.
- Do not deploy and do not push: Cryox does it.
