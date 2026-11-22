import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getCookie, setCookie } from "hono/cookie";
import { Hono, type Context } from "hono";
import { z } from "zod";
import type { ChatLine, TownBot } from "../../shared/chat.ts";

const id = z
  .string()
  .regex(/^[\w-]+$/)
  .max(128);
const message = z.object({
  id: z.string(),
  role: z.string(),
  at: z.number().optional(),
  sendId: z.string().nullish(),
  requestMessageId: z.string().nullish(),
  turnCompletedAt: z.number().nullish(),
  turnSucceeded: z.boolean().nullish(),
  kind: z.string().optional(),
  text: z.string().optional(),
  tool: z
    .object({
      name: z.string(),
      label: z.string().optional(),
      ok: z.boolean().nullable().optional(),
    })
    .nullish(),
});
const botShape = z.object({
  id,
  threadId: id,
  name: z.string(),
  hidden: z.boolean().optional(),
  busy: z.boolean().optional(),
  messages: z.array(z.unknown()).default([]),
  modelSelection: z
    .object({ instanceId: z.string(), model: z.string() })
    .nullish(),
});
function line(raw: unknown): ChatLine[] {
  const parsed = message.safeParse(raw);
  if (!parsed.success) return [];
  const m = parsed.data;
  if (m.role !== "user" && m.role !== "bot") return [];
  const base = {
    id: m.id,
    role: m.role as ChatLine["role"],
    web: false,
    at: m.at,
    sendId: m.sendId ?? undefined,
    requestId: m.requestMessageId ?? undefined,
    finishedAt: m.turnCompletedAt ?? undefined,
    failed: m.turnSucceeded === false,
  };
  if (m.kind === "activity" && m.tool) {
    const web = /web.?search|web.?fetch|browse[r_]|open.?url|open.?page/i.test(
      m.tool.name,
    );
    return [
      {
        ...base,
        kind: "tool",
        web,
        text:
          (m.tool.label || m.tool.name) +
          (m.tool.ok === false ? " · failed" : ""),
      },
    ];
  }
  if (/permission|approval|question/.test(m.kind ?? ""))
    return [
      {
        ...base,
        kind: "card",
        text: "Open OpenMausBot to respond to this request.",
      },
    ];
  return m.kind === "text" && m.text
    ? [{ ...base, kind: "text", text: m.text }]
    : [];
}
function present(b: z.infer<typeof botShape>): TownBot {
  return {
    id: b.id,
    threadId: b.threadId,
    name: b.name,
    busy: !!b.busy,
    messages: b.messages.flatMap(line).slice(-50),
  };
}
import { photoTurnApi, type ReadPhoto } from "./photo-turn.ts";
import { surfaceApi } from "./surfaces.ts";

export function chatApi(request: typeof fetch = fetch, sessionDir?: string, readPhoto?: ReadPhoto) {
  const app = new Hono();
  if (sessionDir) mkdirSync(sessionDir, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(
    sessionDir ? join(sessionDir, "sessions.sqlite") : ":memory:",
  );
  const lifetime = 30 * 24 * 60 * 60;
  db.exec(
    "CREATE TABLE IF NOT EXISTS sessions (handle TEXT PRIMARY KEY, token TEXT NOT NULL, expires INTEGER NOT NULL)",
  );
  function forget(c: Context) {
    db.prepare("DELETE FROM sessions WHERE handle=?").run(
      getCookie(c, "town_session") ?? "",
    );
  }

  function credential(c: Context) {
    return (
      (db
        .prepare("SELECT token FROM sessions WHERE handle=? AND expires>?")
        .get(getCookie(c, "town_session") ?? "", Date.now())?.token as
        string | undefined) || process.env.OMB_SESSION_TOKEN
    );
  }
  async function harness(c: Context, path: string, body?: unknown, mime?: string) {
    const port = Number(process.env.OMB_PORT ?? 8799);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw Error("Invalid OMB_PORT.");
    const headers = new Headers({ "Content-Type": mime ?? "application/json" });
    const token = credential(c);
    if (token && path !== "/api/auth/pair")
      headers.set("Authorization", "Bearer " + token);
    const res = await request("http://127.0.0.1:" + port + path, {
      method: body ? "POST" : "GET",
      headers,
      body: body instanceof ArrayBuffer ? body : body ? JSON.stringify(body) : undefined,
      redirect: "error",
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      if (res.status === 401) forget(c);
      if (
        path.startsWith("/api/auth/cli-login/") &&
        [403, 404].includes(res.status)
      ) {
        pending.delete(getCookie(c, "town_login") ?? "");
        throw Error(
          "The approval was declined or expired. You can request it again.",
        );
      }
      if (path === "/api/auth/pair")
        throw Error(
          "Pairing failed. Generate a fresh code in OpenMausBot and try again.",
        );
      if (res.status === 401 || res.status === 403)
        throw Error(
          "OpenMausBot requires a paired device with permission for this action.",
        );
      const detail = await res.json().catch(() => null);
      throw Error(
        typeof detail?.error === "string"
          ? detail.error.slice(0, 300)
          : "OpenMausBot returned HTTP " + res.status + ".",
      );
    }
    return res.json();
  }
  app.onError((err, c) =>
    c.json(
      {
        error:
          err instanceof TypeError || err.name === "TimeoutError"
            ? "Cannot reach OpenMausBot. Check that the desktop app is running."
            : err.message,
      },
      502,
    ),
  );
  app.use("*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    if (
      c.req.method === "POST" &&
      c.req.header("content-type")?.split(";")[0] !== "application/json"
    )
      return c.json({ error: "JSON required." }, 415);
    await next();
  });
  if (readPhoto) app.route("/photo-turns", photoTurnApi(harness, readPhoto));
  app.route("/surfaces", surfaceApi(harness));
  function connect(c: Context, raw: unknown) {
    const token = z.string().min(1).parse(raw);
    const key = randomUUID();
    forget(c);
    db.prepare("DELETE FROM sessions WHERE expires<=?").run(Date.now());
    db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
      key,
      token,
      Date.now() + lifetime * 1000,
    );
    setCookie(c, "town_session", key, {
      maxAge: lifetime,
      httpOnly: true,
      sameSite: "Strict",
      path: "/api/chat",
    });
    return c.json({ paired: true });
  }
  const pending = new Map<
    string,
    { id: string; verifier: string; code: string; expiresAt: number }
  >();
  app.post("/login", async (c) => {
    for (const [k, v] of pending)
      if (v.expiresAt <= Date.now()) pending.delete(k);
    const previous = pending.get(getCookie(c, "town_login") ?? "");
    if (previous) return c.json({ code: previous.code });
    const verifier = randomBytes(32).toString("base64url");
    const reply = await harness(c, "/api/auth/cli-login", {
      label: "Bot Life town",
      scope: "admin",
      verifierHash: createHash("sha256").update(verifier).digest("base64url"),
    });
    const login = z
      .object({ id, code: z.string(), expiresAt: z.number() })
      .parse(reply);
    const key = randomUUID();
    pending.set(key, { ...login, verifier });
    setCookie(c, "town_login", key, {
      httpOnly: true,
      sameSite: "Strict",
      path: "/api/chat",
      maxAge: 600,
    });
    return c.json({ code: login.code });
  });
  app.post("/login/status", async (c) => {
    const key = getCookie(c, "town_login") ?? "";
    const login = pending.get(key);
    if (!login || login.expiresAt <= Date.now())
      return c.json({ error: "Approval expired. Request it again." }, 410);
    const reply = await harness(c, "/api/auth/cli-login/" + login.id, {
      verifier: login.verifier,
    });
    if (reply.state === "waiting") return c.json({ paired: false });
    pending.delete(key);
    if (reply.state !== "allowed")
      return c.json({ error: "Approval ended." }, 403);
    return connect(c, reply.token);
  });
  app.post("/pair", async (c) => {
    const input = z
      .object({ code: z.string().trim().min(4).max(256) })
      .safeParse(await c.req.json().catch(() => null));
    if (!input.success) return c.json({ error: "Enter a pairing code." }, 400);
    const paired = await harness(c, "/api/auth/pair", {
      code: input.data.code,
      label: "Bot Life town",
      attemptId: randomUUID(),
    });
    return connect(c, paired.token);
  });
  app.get("/bots", async (c) => {
    const { bots } = z
      .object({ bots: z.array(botShape) })
      .parse(await harness(c, "/api/bots"));
    return c.json({
      paired: !!credential(c),
      bots: bots.filter((b) => !b.hidden).map(present),
    });
  });
  app.post("/bots", async (c) => {
    const input = z
      .object({
        name: z.string().trim().min(1).max(64),
        description: z.string().trim().max(2000),
        inheritFrom: id.optional(),
      })
      .safeParse(await c.req.json().catch(() => null));
    if (!input.success)
      return c.json(
        { error: "Enter a bot name and a shorter description." },
        400,
      );
    const { name, description, inheritFrom } = input.data;
    const { bots } = z
      .object({ bots: z.array(botShape) })
      .parse(await harness(c, "/api/bots?messages=0"));
    const modelSelection = bots.find(
      (b) => b.id === inheritFrom,
    )?.modelSelection;
    const created = await harness(c, "/api/bots", {
      name,
      description,
      ...(modelSelection && { modelSelection }),
    });
    return c.json(present(botShape.parse(created.bot)), 201);
  });
  app.post("/bots/:id/messages", async (c) => {
    const target = id.safeParse(c.req.param("id"));
    const input = z
      .object({
        threadId: id,
        sendId: z.uuid(),
        text: z.string().trim().min(1).max(16000),
      })
      .safeParse(await c.req.json().catch(() => null));
    if (!target.success || !input.success)
      return c.json(
        {
          error: "Choose a bot and enter a message (up to 16,000 characters).",
        },
        400,
      );
    const receipt = await harness(
      c,
      "/api/bots/" + target.data + "/messages",
      input.data,
    );
    if (receipt.threadId !== input.data.threadId)
      throw Error("OpenMausBot returned a different conversation.");
    return c.json({ threadId: receipt.threadId });
  });
  return app;
}
