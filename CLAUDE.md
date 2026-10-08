# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**BDO PvP Lab (web)**: the React app of BDO PvP Lab, a small data product built on real Black Desert Online skill data. The backend (data pipeline + FastAPI) lives in a separate repository, `bdo-pvp-lab-api`, expected as a sibling folder (`../bdo-pvp-lab-api`). This app is one consumer of that data product: it only talks to the API.

The project is a showcase for a data-engineering interview (Fri 9 Oct 2026, 14:00). Task brief: `docs/agents/30-web.md`.

## Contract

`contracts/openapi.yaml` is a **vendored copy**: the backend repository owns the source of truth. Never edit it here. To pick up a contract change: `npm run sync:contract` (copies it from `${BDO_API_REPO:-../bdo-pvp-lab-api}`), then `npm run gen:api`, then adapt the app, in separate commits. The fixtures test validates every fixture against this copy.

## Commands

| Build / type-check | Tests | Lint | Format check | Dependency audit |
|---|---|---|---|---|
| `npm run typecheck` | `npm test` | `npm run lint` | `npm run format:check` | `npm audit` |

Dev server: `npm run dev` (port 5173). Mock: `npm run mock` (WireMock on port 8080, needs Docker).

## Goal
A small, clean consumer of the data product: browse classes and skills, see PvP damage per skill, estimate the damage of a skill on a target, and see the data quality of the extract. It must work **before the API exists**, against WireMock stubs built from the contract.

## Stack
- **Vite**, **React 19**, **TypeScript** 5.9 (strict, `noUncheckedIndexedAccess`; pinned below 6 because `openapi-typescript` 7 requires TS 5), **npm**.
- **React Compiler** via `babel-plugin-react-compiler`: `@vitejs/plugin-react` v6 has no `babel` option, so `vite.config.ts` uses `@rolldown/plugin-babel` with `reactCompilerPreset()`. Consequence: **no manual `useMemo`, `useCallback` or `React.memo`**. Write plain components; the compiler memoizes. Follow the Rules of React (pure render, no mutation of props/state, hooks at top level).
- **React Router** (`react-router` v7, `createBrowserRouter` + `RouterProvider`, library/data mode, no framework mode).
- **TanStack Query** v5 for all server state. No `useEffect` + `fetch`.
- **Tailwind CSS** v4 via `@tailwindcss/vite`. No component library.
- API types generated with **openapi-typescript** from `contracts/openapi.yaml`; requests with **openapi-fetch** (typed client). Never hand-write API types.
- Tests: **Vitest** (jsdom), **React Testing Library**, **@testing-library/user-event**, **@testing-library/jest-dom**.
- API mock for development: **WireMock** standalone (Docker image `wiremock/wiremock`), stubs in `wiremock/`.
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
| `gen:api` | `openapi-typescript contracts/openapi.yaml -o src/api/schema.d.ts` |
| `sync:contract` | `cp ${BDO_API_REPO:-../bdo-pvp-lab-api}/contracts/openapi.yaml contracts/openapi.yaml` |
| `mock` | `docker run --rm -p 8080:8080 -v ./wiremock/mappings:/home/wiremock/mappings -v ./src/test/fixtures:/home/wiremock/__files wiremock/wiremock:latest --global-response-templating --enable-stub-cors` |

`VITE_API_BASE_URL` selects the backend: `http://localhost:8080` (WireMock) or `http://localhost:8000` (real API). Default in `.env.development`: WireMock.

## Layout
```
src/
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
wiremock/mappings/          # one mapping per endpoint, bodyFileName → fixtures
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

## Coding standards

### Design
- Follow Robert C. Martin (Clean Code) principles.
- Apply **SOLID**, **YAGNI** and **KISS**:
  - **S**ingle Responsibility: each class/function has one reason to change.
  - **O**pen/Closed: open for extension, closed for modification.
  - **L**iskov Substitution: subtypes must be substitutable for base types.
  - **I**nterface Segregation: prefer small, specific interfaces.
  - **D**ependency Inversion: depend on abstractions, not concretions. Components receive their dependencies; they don't build them.
- Do not over-engineer. Add the minimum necessary for the feature; refactor when the need materializes.
- No premature abstraction: no helper, interface or util for a single usage. (Exception: the API's ports, because the hexagonal boundary is the point of the exercise.)
- No error handling for impossible cases.

### Tests
- Develop in **TDD**: write the failing test before the code.
- Every code file has its test file: `*.test.ts(x)` next to the file.
- Unit tests for functions, integration tests for component interactions. No end-to-end tests and no real network calls: tests use the fake `fetch` over the fixtures.
- Name tests descriptively, in English: `test_returns_404_when_skill_not_found`, `it("shows the PvP damage of each clause")`.
- Cover the happy path and the expected errors of critical paths.
- A task is done only when the suite is green. Run it and report the result.

### Verification before every commit
Never commit without running the five gates (table above):

1. **Build**: compiles / type-checks.
2. **Tests**: the whole suite, not only the tests you touched.
3. **Lint**: clean.
4. **Format check**: clean (check mode, not a silent rewrite).
5. **Dependency audit**: no vulnerabilities.

Report real numbers in one line before committing:
```
Verified (web): typecheck ✅, 42/42 tests ✅, lint clean ✅, format:check clean ✅, npm audit 0 vulnerabilities ✅.
```
Never mark a gate ✅ that you did not run. If a gate fails and can't be fixed here, say so with the failing output and ask. Never use `--no-verify`.

### Changes and commits
- Small, reviewable diffs. Over ~200 lines or dozens of files: propose a split.
- Micro-commits in conventional format: `feat:`, `fix:`, `test:`, `chore:`, `refactor:`, `docs:`. Scope by feature when useful: `feat(skills): add damage estimator`.
- **Never** add a Claude Code signature or watermark (`Co-Authored-By: Claude`, `Generated with Claude Code`) to commits or PRs.
- Never `git push`. Pushing is the developer's decision; pushing to `main` always needs explicit confirmation.
- Never create a branch with `git checkout -b <new> origin/main`; use `git switch -c <new> --no-track origin/main` and check the upstream with `git rev-parse --abbrev-ref --symbolic-full-name @{u}`.
- No regression. If a change conflicts with existing code, ask before continuing.

### Style
- Type annotations everywhere; no `Any` / `any` unless genuinely unavoidable.
- Code, identifiers and docs in English (the developer may write some docs in French; keep a file's original language).
- No superfluous comments. Comment only non-obvious rules; reference the business rule ID when code implements one: `# BR-PVP-02`.
- Configuration comes from `import.meta.env`, never hardcoded.
- Update docs when the code changes.

### Security
- Respect GDPR and EU/France rules: no personal data in logs, no secrets in the repo.
- The source extract (`bdo-skill-data-full.zip`) is third-party data shared privately: **never commit it** or any file derived from it except tiny test fixtures.
- Treat the extract as untrusted input: parse it, never execute it (do not run the `timing.py` or `examples/` shipped inside the zip from the zip folder; copy and review first).

## Domain cheat-sheet
- A **skill** is identified by `(class_slug, skill_id)`: 203 skill IDs are shared between several classes.
- A skill's **spec** is the catalog `build_label`: `Succession`, `Awakening`, `Single build`, and some class-specific labels (`Base`, `Dark`, `Light`, `Buddha`). Treat it as a string, not an enum.
- Percentages: raw sources store `9698` for 9,698%. After staging, store multipliers (`96.98`) for damage and fractions (`0.2137`) for PvP kept share. Column names say which: `damage_multiplier`, `pvp_kept_ratio`.
- Times in milliseconds unless the column ends with `_frame`.
