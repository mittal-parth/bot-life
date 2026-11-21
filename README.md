# Bot Life

Life as a town turns personal obligations into an isometric town. The current milestone provides the local SQLite state store, MCP tools, and live town events. See the [build plan](docs/plan.md) for the full project.

## Run the town server

Requires Node 24 and pnpm 11. From the repo root, run:

```sh
pnpm install
pnpm check
pnpm start
```

- `http://127.0.0.1:4310/api/town` serves the current town.
- `http://127.0.0.1:4310/api/events` streams the initial snapshot and changes.
- `http://127.0.0.1:4310/api/fixtures/busy` serves a fixed-clock fixture. `fresh` and `inferno` are also available.
- `http://127.0.0.1:4310/mcp` serves the four town tools over Streamable HTTP.

The server binds to loopback and starts with boarded landmarks. It stores state in `.town/town.sqlite` by default. Set `TOWN_DB=:memory:` for a disposable run, `TOWN_FIXTURE=busy` to seed an empty store with sample items, or `TOWN_PORT` to change the port.

Use the [OpenMausBot harness contract](docs/city/harness-contract.md) to connect a Codex bot and run the live smoke check.

## Town atlas preview

With Node 24 and the dependencies installed, run `pnpm start` for the local town server, then `pnpm dev:web` in a second terminal. Open [the atlas](http://127.0.0.1:5173). Select a building or ledger entry to inspect its items. The directory lists every building, including close neighbors on the map.

The source selector loads the busy, fresh or inferno fixture from the server, or subscribes to the live town. Fixture views use the fixture's survey time. Live views advance with the clock. Set an ISO timestamp in `?now=` to inspect decay at a particular time, and use `?fixture=fresh`, `busy`, `inferno` or `live` to link a view. `pnpm build:web` creates the browser bundle in `web/dist`. The atlas reads town state; thread actions are planned for M4.
