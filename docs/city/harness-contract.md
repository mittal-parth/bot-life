# OpenMausBot harness contract

M0 source baseline is [OpenMausBot at 237a12b](https://github.com/milind-soni/OpenMausBot/tree/237a12bac719d47c2b9f0bbdcd985dc6af228259). The local desktop release is 0.1.175 on port 8799. An unpaired client could list bots. Registering the probe required the desktop pairing prompt.

| Operation | Request and behavior |
| --- | --- |
| Identify a conversation | `GET /api/bots`. Use the selected bot's `id` and its conversation's `threadId`. A bot can have multiple threads. |
| Send | `POST /api/bots/{botId}/messages` with JSON containing `text`, `threadId` and a UUID `sendId`. Reuse the send ID if retrying the same submission. Read the reply on the event stream. |
| Read history | `GET /api/threads/{threadId}/messages?limit=50`. Supply `before` with the oldest loaded message ID for earlier messages. |
| Respond to a permission request | `POST /api/threads/{threadId}/respond` with the card's `requestId` and `behavior` of `allow` or `deny`. Some reviewed actions also require `reviewedSha256`. Approval authorizes an attempt. The keeper records a repair after execution succeeds. |
| Connect Gmail | `POST /api/connectors/gmail/authorize`. Open the returned login URL for the user and poll `GET /api/connectors?services=gmail` for the result. |
| Register an MCP server | `POST /api/mcp/servers`. The probe uses a local command and argument list. For the town server use a name, `type: "http"` and its URL. New servers start disabled. Follow registration with `POST /api/mcp/servers/{name}/test`, then `PATCH /api/mcp/servers/{name}` with `{"enabled":true}` after successful discovery. Check access for the selected bot. |
| Subscribe | `POST /api/auth/stream-ticket`, then `GET /api/events?screens=off&frames=thread` with the returned ticket as the `ticket` query parameter if present. A trusted loopback request can receive a null ticket. A paired client can authenticate the POST with a bearer token. Tickets are single-use. |

Wait for the SSE `hello` frame before sending. Final bot text arrives as a `message` frame with the matching `threadId`, `message.role === "bot"` and `message.kind === "text"`. For the persistent town client, reconnect with a fresh ticket and the last cursor in `since`. Reload the thread snapshot when replay is unavailable.

Source references include the [desktop command client](https://github.com/milind-soni/OpenMausBot/blob/237a12bac719d47c2b9f0bbdcd985dc6af228259/src/state/store.tsx), [event client](https://github.com/milind-soni/OpenMausBot/blob/237a12bac719d47c2b9f0bbdcd985dc6af228259/src/lib/live-events.ts), [session tests](https://github.com/milind-soni/OpenMausBot/blob/237a12bac719d47c2b9f0bbdcd985dc6af228259/server/remote-sessions.test.ts), [MCP settings](https://github.com/milind-soni/OpenMausBot/blob/237a12bac719d47c2b9f0bbdcd985dc6af228259/src/components/McpServersPanel.tsx) and [connector panel](https://github.com/milind-soni/OpenMausBot/blob/237a12bac719d47c2b9f0bbdcd985dc6af228259/src/components/PluginsPanel.tsx).

## Live result

On 2026-11-21, the M0 smoke test passed against OpenMausBot 0.1.175. After pairing, testing and enabling the server, MausBot returned the random probe receipt in the selected thread over SSE. The runner exited successfully and closed its temporary pairing session. Gmail authorization and approval-card responses still need live verification.

## Local smoke test

Use a local Codex bot and a disposable thread. Under Plugins → MCP servers, add a stdio server named `town-spike`. Use the absolute path printed by `node -p process.execPath` for its command and the absolute path to `scripts/m0/probe.mjs` as its sole argument. Enable it for the test bot. Both processes must share the same user's temp directory.

From the repo root run:

```sh
node --experimental-eventsource scripts/m0/smoke.mjs BOT_ID THREAD_ID
```

Set `OMB_PORT` if the desktop uses a different loopback port and `OPENMAUSBOT_TOKEN` if the harness requires pairing. The script sends one synthetic request, waits up to two minutes, and succeeds when the bot's text on that thread contains the random receipt returned by the probe. If a permission card appears, review the tool call in the desktop app. Gmail access is independent of this check.

## Check the Streamable HTTP town server

1. Install [OpenMausBot](https://github.com/milind-soni/OpenMausBot/releases/latest), sign in to Codex, and create or choose a test bot with the Codex engine.
2. From this repo, run `pnpm install` and start a disposable town with `TOWN_DB=:memory: pnpm start`.
3. Add `http://127.0.0.1:4310/mcp` as a Streamable HTTP server named `town` and grant the test bot access. Approve the test tool call in OpenMausBot if it asks.
4. Run `pnpm smoke:omb <bot-id> <thread-id>`. If your harness uses another port, set `OMB_PORT`. If it requires a paired session, set `OMB_SESSION_TOKEN` locally.

The script sends one test message, waits for the matching bot reply on the harness SSE stream, and checks that a uniquely named building appeared in the disposable town. Gmail and Composio can stay disconnected for this check.

This separate check exercises the actual town store and is pending on the desktop installation.
