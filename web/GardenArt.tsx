const outline = "#575447";
const cream = "#f8eed4";

export function Windmill() {
  return (
    <g
      aria-hidden="true"
      pointerEvents="none"
      stroke={outline}
      strokeWidth=".8"
      strokeLinejoin="round"
    >
      <style>{`
      @keyframes garden-sails { to { transform: rotate(360deg) } }
      .garden-sails { animation: garden-sails 14s linear infinite }
      @media (prefers-reduced-motion: reduce) { .garden-sails { animation: none } }
    `}</style>
      <ellipse
        cx="4"
        cy="1"
        rx="18"
        ry="6"
        fill="#8c9574"
        opacity=".35"
        stroke="none"
      />
      <path d="M-11 -2 -7 -28 1 -33 8 -29 13 -3 2 3Z" fill="#eacb91" />
      <path d="M2 3 1 -33 8 -29 13 -3Z" fill="#bc9467" />
      <path d="m-8 -25 7 -10 10 7 -8 4z" fill="#ce6849" />
      <path d="m-1 -35 10 7 -8 4z" fill="#ad533b" />
      <path d="m-13 -12 13 5 14 -7 -1 3 -13 7 -13 -5z" fill="#f2e3c1" />
      <path
        d="m-13 -12 0 -4 13 5 14 -7v4m-14 7v-4m-7 2v-5m15 2v-4"
        fill="none"
      />
      <path d="m-4 0 .4 -6q2 -2 4 .6v7z" fill="#72523f" />
      <path d="m6 -17 3 -1 1 4 -3 1zm-11 -4 3 1v4l-3 -1z" fill="#718991" />
      <g transform="translate(-2 -30) matrix(.96 -.18 0 1 0 0)">
        <g className="garden-sails">
          {[0, 90, 180, 270].map((angle) => (
            <g key={angle} transform={`rotate(${angle})`}>
              <path d="M0 1V-23" strokeWidth="1.3" />
              <path d="M.2 -7 5 -8.5 5 -22.5 .2 -22z" fill="#f4ead3" />
              <path
                d="m.5 -11 4.5 -1m-4.5 -3 4.5 -1m-4.5 -3 4.5 -1m-2.3 -2.2v14.3"
                strokeWidth=".48"
                fill="none"
              />
            </g>
          ))}
        </g>
        <circle r="1.9" fill="#d27b4c" />
      </g>
    </g>
  );
}

const petals = ["#d57565", "#e7bc57", "#eadbc2", "#b294bb", "#e69899"];
export function FlowerBed() {
  return (
    <g aria-hidden="true" pointerEvents="none">
      <path
        d="m-18 -5 7 -4 29 14 -7 4z"
        fill="#ab8969"
        stroke={outline}
        strokeWidth=".65"
      />
      <path
        d="m-18 -5 29 14 7 -4v1.8l-7 4 -29 -14z"
        fill="#cbb592"
        stroke={outline}
        strokeWidth=".55"
      />
      {[0, 1, 2].map((row) => (
        <g key={row}>
          {Array.from({ length: 13 }, (_, i) => {
            const x = -11 + 2.22 * i - row * 2.15;
            const y = -7 + 1.08 * i + row * 1.09;
            return (
              <g key={i} transform={`translate(${x} ${y})`}>
                <path
                  d="M0 0v-2m0 1-.9 -1"
                  fill="none"
                  stroke="#64805a"
                  strokeWidth=".65"
                />
                <path
                  d="M-1 -2q-1 -1 .2 -1.35l.55 .25q.5 -1 1.2 -.45 .7 .6 .1 1.35-.8 1.3-2.05 .2Z"
                  fill={petals[(row + Math.floor(i / 3)) % petals.length]}
                />
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
}

export function Bench() {
  return (
    <g
      aria-hidden="true"
      pointerEvents="none"
      stroke={outline}
      strokeWidth=".75"
      strokeLinejoin="round"
    >
      <path
        d="m-9 -1 14 7 5 -3 -14 -7z"
        fill="#8c9574"
        opacity=".32"
        stroke="none"
      />
      <path d="m-8 -4 13 6 4 -2 -13 -6z" fill="#deb678" />
      <path d="m-4 -5 .1 -4 13 6v4z" fill="#cda46e" />
      <path
        d="M-5 -5v-4M7 3v-6m-14 .5v3M5 2v3m4-4v2"
        fill="none"
        strokeWidth="1.2"
      />
      <path d="m-6 -4 12 5.5m-9 -8L8 -1.5" fill="none" strokeWidth=".4" />
    </g>
  );
}

export function Bandstand() {
  return (
    <g
      aria-hidden="true"
      pointerEvents="none"
      stroke={outline}
      strokeWidth=".75"
      strokeLinejoin="round"
    >
      <style>{`
      @keyframes garden-conduct { 0%,100% {transform:rotate(-8deg)} 50% {transform:rotate(18deg)} }
      .garden-baton { animation:garden-conduct 1.5s ease-in-out infinite; transform-origin:2px -5px }
      @media (prefers-reduced-motion: reduce) { .garden-baton {animation:none} }
    `}</style>
      <ellipse
        cx="4"
        cy="1"
        rx="20"
        ry="7"
        fill="#889271"
        opacity=".3"
        stroke="none"
      />
      <path d="m-18 -5 7 -6 16 -2 14 5 1 6 -9 6 -16 1 -13 -5z" fill="#d6b98e" />
      <path d="m-18 -5 13 5 16 -1 9 -6v5l-9 6 -16 1 -13 -5z" fill="#dba67c" />
      {[-12, -2, 10, 16].map((x, i) => (
        <path
          key={x}
          d={`M${x} -7v-16`}
          fill="none"
          stroke={i % 2 ? "#577c72" : "#46665d"}
          strokeWidth="1.4"
        />
      ))}
      {[-10, 0, 9].map((x, i) => (
        <g key={x} transform={`translate(${x} ${i === 1 ? -3 : -5})`}>
          <path d="M-1 -4v4m2 -4 1 4" strokeWidth="1.2" />
          <path
            d="M-2 -8q2-2 4 0l.5 5h-5z"
            fill={["#668f97", "#b9684e", "#73739a"][i]}
          />
          <circle
            cy="-10"
            r="1.9"
            fill={["#cf986e", "#edc499", "#b87d59"][i]}
          />
          <path d="m-2 -11 1 -1 2 -.1 1 1" fill="#594e43" />
          {i === 1 ? (
            <g className="garden-baton">
              <path d="m1 -6 3 1 2 -2m-1 1 2 -4" fill="none" />
            </g>
          ) : i === 0 ? (
            <path d="m0 -7 4 1 2 -2 -.3 3 -2 -.5-1 2 -2 -.6z" fill="#eec15a" />
          ) : (
            <g>
              <ellipse cy="-3" rx="2.6" ry="3" fill="#b87b45" />
              <path d="m0 -3 3 -7" strokeWidth="1.2" />
            </g>
          )}
        </g>
      ))}
      <path
        d="M-17 -5v-16M-5 -1v-16m20 12v-16"
        stroke="#447267"
        strokeWidth="1.6"
      />
      <path
        d="m-19 -22 8 4 8 2 11 -1 12 -5 -1 3 -11 5 -11 1 -8 -2 -8 -4z"
        fill="#f2d6a3"
      />
      <path
        d="M-20 -22Q-9 -26 0 -34q8 7 20 12l-12 5 -11 1 -9 -2z"
        fill="#5b9e8c"
      />
      <path d="M0 -34q-1 8 -3 18l11 -1q-4 -10 -8 -17z" fill="#78ac94" />
      <path d="m-12 -18 12 -16 8 17M0 -34v-4" fill="none" />
      <circle cy="-37" r="1.35" fill="#dbb55c" />
      <path
        d="m-17 -6 10 4m13 0 9 -4"
        fill="none"
        stroke="#56766a"
        strokeWidth="1.2"
      />
    </g>
  );
}
