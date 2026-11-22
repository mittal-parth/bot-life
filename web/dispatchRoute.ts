import type { Building } from "../shared/town.ts";

export type Point = [number, number];
export const bay: Point = [168, 151];
export const origins = {
  work: [380, 82],
  money: [202, 173],
  people: [558, 173],
  paperwork: [380, 264],
} as const;
const junction: Point = [379.5, 258];
const northwest: Point = [203, 168];
const northeast: Point = [555, 168];
const southwest: Point = [204, 348];
const southeast: Point = [556, 348];
const frontage = {
  work: [northwest, northeast],
  money: [northwest, southwest],
  people: [northeast, southeast],
  paperwork: [southwest, southeast],
};
export const distance = (a: Point, b: Point) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);
export const along = (a: Point, b: Point, t: number): Point => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];
function nearestCurb(point: Point, end: Point) {
  const dx = end[0] - junction[0],
    dy = end[1] - junction[1];
  const t =
    ((point[0] - junction[0]) * dx + (point[1] - junction[1]) * dy) /
    (dx * dx + dy * dy);
  return along(junction, end, Math.min(0.94, Math.max(0.08, t)));
}
export function planResponse(b: Building) {
  const [ox, oy] = origins[b.district];
  const target: Point = [
    ox + (b.plot.x - b.plot.y) * 18,
    oy + (b.plot.x + b.plot.y + 1.3) * 9,
  ];
  const options = frontage[b.district]
    .map((end) => ({ end, curb: nearestCurb(target, end) }))
    .sort((a, b) => distance(a.curb, target) - distance(b.curb, target));
  const { curb, end } = options[0];
  const path =
    end === northwest
      ? [bay, northwest, curb]
      : [bay, northwest, junction, curb];
  const length = path.slice(1).reduce((n, p, i) => n + distance(p, path[i]), 0);
  // Leave the appliance on the boulevard. The crew takes the line to the facade.
  const approach = along(
    target,
    curb,
    Math.min(0.8, 20 / Math.max(1, distance(target, curb))),
  );
  const travel = (length / 54) * 1000,
    walk = Math.max(1100, (distance(curb, approach) / 26) * 1000);
  const rollout = 550;
  const arrival = rollout + travel,
    water = arrival + walk + 350,
    dry = water + 3400,
    depart = dry + walk + 850;
  return {
    path,
    length,
    target,
    curb,
    approach,
    rollout,
    arrival,
    water,
    dry,
    depart,
    travel,
    walk,
    total: depart + travel,
  };
}
