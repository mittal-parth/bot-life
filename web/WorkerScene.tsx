import { useEffect, useState } from "react";
import type { TownBot } from "../shared/chat.ts";
import type { Desk } from "./BotDesk.tsx";
import { homes } from "./BotDesk.tsx";
import scout from "./assets/workers/Scout.svg";
import porter from "./assets/workers/Porter.svg";
import beacon from "./assets/workers/Beacon.svg";
import scribe from "./assets/workers/Scribe.svg";

export const figures = {
  Scout: scout,
  Porter: porter,
  Beacon: beacon,
  Scribe: scribe,
};
export type Figure = keyof typeof figures;
export type Assignment = { id: string; at: number; web: boolean };
type Point = readonly [number, number];
const travel = 3200;
function interpolate(a: Point, b: Point, t: number): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function onRoute(path: Point[], t: number): Point {
  const legs = path
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
  let left = Math.min(1, Math.max(0, t)) * legs.reduce((sum, n) => sum + n, 0);
  for (const [i, length] of legs.entries()) {
    if (left <= length && length > 0)
      return interpolate(path[i], path[i + 1], left / length);
    left -= length;
  }
  return path[path.length - 1];
}
function Worker({
  b,
  desk,
  i,
  unread,
}: {
  b: TownBot;
  desk: Desk;
  i: number;
  unread: number;
}) {
  const home = desk.homeOf(b),
    [hx, hy] = homes[home];
  const origin: Point = [hx + (i % 4) * 15, hy + Math.floor(i / 4) * 13];
  const job = desk.jobs[b.id];
  const user =
    job && b.messages.find((m) => m.role === "user" && m.sendId === job.id);
  const events = user ? b.messages.filter((m) => m.requestId === user.id) : [];
  const result = events.findLast((m) => m.finishedAt);
  const lookup = events.find((m) => m.web);

  const attention = events.some((m) => m.kind === "card") && !result;
  const island = job?.web || !!lookup;
  const depart = job?.at ?? 0;
  const end = result?.finishedAt;
  const [now, setNow] = useState(Date.now);
  const returnAt =
    end &&
    Math.max(
      end,
      depart + travel + 600,
      (lookup?.at ?? 0) + (job?.web ? 0 : travel) + 600,
    );
  useEffect(() => {
    if (!job) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (returnAt && t >= returnAt + travel) clearInterval(timer);
    }, 45);
    return () => clearInterval(timer);
  }, [job?.id, returnAt]);
  const p = job ? Math.min(1, Math.max(0, (now - depart) / travel)) : 0;
  const back = returnAt
    ? Math.min(1, Math.max(0, (now - returnAt) / travel))
    : 0;
  const dock: Point = [555, 167],
    station: Point = [612 + (i % 3) * 5, 86];
  const junction: Point = [379, 258];
  const via =
    home === "East promenade"
      ? [origin, [558, 258] as Point]
      : [origin, junction];
  const route = [...via, dock, ...(island ? [station] : [])];
  let point = onRoute(route, p * (1 - back));
  if (lookup && !job?.web && !back) {
    const change = Math.min(
      1,
      Math.max(0, ((lookup.at ?? depart) - depart) / travel),
    );
    point = onRoute([...via, dock], p);
    if (now >= (lookup.at ?? depart))
      point = onRoute(
        [onRoute([...via, dock], change), dock, station],
        (now - (lookup.at ?? depart)) / travel,
      );
  }
  const returning = !!returnAt && now >= returnAt;
  const done = returning && back >= 1;
  const searching = !!lookup && !end;
  const status = !job
    ? ""
    : done
      ? result?.failed
        ? "Needs attention"
        : "Answer ready"
      : returning
        ? "Returning"
        : attention
          ? "Needs attention"
          : searching
            ? "Searching the web"
            : p < 1
              ? "Dispatched"
              : "Working";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) point = done || !job ? origin : route[route.length - 1];
  const [x, y] = point;
  const figure = desk.figureOf(b);
  return (
    <g
      data-worker={b.id}
      data-phase={status}
      transform={`translate(${x} ${y})`}
    >
      {job && island && !done && (
        <g
          pointerEvents="none"
          transform={`translate(${station[0] - x} ${station[1] - y})`}
        >
          <ellipse
            className="island-signal"
            rx="10"
            ry="4"
            fill="none"
            stroke="#497d76"
            strokeDasharray="3 2"
          />
          {searching && (
            <path
              className="island-signal"
              d="M4-8q8-3 5-10m-3 12q13-4 9-15"
              stroke="#407269"
              fill="none"
            />
          )}
        </g>
      )}
      <g
        role="button"
        tabIndex={0}
        className="courier"
        aria-label={`Talk to ${b.name} at ${home}${unread ? " · " + unread + " unread deliveries" : ""}${status ? " · " + status : ""}`}
        onClick={() => desk.enter(b.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            desk.enter(b.id);
          }
        }}
      >
        <title>
          {b.name}
          {status ? " · " + status : ""}
        </title>
        <rect x="-12" y="-32" width="24" height="36" fill="transparent" />
        <image href={figures[figure]} x="-12" y="-23" width="24" height="31" />
        {unread > 0 && (
          <g transform="translate(10 -22)" aria-hidden="true">
            <circle r="5.5" fill="#a93930" stroke="#fff4dc" strokeWidth=".8" />
            <text y="1.8" textAnchor="middle" fill="#fff" fontSize="5">
              {unread > 99 ? "99+" : unread}
            </text>
          </g>
        )}
        {returning && !done && !result?.failed && (
          <g
            transform="translate(7 -7) rotate(-12)"
            stroke="#625a47"
            strokeWidth=".7"
          >
            <rect x="-4" y="-5" width="8" height="8" rx=".6" fill="#fff0c7" />
            <path d="M-2-3h4m-4 2h3" stroke="#678677" />
          </g>
        )}
        {status && (
          <g transform="translate(0 -28)" strokeLinejoin="round">
            <path
              d="M-6-5q0-2 2-2h8q2 0 2 2v6q0 2-2 2H1l-2 3-1-3h-2q-2 0-2-2z"
              stroke="#514c42"
              strokeWidth=".7"
              fill={done && !result?.failed ? "#b8dfaa" : "#fff2ce"}
            />
            <path
              d={
                done && !result?.failed
                  ? "m-3-2 2 2 4-5"
                  : attention || result?.failed
                    ? "M0-5v3m0 1v1"
                    : searching
                      ? "M1-1l2 2M1-3a2 2 0 1 0-4 0 2 2 0 0 0 4 0"
                      : "M-3-2h6m-2-2 2 2-2 2"
              }
              stroke="#37594c"
              fill="none"
              strokeWidth="1.3"
            />
          </g>
        )}
      </g>
    </g>
  );
}
export function IslandReceiver({ desk }: { desk: Desk }) {
  const active = desk.bots.some((b) => {
    const job = desk.jobs[b.id];
    const user = job && b.messages.find((m) => m.sendId === job.id);
    if (!user) return false;
    const events = b.messages.filter((m) => m.requestId === user.id);
    return events.some((m) => m.web) && !events.some((m) => m.finishedAt);
  });
  return (
    <g
      transform="translate(-3 4)"
      stroke="#514b3d"
      strokeWidth=".75"
      strokeLinejoin="round"
    >
      <title>Island receiving station</title>
      <path d="m-1 1 8-4 6 3-8 4z" fill="#8a9b9b" />
      <path d="m-1 1 6 3v-9l-6-3z" fill="#71988c" />
      <path d="m5 4 8-4v-9L5-5z" fill="#aac4b2" />
      <path d="m-1-8 8-4 6 3-8 4z" fill="#e1d6ba" />
      <path d="m6-4 6-3v3l-6 3z" fill="#304e4a" />
      <path
        className={active ? "relay-paper" : undefined}
        d="m7-6 4-2v-5l-4 2z"
        fill="#fff5d6"
      />
      <circle cx="1.2" cy="-4" r="1.1" fill={active ? "#fad963" : "#a4c487"} />
    </g>
  );
}
export function TownCouriers({
  desk,
  unread,
}: {
  desk: Desk;
  unread: Record<string, number>;
}) {
  return (
    <>
      {desk.bots.map((b) => (
        <Worker
          key={b.id}
          unread={unread[b.id] ?? 0}
          b={b}
          desk={desk}
          i={desk.bots
            .filter((o) => desk.homeOf(o) === desk.homeOf(b))
            .findIndex((o) => o.id === b.id)}
        />
      ))}
    </>
  );
}
