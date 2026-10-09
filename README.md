# BDO PvP Lab (web)

The React app of BDO PvP Lab: browse Black Desert Online classes and skills, see the PvP damage of each skill, estimate the damage of a skill on a target, and check the data quality of the extract behind it.

The data is built by [`bdo-pvp-lab-pipeline`](https://github.com/StCryox/bdo-pvp-lab-pipeline) and served by [`bdo-pvp-lab-api`](https://github.com/StCryox/bdo-pvp-lab-api). This app only talks to that API, through its OpenAPI contract, and runs without it against WireMock stubs.

## Features

| Page         | Route                                 | What it shows                                                                                                                          |
| ------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Classes      | `/`                                   | Every class with its specs and skill count; the header shows the extract id and game builds.                                           |
| Class skills | `/classes/:classSlug`                 | Skills of one class per spec (`?spec=`): cooldown, PvP and total damage multipliers, down/air, PvP crowd control, data-quality status. |
| Skill detail | `/classes/:classSlug/skills/:skillId` | Damage clauses (multiplier, hits, PvP kept share, crit) and a damage estimator for an attacker, a defender and a situation.            |
| Data quality | `/data-quality`                       | Quality metrics, rule counts by severity, and the issues list filtered by rule, severity and class.                                    |

Every number comes from the API: the app holds no damage formula.

## Stack

Vite, React 19 with the React Compiler, TypeScript (strict), React Router 7, TanStack Query 5, Tailwind CSS 4. API types are generated from the contract with `openapi-typescript` and requests go through `openapi-fetch`. Tests use Vitest and React Testing Library.

## Getting started

Requires Node 24 or 26+ (see `engines` in `package.json`) and, for the mock API, Docker.

```bash
npm install
npm run mock      # WireMock on http://localhost:8080, serves the test fixtures
npm run dev       # http://localhost:5173
```

The backend is selected with `VITE_API_BASE_URL`. `.env.development` points at WireMock.

### Run against the real API

1. Build the warehouse in [`bdo-pvp-lab-pipeline`](https://github.com/StCryox/bdo-pvp-lab-pipeline) (`just setup && just pipeline`), then start the API in [`bdo-pvp-lab-api`](https://github.com/StCryox/bdo-pvp-lab-api) (`just setup && just api`, port 8000).
2. Override the backend in a `.env.development.local`. It is git-ignored, so create it on every fresh clone:

   ```bash
   echo "VITE_API_BASE_URL=http://localhost:8000" > .env.development.local
   ```

3. Restart `npm run dev`: Vite reads env files only at startup.

Without this file the app calls WireMock on port 8080. If WireMock is not running, the pages stay empty and the browser console reports a CORS error, although the API on port 8000 works.

## Scripts

| Script                  | What it does                                                     |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run dev`           | Dev server                                                       |
| `npm run build`         | Type-check and production build                                  |
| `npm run typecheck`     | Type-check only                                                  |
| `npm test`              | Test suite                                                       |
| `npm run lint`          | ESLint                                                           |
| `npm run format:check`  | Prettier, check mode                                             |
| `npm run mock`          | WireMock with the mappings in `wiremock/`                        |
| `npm run sync:contract` | Copy the contract from `../bdo-pvp-lab-api` (or `$BDO_API_REPO`) |
| `npm run gen:api`       | Regenerate `src/api/schema.d.ts` from the contract               |

## API contract

`contracts/openapi.yaml` is a copy of the contract owned by the API repository; it is never edited here. To pick up a change:

```bash
npm run sync:contract
npm run gen:api
```

then adapt the app and fixtures.

## Tests and mock data

The JSON responses in `src/test/fixtures/` are served by both WireMock (`wiremock/mappings/`) and the tests, so the dev server and the test suite see the same data. Tests never hit the network: a fake `fetch` matches each request against the WireMock mappings and returns their fixture. A test checks every fixture against the response schema of its operation in the contract.

## Project layout

```
src/
├─ main.tsx         # builds the query client, API client and router
├─ App.tsx          # providers
├─ router.tsx       # routes
├─ format.ts        # number, percent and duration display
├─ api/             # generated schema, typed client, query options
├─ components/      # layout and shared UI
├─ features/        # one folder per page
└─ test/            # render helpers, fake fetch, fixtures
wiremock/mappings/  # one mapping per endpoint and error case
contracts/          # vendored OpenAPI contract
```

## Data source

Skill data extracted from the game client by a community member and shared privately. It is not included in this repository; the fixtures are small hand-picked samples.
