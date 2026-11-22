import type { CSSProperties } from "react";

// Heights match the wall elevations in Illustrations. Smoke starts at the
// roofline and window flames follow the projected face below the eaves.
const wallHeight: Record<string, number> = {
  office: 36,
  rowhouse: 31,
  cottage: 17,
  bank: 22,
  "clock-tower": 43,
  "telephone-exchange": 25,
  "town-hall": 26,
};
export function fireOrigin(kind: string) {
  const x = kind === "clock-tower" ? 5 : 12;
  return { x, y: 9 - (wallHeight[kind] ?? 22) - x * 0.46 };
}
function Flame({
  x,
  y,
  scale,
  delay,
}: {
  x: number;
  y: number;
  scale: number;
  delay: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="fire-tongue" style={{ animationDelay: delay + "s" }}>
        <path
          fill="#c3492d"
          d="M-4 0Q-7-4-4-11Q-3-7-2-8Q1-12-1-18Q6-13 3-7Q5-8 5-11Q9-3 3 0Q0 2-4 0Z"
        />
        <path
          fill="#ed893e"
          d="M-3 0Q-5-3-3-7L-1-5Q1-8 1-12Q5-7 3-4L4-5Q5 1-1 1Z"
        />
        <path fill="#ffe69c" d="M-1 0Q-3-2 0-5Q0-3 2-5Q4-1 1 0Z" />
      </g>
    </g>
  );
}
export function BuildingFire({
  kind,
  burning,
  seed,
}: {
  kind: string;
  burning: boolean;
  seed: number;
}) {
  const tower = kind === "clock-tower";
  const eave = 9 - (wallHeight[kind] ?? 22);
  const offset = (seed % 37) / 11;
  const root = fireOrigin(kind);
  return (
    <g aria-hidden="true" pointerEvents="none" stroke="none">
      <g transform={`translate(${root.x} ${root.y})`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            className="rising-soot"
            style={
              {
                animationDelay: -(i * 0.84 + offset) + "s",
                "--drift": 9 + (i % 3) * 3 + "px",
              } as CSSProperties
            }
            fill={i % 2 ? "#766b60" : "#968c7b"}
            d="M-4 1Q-7-2-4-4Q-5-8 0-8Q3-11 5-7Q10-5 7-1Q5 3 1 2Q-2 4-4 1Z"
          />
        ))}
        {burning &&
          [0, 1, 2, 3].map((i) => (
            <circle
              key={i}
              className="fire-ember"
              cx={i - 2}
              cy="-2"
              r={i % 2 ? 0.65 : 1}
              fill="#e89a49"
              style={{ animationDelay: -(i * 0.63 + offset) + "s" }}
            />
          ))}
      </g>
      {burning && (
        <>
          <path
            d={tower ? "M1-35l11-5v6L1-28z" : `M1 ${eave}l24 -11v5l-24 11z`}
            fill="#604137"
            opacity=".58"
          />
          {[0, 1, 2, 3].map((i) => {
            const x = (tower ? 2 : 4) + i * (tower ? 2.5 : 5.4);
            return (
              <Flame
                key={x}
                x={x}
                y={eave - x * 0.46 + 1.3}
                scale={[0.53, 0.91, 0.72, 0.44][i]}
                delay={-offset - i * 0.43}
              />
            );
          })}
          <Flame
            x={tower ? 6 : 7}
            y={tower ? -6 : -2}
            scale={0.55}
            delay={-0.32 - offset}
          />
        </>
      )}
    </g>
  );
}
