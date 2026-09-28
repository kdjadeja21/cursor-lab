# Fetchboard

Connect APIs. Build your dashboard.

Fetchboard turns REST and GraphQL endpoints into live dashboards without writing
frontend code. You add an endpoint, test it, inspect the JSON that comes back,
pick from the visualizations it suggests, and combine widgets from several
endpoints into one dashboard that refreshes on a schedule.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with any email
address — see [Placeholder sign-in](#placeholder-sign-in) below — and two sample
endpoints are bundled so you can try the whole flow immediately:

| Endpoint                                   | Type    | Notes                                              |
| ------------------------------------------ | ------- | -------------------------------------------------- |
| `http://localhost:3000/api/demo/orders`    | REST    | Order summary plus 24 order records                |
| `http://localhost:3000/api/demo/graphql`   | GraphQL | Product catalog; send any query, variables honored |

Values drift slightly on every call, so scheduled refresh is visible.

## What this MVP does

- **REST and GraphQL connections** with method, headers, query parameters, JSON
  body, GraphQL query and variables, API-key or bearer auth, request timeout, and
  a refresh schedule.
- **Server-side request execution** through `POST /api/execute`, so the browser
  never calls the target endpoint directly and cross-origin APIs work without
  CORS headers.
- **Response inspection** with a collapsible JSON tree, inferred field types, and
  detection of tabular arrays, numeric measures, categorical dimensions, and
  date fields.
- **Visualization recommendations** ranked by fit, each explaining why it was
  suggested. Nothing is applied until you pick it.
- **Four view types** — table (column choice, sort, search, pagination), KPI
  cards, record cards, and charts (line, bar, area, pie) — with number,
  currency, percent, and date formatting per field.
- **Multi-source dashboards** on a four-column grid with reordering, resizing,
  duplication, and removal.
- **Manual and scheduled refresh** that fetches each connection once per
  interval however many widgets read from it, backs off exponentially after
  failures, keeps the last successful payload when a refresh fails, and shows
  per-source fresh / stale / error state.

## Architecture

```
app/(auth)/sign-in      Placeholder local sign-in
app/(app)/              Dashboard list, create, viewer, editor, widget builder,
                        connection list and wizard
app/api/execute         Stateless server-side request proxy (the only server logic)
app/api/demo/*          Bundled sample REST and GraphQL endpoints
lib/store/              localStorage-backed workspace store
lib/server/             SSRF guard, request execution, rate limiting
lib/infer-schema.ts     JSON shape and field-type inference
lib/recommend.ts        Rule-based visualization recommendations
lib/widget-data.ts      Turns a cached response plus a widget config into rows,
                        metrics, cards, or chart points
lib/schedule.ts         When a connection's next scheduled run is due
components/widgets/     Table, KPI, cards, and chart renderers
```

State flows in one direction: screens read the store, the refresh scheduler
calls the proxy and writes responses back into the store, and widgets render
from the cached response.

## No backend yet, and what that costs

This build has **no database and no account system**. Everything is kept in the
browser. Two guarantees from the product requirements therefore do not hold yet,
and it is worth being explicit about them rather than implying otherwise.

### Placeholder sign-in

Entering an email stores it in `localStorage` and namespaces your dashboards and
connections under it. There is no password, no session, and no server-side
check. Anyone with access to the browser profile has access to the data, and
opening the app in a different browser shows an empty workspace.

### Credentials are stored in the browser

API keys and bearer tokens are saved in `localStorage` alongside the rest of the
connection and sent to the proxy with each request. The proxy keeps them out of
URLs, never logs request headers or bodies, strips `Authorization` and `Cookie`
on cross-host redirects, and the UI masks the inputs — but "secrets never leave
the server" is not achieved without a backend that owns them.

### Scheduled refresh needs an open tab

The scheduler is a timer in the page. It pauses when the tab is hidden and stops
when the tab closes, so there is no background sync and no refresh while nobody
is looking.

Replacing all three means a real backend: server-side sessions, encrypted
credential storage, and a queue-backed worker. `lib/store/` is the only module
that reads or writes persisted state, so the screens would not need to change.

## Security controls that are in place

Fetchboard fetches arbitrary user-supplied URLs, so the proxy is written
defensively regardless of the missing backend:

- `http` and `https` only; credentials embedded in a URL are rejected.
- DNS is resolved and every resolved address is checked against loopback,
  private, carrier-grade NAT, link-local (including `169.254.169.254`),
  multicast, and reserved ranges, for both IPv4 and IPv6 including IPv4-mapped
  forms.
- The socket connection is pinned through the same guard, so a DNS answer that
  changes between the check and the connection is still rejected.
- Redirects are followed at most three times and re-validated at every hop.
- Responses are capped (2 MB by default) and aborted mid-stream when exceeded.
- Requests time out on a per-connection budget that spans redirects.
- The proxy is rate-limited per caller by a token bucket.
- Upstream values are always rendered as text, so returned markup cannot
  execute.

The app's own origin is allowlisted so the bundled demo endpoints remain
reachable. Configuration lives in `.env.example`.

## Scripts

| Command         | Purpose                                             |
| --------------- | --------------------------------------------------- |
| `npm run dev`   | Start the dev server                                |
| `npm run build` | Production build, including a type check            |
| `npm run lint`  | ESLint                                              |
| `npm test`      | Unit tests for the SSRF guard, inference, recommendations, widget data, and scheduling |
