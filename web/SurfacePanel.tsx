import { PanelPaper } from "./PanelPaper.tsx";
import { DrawablyButton, DrawablyInput, DrawablySelect } from "drawably/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SurfaceCatalog,
  SurfaceService,
  SurfaceSnapshot,
} from "../shared/surfaces.ts";
import "./surfaces.css";

const empty = { connected: false, pending: false, watches: [], deliveries: [] };
const initial: SurfaceSnapshot = {
  configured: false,
  feeds: false,
  feedMessage: "",
  byService: { gmail: empty, github: empty },
};
const names = { gmail: "Gmail", github: "GitHub" };
const buildings = { gmail: "Post office", github: "GitHub HQ" };
const seenKey = "bot-life:opened-deliveries:v1";

async function request<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch("/api/chat/surfaces" + path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw Error(data.error || "The island could not reach OpenMausBot.");
  return data;
}

function readMarks(): string[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(seenKey) || "[]");
    return Array.isArray(data) ? data.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function useSurfaces() {
  const [snapshot, setSnapshot] = useState(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [seen, setSeen] = useState(readMarks);
  const current = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;
    try {
      const next = await request<SurfaceSnapshot>(
        "",
        undefined,
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setSnapshot(next);
        setReady(true);
        setError("");
      }
    } catch (e) {
      if (!controller.signal.aborted) setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const poll = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const interval = setInterval(poll, 15000);
    const marks = (e: StorageEvent) => {
      if (e.key === seenKey) setSeen(readMarks());
    };
    document.addEventListener("visibilitychange", poll);
    window.addEventListener("storage", marks);
    return () => {
      clearInterval(interval);
      current.current?.abort();
      document.removeEventListener("visibilitychange", poll);
      window.removeEventListener("storage", marks);
    };
  }, [refresh]);
  function markRead(ids: string[]) {
    const next = [...new Set([...readMarks(), ...seen, ...ids])].slice(-2048);
    try {
      localStorage.setItem(seenKey, JSON.stringify(next));
    } catch {
      /* Available in memory when storage is full. */
    }
    setSeen(next);
  }
  const building = (key: SurfaceService) => {
    const state = snapshot.byService[key];
    const deliveries = state.deliveries.map((d) => ({
      ...d,
      unread: !seen.includes(d.id),
    }));
    return {
      ...state,
      deliveries,
      unread: deliveries.filter((d) => d.unread).length,
    };
  };
  return {
    ...snapshot,
    byService: { gmail: building("gmail"), github: building("github") },
    ready,
    error,
    refresh,
    markRead,
  };
}

type Props = {
  service: SurfaceService;
  surfaces: ReturnType<typeof useSurfaces>;
  bots?: { id: string; name: string }[];
  onPreviewDelivery?: () => void;
  onClose: () => void;
};
export function SurfacePanel(props: Props) {
  return <BuildingPanel key={props.service} {...props} />;
}

function BuildingPanel({
  service,
  surfaces,
  bots = [],
  onClose,
  onPreviewDelivery,
}: Props) {
  const state = surfaces.byService[service];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [editing, setEditing] = useState(false);
  const [worker, setWorker] = useState("");
  const workerId = worker || bots[0]?.id || "";
  const [catalog, setCatalog] = useState<SurfaceCatalog>();
  const [eventId, setEventId] = useState("");
  const [account, setAccount] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const event = catalog?.events.find((e) => e.event === eventId);
  useEffect(() => {
    if (!editing || !workerId) return;
    const controller = new AbortController();
    setCatalog(undefined);
    setError("");
    void request<SurfaceCatalog>(
      `/${service}/events?botId=${encodeURIComponent(workerId)}`,
      undefined,
      controller.signal,
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        setCatalog(data);
        setEventId(data.events[0]?.event || "");
        setAccount(data.accounts[0]?.id || "");
        setFields({});
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [service, editing, workerId]);
  async function connect() {
    setBusy(true);
    setError("");
    try {
      const { url } = await request<{ url: string }>(
        "/" + service + "/connect",
        {},
      );
      setLink(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function watch() {
    if (!event) return;
    const config = Object.fromEntries(
      event.fields.map((f) => [
        f.name,
        f.type === "number" || f.type === "integer"
          ? Number(fields[f.name])
          : f.type === "boolean"
            ? fields[f.name] === "true"
            : fields[f.name],
      ]),
    );
    setBusy(true);
    setError("");
    try {
      await request("/" + service + "/watch", {
        botId: workerId,
        event: eventId,
        account: account || undefined,
        config,
      });
      setEditing(false);
      await surfaces.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <aside className="bot-desk surface-panel" aria-label={buildings[service]}>
      <PanelPaper>
        <div className="desk-head">
          <h2>{buildings[service]}</h2>
          <button onClick={onClose} aria-label={"Close " + buildings[service]}>
            ×
          </button>
        </div>
        {(error || surfaces.error) && (
          <p role="alert">{error || surfaces.error}</p>
        )}
        {!surfaces.ready ? (
          <p>
            {surfaces.error
              ? "Check the desktop connection and retry."
              : "Checking connection…"}
          </p>
        ) : !surfaces.configured ? (
          <p>
            Set up Connected Apps in OpenMausBot, then return here to connect{" "}
            {names[service]}.
          </p>
        ) : !state.connected ? (
          <div className="desk-fields">
            <p>
              {service === "gmail"
                ? "Mail from your connected inbox lands here."
                : "Repository activity arrives here for your workers."}
            </p>
            {link ? (
              <a
                className="desk-send"
                href={link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Continue to {names[service]} ↗
              </a>
            ) : (
              <DrawablyButton variant="solid" disabled={busy} onClick={connect}>
                {busy
                  ? "Preparing sign-in…"
                  : state.pending
                    ? "Resume sign-in"
                    : "Connect " + names[service]}
              </DrawablyButton>
            )}
          </div>
        ) : (
          <>
            <p className="surface-connected">{names[service]} connected</p>
            {surfaces.feedMessage && <p>{surfaces.feedMessage}</p>}
            {state.watches.length > 0 && (
              <ul>
                {state.watches.map((w, i) => (
                  <li key={i}>
                    {w.name}
                    {w.problem
                      ? " · " + w.problem
                      : w.enabled
                        ? ""
                        : " · paused"}
                  </li>
                ))}
              </ul>
            )}
            {surfaces.feeds &&
              !state.watches.some((w) => w.enabled) &&
              !editing && (
                <DrawablyButton
                  variant="solid"
                  onClick={() => setEditing(true)}
                >
                  Set up deliveries
                </DrawablyButton>
              )}
            {editing && (
              <form
                className="desk-fields"
                onSubmit={(e) => {
                  e.preventDefault();
                  void watch();
                }}
              >
                <p>
                  Each event starts a read-only summary task for the selected
                  worker. Manage or pause it in OpenMausBot.
                </p>
                {!bots.length ? (
                  <p>Create a worker on the island first.</p>
                ) : (
                  <label>
                    Worker
                    <DrawablySelect
                      value={workerId}
                      onChange={(e) => setWorker(e.target.value)}
                    >
                      {bots.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </DrawablySelect>
                  </label>
                )}
                {catalog && (
                  <>
                    {catalog.accounts.length > 1 && (
                      <label>
                        Account
                        <DrawablySelect
                          value={account}
                          onChange={(e) => setAccount(e.target.value)}
                        >
                          {catalog.accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.alias || a.id}
                            </option>
                          ))}
                        </DrawablySelect>
                      </label>
                    )}
                    {catalog.events.length ? (
                      <label>
                        Deliver when
                        <DrawablySelect
                          value={eventId}
                          onChange={(e) => {
                            setEventId(e.target.value);
                            setFields({});
                          }}
                        >
                          {catalog.events.map((e) => (
                            <option key={e.event} value={e.event}>
                              {e.name}
                            </option>
                          ))}
                        </DrawablySelect>
                      </label>
                    ) : (
                      <p>No supported events are available for this worker.</p>
                    )}
                    {event?.fields.map((f) => (
                      <label key={f.name}>
                        {f.description || f.name}
                        {f.type === "boolean" ? (
                          <DrawablySelect
                            required
                            value={fields[f.name] || ""}
                            onChange={(e) =>
                              setFields({ ...fields, [f.name]: e.target.value })
                            }
                          >
                            <option value="">Choose</option>
                            <option>true</option>
                            <option>false</option>
                          </DrawablySelect>
                        ) : (
                          <DrawablyInput
                            required
                            type={
                              ["integer", "number"].includes(f.type)
                                ? "number"
                                : "text"
                            }
                            value={fields[f.name] || ""}
                            onChange={(e) =>
                              setFields({ ...fields, [f.name]: e.target.value })
                            }
                          />
                        )}
                      </label>
                    ))}
                  </>
                )}
                <div>
                  <button type="submit" disabled={busy || !event}>
                    Enable deliveries
                  </button>{" "}
                  <button type="button" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
            <h3>Deliveries</h3>
            {state.deliveries.length === 0 ? (
              <p>No deliveries yet.</p>
            ) : (
              <ul className="surface-deliveries">
                {state.deliveries.map((d) => (
                  <li key={d.id}>
                    <span>
                      {d.title}
                      <small>
                        {bots.find((b) => b.id === d.botId)?.name || "Worker"} ·{" "}
                        {new Date(d.at).toLocaleString()}
                      </small>
                    </span>
                    {d.unread && (
                      <button onClick={() => surfaces.markRead([d.id])}>
                        Mark read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {service === "gmail" && !state.connected && onPreviewDelivery && (
          <DrawablyButton type="button" onClick={onPreviewDelivery}>
            Preview mail flight
          </DrawablyButton>
        )}
        <button
          className="surface-refresh"
          onClick={() => void surfaces.refresh()}
        >
          Refresh
        </button>
      </PanelPaper>
    </aside>
  );
}
