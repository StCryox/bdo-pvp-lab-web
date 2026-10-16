# Agent brief 30: React app

**Scope:** this repository. Do not modify `contracts/openapi.yaml` (vendored copy owned by `bdo-pvp-lab-api`); if it looks wrong, stop and ask.
**Read first:** `CLAUDE.md`, `contracts/openapi.yaml`.

## Current state
Steps 1–7 are committed: every page works against WireMock, and the app is synced to contract v2.1.0 (selector-alias clauses are marked on the skill page and in the estimator; the estimator takes a crit rate bonus and a variant; estimates show the HP loss without crit, with crit and on average; skills list one row per variant and only the highest rank of each skill; the form takes rates in %; the skills table sorts by damage, crit rate and HP loss). Step 8 is done too: the app runs against the real API, which serves the warehouse built by `bdo-pvp-lab-pipeline`.

## Steps (TDD for each component)
1. *(done)* `npm run gen:api`; `client.ts`, `ApiProvider.tsx`, `queries.ts` (one `queryOptions` per GET operation, one mutation hook for `estimateDamage`).
2. *(done)* **Fixtures + WireMock:** fixtures for every operation, built from the contract examples (mystic, Wave Orb III 2786 with clauses 96.98×2×21.37% and 73.39×2×25.42%, estimate total 2706.32, a 404 and a 422 problem). Mappings in `wiremock/mappings/`. Check `npm run mock` serves them.
3. *(done)* `test/renderWithProviders.tsx` with a fake `fetch` routing to the same fixtures.
4. *(done)* Layout (header with extract id and builds from `/meta`, nav: Classes, Data quality), router, NotFound.
5. *(done)* ClassesPage → ClassSkillsPage (spec tabs in the URL) → SkillDetailPage.
6. *(done)* DamageEstimator.
7. *(done)* DataQualityPage (metric cards, rule counts, paginated filtered issues).
8. *(done)* **Integration**: set `VITE_API_BASE_URL=http://localhost:8000` in `.env.development.local`, click through every page on the real API, fix display issues; report contract mismatches to the api session (they fix the contract in bdo-pvp-lab-api, you sync it).

## Done when
- All web gates green (typecheck, tests, lint, format:check, npm audit).
- The app works against WireMock **and** against the real API.
- No `useMemo` / `useCallback` / `React.memo` and no `useEffect` used for data fetching.

## Prompt to paste
> Read CLAUDE.md, contracts/openapi.yaml and docs/agents/30-web.md. Steps 1–7 are done; do step 8 only if the API is running on localhost:8000 on the real warehouse (otherwise stop and tell me). Commit after each fix with the verification line. Do not edit the vendored contract.
