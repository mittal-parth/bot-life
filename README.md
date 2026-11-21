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
