# Life as a town: build plan

Your Gmail, iMessage, Calendar and Drive, drawn as a hand-inked isometric town. Overdue things decay dramatically. Tap a broken building, read the bot's drafted fix in its thread, approve, and watch it repair.

This is an **interface over OpenMausBot**. We write no agent harness, no tool-calling loop and no extraction pipeline.

## Current direction (2026-11-22)

The first two connected buildings are the Post Office (Gmail) and GitHub HQ. The island uses OpenMausBot’s existing account links, app-event catalog, worker threads and image attachments. Drawably supplies interactive controls. The photo bazaar, temple journal and cricket ground work before connecting an account. The setup and storage details are in the [README](../README.md).

The next proposed milestone uses the same Gmail connection. A keeper can recognize a bill or a promised follow-up, propose a dated item at the right building, and show the source in its thread. The town already has the tools for recording a due date and repairing the building with evidence. Calendar, Drive, iMessage and historical backfill remain later milestones.

## Original decisions (2026-11-21)

| Area | Decision |
|---|---|
| Harness | OpenMausBot with the **Codex** engine. The town is a second client of its harness server (`127.0.0.1:8799`, HTTP commands + `/api/events` SSE). |
| Sources | Gmail, Calendar and Drive via OpenMausBot's Composio connectors. iMessage via a local MCP server (`tszaks/imessage-mcp`) added under Plugins → MCP servers. Sending only after approval. |
| What a building is | A person or organisation in your life (HDFC, Mom, landlord). |
| Districts | Four floating diorama slabs: **Money**, **People**, **Work**, **Paperwork**. |
| Bots | One **keeper** bot per district (Banker, Postmaster, Secretary, Clerk), each with only the apps it needs. MausBot is the **Mayor** at Town Hall. Keepers walk to the building they're working on. |
| How the town learns state | The **town is an MCP server**. Bots call `town.*` tools as they work; they still chat normally in their threads. |
| Starter town | Fixed landmarks (Town Hall, Bank, Telephone Exchange, Clock Tower, Post Office) and empty slabs with vacant lots. Landmarks start **boarded up** until their app is connected. |
| First run | Tap a landmark, connect via Composio's browser login (iMessage gets a short setup guide). The district's keeper then backfills the last 30 days, and buildings rise. |
| Staying current | Gmail: OpenMausBot app-event automations (~15 min). iMessage and Calendar: hourly routine per keeper. Decay is computed in the browser from `due_at`, so it worsens between bot runs. |
| Tap a building | Side panel with its OpenMausBot thread inline, using **Vercel AI Elements** plus a small adapter from OpenMausBot SSE to AI SDK messages. Approve / Deny there. |
| Repair | Only when the keeper calls `town.set_state(..., "fixed")` after the action actually succeeded. |
| Decay | Dramatic: fine → dusty → cracked → smoking → fire. People: lights dim → garden wilts → window cracks → smoke. "Not now" puts up scaffolding. |
| Look | Layered SVG in the DOM, in the colorfigures hand-inked style, using the tweet's palette (below). |
| Repo | Fresh git history. Ideas copied from claude-clan (layout, plot hashing, HUD feel), not its Phaser renderer or its history. |
| Out of scope for now | Time slider, "blame" view, year time-lapse, shared family town, phone widget, demo planning. |

### Palette

| Role | Hex |
|---|---|
| Paper | `#F4F0E6` |
| Road / plinth side | `#E6E1D6` / `#D9D3C6` |
| Ink outline | `#3B3A36` |
| Tomato (hero accent) | `#E0623F` |
| Grass | `#A5CF78` |
| Water | `#93C4E6` |
| Teal roof | `#4F9B7E` |
| Mustard | `#E9C25A` |
| Lilac / blossom | `#B8A9D8` / `#F2B9C8` |

## Architecture

```
Gmail · Calendar · Drive (Composio)      iMessage (MCP server)
                 │                              │
                 ▼                              ▼
        ┌──────────────── OpenMausBot (Codex engine) ────────────────┐
        │  Mayor · Banker · Postmaster · Secretary · Clerk            │
        │  routines + app-event automations, approval cards           │
        └───────┬──────────────────────────────────────┬─────────────┘
       calls town.* tools (MCP)              HTTP commands + /api/events SSE
                ▼                                      │
        ┌──────────── town-server (Hono) ──────────────┼──┐
        │  MCP server · SQLite town state · SSE relay ◄─┘  │
        └───────────────────────┬─────────────────────────┘
                                │ WebSocket / SSE
                                ▼
        ┌──────────── web (Vite + React + TS) ────────────┐
        │  SVG town · decay(now) · thread panel (AI Elements) │
        └─────────────────────────────────────────────────┘
```

### Repo layout

```
web/            Vite + React + TS. SVG town, HUD, thread panel.
town-server/    Hono. MCP server (Streamable HTTP), SQLite, OpenMausBot client + relay.
shared/         zod schemas: Building, District, TownEvent, MCP tool inputs.
art/            Building SVGs (named layers) and decay overlays.
bots/           Keeper and Mayor instructions + routine definitions (OpenMausBot team YAML).
fixtures/       Seeded town states used in development and checks.
```

### Town MCP tools (the contract bots use)

| Tool | Purpose |
|---|---|
| `town.get(district?)` | Existing buildings and their open items. Bots call this first so they reuse buildings instead of duplicating "HDFC" and "HDFCBK". |
| `town.place_building({entity, aliases[], district, kind})` | Create a building, or return the existing one if an alias matches. |
| `town.set_state({building_id, item_id, title, due_at?, state, thread_id, evidence?})` | Open, update, snooze or fix an item on a building. `fixed` requires `evidence` (sent message id, receipt, etc.). |
| `town.walk_to({bot, building_id})` | Move the keeper character, so the town shows who is working where. |

### Data model

```ts
Building { id, entity, aliases[], district, kind, plot: {x, y} }   // plot = hash(id) within district, persisted
Item     { id, building_id, title, due_at?, state: "open"|"snoozed"|"fixed",
           thread_id, bot, evidence?, updated_at }
// health(building, now) is computed in the browser from its open items
```

## Milestones

Each milestone ends with a short **Check** (see "Verification" below).

### Setup by milestone

The code lives at the root of `bot-life`. M1 starts with seeded fixtures and can run before M0's live check.

| What | Needed by |
|---|---|
| Install and onboard OpenMausBot, sign in to Codex, and select Codex as the engine | M0 live check |
| Provide access to the claude-clan layout and HUD references | M2 |
| Provide access to the colorfigures skill and check its license | M3 |
| Choose a Gmail account and a managed or custom Composio project, then connect Gmail in OpenMausBot. Calendar and Drive can be connected when their flows are exercised. | M5 |
| Grant the iMessage MCP host Full Disk Access and Automation access to Messages | M6 |

### M0: Harness spike (half a day)

- Map the harness API from OpenMausBot's own `src/` client: send a message to a bot, read a thread, answer an approval, start a connector login, subscribe to `/api/events` (stream-ticket auth).
- Write `docs/city/harness-contract.md`.
- Install OpenMausBot, set the Codex engine, and register a test MCP server.
- **Check:** one script sends a message to a bot, receives the SSE reply, and sees the bot call the test MCP tool.

### M1: town-server + contract
- `shared/` schemas, SQLite store, the four `town.*` MCP tools, plot hashing, event stream to the browser.
- Seed fixtures: `fresh` (boarded landmarks only), `busy` (mixed decay), `inferno` (everything overdue).
- **Check:** unit tests for alias matching and plot stability; a test that calls each tool through an MCP client.

### M2: The town renders
- SVG iso projection, four district slabs, landmarks, vacant lots, roads, paper background, palette.
- Loads a fixture or live state; `?now=` query param to pick the time decay is computed at.
- **Check:** screenshot of each fixture looks right (manual review against the tweet reference).

### M3: Art and decay
- ~6 building types per district generated with the colorfigures skill, recoloured, split into named layers.
- Shared overlays and animations: dust, cracks, smoke, fire, scaffolding, boarded-up, rising, repairing.
- `decay(item, now)` pure function.
- **Check:** unit test for `decay`; a fixture page showing one building at every decay step.

### M4: Thread panel and repair
- Click a building → side panel with its thread (AI Elements + OpenMausBot SSE adapter), Approve / Deny.
- Keeper character walks to the building; repair animation when `fixed` arrives.
- **Check:** end-to-end against a real bot: post a fake bill into a keeper's thread, building appears and decays, approve, building repairs.

### M5: Keepers, onboarding, backfill
- `bots/` team file: Mayor + four keepers, instructions, app access per keeper, routines, Gmail app-event automation.
- Boarded-up landmarks → connect flow → backfill run → buildings rise.
- **Check:** start from an empty OpenMausBot workspace and real Gmail; the Money district fills in from the last 30 days.

### M6: iMessage and Calendar
- Add the iMessage MCP server to the Postmaster; Calendar to the Secretary; hourly routines.
- **Check:** an unanswered iMessage shows up on the right house within the hour; a drafted reply sends only after Approve.

## Verification

Kept deliberately small:

1. **`pnpm check`**: typecheck plus a few unit tests (alias matching, plot stability, `decay`) plus the MCP tool test. Run before every commit.
2. **Fixtures + screenshot.** Every UI change is checked by loading `fresh`, `busy` and `inferno` and looking at a screenshot.
3. **One end-to-end per milestone** from M4 on, as listed in that milestone's Check, run by hand against a real OpenMausBot.

In the product itself, the safety check is the `evidence` rule: a building only repairs when the keeper proves the action happened.

## Risks

| Risk | Mitigation |
|---|---|
| OpenMausBot's harness API is internal and may change | Pin a version; keep all calls in one `town-server/omb/` module, mapped in M0. |
| Bots skip calling `town.*` tools or create duplicates | Instructions say "call `town.get` first"; alias matching in `place_building`; Mayor can tidy up. |
| Hand-inked art is slow to produce | Limit to ~6 building types per district; reuse overlays across all buildings. |
| Gmail updates every ~15 min feel slow | Decay animates continuously in the browser; a "refresh" on a landmark triggers its keeper immediately. |
| iMessage needs Full Disk Access | One-time setup guide on the Telephone Exchange. |
