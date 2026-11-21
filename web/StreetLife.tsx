import type { CSSProperties } from "react";

const ink = "#504c40";
const coats = ["#cb6347", "#547c94", "#e3b449", "#74a182", "#9b84a4"];
export function Resident({ variant = 0 }: { variant?: number }) {
  const skin = ["#d7a279", "#a97758", "#e4bb90"][variant % 3];
  return (
    <g
      stroke={ink}
      strokeWidth=".65"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <ellipse
        cy=".7"
        rx="3"
        ry="1"
        fill="#7c735d"
        opacity=".23"
        stroke="none"
      />
      <path
        className="stride"
        d="m-1 -3 -1.1 3.1m3-3 .9 3.3"
        fill="none"
        strokeWidth="1.4"
      />
      <path
        d="M-1.6 -7.3q1.6 -1.3 3.1 .1l.9 4.2q-2.2 1-4.8 0z"
        fill={coats[variant % coats.length]}
      />
      <path
        d="m-1.9 -6.3 -1.3 2.5m5-2.6 1.3 2"
        stroke={skin}
        strokeWidth="1.4"
      />
      <ellipse cy="-9" rx="2" ry="2.3" fill={skin} />
      <path
        d="M-2.1 -9.4q-.3 -3.2 2.3 -2.3 1.9 .1 1.8 2.1l-1.3 -.9z"
        fill={variant % 2 ? ink : "#82604c"}
      />
    </g>
  );
}
function Tram() {
  return (
    <g stroke={ink} strokeWidth=".75" strokeLinejoin="round">
      <ellipse
        cx="1"
        cy="2"
        rx="15"
        ry="3"
        fill="#84795f"
        stroke="none"
        opacity=".25"
      />
      <path d="m-15 -7 22 11 9 -5v-12L-6 -24l-9 5z" fill="#e4b453" />
      <path d="m-15 -18 22 11v11L-15 -7z" fill="#bd5541" />
      <path d="m-17 -19 10 -6 25 12 -11 6z" fill="#f7dda1" />
      {[-12, -7, -2, 3].map((x) => (
        <path
          key={x}
          d={`M${x} ${-16 + (x + 12) * 0.5}l3.3 1.6v4.6l-3.3 -1.6z`}
          fill="#b3d1d5"
        />
      ))}
      <path d="m8 -6 6 -3v4l-6 3z" fill="#a6cbd1" />
      <path d="m-14 -9 20 10" stroke="#edc489" />
      <path d="m-5 -22 7 -5 6 3 -5 5" fill="none" />
      <path d="m-2 -28 7 3" />
      <ellipse cx="-10" cy="-4" rx="1.8" ry="2.5" fill={ink} />
      <ellipse cx="3" cy="2.3" rx="1.8" ry="2.5" fill={ink} />
      <circle cx="12" cy="-1.5" r="1" fill="#fff0ad" />
    </g>
  );
}
export function Boulevards() {
  return (
    <g aria-hidden="true" pointerEvents="none" fill="none">
      {["M203 168 556 348", "M555 168 204 348"].map((path) => (
        <g key={path}>
          <path d={path} stroke="#c6bca8" strokeWidth="19" />
          <path d={path} stroke="#e1dac9" strokeWidth="17" />
          <path
            d={path}
            stroke="#b3a693"
            strokeWidth=".7"
            strokeDasharray="4 6"
          />
        </g>
      ))}
      {[-2, 2].map((y) => (
        <path
          key={y}
          d={`M205 ${170 + y}l348 177`}
          stroke="#938c7a"
          strokeWidth=".8"
        />
      ))}
    </g>
  );
}
export function Streetcar() {
  return (
    <g transform="translate(231 184)" pointerEvents="none" aria-hidden="true">
      <g className="tram-run">
        <Tram />
      </g>
    </g>
  );
}
export function Parade({ districtIndex }: { districtIndex: number }) {
  return (
    <g aria-hidden="true" pointerEvents="none">
      {Array.from({ length: 8 }, (_, i) => {
        const x =
            [-142, -115, -72, -64, -12, 38, 94, 128][(i + districtIndex) % 8] +
            Math.sin(i * 4 + districtIndex) * 7,
          y = 81 + Math.abs(x) * -0.5 + (i % 2 ? 80 : 78);
        // Both segments follow the front sidewalk of the diamond.
        const style = {
          "--walk-x": (i % 3 === 0 ? -1 : 1) * (x < 0 ? 14 : -14) + "px",
          "--walk-y": (i % 3 === 0 ? -7 : 7) + "px",
          animationDelay: -(i * 1.8 + districtIndex * 2.1) + "s",
          animationDuration: 4 + (i % 4) + "s",
        } as CSSProperties;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <g className="promenade" style={style}>
              <Resident variant={i + districtIndex} />
            </g>
          </g>
        );
      })}
    </g>
  );
}
export function Bunting() {
  return (
    <g stroke={ink} strokeWidth=".7">
      <path d="M-24 0v-20m48 42V2M-24 -20Q0 0 24 2" fill="none" />
      {Array.from({ length: 8 }, (_, i) => {
        const t = (i + 1) / 9;
        const x = -24 + 48 * t,
          y = -20 * (1 - t) ** 2 + 2 * t * t;
        return (
          <path key={i} d={`M${x} ${y}l4 1.5 -2 4z`} fill={coats[i % 5]} />
        );
      })}
    </g>
  );
}
export function Airship() {
  return (
    <g transform="translate(128 60)" pointerEvents="none" aria-hidden="true">
      <g
        className="airship"
        stroke={ink}
        strokeWidth=".75"
        strokeLinejoin="round"
      >
        <path d="m-19 -1 -8 -8 1 8 -2 6 10 -2" fill="#b45a40" />
        <ellipse cx="1" cy="-1" rx="23" ry="9" fill="#eecb8f" />
        <path
          d="M-21 -2Q1 -13 23 -1Q1 -7 -21 -2M-20 1Q2 11 23 0Q1 6 -20 1"
          fill="#cf7054"
          stroke="none"
        />
        <path d="m-7 7 3 8m13 -8 -4 8" fill="none" />
        <path d="m-6 13 13 0 -2 4 -9 0z" fill="#8b6e53" />
        <path
          d="M-10 -9q-5 8 0 15m21 -15q4 8 0 15"
          fill="none"
          stroke="#b79468"
        />
      </g>
    </g>
  );
}
