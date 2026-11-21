# OpenMausBot harness contract

The routes below were checked against [OpenMausBot source at commit 4305086](https://github.com/milind-soni/OpenMausBot/tree/43050869d35a379862403df6dcfa8eed10d729f3). The live Codex check requires a configured OpenMausBot instance.

| Action | Request and response |
|---|---|
| Find a bot and its threads | `GET /api/bots?messages=0` returns `bots`, including IDs and task metadata. |
| Send to a bot | `POST /api/bots/:botId/messages` with `{text, threadId, sendId}` returns HTTP 202 with `threadId` and either `message` or queue information. Send an explicit thread ID to pin the destination. |
| Load thread messages | `GET /api/threads/:threadId/messages?limit=50`. Use `before` to fetch older messages. |
| Answer a card | `POST /api/threads/:threadId/respond` with `{requestId, behavior}`. Approve uses `allow` and Deny uses `deny`. Read `requestId` from the card. Some card types carry extra reviewed fields. |
| Start an app connection | `POST /api/connectors/:slug/authorize` returns the browser login `url`. Read connection status through `GET /api/connectors/connected`. |
| Register a town server | In Plugins → MCP servers, add a Streamable HTTP server. The underlying route is `POST /api/mcp/servers` with `{name, type: "http", url, enabled: true}`. Enable it for the Codex bot used for testing. |
| Subscribe to live messages | `GET /api/events?screens=off&frames=thread`. The first data frame is `hello` with `cursor` and `resumed`. Apply `message` and `message.patch` by thread and message ID. Reconnect with `Last-Event-ID` or `since` and reload thread history when `resumed` is false. |

The harness normally listens on `127.0.0.1:8799`. In a trusted local terminal setup, loopback may authenticate directly and `POST /api/auth/stream-ticket` returns a null ticket. For a paired session, use its bearer token for commands. The same endpoint issues a ticket for an EventSource that connects with `?ticket=…`. Desktop-managed setups can require a paired session for writes even on loopback. Use the supported pairing flow and keep session tokens in the local process environment. Keep the town server and harness on the same machine for the initial check.

## Run the live check

1. Install [OpenMausBot](https://github.com/milind-soni/OpenMausBot/releases/latest), sign in to Codex, and create or choose a test bot with the Codex engine.
2. From this repo, run `pnpm install` and start a disposable town with `TOWN_DB=:memory: pnpm start`.
3. Add `http://127.0.0.1:4310/mcp` as a Streamable HTTP server named `town` and grant the test bot access. Approve the test tool call in OpenMausBot if it asks.
4. Run `pnpm smoke:omb <bot-id> <thread-id>`. If your harness uses another port, set `OMB_PORT`. If it requires a paired session, set `OMB_SESSION_TOKEN` locally.

The script sends one test message, waits for the matching bot reply on the harness SSE stream, and checks that a uniquely named building appeared in the disposable town. Gmail and Composio can stay disconnected for this check.
