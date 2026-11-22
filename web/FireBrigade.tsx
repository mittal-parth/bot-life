import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Building, TownSnapshot } from "../shared/town.ts";
import { buildingHealth } from "./health.ts";

import {
  bay,
  planResponse,
  along,
  distance,
  type Point,
} from "./dispatchRoute.ts";
import { fireOrigin } from "./BuildingFire.tsx";

// Project a truck-space point onto the map. Heading rotates the chassis on
// the ground plane while the body, ladder and wheels remain upright.
const Engine = memo(function Engine({ heading = 0 }: { heading?: number }) {
  const cos = Math.cos(heading),
    sin = Math.sin(heading);
  function point(x: number, y: number, z: number): Point {
    const u = x * cos - y * sin,
      v = x * sin + y * cos;
    return [u - v, (u + v) * 0.5 - z];
  }
  const pts = (corners: number[][]) =>
    corners.map(([x, y, z]) => point(x, y, z).join(",")).join(" ");

  const front = cos + sin >= 0 ? 1 : -1;
  const visibleY = cos - sin >= 0 ? 1 : -1;
  function box(
    x: number,
    X: number,
    y: number,
    Y: number,
    z: number,
    Z: number,
    colors: string[],
  ) {
    const end = front > 0 ? X : x,
      flank = visibleY > 0 ? Y : y;
    return (
      <g>
        <polygon
          points={pts([
            [x, flank, z],
            [X, flank, z],
            [X, flank, Z],
            [x, flank, Z],
          ])}
          fill={colors[0]}
        />
        <polygon
          points={pts([
            [end, y, z],
            [end, Y, z],
            [end, Y, Z],
            [end, y, Z],
          ])}
          fill={colors[1]}
        />
        <polygon
          points={pts([
            [x, y, Z],
            [X, y, Z],
            [X, Y, Z],
            [x, Y, Z],
          ])}
          fill={colors[2]}
        />
      </g>
    );
  }
  const body = box(-12, 4, -4, 4, 2, 10, ["#b64f38", "#964532", "#edd6ab"]);
  const cab = box(4, 12, -4, 4, 2, 10, ["#d86448", "#b6503c", "#dbaa75"]);
  const panelY = visibleY * 4.04;
  return (
    <g stroke="#524b3e" strokeLinejoin="round" strokeWidth=".65">
      <ellipse rx="15" ry="4" opacity=".18" fill="#554530" stroke="none" />
      {front > 0 ? (
        <>
          {body}
          {cab}
        </>
      ) : (
        <>
          {cab}
          {body}
        </>
      )}
      <polygon
        points={pts([
          [6, panelY, 6],
          [10, panelY, 6],
          [10, panelY, 9],
          [6, panelY, 9],
        ])}
        fill="#b9d3cf"
      />
      {front > 0 && (
        <polygon
          points={pts([
            [12, -3, 6],
            [12, 3, 6],
            [12, 3, 9],
            [12, -3, 9],
          ])}
          fill="#aec9ce"
        />
      )}
      {[4, 6, 8].map((z) => (
        <polyline
          key={z}
          points={pts([
            [-10, panelY, z],
            [1, panelY, z],
          ])}
          stroke="#ebcea6"
        />
      ))}
      {[-1.8, 1.8].map((y) => (
        <polyline
          key={y}
          points={pts([
            [-11, y, 11],
            [4, y, 11],
          ])}
          stroke="#667273"
        />
      ))}
      {[-9, -6, -3, 0, 3].map((x) => (
        <polyline
          key={x}
          points={pts([
            [x, -2, 11],
            [x, 2, 11],
          ])}
          stroke="#667273"
        />
      ))}
      {[-8, 8].map((x) => {
        const [cx, cy] = point(x, panelY, 2);
        return (
          <g key={x}>
            <ellipse cx={cx} cy={cy} rx="2.2" ry="2.8" fill="#414338" />
            <circle cx={cx} cy={cy} r=".95" fill="#c3bcb0" />
          </g>
        );
      })}
      {box(7, 9, -2, 2, 10, 12, ["#64a0ab", "#557f8f", "#b8e1dc"])}
    </g>
  );
});
type Call = { building: Building; from: "fire" | "smoking"; key: string };

export function useDispatch(town: TownSnapshot, now: number) {
  const previous = useRef(town);
  const [queue, setQueue] = useState<Call[]>([]);
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = town;
    if (before === town) return;
    const calls: Call[] = [];
    for (const b of town.buildings) {
      const prior = before.items.filter((i) => i.building_id === b.id);
      const items = town.items.filter((i) => i.building_id === b.id);
      const from = buildingHealth(prior, now),
        health = buildingHealth(items, now);
      if (
        (from !== "fire" && from !== "smoking") ||
        from === health ||
        health === "fire"
      )
        continue;
      const fixed = items.find(
        (i) =>
          i.state === "fixed" &&
          i.evidence &&
          prior.some((old) => old.id === i.id && old.state !== "fixed"),
      );
      if (fixed)
        calls.push({
          building: b,
          from,
          key: b.id + fixed.id + fixed.updated_at,
        });
    }
    if (calls.length) setQueue((current) => [...current, ...calls]);
  }, [town, now]);
  const active = queue[0];
  const [extinguished, setExtinguished] = useState<string>();
  useEffect(() => {
    if (!active) return;
    const route = planResponse(active.building);
    const quench = setTimeout(() => setExtinguished(active.key), route.dry);
    const timer = setTimeout(
      () => setQueue((q) => q.slice(1)),
      route.total,
    );
    return () => {
      clearTimeout(timer);
      clearTimeout(quench);
    };
  }, [active]);
  return { active, queue, extinguished };
}

function Firehouse() {
  return (
    <g
      transform="translate(145 137)"
      stroke="#574c40"
      strokeWidth=".85"
      strokeLinejoin="round"
    >
      <title>Fire station</title>
      <path d="m-36 2 26-14 72 36-27 14z" fill="#d9ccb5" />
      <path d="m-29-31 20-10 35 17v31L6 17-29 0z" fill="#ad5946" />
      <path d="m6-14 20-10V7L6 17z" fill="#e7bc8f" />
      <path d="m-32-32 23-12 38 19-22 13z" fill="#6f7770" />
      <path d="m-31-32 38 19 21-11v3L7-10-31-29z" fill="#efd6ae" />
      <path d="m9 13V-4l14-7V6z" fill="#423e35" />
      <path d="m8-4 16-8m-16 10 16-8" stroke="#bfab90" />
      <path d="m-26-24 27 13v7l-27-13z" fill="#f7e4bd" />
      <text
        transform="matrix(1 .47 0 1 -23 -18)"
        stroke="none"
        fill="#754133"
        fontFamily="Georgia,serif"
        fontSize="5"
        fontWeight="bold"
      >
        FIRE CO.
      </text>
      {[-24, -13, -2].map((x) => (
        <path
          key={x}
          d={`M${x} ${-11 + (x + 24) * 0.47}l6 3v7l-6-3z`}
          fill="#a4bebd"
        />
      ))}
      <path d="m-12-37 6-3 7 3-6 3z" fill="#caa77a" />
      <path d="m-11-37 1-9 4-2 5 3v9l-5 2z" fill="#b47452" />
      <path d="m-13-46 7-5 7 5-7 3z" fill="#5f6d65" />
    </g>
  );
}
function Firefighter() {
  return (
    <g stroke="#514b40" strokeWidth=".7">
      <path d="m-2 0 .6-4m2.3 4-.6-4" strokeWidth="1.7" />
      <path d="m-2.2-4 .5-4h3.2l.8 4z" fill="#506369" />
      <path d="m-2-5 4 .1" stroke="#e8c55e" />
      <circle cy="-9" r="2" fill="#ce9870" />
      <path d="M-3-10q.2-4 4-2l1 2z" fill="#dcc064" />
    </g>
  );
}
function ResponseScene({ building }: { building: Building }) {
  const route = useMemo(() => planResponse(building), [building]);
  const [time, setTime] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    function tick(now: number) {
      setTime(Math.min(now - start, route.total));
      if (now - start < route.total) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [route]);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const returning = time >= route.depart;
  const progress = returning
    ? 1 - clamp((time - route.depart) / route.travel)
    : clamp((time - route.rollout) / route.travel);
  let remaining =
    (reduced ? (time < route.arrival || returning ? 0 : 1) : progress) *
    route.length;
  let pos: Point = bay,
    heading = 0;
  for (let i = 1; i < route.path.length; i++) {
    const a = route.path[i - 1],
      b = route.path[i],
      length = distance(a, b);
    if (remaining > length && i < route.path.length - 1) {
      remaining -= length;
      continue;
    }
    pos = along(a, b, clamp(remaining / length));
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    // The driver backs along the short final driveway into the original bay.
    heading =
      Math.atan2(dy - dx / 2, dy + dx / 2) + (returning && i > 1 ? Math.PI : 0);
    break;
  }
  const walking = time >= route.arrival && time < route.depart;
  const fraction =
    time < route.dry
      ? clamp((time - route.arrival) / route.walk)
      : 1 - clamp((time - route.dry - 600) / route.walk);
  const crew = along(route.curb, route.approach, reduced ? 1 : fraction);
  const spraying = time >= route.water && time < route.dry;
  const origin = fireOrigin(building.kind);
  const tx = route.target[0] + origin.x * 0.82,
    ty = route.target[1] + origin.y * 0.82;
  const stream = `M${crew[0]} ${crew[1] - 6} Q${(crew[0] + tx) / 2} ${Math.min(crew[1] - 10, ty - 14)} ${tx} ${ty}`;
  return (
    <g>
      <g className="brigade-engine" transform={`translate(${pos}) scale(.82)`}>
        <Engine heading={heading} />
      </g>
      {walking && (
        <g>
          <path
            d={`M${route.curb} Q${(crew[0] + route.curb[0]) / 2 + 2} ${(crew[1] + route.curb[1]) / 2 + 4} ${crew}`}
            stroke="#64767a"
            strokeWidth="1.4"
            fill="none"
          />
          <g transform={`translate(${crew}) scale(.85)`}>
            <Firefighter />
          </g>
        </g>
      )}
      {spraying && (
        <g fill="none" strokeLinecap="round">
          <path d={stream} stroke="#78b7cb" strokeWidth="2.3" />
          <path
            className="brigade-spray"
            d={stream}
            stroke="#e7f9fc"
            strokeWidth="1.1"
            strokeDasharray="2 3"
          />
        </g>
      )}
    </g>
  );
}
export function StationScene({ call }: { call?: Call }) {
  return (
    <g pointerEvents="none">
      <path d="M157 145L204 169" stroke="#b9aa91" strokeWidth="12" />
      <path d="M157 145L204 169" stroke="#e3d7c3" strokeWidth="10" />
      <Firehouse />
      {call ? (
        <ResponseScene key={call.key} building={call.building} />
      ) : (
        <g transform={`translate(${bay[0]} ${bay[1]}) scale(.82)`}>
          <Engine />
        </g>
      )}
    </g>
  );
}
