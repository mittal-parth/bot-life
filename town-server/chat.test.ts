import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { chatApi } from "./omb/chat.ts";

test("chat forwards creation and sends to the selected harness thread and exposes search activity", async () => {
  const base = {
    id: "bot-a",
    threadId: "thread-a",
    name: "Maus",
    modelSelection: { instanceId: "codex", model: "example" },
  };
  const calls: { path: string; body: unknown }[] = [];
  const app = chatApi(async (url, init) => {
    const path = new URL(String(url)).pathname;
    const body = init?.body && JSON.parse(String(init.body));
    calls.push({ path, body });
    if (path.endsWith("messages"))
      return Response.json({ threadId: base.threadId });
    if (body)
      return Response.json({
        bot: { ...base, id: "bot-b", threadId: "thread-b", name: body.name },
      });
    return Response.json({
      bots: [
        {
          ...base,
          messages: [
            {
              id: "1",
              role: "bot",
              kind: "activity",
              tool: { name: "WebSearch", ok: true },
            },
            { id: "2", role: "bot", kind: "text", text: "Result" },
          ],
        },
      ],
    });
  });
  const list = await (await app.request("/bots")).json();
  assert.equal(list.bots[0].messages[0].web, true);
  assert.equal(list.bots[0].messages[1].text, "Result");
  function post(path: string, body: unknown) {
    return app.request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  assert.equal(
    (
      await post("/bots", {
        name: "Scout",
        description: "Find flights",
        inheritFrom: base.id,
      })
    ).status,
    201,
  );
  assert.deepEqual(calls.at(-1)?.body, {
    name: "Scout",
    description: "Find flights",
    modelSelection: base.modelSelection,
  });
  const message = {
    text: "Search flights",
    threadId: base.threadId,
    sendId: crypto.randomUUID(),
  };
  assert.equal((await post("/bots/bot-a/messages", message)).status, 200);
  assert.deepEqual(calls.at(-1), {
    path: "/api/bots/bot-a/messages",
    body: message,
  });
  assert.equal(
    (await post("/bots/bot-a/messages", { ...message, text: " " })).status,
    400,
  );
});

test("pairing keeps the harness credential server-side and scopes it to the paired browser", async (t) => {
  const auth: (string | null)[] = [];
  const dir = mkdtempSync(join(tmpdir(), "town-pair-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const harness: typeof fetch = async (url, init) => {
    if (String(url).endsWith("/api/auth/pair"))
      return Response.json({ token: "mock-harness-token" });
    auth.push(new Headers(init?.headers).get("Authorization"));
    return Response.json({ bots: [] });
  };
  const app = chatApi(harness, dir);
  const paired = await app.request("/pair", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "sample-code" }),
  });
  assert.equal(paired.status, 200);
  const cookie = paired.headers.get("set-cookie")!;
  assert.match(cookie, /HttpOnly/i);
  assert.ok(!cookie.includes("mock-harness-token"));
  assert.deepEqual(await paired.json(), { paired: true });
  await chatApi(harness, dir).request("/bots", {
    headers: { Cookie: cookie.split(";")[0] },
  });
  assert.equal(auth[0], "Bearer mock-harness-token");
});
