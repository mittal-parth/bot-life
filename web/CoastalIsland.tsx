function Cottage() {
  return (
    <g transform="translate(-7 -2)" strokeWidth=".6">
      <path d="m-12 -1 8 -5 15 6 -7 5z" fill="#e7dfcc" />
      <path d="m-12 -1 8 4v-7l-4-4-4 2z" fill="#f6e9d1" />
      <path d="m-4 3 14-7v-6L-4 -3z" fill="#e8dbbc" />
      <path d="m-13 -3 4-6 14 -7 7 6-16 8-5-5z" fill="#ce774f" />
      <path d="m-4 -2 -5-6 14-7" fill="none" stroke="#f0aa7a" />
      <path
        d="m1-1 2.6-1.3v-3L1-4Zm5-2.6 2.4-1.2v-2.8L6 -6.4z"
        fill="#667f88"
      />
      <path d="m-10 -1 2.3 1.1v-3.2l-2.3-1z" fill="#60847b" />
      <path d="m4-14 1.7.7v-4l-1.7-.6z" fill="#9f6048" />
    </g>
  );
}

function Lighthouse() {
  return (
    <g transform="translate(13 -3)" strokeWidth=".65">
      <ellipse cy="1" rx="5.2" ry="1.9" fill="#a5a48a" stroke="none" />
      <path
        d="M-4.1 .3 -2.6 -20Q0 -21 2.5 -20L4.2 .3Q.2 2.9-4.1 .3Z"
        fill="#fff3d4"
      />
      <path d="m1.5 -20 .6 21.4 2.1-.9L2.5 -20z" fill="#d2ceb9" stroke="none" />
      <path
        d="M-3.45-10q3.4 1.4 6.9 0l-.4-3.8q-2.9 1.3-6.2 0z"
        fill="#bf654b"
      />
      <path d="M-2 .2v-3.3q.8-1.5 1.7-.4v4z" fill="#52646a" />
      <path d="M-.7-16.6h1v2h-1z" fill="#475e63" />
      <path d="m-4.4-21.8 4.1-1.6 4.8 1.7v1.3Q0-18-4.4-20.6z" fill="#e5d9bf" />
      <path
        d="M-4.2 -21.4v-2.8q4.1 2.1 8.4 .1v2.7m-6.5-2.1v2.9m4.1-3v3"
        fill="none"
      />
      <path
        d="M-2.6-22.8v-4.8q2.5-1.4 5.2 0v4.8q-2.4 1.3-5.2 0Z"
        fill="#f0ca72"
      />
      <path d="M-.5-28v5.8m2-5.8v5.7" fill="none" />
      <path d="M-3.7-27.4 0-31.5l3.8 4.1q-3.5 1.5-7.5 0Z" fill="#4f666a" />
      <path d="M0-31.4v-2.9" />
    </g>
  );
}

export default function CoastalIsland() {
  return (
    <g
      aria-hidden="true"
      pointerEvents="none"
      stroke="#59584b"
      strokeWidth=".65"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <style>{`
      @keyframes beacon-boat {0%,100% {transform:translate(0,0)} 50% {transform:translate(7px,1.3px)}}
      @keyframes beacon-gull {0%,100% {transform:translate(0,0)} 50% {transform:translate(5px,-2px)}}
      .beacon-boat {animation:beacon-boat 13s ease-in-out infinite}
      .beacon-gulls {animation:beacon-gull 9s ease-in-out infinite}
      @media(prefers-reduced-motion:reduce){.beacon-boat,.beacon-gulls{animation:none}}
    `}</style>
      <path
        d="M-48 6Q-50 1-39-2Q-31-4-33-7Q-32-12-15-12Q-6-12 1-9Q14-9 22-8Q42-7 46 0Q54 6 43 10Q34 13 37 17Q37 21 25 21Q15 21 7 24Q-5 28-17 22Q-26 17-33 17Q-49 17-48 6Z"
        fill="#a6cbd9"
        stroke="none"
      />
      {Array.from({ length: 19 }, (_, i) => {
        const a = (i * Math.PI * 2) / 19;
        return (
          <path
            key={i}
            d={`M${39 * Math.cos(a) - 2.4} ${6 + 13 * Math.sin(a)}q2.8 1.3 5.5-.4`}
            fill="none"
            stroke={i % 2 ? "#74a5bc" : "#e6f0e8"}
            strokeWidth=".65"
          />
        );
      })}
      <path
        d="M-28 6Q-26 2-24 0Q-21-1-20-4Q-18-8-11-9Q-4-11 5-9Q15-8 20-6Q28-3 31 2Q34 4 31 9Q27 13 19 13Q12 15 6 14Q-6 12-14 13Q-24 12-28 6Z"
        fill="#d7c39d"
      />
      <path
        d="M-27 5Q-24 1-22-2Q-19-9-11-10Q-1-13 7-10Q19-9 24-5Q30-1 30 4Q31 8 25 9Q18 11 9 10Q1 9-8 10Q-20 10-27 5Z"
        fill="#b9cd8a"
        stroke="#8e9e71"
      />
      <path
        d="M-15 8Q-18 5-13 2Q-8-1-2-1Q8-1 13-4"
        fill="none"
        stroke="#e9dbb7"
        strokeWidth="2.2"
      />
      {Array.from({ length: 22 }, (_, i) => {
        const a = (i * Math.PI * 2) / 22;
        return (
          <path
            key={i}
            d={`M${23 * Math.cos(a)} ${7 * Math.sin(a)}l1-1.8m0 1.5 1.6-1`}
            stroke="#839563"
            fill="none"
            strokeWidth=".55"
          />
        );
      })}
      <Cottage />
      <Lighthouse />
      <path d="m-9 10 3-1 6.8 5.7-3.4 1.4z" fill="#c99562" />
      <path d="m-7.4 10.8 2.7-1m-.9 2.6 2.8-1m-.7 2.6 2.5-1m-2 3.2v2.8m3.4-4.3v2.6" />
      <path
        d="M23 10q-1-3-2.3-4m2.3 4 1-4.6m-.5 4.8 2.2-2.7"
        fill="none"
        stroke="#748451"
      />
      <g transform="translate(-30 12)">
        <g className="beacon-boat">
          <path d="m-10 0-4-.8m3 2.7-4-.3" stroke="#f4efe1" />
          <path d="m-6 -2.4 10 3.6 3-.9-2.7 3-3.4-.2-7.4-3.6z" fill="#c7684d" />
          <path d="m-.7 -1.5v-12m0 1 -4.8 8.6 4.8 1.6z" fill="#fff3d8" />
          <path d="m.5 -11.2 4.2 10.5L.5-2.4z" fill="#eab36e" />
        </g>
      </g>
      <g className="beacon-gulls" fill="none" stroke="#737366">
        <path d="M-28-20q2-1 3.2 1.4 1.5-2.9 3.3-2.7m1-4q1.3-.9 2.4 1 1.1-1.8 2.7-1.9" />
      </g>
    </g>
  );
}
