# Agent brief 30: React app

**Scope:** this repository. Do not modify `contracts/openapi.yaml` (vendored copy owned by `bdo-pvp-lab-api`); if it looks wrong, stop and ask. **Time box:** 08:30–12:15.
**Read first:** `CLAUDE.md`, `contracts/openapi.yaml`.

## Steps (TDD for each component)
1. `npm run gen:api`; `client.ts`, `ApiProvider.tsx`, `queries.ts` (one `queryOptions` per GET operation, one mutation hook for `estimateDamage`).
2. **Fixtures + WireMock:** fixtures for every operation, built from the contract examples (mystic, Wave Orb III 2786 with clauses 96.98×2×21.37% and 73.39×2×25.42%, estimate total 2706.32, a 404 and a 422 problem). Mappings in `wiremock/mappings/`. Check `npm run mock` serves them.
3. `test/renderWithProviders.tsx` with a fake `fetch` routing to the same fixtures.
4. Layout (header with extract id and builds from `/meta`, nav: Classes, Data quality), router, NotFound.
5. ClassesPage → ClassSkillsPage (spec tabs in the URL) → SkillDetailPage.
6. DamageEstimator.
7. DataQualityPage (metric cards, rule counts, paginated filtered issues).
8. **Integration (12:15):** set `VITE_API_BASE_URL=http://localhost:8000`, click through every page on the real API, fix display issues; report contract mismatches to the api session (they fix the contract in bdo-pvp-lab-api, you sync it).

## Done when
- All web gates green (typecheck, tests, lint, format:check, npm audit).
- The app works against WireMock **and** against the real API.
- No `useMemo` / `useCallback` / `React.memo` and no `useEffect` used for data fetching.

## Prompt to paste
> Read CLAUDE.md, contracts/openapi.yaml and docs/agents/30-web.md, then implement the brief step by step in TDD. Commit after each step with the verification line. Do not edit the vendored contract.
