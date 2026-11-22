const ink = "#514d40";
const paper = "#f6eddb";

export function PicnicGrove() {
  return (
    <g
      aria-hidden="true"
      pointerEvents="none"
      stroke={ink}
      strokeWidth=".7"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="m-19 -1 18 -8 22 10 -17 9z" fill="#d6856a" />
      <path
        d="m-16 -2 23 10m-15 -14 23 10m-23 1 17 -8m-9 12 17 -8"
        fill="none"
        stroke="#ffe9c9"
        strokeWidth="1.5"
      />
      <path
        d="m-19 0 21 10m1 1 17 -9"
        fill="none"
        stroke={paper}
        strokeWidth=".7"
        strokeDasharray="1 1"
      />
      <ellipse
        cx="-10"
        cy="0"
        rx="9"
        ry="2"
        stroke="none"
        fill="#817f68"
        opacity=".2"
      />
      <path d="M-12 -1v-20" stroke="#866c4d" strokeWidth="1.3" />
      <path
        d="M-24 -16q5-9 12-10 10 4 13 10-1 2-4 1-3 2-6 1-3 1.5-5-.2-4 1.4-6-.4-2 1.2-4-1.4z"
        fill={paper}
      />
      <path
        d="M-12 -26q-3 6-8 11-1 1-4-1 4-8 12-10zm0 0q1 5-2 11.8 2 2 5 .2 1-6-3-12zm1 1q8 3 12 9-1 2-4 1-2-6-8-10z"
        fill="#d76348"
      />
      <circle cx="-12" cy="-26.2" r="1" fill="#b67f49" />
      <g transform="translate(0 0) rotate(20)">
        <path
          d="m-3 -3 -4 3 -6 1m10 -3 -2 4 -7 1"
          stroke="#966949"
          strokeWidth="1.6"
          fill="none"
        />
        <path d="m-4 -4 -3 3 3 1 3-3z" fill="#536b85" />
        <path d="m-3 -4 5 -3 3 2 -1 2 -7 1z" fill="#6ba09b" />
        <circle cx="6" cy="-6" r="2" fill="#d4a07b" />
        <path d="m4.5 -7q2-3 3.5.2l-.7 1.4z" fill="#554439" />
        <path
          d="m3 -4 4 1 1 -3"
          fill="none"
          stroke="#bd8968"
          strokeWidth="1.2"
        />
      </g>
      <path d="m9 -1 5 -2 4 2 -1 4 -5 1 -3 -2z" fill="#ca9b61" />
      <path
        d="m11 -1q.5-7 4-2m-3 4 4-1m-2-1v3"
        fill="none"
        stroke="#896b49"
        strokeWidth=".6"
      />
      <g transform="translate(16 -8)">
        <path d="M-2 -2q-3 0-4-2" fill="none" strokeWidth="1.2" />
        <path
          d="m-3 -3 5 -.3 1-2.5 1 -.4 1.4 2 1.7 .7 -.8 1.3 -2.6 .2 -1.2 4h-1l-.5-2.6-2 .3-1.2 2.6h-1l.4-3.1z"
          fill="#bf8151"
        />
        <path d="m3.4 -4 1 2 -1 1z" fill="#795c47" />
      </g>
    </g>
  );
}

function JadeRoof({ lower = false }: { lower?: boolean }) {
  return (
    <g transform={lower ? "translate(0 5) scale(.87 .8)" : undefined}>
      <path
        d="M-23 -26q4 3 8 1l10-7q1-2 2-4 4 4 7 4l12 2q4 1 8-2-1 5-5 7L5 -18q-3 1-6 0l-17-4q-3-.5-5-4Z"
        fill="#508a75"
      />
      <path
        d="M-3 -36q1 5 6 8 9 1 21-4-1 5-5 7L5 -18q0-8-8-18z"
        fill="#3e776c"
      />
      <path
        d="M-22 -25q3 3 7 3l16 5q3 1 5-.5l16-8"
        fill="none"
        stroke="#cfb768"
        strokeWidth="1.35"
      />
      <path
        d="m-14 -24 9 -7m-4 9 6 -7m1 9 2 -6m5 5 4 -3m4 0 4 -3"
        fill="none"
        stroke="#bad0ab"
        strokeWidth=".5"
      />
      <path d="m-4 -35 9 4 8-1" fill="none" stroke="#7ba995" />
    </g>
  );
}

export function LanternGate() {
  return (
    <g
      aria-hidden="true"
      pointerEvents="none"
      stroke={ink}
      strokeWidth=".75"
      strokeLinejoin="round"
    >
      <style>{`
      @keyframes garden-lantern-sway {from {transform:rotate(-6deg)} to {transform:rotate(7deg)}}
      .garden-lantern {animation:garden-lantern-sway 3.2s ease-in-out infinite alternate}
      @media (prefers-reduced-motion: reduce) {.garden-lantern {animation:none}}
    `}</style>
      <ellipse
        cx="3"
        cy="1.4"
        rx="20"
        ry="4.5"
        fill="#91967a"
        opacity=".26"
        stroke="none"
      />
      {[-15, 14].map((x, i) => (
        <g key={x} transform={`translate(${x} ${i ? 1 : -3})`}>
          <path d="m-3 0 3 -1.4L4 0 1 2 -3 1z" fill="#d3ceba" />
          <path d="M-1.5 0v-22l2.5-1 1 1v22l-2 1z" fill="#bb5944" />
          <path d="M1 -21V0" stroke="#e98d69" strokeWidth=".6" />
          <path d="m-2 -16 3 -1 1 .5v2l-3 .7 -1 -.5z" fill="#c7b470" />
        </g>
      ))}
      <path d="m-17 -21 4 -1 30 4 -3 4z" fill="#c87350" />
      <JadeRoof lower />
      <JadeRoof />
      <path d="m-5 -17 11 1v4l-11-1z" fill="#324f50" stroke="#bda76a" />
      <path
        d="m-3 -15 1 1 1 -1 1 1m1 -1 2 1"
        fill="none"
        stroke="#e3ca7f"
        strokeWidth=".6"
      />
      {[
        [-10, -17],
        [9, -15],
      ].map(([x, y], i) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <g
            className="garden-lantern"
            style={{ animationDelay: i ? "-1s" : "0s" }}
          >
            <path d="M0 0v2" strokeWidth=".5" />
            <ellipse cy="4.5" rx="2.4" ry="2.8" fill="#d96243" />
            <path
              d="M0 2q-1.2 2.4 0 5m0 -5q1.3 2 0 5"
              fill="none"
              stroke="#ad5139"
              strokeWidth=".45"
            />
            <path d="M-1 2h2m-2 5h2M0 7v2" fill="none" stroke="#c59b50" />
          </g>
        </g>
      ))}
    </g>
  );
}
