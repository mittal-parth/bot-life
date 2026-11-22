import assert from "node:assert/strict";
import test from "node:test";
import { surfaceApi } from "./omb/surfaces.ts";

test("routes a native Gmail receipt to its worker once", async () => {
  const receipt = {
    triggerId: "post",
    eventId: "letter",
    at: 1,
    outcome: "started",
    preview: "Test delivery",
  };
  const api = surfaceApi(async (_, path) => {
    if (path === "/api/connectors?services=gmail,github")
      return {
        configured: true,
        services: { gmail: { connected: true }, github: { connected: false } },
      };
    assert.equal(path, "/api/app-triggers");
    return {
      service: { available: true },
      triggers: [
        {
          id: "post",
          app: "gmail",
          botId: "keeper",
          name: "Post office",
          enabled: true,
          event: "GMAIL_NEW_GMAIL_MESSAGE",
        },
      ],
      attempts: [receipt, receipt],
    };
  });
  const { byService } = await (await api.request("/")).json();
  assert.deepEqual(byService.gmail.deliveries, [
    {
      id: "gmail:keeper:letter",
      at: 1,
      title: "Test delivery",
      botId: "keeper",
    },
  ]);
  assert.deepEqual(byService.github.deliveries, []);
});

test("only the two island services can request a Composio Connect Link", async () => {
  const api = surfaceApi(async (_, path) => {
    assert.equal(path, "/api/connectors/github/authorize");
    return { url: "https://connect.composio.dev/link/test" };
  });
  assert.equal(
    (await api.request("/github/connect", { method: "POST" })).status,
    200,
  );
  assert.equal(
    (await api.request("/drive/connect", { method: "POST" })).status,
    404,
  );
});
