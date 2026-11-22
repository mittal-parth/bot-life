// A sliver of terraced street along the eastern edge of the People district.
const route =
  "M18 0 C25 7 12 9 23 16 S57 18 52 26 S42 34 60 37 S92 38 86 47 S78 53 99 57 S130 59 123 67 S127 73 145 78 L159 84";
export function FlowerLane() {
  return (
    <g transform="translate(0 -10)" aria-hidden="true" pointerEvents="none">
      <path
        d="m0 10 19-11 165 82-22 12z"
        fill="#bed093"
        stroke="#79745f"
        strokeWidth=".8"
      />
      <path
        d="m162 93 22-12v6l-22 12z"
        fill="#c0ad90"
        stroke="#79745f"
        strokeWidth=".7"
      />
      <path d={route} stroke="#ede4cb" strokeWidth="9" fill="none" />
      <path d={route} stroke="#c57d60" strokeWidth="6.5" fill="none" />
      {Array.from({ length: 54 }, (_, i) => {
        const x = 8 + i * 3.05,
          y = x * 0.5 + (i % 3 === 0 ? 4 : -3);
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <ellipse rx="2.1" ry="1.25" fill="#869765" />
            <circle
              cy="-1"
              r="1.45"
              fill={["#d796a2", "#b6a2c4", "#efb7b6", "#eac69b"][i % 4]}
            />
          </g>
        );
      })}
      {[0, 1].map((i) => (
        <g
          key={i}
          className="lane-car"
          style={{
            offsetPath: `path('${route}')`,
            animationDelay: i ? "-13s" : "-3s",
          }}
        >
          <ellipse cy="1" rx="5" ry="2.2" fill="#645642" opacity=".24" />
          <path
            d="m-5 -2 1-3h5l2 2h2v3H-5z"
            fill={i ? "#ddb356" : "#7daad0"}
            stroke="#5b5549"
            strokeWidth=".55"
          />
          <path d="m-3-4 3.5 0 1.6 1.4h-5.5z" fill="#d6e6e3" />
          <circle cx="-2.8" r="1" fill="#454a45" />
          <circle cx="3" r="1" fill="#454a45" />
        </g>
      ))}
    </g>
  );
}
