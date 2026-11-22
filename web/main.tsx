import { PanelPaper } from "./PanelPaper.tsx";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  TownSnapshot,
  keeperByDistrict,
  type Building,
  type District,
} from "../shared/town.ts";
import { BuildingArt } from "./Illustrations.tsx";
import { TownMap, colors } from "./Map.tsx";
import { buildingHealth, day, decay, overdueDays } from "./health.ts";
import { BotDesk, useBotDesk } from "./BotDesk.tsx";
import { PhotoGallery } from "./PhotoGallery.tsx";
import { IslandLandmarks, TempleReflection } from "./IslandLandmarks.tsx";
import { SurfacePanel, useSurfaces } from "./SurfacePanel.tsx";
import { CricketScores, useCricketScores } from "./CricketScores.tsx";
import { DrawablyButton, DrawablySelect } from "drawably/react";
import "drawably/style.css";
import "./style.css";

const places = {
  cricket: "Cricket scores",
  gallery: "Photo gallery",
  gmail: "Post Office",
  github: "GitHub HQ",
  temple: "Temple",
} as const;
type Place = keyof typeof places;

const modes = ["busy", "fresh", "inferno", "live"] as const;
type Mode = (typeof modes)[number];
const params = new URLSearchParams(location.search);
const fixedTime = Date.parse(params.get("now") ?? "");
const names: Record<Mode, string> = {
  busy: "Busy town",
  fresh: "Fresh town",
  inferno: "Inferno",
  live: "Live town",
};
const districtNames: District[] = ["money", "people", "work", "paperwork"];
function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    map: "m2 5 6-2 7 2 6-2v15l-6 2-7-2-6 2z M8 3v15m7-13v15",
    book: "M4 4h14a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z M8 4v16m3-11h6m-6 4h5",
    arrow: "m9 5 7 7-7 7",
    home: "m2 11 10-8 10 8 M5 10v10h14V10 M10 20v-7h4v7",
    target: "M3 8V3h5m8 0h5v5m0 8v5h-5m-8 0H3v-5",
    close: "m6 6 12 12M18 6 6 18",
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
function App() {
  const desk = useBotDesk();
  const cricket = useCricketScores();
  const surfaces = useSurfaces();
  const [mode, setMode] = useState<Mode>(
    modes.find((m) => m === params.get("fixture")) ?? "live",
  );
  const [town, setTown] = useState<TownSnapshot | null>(null);
  const [clock, setClock] = useState(Date.now());
  const [reference, setReference] = useState<number>();
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<string>();
  const [panel, setPanel] = useState<
    "ledger" | "directory" | "building" | Place
  >();
  const [previewMailFlight, setPreviewMailFlight] = useState(0);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [filter, setFilter] = useState("all");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const url = new URL(location.href);
    url.searchParams.set("fixture", mode);
    history.replaceState(null, "", url);
    const abort = new AbortController();
    let events: EventSource | undefined;
    setPanel(undefined);
    setTown(null);
    setSelected(undefined);
    setStatus("Loading town…");
    setReference(undefined);
    if (mode === "live") {
      events = new EventSource("/api/events");
      events.addEventListener("snapshot", (e) => {
        const parsed = TownSnapshot.safeParse(JSON.parse(e.data));
        if (parsed.success) {
          setTown(parsed.data);
          setStatus("");
        }
      });
      for (const [event, key, id] of [
        ["building", "buildings", "id"],
        ["item", "items", "id"],
        ["walk", "positions", "bot"],
      ] as const) {
        events.addEventListener(event, (e) => {
          const data = JSON.parse(e.data);
          setTown(
            (t) =>
              t && {
                ...t,
                [key]: [
                  ...t[key].filter((row) => Reflect.get(row, id) !== data[id]),
                  data,
                ],
              },
          );
        });
      }
      events.onerror = () => setStatus("Reconnecting to the town server…");
    } else {
      fetch("/api/fixtures/" + mode, { signal: abort.signal })
        .then(async (r) => {
          if (!r.ok) throw Error();
          const data = await r.json();
          if (abort.signal.aborted) return;
          setTown(TownSnapshot.parse(data));
          setReference(Date.parse(data.now));
          setStatus("");
        })
        .catch(() => {
          if (!abort.signal.aborted) setStatus("Town server unavailable.");
        });
    }
    return () => {
      abort.abort();
      events?.close();
    };
  }, [mode, retry]);
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (desk.open) {
      setPanel(undefined);
      setSelected(undefined);
      setToolsOpen(false);
    }
  }, [desk.open, desk.visit]);
  const now = Number.isFinite(fixedTime) ? fixedTime : (reference ?? clock);
  const building = town?.buildings.find((b) => b.id === selected);
  const pending = town?.items.filter((i) => i.state !== "fixed") ?? [];
  const overdue = pending
    .filter((i) => i.state === "open" && i.due_at && Date.parse(i.due_at) < now)
    .sort((a, b) => Date.parse(a.due_at!) - Date.parse(b.due_at!));
  function closePanel() {
    setPanel(undefined);
    setSelected(undefined);
  }
  useEffect(() => {
    function dismiss(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
        desk.setOpen(false);
        setToolsOpen(false);
      }
    }
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, []);
  function openPlace(place: Place) {
    desk.setOpen(false);
    setSelected(undefined);
    setToolsOpen(false);
    setPanel(place);
  }
  const workerUnread: Record<string, number> = {};
  for (const surface of Object.values(surfaces.byService)) {
    for (const delivery of surface.deliveries) {
      if (delivery.unread)
        workerUnread[delivery.botId] = (workerUnread[delivery.botId] ?? 0) + 1;
    }
  }
  const inspect = (id: string) => {
    desk.setOpen(false);
    setSelected(id);
    setPanel("building");
  };
  function dueLabel(date?: string) {
    if (!date) return "No due date";
    const d = Math.ceil((Date.parse(date) - now) / day);
    return d < 0
      ? Math.abs(d) + "d overdue"
      : d === 0
        ? "Due today"
        : "Due in " + d + "d";
  }
  function row(b: Building, sub: string, detail?: string) {
    return (
      <button key={b.id} className="row" onClick={() => inspect(b.id)}>
        <span className="spot" style={{ background: colors[b.district] }} />
        <span>
          <strong>{b.entity}</strong>
          <small>{sub}</small>
        </span>
        <em>{detail}</em>
        <Icon name="arrow" size={14} />
      </button>
    );
  }
  return (
    <>
      <header>
        <DrawablyButton
          className="brand"
          variant="solid"
          boil={0}
          aria-label="Town tools"
          aria-expanded={toolsOpen}
          onClick={() => {
            desk.setOpen(false);
            setToolsOpen(!toolsOpen);
            closePanel();
          }}
        >
          <span className="brandstamp">
            <Icon name="home" size={26} />
          </span>
          Bot Life <span aria-hidden="true">{toolsOpen ? "−" : "+"}</span>
        </DrawablyButton>
        {toolsOpen && (
          <>
            <nav aria-label="Town tools">
              {(["directory", "ledger"] as const).map((tool) => (
                <DrawablyButton
                  key={tool}
                  variant={panel === tool ? "solid" : "outline"}
                  boil={0}
                  aria-expanded={panel === tool}
                  onClick={() => {
                    setSelected(undefined);
                    setPanel(panel === tool ? undefined : tool);
                  }}
                >
                  {tool === "ledger" ? "Ledger" : "Directory"}
                </DrawablyButton>
              ))}
            </nav>
            <label className="source">
              <DrawablySelect
                aria-label="Town source"
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
              >
                {modes.map((m) => (
                  <option key={m} value={m}>
                    {names[m]}
                  </option>
                ))}
              </DrawablySelect>
            </label>
          </>
        )}
      </header>
      <main aria-label="Town atlas">
        {status && (
          <div role="status" className="status">
            {status}{" "}
            {status.includes("unavailable") && (
              <button onClick={() => setRetry((r) => r + 1)}>Retry</button>
            )}
          </div>
        )}
        {town && (
          <div className="mapfield">
            <div className="compass" aria-hidden="true">
              N
              <svg viewBox="0 0 20 36" width="18" height="30">
                <path
                  d="M10 1 16 27 10 22 4 27z"
                  stroke="currentColor"
                  fill="none"
                />
                <path d="M10 1v21l-6 5z" fill="currentColor" />
              </svg>
            </div>
            <div className="mapscroll">
              <TownMap
                {...{ town, now, selected, zoom, desk, workerUnread }}
                postOfficeConnected={surfaces.byService.gmail.connected}
                select={(id) =>
                  town.buildings.find((b) => b.id === id)?.kind ===
                  "post-office"
                    ? openPlace("gmail")
                    : inspect(id)
                }
                landmarks={
                  <IslandLandmarks
                    cricketBoard={cricket.board}
                    town={town}
                    onOpen={openPlace}
                    previewMailFlight={previewMailFlight}
                    mailUnread={surfaces.byService.gmail.unread}
                    githubUnread={surfaces.byService.github.unread}
                    mailConnected={surfaces.byService.gmail.connected}
                    githubConnected={surfaces.byService.github.connected}
                    mailEventKey={surfaces.byService.gmail.deliveries[0]?.id}
                  />
                }
              />
            </div>
            <div className="zoom">
              <button
                aria-label="Zoom out"
                disabled={zoom <= 0.8}
                onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))}
              >
                −
              </button>
              <button aria-label="Reset zoom" onClick={() => setZoom(1)}>
                <Icon name="target" size={14} />
              </button>
              <button
                aria-label="Zoom in"
                disabled={zoom >= 1.6}
                onClick={() => setZoom((z) => Math.min(1.6, z + 0.2))}
              >
                +
              </button>
            </div>
          </div>
        )}
        <BotDesk
          desk={desk}
          inbox={Object.values(surfaces.byService)
            .flatMap((service) => service.deliveries)
            .filter(
              (delivery) => delivery.botId === desk.bot?.id && delivery.unread,
            )}
          markRead={surfaces.markRead}
        />
        {panel === "gallery" && (
          <PhotoGallery desk={desk} onClose={closePanel} />
        )}
        {panel === "cricket" && (
          <CricketScores feed={cricket} onClose={closePanel} />
        )}
        {panel === "temple" && <TempleReflection onClose={closePanel} />}
        {(panel === "gmail" || panel === "github") && (
          <SurfacePanel
            key={panel}
            service={panel}
            surfaces={surfaces}
            bots={desk.bots}
            onClose={closePanel}
            onPreviewDelivery={() => {
              closePanel();
              setPreviewMailFlight((n) => n + 1);
            }}
          />
        )}
        {panel === "directory" && town && (
          <aside className="ledger directory" aria-label="Directory">
            <PanelPaper>
              <div className="ledgerhead">
                <h2>Directory</h2>
                <button aria-label="Close directory" onClick={closePanel}>
                  <Icon name="close" />
                </button>
              </div>
              <label>
                District{" "}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All districts</option>
                  {districtNames.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
              <div className="directory-places">
                {(Object.keys(places) as Place[]).map((place) => (
                  <DrawablyButton key={place} onClick={() => openPlace(place)}>
                    {places[place]}
                  </DrawablyButton>
                ))}
              </div>
              {town.buildings
                .filter((b) => filter === "all" || b.district === filter)
                .map((b) =>
                  row(
                    b,
                    b.district,
                    b.boarded
                      ? "Boarded"
                      : buildingHealth(
                          town.items.filter((i) => i.building_id === b.id),
                          now,
                        ),
                  ),
                )}
            </PanelPaper>
          </aside>
        )}
        {(panel === "ledger" || (panel === "building" && building)) && (
          <aside
            className="ledger"
            aria-label={building ? "Building record" : "Town ledger"}
          >
            <PanelPaper>
              <div className="ledgerhead">
                <p className="eyebrow">
                  {building ? "Building record" : "Town records"}
                </p>
                <button
                  className="plain"
                  aria-label={
                    building ? "Close building record" : "Close ledger"
                  }
                  onClick={closePanel}
                >
                  <Icon name="close" />
                </button>
              </div>
              {building && town ? (
                <>
                  <div className="portrait">
                    <svg viewBox="-55 -80 110 100">
                      <BuildingArt
                        kind={building.kind}
                        boarded={building.boarded}
                      />
                    </svg>
                  </div>
                  <h2>{building.entity}</h2>
                  <p className="byline">
                    {building.district} district ·{" "}
                    {keeperByDistrict[building.district]}
                  </p>
                  <hr />
                  <h3>Open items</h3>
                  {pending
                    .filter((i) => i.building_id === building.id)
                    .map((i) => (
                      <div className="entry" key={i.id}>
                        <strong>{i.title}</strong>
                        <small>
                          {dueLabel(i.due_at)} · {decay(i, now)}
                        </small>
                        {mode !== "live" && building.district === "money" && (
                          <button
                            className="demo-pay"
                            onClick={() => {
                              setTown(
                                (t) =>
                                  t && {
                                    ...t,
                                    items: t.items.map((item) =>
                                      item.id === i.id &&
                                      item.building_id === building.id
                                        ? {
                                            ...item,
                                            state: "fixed",
                                            evidence: "Sample payment receipt",
                                            updated_at: new Date(
                                              now,
                                            ).toISOString(),
                                          }
                                        : item,
                                    ),
                                  },
                              );
                              closePanel();
                              setToolsOpen(false);
                            }}
                          >
                            Simulate payment
                          </button>
                        )}
                      </div>
                    ))}
                  {!pending.some((i) => i.building_id === building.id) && (
                    <p className="empty">
                      {building.boarded
                        ? "Boarded up until its app is connected."
                        : "No open items at this building."}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h2>Town ledger</h2>
                  <div className="stats">
                    <div>
                      <b>{town?.buildings.length ?? "—"}</b>
                      <small>Buildings</small>
                    </div>
                    <div>
                      <b>{town ? pending.length : "—"}</b>
                      <small>Open items</small>
                    </div>
                  </div>
                  <div className="sectiontitle">
                    <h3>Needs attention</h3>
                    <span>{overdue.length}</span>
                  </div>
                  {overdue.map((i) => {
                    const b = town!.buildings.find(
                      (b) => b.id === i.building_id,
                    );
                    return (
                      b && (
                        <button
                          className="issue"
                          key={i.id}
                          onClick={() => inspect(b.id)}
                        >
                          <span
                            className="spot"
                            style={{ background: colors[b.district] }}
                          />
                          <span>
                            <strong>{b.entity}</strong>
                            <small>{i.title}</small>
                            <em>{overdueDays(i, now)}d overdue</em>
                          </span>
                          <Icon name="arrow" size={14} />
                        </button>
                      )
                    );
                  })}
                  {town && !overdue.length && (
                    <p className="empty">No overdue items in this town.</p>
                  )}
                </>
              )}
            </PanelPaper>
          </aside>
        )}
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
