// Render the fixed town camera using April Zhu's Colorfigures modelling engine.
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { runInNewContext } from "node:vm";
const core = readFileSync(
  process.argv[2] ?? homedir() + "/.codex/skills/colorfigures/assets/core.js",
  "utf8",
);
function figure(kind) {
  // Town-scale storybook figures. Keep the ears, eyes and one occupational prop
  // legible at the map's smaller scale as well as in the character picker.
  const fox = kind === "Scout",
    bear = kind === "Porter",
    bunny = kind === "Beacon";
  const coat =
    PALS[
      { Scout: "mint", Porter: "tomato", Beacon: "mustard", Scribe: "cobalt" }[
        kind
      ]
    ];
  const fur = {
    Scout: "#e99b60",
    Porter: "#bd8969",
    Beacon: "#f7eddd",
    Scribe: "#b5a4bc",
  }[kind];
  const cream = "#fff0d8",
    ink = "#4b403e";
  const path = (d, fill, width = 1.3) =>
    `<path d="${d}" fill="${fill}" stroke="${ink}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const oval = (x, y, rx, ry, fill, stroke = "none", width = 1.2) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
  const ears = bunny
    ? path("M-10-28Q-20-50-12-49Q-7-49-5-30Z", fur) +
      path("M1-31Q1-51 6-50Q13-50 7-28Z", fur) +
      path("M-12-45l4 13m13-14-1 13", "none", 0.8)
    : bear
      ? oval(-10, -31, 5, 5, fur, ink) +
        oval(9, -32, 4.5, 5, fur, ink) +
        oval(-10, -31, 2.4, 2.4, "#eac5a3") +
        oval(9, -32, 2.3, 2.4, "#eac5a3")
      : path("M-13-25l-2-14q0-2 2-1l10 9M3-31l8-11q1-1 2 1l1 15", fur) +
        path("m-12-35 1 7 5-2m13 0 4-6 .3 7", "#e7ada2", 0.6);
  const tails = fox
    ? path("M-6-7Q-20-5-22-20q0-3 2-1 6 5 11 6 5 1 5 6Z", fur) +
      path("M-21-20q3 3 6 4l-1 5q-4-4-5-9Z", cream, 0.5)
    : bear || bunny
      ? oval(-9, -8, 4, 4, fur, ink)
      : path("M-7-7q-11 1-12-6-2-6 2-6 2 0 2 4 0 3 8 3Z", fur);
  const hat = bear
    ? path("M-12-31q2-9 13-7 7 0 9 5l-5 3Z", coat.m) +
      path("M-9-32q9-3 19-1l4 2q-6 4-14 2z", coat.l)
    : bunny
      ? path("M-12-30q4-7 13-6 7 0 10 5l-2 3Z", coat.l) +
        path("M-11-30q11-2 22-1l-1 3q-11 2-21 1Z", coat.m)
      : "";
  const accessory = fox
    ? path("M-7-15q8 4 15-1l-3 4-5 1-4-1-5 4 1-6Z", "#df8358")
    : bear
      ? path("M-5-15 6-7l2-1-11-9Z", "#8c674d", 0.7) +
        path("m2-9 9-2 1 7-9 2Z", "#f1c28a") +
        path("m2-9 5 3 4-5", "none", 0.7)
      : bunny
        ? path("M-8-16q7 3 15-1l-1 3-4 2-1 6-3-1 1-6-6-1Z", "#6a99a0")
        : path("m1-12 9-2 2 8-9 2Z", "#f4dfb4") +
          path("m3-11 1.6 6m1-5 3-.6", "none", 0.7);
  const glasses =
    bear || fox || bunny
      ? ""
      : oval(-3.8, -23.8, 4.2, 3.6, "none", ink, 0.95) +
        oval(6.8, -24.6, 3.7, 3.3, "none", ink, 0.95) +
        path("m.6-24 2.2-.3", "none", 0.9);
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-25 -52 50 60"><title>' +
    kind +
    "</title>" +
    '<g stroke-linejoin="round">' +
    oval(-1, 0.8, 12, 3, "#a6b2c1") +
    tails +
    oval(-4.6, -1, 3.6, 2.6, "#695649", ink) +
    oval(5.1, -1.6, 3.8, 2.5, "#695649", ink) +
    path("M-7-17Q0-20 7-16l3 11q-8 6-19 1Z", coat.l) +
    path("M-7-15q-5 3-5 9 2 3 5 0l2-7Z", coat.m) +
    oval(-10, -5.8, 2.4, 2.3, fur, ink, 0.9) +
    ears +
    path("M-14-25q0-9 13-10 13-2 16 8 3 10-7 13-12 4-19-2-4-4-3-9Z", fur) +
    path("M-11-21q4 3 9 1 3-3 6-1 4 2 10-2-1 8-9 9-10 2-16-7Z", cream, 0.45) +
    oval(-4, -24, 1.65, 2.15, ink) +
    oval(7, -25, 1.55, 2.05, ink) +
    oval(-3.55, -24.7, 0.48, 0.57, "white") +
    oval(7.45, -25.7, 0.48, 0.57, "white") +
    oval(-9, -21, 2.2, 1.25, "#e9ae9b") +
    oval(11, -22, 1.9, 1.1, "#e9ae9b") +
    path("m.6-21.6 3.8-.4q.6 1.1-1.6 2.3-1.7-.3-2.2-1.9Z", ink, 0.55) +
    path("M2.8-19.7q0 2-1.9 2m1.9-2q.8 1.6 2.2 1", "none", 0.65) +
    hat +
    glasses +
    accessory +
    "</g></svg>"
  );
}
for (const kind of ["Scout", "Porter", "Beacon", "Scribe"]) {
  const svg = runInNewContext(core + "\n(" + figure.toString() + ")(kind)", {
    kind,
    addEventListener() {},
  });
  writeFileSync(
    new URL("../web/assets/workers/" + kind + ".svg", import.meta.url),
    svg,
  );
}
