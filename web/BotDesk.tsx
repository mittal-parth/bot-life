import { PanelPaper } from "./PanelPaper.tsx";
import {
  DrawablyButton,
  DrawablyInput,
  DrawablyTextarea,
  DrawablySelect,
} from "drawably/react";
import type { SurfaceDelivery } from "../shared/surfaces.ts";
import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import type { TownBot } from "../shared/chat.ts";

import { figures, type Figure, type Assignment } from "./WorkerScene.tsx";
const WorkerMarkdown = lazy(() => import("./WorkerMarkdown.tsx"));
export const homes = {
  "Harbor steps": [184, 337],
  "Market square": [374, 215],
  "East promenade": [545, 290],
  "South gardens": [391, 381],
} as const;
type Home = keyof typeof homes;
function saved<T>(key: string): Record<string, T> {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch {
    return {};
  }
}
async function api<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const r = await fetch("/api/chat/" + path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  if (!r.ok)
    throw Error(
      (await r.json().catch(() => ({}))).error || "Town chat is unavailable.",
    );
  return r.json();
}
export function useBotDesk() {
  const [bots, setBots] = useState<TownBot[]>([]);
  const [selected, select] = useState("");
  const [visit, setVisit] = useState(0);
  const [open, setOpen] = useState(false);
  const [web, setWeb] = useState(false);
  const [connection, setConnection] = useState("");
  const [paired, setPaired] = useState(false);
  const [ready, setReady] = useState(false);
  const [jobs, setJobs] = useState(() => saved<Assignment>("bot-life:jobs"));
  const [looks, setLooks] = useState(() => saved<Figure>("bot-life:figures"));
  const [locations, setLocations] = useState(() =>
    saved<Home>("bot-life:homes"),
  );
  useEffect(() => {
    localStorage.setItem("bot-life:jobs", JSON.stringify(jobs));
  }, [jobs]);
  useEffect(() => {
    localStorage.setItem("bot-life:figures", JSON.stringify(looks));
  }, [looks]);
  const since = useRef(Date.now());
  useEffect(() => {
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function sync() {
      try {
        const { bots: next, paired } = await api<{
          bots: TownBot[];
          paired: boolean;
        }>("bots", undefined, abort.signal);
        if (abort.signal.aborted) return;
        setJobs((previous) => {
          let updated = previous;
          for (const b of next) {
            const user = b.messages.findLast((m) => m.role === "user");
            if (
              user?.sendId &&
              user.at &&
              user.at >= since.current &&
              (!previous[b.id] || user.at > previous[b.id].at) &&
              previous[b.id]?.id !== user.sendId
            ) {
              updated = {
                ...updated,
                [b.id]: { id: user.sendId, at: user.at, web: false },
              };
            }
          }
          return updated;
        });
        setPaired(paired);
        setBots(next);
        setConnection("");
        setReady(true);
      } catch (e) {
        if (!abort.signal.aborted) setConnection((e as Error).message);
      }
      if (!abort.signal.aborted) timer = setTimeout(sync, 1800);
    }
    void sync();
    return () => {
      abort.abort();
      clearTimeout(timer);
    };
  }, []);
  const bot = bots.find((b) => b.id === selected) ?? bots[0];
  function enter(id?: string, internet = false) {
    if (id) select(id);
    setVisit((v) => v + 1);
    setWeb(internet);
    setOpen(true);
  }
  function place(id: string, home: Home) {
    const next = { ...locations, [id]: home };
    setLocations(next);
    try {
      localStorage.setItem("bot-life:homes", JSON.stringify(next));
    } catch {}
  }
  function homeOf(b: TownBot): Home {
    const choices = Object.keys(homes) as Home[];
    return Object.hasOwn(homes, locations[b.id])
      ? locations[b.id]
      : choices[
          Math.max(
            0,
            bots.findIndex((x) => x.id === b.id),
          ) % choices.length
        ];
  }
  return {
    bots,
    setBots,
    bot,
    select,
    enter,
    open,
    setOpen,
    web,
    setWeb,
    connection,
    ready,
    paired,
    setPaired,
    visit,
    jobs,
    dispatch: (id: string, assignment: Assignment) => {
      setJobs((j) => ({ ...j, [id]: assignment }));
      setOpen(false);
    },
    chooseFigure: (id: string, figure: Figure) =>
      setLooks((l) => ({ ...l, [id]: figure })),
    figureOf: (b: TownBot): Figure =>
      Object.hasOwn(figures, looks[b.id])
        ? looks[b.id]
        : b.name.includes("Scout")
          ? "Scout"
          : "Porter",
    place,
    homeOf,
  };
}
export type Desk = ReturnType<typeof useBotDesk>;
export function BotDesk({
  desk,
  inbox,
  markRead,
}: {
  desk: Desk;
  inbox: SurfaceDelivery[];
  markRead: (ids: string[]) => void;
}) {
  const { bot, open, web } = desk;
  const [code, setCode] = useState("");
  const [approval, setApproval] = useState(
    () => sessionStorage.getItem("town-approval") || "",
  );
  useEffect(() => {
    if (!approval) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const result = await api<{ paired: boolean }>("login/status", {});
        if (stopped) return;
        if (!result.paired) {
          timer = setTimeout(poll, 1500);
          return;
        }
        desk.setPaired(true);
      } catch (e) {
        if (stopped) return;
        setError((e as Error).message);
      }
      sessionStorage.removeItem("town-approval");
      setApproval("");
    }
    timer = setTimeout(poll, 1000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [approval, desk.setPaired]);
  const [creating, setCreating] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [name, setName] = useState(""),
    [description, setDescription] = useState("");
  const [home, setHome] = useState<Home>("Harbor steps");
  const [sending, setSending] = useState(false),
    [error, setError] = useState("");
  const retry = useRef<{ thread: string; text: string; id: string } | null>(
    null,
  );
  const [figure, chooseFigure] = useState<Figure>("Scout");
  const bubble = useRef<HTMLElement>(null);
  const job = bot && desk.jobs[bot.id];
  const request = job && bot?.messages.find((m) => m.sendId === job.id);
  const reply = bot?.messages.findLast(
    (m) =>
      m.role === "bot" &&
      (m.kind === "text" || m.kind === "card") &&
      (!job || (request && m.requestId === request.id)),
  );
  useLayoutEffect(() => {
    if (!open || !bot || creating || !desk.paired) return;
    let frame = 0;
    function position() {
      const el = bubble.current;
      const actor = document.querySelector(
        '[data-worker="' + CSS.escape(bot!.id) + '"]',
      );
      if (el && actor) {
        const box = actor
          .querySelector('[role="button"]')
          ?.getBoundingClientRect();
        if (box) {
          const left = Math.max(
            8,
            Math.min(
              innerWidth - el.offsetWidth - 8,
              box.left + box.width / 2 - el.offsetWidth / 2,
            ),
          );
          el.style.left = left + "px";
          el.style.top =
            (box.top > el.offsetHeight + 12
              ? box.top - el.offsetHeight - 8
              : Math.max(
                  8,
                  Math.min(innerHeight - el.offsetHeight - 8, box.bottom + 8),
                )) + "px";
        }
      }
      frame = requestAnimationFrame(position);
    }
    position();
    const el = bubble.current;
    return () => {
      cancelAnimationFrame(frame);
      el?.style.removeProperty("top");
      el?.style.removeProperty("left");
    };
  }, [open, bot?.id, creating, desk.paired]);
  useEffect(() => setError(""), [bot?.id, creating]);
  useEffect(() => {
    setCreating(false);
  }, [open, desk.visit]);
  const key = bot?.threadId ?? "";
  const draft = drafts[key] ?? "";
  async function submit() {
    if (sending || !desk.paired) return;
    setSending(true);
    setError("");
    try {
      if (creating) {
        const b = await api<TownBot>("bots", {
          name,
          description,
          inheritFrom: bot?.id,
        });
        desk.setBots((bs) => [...bs.filter((old) => old.id !== b.id), b]);
        desk.place(b.id, home);
        desk.chooseFigure(b.id, figure);
        desk.enter(b.id);
        setCreating(false);
        setName("");
        setDescription("");
      } else if (bot && draft.trim()) {
        const text =
          (web
            ? "Search the web for the following request and include source links.\n\n"
            : "") + draft.trim();
        const old = retry.current;
        const id =
          old?.thread === key && old.text === text
            ? old.id
            : crypto.randomUUID();
        retry.current = { thread: key, text, id };
        await api("bots/" + bot.id + "/messages", {
          threadId: key,
          sendId: id,
          text,
        });
        desk.dispatch(bot.id, { id, at: Date.now(), web });
        retry.current = null;
        setDrafts((d) => ({ ...d, [key]: "" }));
        desk.setWeb(false);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }
  if (!open)
    return (
      <button className="desk-launch" onClick={() => desk.enter()}>
        Workers
      </button>
    );
  return (
    <aside
      ref={bubble}
      className={
        creating || !desk.paired ? "bot-desk" : "bot-desk speech-bubble"
      }
      aria-label="Worker conversation"
    >
      <PanelPaper>
        <div className="desk-head">
          <h2>{creating ? "Create a worker" : (bot?.name ?? "Workers")}</h2>
          <button
            onClick={() => {
              setCreating(!creating);
              setError("");
            }}
            disabled={sending}
          >
            {creating ? "Back" : "+ New bot"}
          </button>
          <button aria-label="Close chat" onClick={() => desk.setOpen(false)}>
            ×
          </button>
        </div>
        {desk.connection && <p role="status">{desk.connection}</p>}
        {desk.ready && !desk.paired && (
          <form
            className="desk-fields"
            onSubmit={async (e) => {
              e.preventDefault();
              setSending(true);
              setError("");
              try {
                await api("pair", { code });
                desk.setPaired(true);
                setCode("");
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setSending(false);
              }
            }}
          >
            <DrawablyButton
              type="button"
              variant="solid"
              disabled={sending || !!approval}
              onClick={async () => {
                setSending(true);
                setError("");
                try {
                  const result = await api<{ code: string }>("login", {});
                  sessionStorage.setItem("town-approval", result.code);
                  setApproval(result.code);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setSending(false);
                }
              }}
            >
              Request approval in OpenMausBot
            </DrawablyButton>
            {approval && (
              <strong role="status">
                Match {approval} in OpenMausBot and choose Allow.
              </strong>
            )}
            <details>
              <summary>Use a pairing code</summary>
              <label>
                Connect OpenMausBot
                <DrawablyInput
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Pairing code"
                  required
                  autoComplete="off"
                />
              </label>
              <small>
                Get a code from Remote access in OpenMausBot. Choose admin
                access to create bots.
              </small>
              <DrawablyButton
                variant="solid"
                type="submit"
                disabled={!code.trim() || sending}
              >
                Pair town
              </DrawablyButton>
            </details>
          </form>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {creating ? (
            <div className="desk-fields">
              <label>
                Name
                <DrawablyInput
                  required
                  maxLength={64}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Travel scout"
                />
              </label>
              <label>
                Role
                <DrawablyTextarea
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Find flights and compare routes."
                />
              </label>
              <label>
                Home base
                <DrawablySelect
                  value={home}
                  onChange={(e) => setHome(e.target.value as Home)}
                >
                  {Object.keys(homes).map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </DrawablySelect>
              </label>
              <fieldset className="figure-picker">
                <legend>Character</legend>
                {(Object.keys(figures) as Figure[]).map((f) => (
                  <label key={f}>
                    <input
                      type="radio"
                      name="figure"
                      checked={f === figure}
                      onChange={() => chooseFigure(f)}
                    />
                    <img src={figures[f]} alt="" />
                    {f}
                  </label>
                ))}
              </fieldset>
              <DrawablyButton
                variant="solid"
                type="submit"
                disabled={
                  !desk.paired || sending || !name.trim() || !!desk.connection
                }
              >
                {sending ? "Creating…" : "Create bot"}
              </DrawablyButton>
            </div>
          ) : bot ? (
            <>
              <details className="worker-settings">
                <summary>Worker &amp; home base</summary>
                <div className="desk-controls">
                  <label>
                    Bot
                    <DrawablySelect
                      disabled={sending}
                      value={bot.id}
                      onChange={(e) => desk.select(e.target.value)}
                    >
                      {desk.bots.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </DrawablySelect>
                  </label>
                  <label>
                    Home base
                    <DrawablySelect
                      value={desk.homeOf(bot)}
                      onChange={(e) =>
                        desk.place(bot.id, e.target.value as Home)
                      }
                    >
                      {Object.keys(homes).map((h) => (
                        <option key={h}>{h}</option>
                      ))}
                    </DrawablySelect>
                  </label>
                </div>
              </details>
              {inbox.length > 0 && (
                <details className="worker-settings">
                  <summary>
                    {inbox.length} unread{" "}
                    {inbox.length === 1 ? "delivery" : "deliveries"}
                  </summary>
                  {inbox.map((delivery) => (
                    <div className="worker-delivery" key={delivery.id}>
                      <span>{delivery.title}</span>
                      <button
                        type="button"
                        onClick={() => markRead([delivery.id])}
                      >
                        Mark read
                      </button>
                    </div>
                  ))}
                </details>
              )}
              {reply && (
                <div className="worker-answer" aria-label="Worker reply">
                  <Suspense fallback={reply.text}>
                    <WorkerMarkdown text={reply.text} />
                  </Suspense>
                </div>
              )}
              <div className="composer">
                {web && (
                  <button type="button" onClick={() => desk.setWeb(false)}>
                    Internet island ×
                  </button>
                )}
                <DrawablyTextarea
                  aria-label="Message"
                  required
                  disabled={sending}
                  maxLength={web ? 15850 : 16000}
                  value={draft}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [key]: e.target.value }))
                  }
                  placeholder={
                    web ? "What should I look up?" : "Ask " + bot.name + "…"
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing
                    ) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
                <DrawablyButton
                  type="submit"
                  variant="solid"
                  disabled={
                    !desk.paired ||
                    !draft.trim() ||
                    sending ||
                    !!desk.connection
                  }
                >
                  {sending ? "Sending…" : "Dispatch"}
                </DrawablyButton>
              </div>
            </>
          ) : (
            <p>
              {desk.ready
                ? "Create a bot to start a conversation."
                : "Connecting to OpenMausBot…"}
            </p>
          )}
          {error && <p role="alert">{error}</p>}
        </form>
      </PanelPaper>
    </aside>
  );
}
