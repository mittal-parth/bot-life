import type { ReactNode } from "react";
import { BuildingArt, Tree } from "./Illustrations.tsx";
import type { Building, District, TownSnapshot } from "../shared/town.ts";
import { buildingHealth, type Health } from "./health.ts";

import {
  Airship,
  Boulevards,
  Streetcar,
  Bunting,
  Parade,
  Resident,
} from "./StreetLife.tsx";
import { FerrisWheel, MarketStall, FairStyles } from "./Fairground.tsx";
import { Windmill, FlowerBed, Bandstand, Bench } from "./GardenArt.tsx";
import { Harbor } from "./Harbor.tsx";

export const districts: District[] = ["work", "money", "people", "paperwork"];
export const colors = {
  work: "#d9b34d",
  money: "#72a78c",
  people: "#cf8d88",
  paperwork: "#9c92b8",
};
const origins = {
  work: [380, 82],
  money: [202, 173],
  people: [558, 173],
  paperwork: [380, 264],
};
const terrain = {
  work: "#d5d6b7",
  money: "#cad7ad",
  people: "#d4dcb0",
  paperwork: "#d7d4bf",
};
const ink = "#555348";
const px = (u: number, v: number) => (u - v) * 18;
const py = (u: number, v: number) => (u + v) * 9;
function quad(u: number, v: number, w: number, h: number) {
  return [
    [u, v],
    [u + w, v],
    [u + w, v + h],
    [u, v + h],
  ]
    .map(([a, b]) => px(a, b) + "," + py(a, b))
    .join(" ");
}
function Fountain() {
  return (
    <g stroke={ink} strokeWidth=".8">
      <ellipse cy="0" rx="17" ry="6" fill="#c4ba9f" />
      <ellipse cy="-2" rx="16" ry="5" fill="#9bc6d3" />
      <path d="M-3 -3 L-1 -14 H1 L3 -3Z" fill="#efdfba" />
      <ellipse cy="-13" rx="6" ry="2.4" fill="#c4d9d2" />
      <path
        d="M0 -14q-4 -10 -8 5m8 -5q4 -10 8 5"
        fill="none"
        stroke="#8fbac5"
      />
    </g>
  );
}
function Lamp() {
  return (
    <g stroke={ink} strokeWidth="1.2">
      <path d="M0 0v-11m-2 11h4" />
      <path d="M-2 -15h4l-1 4h-2z" fill="#efd594" />
      <path d="m-3 -15 3 -3 3 3" fill={ink} />
    </g>
  );
}
function Overlay({ state }: { state: Health }) {
  if (state === "smoking" || state === "fire")
    return (
      <g pointerEvents="none">
        <g className="smoke" fill="#77796f" opacity=".63">
          <circle cx="9" cy="-50" r="5" />
          <circle cx="11" cy="-59" r="7" />
          <circle cx="16" cy="-69" r="8" />
          <circle cx="22" cy="-81" r="6" opacity=".6" />
        </g>
        {state === "fire" && (
          <path
            d="M4 -34 Q-3 -40 5 -48 Q4 -42 8 -44 Q7 -52 13 -57 Q10 -48 15 -46 Q20 -50 18 -52 Q23 -39 14 -33Z"
            fill="#e47d45"
            stroke="#ae583a"
          />
        )}
      </g>
    );
  if (state === "cracked")
    return (
      <path
        d="m2 -21 -3 4 4 2 -4 5"
        stroke={ink}
        fill="none"
        strokeWidth="1.4"
      />
    );
  if (state === "snoozed")
    return (
      <g stroke="#927a54" strokeWidth="1.6" fill="none">
        <path d="M-20 -29v25m14 -18v24m12 -19V6m-28 -28 30 14m-30 -3L8 4m-27 -25 12 21m1 -14L5 4" />
      </g>
    );
  if (state === "dusty")
    return (
      <g fill="#a98958">
        <circle cx="-9" cy="-9" r="1.5" />
        <circle cx="-6" cy="-6" r="1" />
        <circle cx="-13" cy="-8" r="1" />
      </g>
    );
  return null;
}
const positions = [
  [0.7, 0.9],
  [7.9, 1.5],
  [1.1, 6.9],
  [6.9, 6.5],
  [2, 7.4],
  [6.7, 1.2],
  [0.8, 4.9],
  [7.9, 4.8],
  [4.7, 7.8],
  [3.1, 0.6],
  [7.6, 7.7],
  [2.7, 6.8],
];
function Slab({
  district,
  town,
  now,
  selected,
  select,
}: {
  district: District;
  town: TownSnapshot;
  now: number;
  selected?: string;
  select: (id: string) => void;
}) {
  const buildings = town.buildings.filter((b) => b.district === district);
  const [ox, oy] = origins[district];
  const sprites: { depth: number; key: string; node: ReactNode }[] = [];
  function add(u: number, v: number, key: string, node: ReactNode) {
    sprites.push({
      depth: u + v,
      key,
      node: <g transform={`translate(${px(u, v)} ${py(u, v)})`}>{node}</g>,
    });
  }
  const free = (u: number, v: number) =>
    buildings.every(
      (b) => Math.hypot(u - b.plot.x - 0.65, v - b.plot.y - 0.65) > 1.12,
    );
  const decor: [number, number, ReactNode][] = [];
  if (district === "people")
    decor.push(
      [6.8, 2.7, <FerrisWheel />],
      [1.6, 6.8, <MarketStall color="#cf6646" />],
      [3.1, 7.1, <MarketStall color="#e3b449" />],
      [2.4, 7.7, <Bunting />],
    );
  if (district === "work")
    decor.push(
      [1.5, 6.5, <Bandstand />],
      [6.6, 6.5, <FlowerBed />],
      [6.8, 7.8, <Bench />],
    );
  if (district === "money")
    decor.push(
      [1.4, 6.4, <MarketStall color="#508e85" />],
      [3.2, 6.5, <MarketStall color="#ce6246" />],
      [6.7, 2.3, <MarketStall color="#e0b049" />],
      [2, 7.7, <Bunting />],
    );
  if (district === "paperwork")
    decor.push(
      [1.8, 6.9, <Windmill />],
      [3.5, 7.6, <FlowerBed />],
      [6.8, 2.6, <Bandstand />],
      [7.5, 6.4, <FlowerBed />],
    );
  const placed = decor.filter(([u, v]) => free(u, v));
  placed.forEach(([u, v, node], i) =>
    add(
      u,
      v,
      "scene" + i,
      <g aria-hidden="true" pointerEvents="none">
        {node}
      </g>,
    ),
  );
  [
    [0.9, 3.7],
    [5.3, 1.3],
    [6.9, 7.4],
    [3, 5.2],
  ].forEach(([u, v], i) => {
    if (free(u, v))
      add(
        u,
        v,
        "neighbors" + i,
        <g aria-hidden="true" pointerEvents="none">
          <Resident variant={i} />
          <g transform="translate(5 2)">
            <Resident variant={i + 2} />
          </g>
        </g>,
      );
  });
  positions.forEach(([u, v], i) => {
    if (free(u, v) && placed.every(([a, b]) => Math.hypot(a - u, b - v) > 1.3))
      add(
        u,
        v,
        "tree" + i,
        <Tree variant={(i + districts.indexOf(district)) % 4} />,
      );
  });
  for (const [i, v] of [1.1, 3.1, 6.5, 8].entries())
    if (free(4.9, v)) add(4.9, v, "lamp" + i, <Lamp />);
  if (district === "work" && free(6.5, 5.8))
    add(6.5, 5.8, "fountain", <Fountain />);
  for (const b of buildings) {
    const items = town.items.filter((i) => i.building_id === b.id);
    const state = buildingHealth(items, now);
    const keeper = town.positions
      .filter((p) => p.building_id === b.id)
      .map((p) => p.bot)
      .join(", ");
    add(
      b.plot.x + 0.65,
      b.plot.y + 0.65,
      b.id,
      <g
        role="button"
        tabIndex={0}
        aria-label={b.entity + " · " + district}
        aria-pressed={selected === b.id}
        className="building"
        onClick={() => select(b.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            select(b.id);
          }
        }}
      >
        <title>
          {b.entity}
          {keeper ? " · " + keeper : ""}
        </title>
        <ellipse
          className="halo"
          cy="0"
          rx="27"
          ry="10"
          fill="none"
          stroke="#ac573a"
          strokeWidth="2"
          strokeDasharray="3 2"
        />
        <g transform="scale(.82)">
          <BuildingArt kind={b.kind} boarded={b.boarded} />
          <Overlay state={state} />
        </g>
        {keeper && (
          <g>
            <circle cx="18" cy="-6" r="3.3" fill="#cb925f" />
            <path d="M14 2v-5q4-3 8 0v5z" fill={colors[district]} />
          </g>
        )}
      </g>,
    );
  }
  return (
    <g transform={`translate(${ox} ${oy})`}>
      <path
        d="m-162 84 162 81 162 -81 -162 -81z"
        transform="translate(3 8)"
        fill="#b2a994"
        opacity=".2"
      />
      <path d="M-162 81 0 162v6l-162 -81z" fill="#c5bba6" stroke={ink} />
      <path d="m0 162 162 -81v6L0 168z" fill="#b8af9b" stroke={ink} />
      <polygon
        points={quad(0, 0, 9, 9)}
        fill={terrain[district]}
        stroke={ink}
        strokeWidth="1.25"
      />
      <polygon
        points={quad(0.23, 0.23, 8.54, 8.54)}
        fill="none"
        stroke="#f3e7cc"
        strokeWidth="4"
      />
      {[
        [0.5, 0.5, 3.4, 3.5],
        [5, 0.55, 3.4, 3.5],
        [0.55, 5, 3.4, 3.4],
        [5.2, 5.2, 3.2, 3.2],
      ].map(([u, v, w, h], i) => (
        <polygon
          key={i}
          points={quad(u, v, w, h)}
          fill={i % 2 ? "#bccb98" : "#e3d8bd"}
          stroke="#a6a186"
          strokeWidth=".8"
        />
      ))}
      {[
        [4.05, 0, 0.86, 9],
        [0, 4.09, 9, 0.8],
      ].map(([u, v, w, h], i) => (
        <polygon
          key={i}
          points={quad(u, v, w, h)}
          fill="#f0e8d5"
          stroke="#a69d89"
          strokeWidth=".8"
        />
      ))}
      <g
        transform="matrix(18 9 -18 9 0 0)"
        pointerEvents="none"
        aria-hidden="true"
      >
        {district === "people" && (
          <g transform="translate(4.6 0)" stroke="#f6f1cf" strokeWidth=".055">
            <rect x=".65" y="5.15" width="2.55" height="3" fill="#8fb5bc" />
            <path
              d="M.85 5.4h2.15v2.52H.85z M1.12 5.4v2.52m1.62-2.52v2.52M.85 6.66H3m-1.88-.77h1.62v1.55H1.12z"
              fill="none"
            />
          </g>
        )}
        {district === "paperwork" && (
          <g stroke="#a68e67" strokeWidth=".045">
            {Array.from({ length: 8 }, (_, i) => (
              <path key={i} d={`M.7 ${5.3 + i * 0.38}h3`} />
            ))}
          </g>
        )}
        {district === "money" && (
          <g stroke="#b09c7d" strokeWidth=".045">
            {Array.from({ length: 13 }, (_, i) => (
              <path key={i} d={`M${0.55 + i * 0.28} 5v3.45`} />
            ))}
          </g>
        )}
        {[1.3, 7.5].map((u) => (
          <g key={u} fill="#fff7e1">
            {Array.from({ length: 5 }, (_, i) => (
              <rect
                key={i}
                x={u + i * 0.1}
                y="4.16"
                width=".055"
                height=".65"
              />
            ))}
          </g>
        ))}
      </g>
      {Array.from({ length: 45 }, (_, i) => {
        const u = 0.32 + ((i * 37) % 81) / 10,
          v = 0.35 + ((i * 53) % 81) / 10;
        return (
          <path
            key={i}
            d={`M${px(u, v)} ${py(u, v)}l1 -2m0 2 2 -1`}
            stroke="#85956f"
            opacity=".65"
            strokeWidth=".7"
          />
        );
      })}
      {sprites
        .sort((a, b) => a.depth - b.depth)
        .map((s) => (
          <g key={s.key}>{s.node}</g>
        ))}
      {district === "money" && <Harbor />}
      <Parade districtIndex={districts.indexOf(district)} />
    </g>
  );
}
export function TownMap({
  town,
  now,
  selected,
  select,
  zoom,
}: {
  town: TownSnapshot;
  now: number;
  selected?: Building["id"];
  select: (id: string) => void;
  zoom: number;
}) {
  return (
    <svg
      className="town-map"
      viewBox="0 0 760 472"
      aria-label="Isometric town map"
    >
      <g transform={`translate(380 236) scale(${zoom}) translate(-380 -236)`}>
        <FairStyles />
        <Airship />
        <Boulevards />
        {districts.map((d) => (
          <Slab key={d} district={d} {...{ town, now, selected, select }} />
        ))}
        <Streetcar />
        {(
          [
            ["Work", 425, 48],
            ["Money", 111, 135],
            ["People", 649, 135],
            ["Paperwork", 380, 453],
          ] as const
        ).map(([label, x, y]) => (
          <g
            key={label}
            transform={`translate(${x} ${y})`}
            pointerEvents="none"
          >
            <rect
              x="-47"
              y="-9"
              width="94"
              height="18"
              rx="9"
              fill="#f5f1e6"
              stroke="#b5ad97"
              strokeWidth=".7"
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="Georgia, serif"
              fontStyle="italic"
              fontSize="13"
              fill={ink}
            >
              {label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
