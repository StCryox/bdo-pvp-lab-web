# web/CLAUDE.md

Local rules for the React app. Read the root `CLAUDE.md` and `contracts/openapi.yaml` first.

## Goal
A small, clean consumer of the data product: browse classes and skills, see PvP damage per skill, estimate the damage of a skill on a target, and see the data quality of the extract. It must work **before the API exists**, against WireMock stubs built from the contract.

## Stack
- **Vite**, **React 19**, **TypeScript** 5.9 (strict, `noUncheckedIndexedAccess`; pinned below 6 because `openapi-typescript` 7 requires TS 5), **npm**.
- **React Compiler** via `babel-plugin-react-compiler`: `@vitejs/plugin-react` v6 has no `babel` option, so `vite.config.ts` uses `@rolldown/plugin-babel` with `reactCompilerPreset()`. Consequence: **no manual `useMemo`, `useCallback` or `React.memo`**. Write plain components; the compiler memoizes. Follow the Rules of React (pure render, no mutation of props/state, hooks at top level).
- **React Router** (`react-router` v7, `createBrowserRouter` + `RouterProvider`, library/data mode, no framework mode).
- **TanStack Query** v5 for all server state. No `useEffect` + `fetch`.
- **Tailwind CSS** v4 via `@tailwindcss/vite`. No component library.
- API types generated with **openapi-typescript** from `../contracts/openapi.yaml`; requests with **openapi-fetch** (typed client). Never hand-write API types.
- Tests: **Vitest** (jsdom), **React Testing Library**, **@testing-library/user-event**, **@testing-library/jest-dom**.
- API mock for development: **WireMock** standalone (Docker image `wiremock/wiremock`), stubs in `web/wiremock/`.
- Lint/format: **ESLint** flat config with `typescript-eslint`, `eslint-plugin-react-hooks` (recommended config, which includes the React Compiler rules), **Prettier**.

## Scripts (`package.json`)
| Script | Command |
|---|---|
| `dev` | `vite` |
| `build` | `tsc -b && vite build` |
| `typecheck` | `tsc -b --noEmit` |
| `test` | `vitest run` |
| `lint` | `eslint .` |
| `format:check` | `prettier --check .` |
| `gen:api` | `openapi-typescript ../contracts/openapi.yaml -o src/api/schema.d.ts` |
| `mock` | `docker run --rm -p 8080:8080 -v ./wiremock/mappings:/home/wiremock/mappings -v ./src/test/fixtures:/home/wiremock/__files wiremock/wiremock:latest --global-response-templating --enable-stub-cors` |

`VITE_API_BASE_URL` selects the backend: `http://localhost:8080` (WireMock) or `http://localhost:8000` (real API). Default in `.env.development`: WireMock.

## Layout
```
web/src/
├─ main.tsx
├─ router.tsx
├─ api/
│  ├─ schema.d.ts         # generated, do not edit
│  ├─ client.ts           # createClient<paths>({ baseUrl, fetch })
│  ├─ ApiProvider.tsx     # React context holding the client (tests inject a fake fetch)
│  └─ queries.ts          # queryOptions factories + mutation hooks, one per operationId
├─ features/
│  ├─ classes/ClassesPage.tsx
│  ├─ skills/ClassSkillsPage.tsx  SkillDetailPage.tsx  DamageEstimator.tsx
│  └─ data-quality/DataQualityPage.tsx
├─ components/            # only what is shared by 2+ features: Layout, ErrorState, Loading, Badge
└─ test/
   ├─ setup.ts
   ├─ renderWithProviders.tsx   # QueryClient (retry false) + Router + ApiProvider with fake fetch
   ├─ fakeFetch.ts              # matches requests against the WireMock mappings, serves their fixtures
   └─ fixtures/                 # JSON responses, shared with WireMock (__files)
web/wiremock/mappings/          # one mapping per endpoint, bodyFileName → fixtures
```
Each component has a `*.test.tsx` next to it.

## One set of fixtures for tests and WireMock
- `src/test/fixtures/*.json` contain realistic responses that **validate against the contract** (use the contract examples: mystic, Wave Orb III 2786...).
- WireMock mappings serve them (`"bodyFileName": "skill-2786.json"`), so the dev server and the tests use the same data.
- Unit/integration tests never call WireMock or any network: `renderWithProviders` injects a fake `fetch` that reads the WireMock mappings (method, `urlPath`/`urlPathPattern`, `queryParameters.equalTo`, `bodyPatterns.matchesJsonPath` with a dotted `expression` + `equalTo`, `priority`) and serves the same fixture files. Keep mappings within that subset. Tests pass `overrides` for one-off responses.
- Add one mapping per error case used by the UI: unknown skill → 404 problem+json, skill that cannot be estimated (2722, no damage) → 422.
- Each mapping carries `"metadata": { "operationId": ... }`; `src/test/fixtures.test.ts` validates every served body against that operation's response schema in the contract.

## Routes and pages
| Route | Page | Content |
|---|---|---|
| `/` | ClassesPage | Grid of classes (name, specs, skill count). Header shows extract id and game builds from `/meta`. |
| `/classes/:classSlug` | ClassSkillsPage | Spec tabs from the class specs (`?spec=` in the URL). Table: skill, cooldown, PvP damage multiplier, total damage multiplier, down/air, PvP CC, DQ status badge. Sorted as the API returns. |
| `/classes/:classSlug/skills/:skillId` | SkillDetailPage | Skill facts, clauses table (multiplier, hits, PvP kept %, PvP multiplier, crit, DQ flag), PvE-only CC note, then `DamageEstimator`. |
| (component) | DamageEstimator | Form: attacker (AP, accuracy, crit bonus, back/down/air bonus), defender (DR, evasion, SA DR rate), situation (target state, from behind, target in SA, PvP modifier). Defaults = contract example. Submit → `estimateDamage` mutation. Result: total expected HP loss, breakdown (hit rate, base, DR rate, special, crit, PvP modifier), per-clause table, warnings. Shows 422 problem detail inline. |
| `/data-quality` | DataQualityPage | Metric cards from `/data-quality`, rule counts by severity, paginated issues table with filters (rule, severity, class) synced to the URL. Issue rows link to the skill page when `skill_id` is set. |
| `*` | NotFound | |

## UI rules
- Dark theme by default, readable tables, numbers right-aligned with fixed decimals (multipliers 2 decimals, ratios as %).
- Every query has loading, error (problem `title` + `detail`) and empty states.
- Accessibility: real `<table>`, `<label>` for every input, buttons not divs, focus visible, color never the only signal (badges have text).
- No business formulas in the front: everything numeric comes from the API.

## Tests (minimum)
- ClassesPage renders the fixture classes and links to `/classes/mystic`.
- ClassSkillsPage switches spec tab and updates the URL.
- SkillDetailPage shows the clauses of 2786 with PvP kept 21.37%.
- DamageEstimator submits the default form and shows total 2706.32; shows the 422 detail on error.
- DataQualityPage filters by severity and paginates.
- 404 problem → error state with the problem title.
