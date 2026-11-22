import { PanelPaper } from "./PanelPaper.tsx";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DrawablyButton, DrawablyTextarea } from "drawably/react";
import type { TownSnapshot } from "../shared/town.ts";
import { origins } from "./dispatchRoute.ts";
import { MarketStall } from "./Fairground.tsx";
import { Resident } from "./StreetLife.tsx";
import "./IslandLandmarks.css";

export type LandmarkPlace =
  "cricket" | "temple" | "gallery" | "github" | "gmail";

function Place({
  x,
  y,
  label,
  open,
  children,
  hitBox = [-46, -36, 92, 61],
}: {
  x: number;
  y: number;
  label: string;
  open: () => void;
  children: ReactNode;
  hitBox?: [number, number, number, number];
}) {
  return (
    <g
      className="island-place"
      transform={`translate(${x} ${y})`}
      tabIndex={0}
      role="button"
      aria-label={label}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
    >
      <title>{label}</title>
      {children}
      <rect
        x={hitBox[0]}
        y={hitBox[1]}
        width={hitBox[2]}
        height={hitBox[3]}
        fill="transparent"
        stroke="none"
        pointerEvents="all"
      />
    </g>
  );
}

function Plinth({ turf = "#c5cea1" }: { turf?: string }) {
  return (
    <g>
      <path
        d="m-45 3 43-21 48 20-43 23Z"
        fill="#776b54"
        opacity=".16"
        stroke="none"
      />
      <path d="m-45-1 42-21 48 21-43 22Z" fill={turf} />
      <path d="m-45-1 47 22v3L-45 2Z" fill="#d5bf95" />
      <path d="m2 21 43-22v3L2 24Z" fill="#b9a480" />
    </g>
  );
}

function Cow({ calf = false }: { calf?: boolean }) {
  return (
    <g strokeWidth=".57" fill={calf ? "#bc8965" : "#f4e7ce"}>
      <ellipse cy="1" rx="8" ry="2" fill="#88916c" opacity=".4" stroke="none" />
      <path d="m-5-4 1 5h1l.5-5m4 .5L2 2h1l1-6" fill="#c5ad8f" />
      <path d="M-7-6q1-3 6-2 3-4 5-.4l2 2-.6 3-2 .8L3 2H1.8l.3-4.8-6 .1L-5 1h-1L-6-3Z" />
      <path
        className="meadow-tail"
        d="M-6.7-6.3q-2-.5-2 3.5l-.9 2m.7-1-.5 1.5"
        fill="none"
      />
      <g className="meadow-nod">
        <path d="m3-7.3 2.5-1.3L8-7l1.7 3-2 1.2-2.4-1.6-1.9-.4Z" />
        <path d="m5.5-8 1-2.1.3 2m.7.8 1.7-1.2-.7 1.6" fill="#c7a87d" />
        <path d="m5.3-7-2 .4 1.3 1.4" fill="#dbab90" />
        <circle cx="7.3" cy="-6.4" r=".42" fill="#474333" stroke="none" />
      </g>
    </g>
  );
}

function Temple() {
  return (
    <>
      <Plinth />
      <path d="m-21 4 18-9 23 9-18 10Z" fill="#dfc69c" />
      <g transform="translate(-7 0)">
        <path d="m-14-3 15-7 14 6V3L0 10l-14-6Z" fill="#f2d5a5" />
        <path d="m0 3 15-7V3L0 10Z" fill="#bc8464" />
        <path d="m-7 6 .1-6q2-5 4 1v6" fill="#594a41" />
        {Array.from({ length: 5 }, (_, i) => (
          <g
            key={i}
            transform={`translate(0 ${-i * 4.2 - 4}) scale(${1 - i * 0.15} 1)`}
          >
            <path d="m-13 0 13-6 13 6L0 6Z" fill="#ebbc7e" />
            <path d="m-13 0 13 6 13-6-1 2L0 8-12 2Z" fill="#bf7055" />
            {[-8, -4, 0, 4, 8].map((v) => (
              <path
                key={v}
                d={`M${v - 1} ${4 - Math.abs(v) * 0.44}q0-3 1.1-3t1.1 3`}
                fill="#fff0c6"
                strokeWidth=".45"
              />
            ))}
          </g>
        ))}
        <path d="m-2.6-24q2.5-4 5.2 0l-2.6 1.7Z" fill="#c99948" />
        <path d="M0-25v-11" fill="none" />
        <path
          className="temple-pennant"
          d="M.4-35q3-1 7 .7l-7 3Z"
          fill="#dc7845"
        />
        <path
          d="m-9 7 6 2.6-6 3-6-2.8Zm-3 3 5.5 2.5-4 2-6-2.5Z"
          fill="#e8d1a7"
        />
      </g>
      <g transform="translate(17 -4) scale(.83)">
        <Cow />
      </g>
      <g transform="translate(24 1) scale(-.54 .54)">
        <Cow calf />
      </g>
      {[-28, -22, 7, 14].map((x, i) => (
        <g
          key={x}
          transform={`translate(${x} ${i < 2 ? 0 - i * 1.8 : 11 - (i - 2) * 3})`}
        >
          <path d="m-1 0 2 1 2-1" fill="none" stroke="#789060" />
          <circle cy="-1" r="1" fill="#dfa455" />
        </g>
      ))}
      <g transform="translate(-21 6) scale(.64)">
        <Resident variant={2} />
      </g>
    </>
  );
}

function Bazaar() {
  return (
    <>
      <Plinth turf="#e6d3b2" />
      <path
        d="m-34 0 29-15m-20 23L15-13M-12 13 36-9"
        stroke="#c9b695"
        strokeDasharray="2 3"
      />
      <g transform="translate(12 -7) scale(.85)">
        <MarketStall color="#4d9186" />
      </g>
      <g transform="translate(-8 -1)">
        <MarketStall color="#cb6c51" />
      </g>
      <g transform="translate(-22 8) scale(.68)">
        <Resident variant={3} />
      </g>
      <g transform="translate(7 9) scale(.72)">
        <Resident variant={0} />
      </g>
      <g transform="translate(16 5)">
        <path d="m-4 0 5-2 5 2-5 3Z" fill="#ccaa73" />
        <path d="m-4 0 5 3v4l-5-3Z" fill="#ba8760" />
        <path d="M-3 2v-9h6v9Z" fill="#fff0d0" />
        <path d="M-2-3l1-2 1 1 1-2 1 2v2Z" fill="#7eab9b" />
      </g>
      <path d="M-35-1v-17q18 11 39 9v16" fill="none" />
      {["#da8657", "#e5bd5f", "#80a68e", "#d68f89", "#e5bd5f"].map(
        (color, i) => (
          <path
            key={i}
            d={`m${-33 + i * 7} ${-17 + i * (2.8 - i * 0.22)} 4 1-2 3Z`}
            fill={color}
            strokeWidth=".45"
          />
        ),
      )}
    </>
  );
}

function Counter({
  count,
  connected,
  x,
  y,
}: {
  count: number;
  connected: boolean;
  x: number;
  y: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`} strokeWidth=".85">
      <rect
        x="-6.5"
        y="-5"
        width="13"
        height="9"
        rx="4.3"
        fill={connected ? "#497b69" : "#faf1db"}
      />
      {connected ? (
        <text
          y="1.7"
          textAnchor="middle"
          fill="white"
          stroke="none"
          fontWeight="700"
          fontFamily="system-ui"
          fontSize="6"
        >
          {count > 99 ? "99+" : count}
        </text>
      ) : (
        <path d="M-2-1h4M0-3v4" stroke="#5a5b4b" strokeWidth="1.2" />
      )}
    </g>
  );
}

function Headquarters({
  count,
  connected,
}: {
  count: number;
  connected: boolean;
}) {
  return (
    <>
      <Plinth turf="#c8cfb6" />
      <path d="m-22-21 24-11 23 10-23 12Z" fill="#e9e5d3" />
      <path d="m-22-21 24 11V8L-22-3Z" fill="#a8b8ad" />
      <path d="m2-10 23-12v18L2 8Z" fill="#82968f" />
      {[-18, -12, -6].map((x) => (
        <g key={x} transform={`translate(${x} ${(x + 22) * 0.46 - 16})`}>
          <path d="m0 0 3.6 1.6v4L0 4Z" fill="#e9d5a4" />
          <path d="m0 6 3.6 1.6v4L0 10Z" fill="#bad2ce" />
        </g>
      ))}
      <path d="m6-9 6-3v12L6 3Z" fill="#435b58" />
      <path d="m14-13 8-4v4l-8 4Z" fill="#d4e2d4" />
      <g transform="translate(0 -24)">
        <path
          d="M-6 1v-7m0 4q5 2 6-3"
          fill="none"
          strokeWidth="1.4"
          stroke="#565c55"
        />
        {[
          [0, -5],
          [-6, -6],
          [-6, 1],
        ].map(([x, y]) => (
          <circle key={x + "," + y} cx={x} cy={y} r="1.35" fill="#f0da9b" />
        ))}
      </g>
      <g transform="translate(0 11)">
        <path d="M-12 0v5m23-6v5" fill="none" />
        <rect x="-13" y="-5" width="26" height="6.7" rx=".8" fill="#fbedd0" />
        <text
          y="0"
          textAnchor="middle"
          fontFamily="system-ui"
          fontWeight="bold"
          fontSize="4.7"
          fill="#454b42"
          stroke="none"
        >
          GitHub HQ
        </text>
      </g>
      <Counter count={count} connected={connected} x={25} y={-27} />
    </>
  );
}

function Cricket({ board, open }: { board: string; open: () => void }) {
  return (
    <Place
      x={630}
      y={371}
      open={open}
      label={`Cricket ground · ${board} · View match scores`}
    >
      <ellipse cy="4" rx="47" ry="22" fill="#c9aa83" />
      <ellipse rx="47" ry="22" fill="#ead2a3" />
      <ellipse rx="43" ry="19" fill="#acc78d" />
      <ellipse
        rx="39"
        ry="16.4"
        stroke="#f7edce"
        fill="none"
        strokeDasharray="2 .7"
      />
      <path d="M-43-7q18-23 58-15v6Q-13-23-40-3Z" fill="#ce8c70" />
      {Array.from({ length: 22 }, (_, i) => {
        const a = ((199 + i * 3.95) * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={Math.cos(a) * 43}
            cy={Math.sin(a) * 20 - 3 - (i % 2) * 1.5}
            r="1.2"
            fill={["#70888b", "#f0ce89", "#cb8d76", "#f8e4bd"][i % 4]}
            strokeWidth=".35"
          />
        );
      })}
      <path d="M-43-7v-5q20-21 58-15v5q-33-8-58 15Z" fill="#739487" />
      <path d="m-14 4 22-11 6 4L-9 8Z" fill="#dabb87" />
      <path d="m-10 2 6 3M6-5l5 3" stroke="#f8e8ba" />
      {[-10, 10].map((x) => (
        <path
          key={x}
          d={`m${x} ${-x * 0.46}v-3m1 2.5v-3m1 2.5v-3`}
          stroke="#a06b49"
          strokeWidth=".64"
        />
      ))}
      {[
        [-14, 8],
        [12, -2],
        [28, 2],
        [-26, -2],
        [4, 12],
      ].map(([x, y], i) => (
        <g key={x} transform={`translate(${x} ${y}) scale(.42)`}>
          <Resident variant={i} />
        </g>
      ))}
      <path d="M-15 18v9m30-9v9" fill="none" />
      <rect x="-18" y="15" width="36" height="9.5" rx="1" fill="#435b50" />
      <text
        x="0"
        y="21.6"
        fill="#ffefd2"
        textAnchor="middle"
        fontSize="5.6"
        fontFamily="monospace"
        fontWeight="bold"
        stroke="none"
        aria-live="polite"
      >
        {board}
      </text>
    </Place>
  );
}

function Cloud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      pointerEvents="none"
      aria-hidden="true"
    >
      <g className="island-cloud">
        <path
          d="M-21 2q-3-5 4-6 1-6 8-5 5-9 13-3 5-2 8 4 9-1 10 6 6 1 2 4-10 3-22 1-12 3-23-1Z"
          fill="#fffaf0"
          stroke="#cfc7af"
          strokeWidth=".8"
        />
        <path d="M-14 3q6 1 10 0m12 0 7-.6" stroke="#dbd6c3" fill="none" />
      </g>
    </g>
  );
}

interface LandmarkProps {
  cricketBoard: string;
  town: TownSnapshot;
  onOpen: (place: LandmarkPlace) => void;
  mailUnread?: number;
  githubUnread?: number;
  mailConnected?: boolean;
  githubConnected?: boolean;
  previewMailFlight?: number;
  mailEventKey?: string | number | null;
}

export function IslandLandmarks({
  cricketBoard,
  town,
  onOpen,
  mailUnread = 0,
  githubUnread = 0,
  mailConnected = false,
  githubConnected = false,
  mailEventKey,
  previewMailFlight = 0,
}: LandmarkProps) {
  const previous = useRef({ mailEventKey, mailConnected, mailUnread });
  const [flight, setFlight] = useState(0);
  const previousPreview = useRef(previewMailFlight);
  useEffect(() => {
    if (previewMailFlight !== previousPreview.current) setFlight((n) => n + 1);
    previousPreview.current = previewMailFlight;
  }, [previewMailFlight]);
  const post = town.buildings.find((b) => b.kind === "post-office");
  const [ox, oy] = post ? origins[post.district] : [0, 0];
  const postX = post ? ox + (post.plot.x - post.plot.y) * 18 : 0;
  const postY = post ? oy + (post.plot.x + post.plot.y + 1.3) * 9 : 0;
  useEffect(() => {
    const last = previous.current;
    if (
      mailConnected &&
      last.mailConnected &&
      (mailUnread > last.mailUnread ||
        (mailEventKey != null && last.mailEventKey !== mailEventKey))
    ) {
      setFlight((n) => n + 1);
    }
    previous.current = { mailEventKey, mailConnected, mailUnread };
  }, [mailEventKey, mailConnected, mailUnread]);
  return (
    <g
      stroke="#555348"
      strokeWidth=".8"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <Cloud x={292} y={55} scale={0.74} />
      <Cloud x={548} y={43} />
      <Place
        x={215}
        y={80}
        label="Temple garden · Write a reflection"
        open={() => onOpen("temple")}
      >
        <Temple />
      </Place>
      <Place
        x={504}
        y={94}
        label={`GitHub headquarters · ${githubConnected ? githubUnread + " unread" : "Connect GitHub"}`}
        open={() => onOpen("github")}
      >
        <Headquarters count={githubUnread} connected={githubConnected} />
      </Place>
      <Place
        x={123}
        y={377}
        label="Photo bazaar · Open your gallery"
        open={() => onOpen("gallery")}
      >
        <Bazaar />
      </Place>
      <Cricket board={cricketBoard} open={() => onOpen("cricket")} />
      {post && (
        <Place
          x={postX + 11}
          y={postY - 37}
          label={`Post Office · ${mailConnected ? mailUnread + " unread" : "Connect Gmail"}`}
          hitBox={[-11, -11, 29, 18]}
          open={() => onOpen("gmail")}
        >
          <rect x="-10" y="-6" width="20" height="12" rx="2" fill="#f4e5c2" />
          <path
            d="m-8-4 8 6 8-6m-16 8 5-4m11 4-5-4"
            fill="none"
            stroke="#a7674e"
          />
          <Counter x={10} y={-5} connected={mailConnected} count={mailUnread} />
        </Place>
      )}
      {flight > 0 && post && (
        <g
          key={flight}
          className="post-flight"
          aria-hidden="true"
          pointerEvents="none"
          style={{
            offsetPath: `path("M548 46 C 590 128, ${postX - 92} ${postY - 139}, ${postX + 11} ${postY - 37}")`,
          }}
        >
          <rect x="-6" y="-4" width="12" height="8" rx="1" fill="#fff0ca" />
          <path d="m-5-3 5 4 5-4" fill="none" stroke="#aa6449" />
        </g>
      )}
    </g>
  );
}

const journalKey = "bot-life.temple-reflections.v1";
type Reflection = { date: string; text: string };
function readJournal(): Reflection[] {
  const raw: unknown = JSON.parse(localStorage.getItem(journalKey) ?? "[]");
  if (!Array.isArray(raw)) throw new Error("Invalid journal");
  return raw.filter(
    (entry): entry is Reflection =>
      typeof entry?.text === "string" && typeof entry?.date === "string",
  );
}

export function TempleReflection({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<Reflection[]>(() => {
    try {
      return readJournal();
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  return (
    <aside
      className="bot-desk temple-reflection"
      aria-label="Temple reflections"
    >
      <PanelPaper>
        <div className="desk-head">
          <h2>Temple reflections</h2>
          <button onClick={onClose} aria-label="Close temple reflections">
            ×
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            try {
              const next = [
                { date: new Date().toISOString(), text: draft.trim() },
                ...readJournal(),
              ];
              localStorage.setItem(journalKey, JSON.stringify(next));
              setEntries(next);
              setDraft("");
              setNotice("Saved on this device.");
            } catch {
              setNotice(
                "Couldn’t save on this device. Your draft is still here.",
              );
            }
          }}
        >
          <label htmlFor="temple-note">
            What would you like to remember today?
          </label>
          <DrawablyTextarea
            id="temple-note"
            value={draft}
            rows={3}
            onChange={(event) => setDraft(event.target.value)}
          />
          <DrawablyButton type="submit" disabled={!draft.trim()}>
            Save reflection
          </DrawablyButton>
          <small role="status">{notice || "Private to this browser."}</small>
        </form>
        {entries.map((entry, i) => (
          <article key={entry.date + i}>
            <time dateTime={entry.date}>
              {new Date(entry.date).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </time>
            <p>{entry.text}</p>
          </article>
        ))}
      </PanelPaper>
    </aside>
  );
}
