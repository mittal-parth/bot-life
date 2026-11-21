const ink = "#514e40";
const timber = "#bf9368";
const bridge = "#cc664a";

// Shore distance runs southeast. Channel distance runs southwest.
function waterPoint(shore: number, channel: number) {
  return [shore - channel, (shore + channel) / 2];
}

function Pile({ shore, channel }: { shore: number; channel: number }) {
  const [x, y] = waterPoint(shore, channel);
  return (
    <g transform={`translate(${x} ${y})`} strokeWidth=".55">
      <path d="M-1 1.5V-4q1.2-.9 2.4 0v5.5q-1 .8-2.4 0Z" fill="#9f7756" />
      <ellipse cx=".2" cy="-4" rx="1.2" ry=".55" fill="#e1c498" />
    </g>
  );
}

function Buoy({ shore, channel }: { shore: number; channel: number }) {
  const [x, y] = waterPoint(shore, channel);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cy="1.3" rx="3.4" ry=".85" fill="none" stroke="#edf3e3" />
      <g className="harbor-bob">
        <path
          d="M-2.2 0Q-2 -2.3 0 -2.4Q2 -2.3 2.2 0Q0 1.7 -2.2 0Z"
          fill="#d46044"
        />
        <path d="M0-2.4v-2.8" />
        <circle cy="-5.5" r=".65" fill="#e3b957" />
      </g>
    </g>
  );
}

function Boat({ fishing }: { fishing?: boolean }) {
  return (
    <g strokeWidth=".72" strokeLinejoin="round" strokeLinecap="round">
      <g className="harbor-wake" stroke="#eaf3e9" fill="none">
        <path d="m-11 -3 -6 -1.2m4 3.8 -7 -.3M6 6q-5 .9-10-1.9" />
      </g>
      <g className="harbor-bob">
        <path d="m-10 -4 4 -3 13 6 4 4 -6 1 -12 -5z" fill="#f1dbb4" />
        <path
          d="m-10 -4 15 7 6 0 -3 3.1 -4 .8 -12 -6z"
          fill={fishing ? "#346d72" : "#c56649"}
        />
        <path d="m-8 -.7 12 5.8 3.1-.35" fill="none" stroke="#faf3d4" />
        {fishing ? (
          <>
            <path d="M-6 -6v-5l7 3v5.2z" fill="#ffedcf" />
            <path d="m1 -8 3-2v5l-3 2z" fill="#cbbf9d" />
            <path d="m-7 -11 3.7 -2L5 -9.5 1.3 -7.5z" fill="#548c7b" />
            <path
              d="m-4.8 -9 1.9 .8v2.3l-1.9-.8zm3 .95 1.9 .8v2.3l-1.9-.8z"
              fill="#85adba"
              strokeWidth=".45"
            />
            <path d="M4.7 .4v-13l4.1 1.2m-4.2-.5L9 .4" fill="none" />
            <ellipse cx="3.7" cy="-.5" rx="1.8" ry="1" fill="#cda66b" />
          </>
        ) : (
          <>
            <path d="M0 0v-18.5" fill="none" />
            <path d="M-.9 -17.2 -8.5 -5.4 -.9 -2.1Z" fill="#faf0d7" />
            <path d="M1 -16.6 7.5 -.8 1 -3.4Z" fill="#dfa153" />
            <path d="M.2 -18.5 4.8 -17.8 .2 -16.4z" fill="#c75744" />
            <path d="m-7 -3.9 13.7 6.2" stroke="#765941" />
          </>
        )}
      </g>
    </g>
  );
}

function Footbridge() {
  return (
    <g transform="translate(85 42.5)" strokeWidth=".8">
      <path d="m-3 -.5 4 -2 4 2 -32 16 -5 -2.1z" fill="#e2ceb1" />
      <path d="m-32 13.4 5 2.1 32 -16v2l-32 16 -5-2z" fill="#be7654" />
      {[-28, -2].map((x) => (
        <g key={x} transform={`translate(${x} ${-x / 2})`}>
          <path
            d="m-3 .5 1 -19 1.7 -.9 -.3 18.2 3 1.4 .4 -17.8 1.8 .7 -.2 19.1z"
            fill={bridge}
          />
          <path d="m-1.8 -19.4 2 -.8 5.5 2.7 -1.9 .9z" fill="#ed9b71" />
          <path d="m-1.8 -19.4 5.5 2.8v2l-5.5 -2.6z" fill={bridge} />
        </g>
      ))}
      <path
        d="M-25 0Q-14 7 1 -14 M-29 -3Q-15 4 -2 -17"
        fill="none"
        stroke="#9d523a"
      />
      <path
        d="m-21 2 .1 8m5 -8 .1 5.4m5 -7 .1 5m5 -10 .1 7"
        fill="none"
        stroke="#b7704d"
        strokeWidth=".55"
      />
    </g>
  );
}

export function Harbor() {
  return (
    <g
      aria-hidden="true"
      pointerEvents="none"
      transform="translate(-162 81)"
      stroke={ink}
      strokeWidth=".72"
      strokeLinejoin="round"
    >
      <style>{`
      @keyframes harbor-sail { 0%,100% {transform:translate(0,0)} 48%,55% {transform:translate(25px,12.5px)} }
      @keyframes harbor-fish { 0%,100% {transform:translate(0,0)} 47%,53% {transform:translate(-20px,-10px)} }
      @keyframes harbor-bob { from {transform:translateY(-.55px) rotate(-1.2deg)} to {transform:translateY(.55px) rotate(1.2deg)} }
      @keyframes harbor-glint { from {opacity:.45} to {opacity:1} }
      .harbor-sail {animation:harbor-sail 15s ease-in-out infinite}
      .harbor-fish {animation:harbor-fish 19s -6s ease-in-out infinite}
      .harbor-bob {animation:harbor-bob 2.4s ease-in-out infinite alternate}
      .harbor-fish .harbor-bob {animation-delay:-1.2s}
      .harbor-wake,.harbor-glints {animation:harbor-glint 2.1s ease-in-out infinite alternate}
      @media(prefers-reduced-motion:reduce){.harbor-sail,.harbor-fish,.harbor-bob,.harbor-wake,.harbor-glints{animation:none}}
    `}</style>
      <path d="m-30 15 162 81 30 -15v4l-30 15 -162 -81z" fill="#cbbba4" />
      <path d="m0 0 162 81 -30 15 -162 -81z" fill="#94bbce" />
      {Array.from({ length: 62 }, (_, i) => {
        const [x, y] = waterPoint(4 + ((i * 47) % 154), 8 + ((i * 13) % 20));
        return (
          <path
            key={i}
            className={i % 3 === 0 ? "harbor-glints" : undefined}
            d={`M${x - 2} ${y}q1.5 1.5 4.6 .1`}
            fill="none"
            stroke={i % 2 ? "#e0eef0" : "#6999b3"}
            strokeWidth=".72"
          />
        );
      })}
      <path d="m0 0 162 81 -5.9 3 -162 -81z" fill="#dec7a3" />
      {Array.from({ length: 39 }, (_, i) => (
        <path
          key={i}
          d={`M${i * 4 + 0.8} ${i * 2 + 0.4}l-5.7 2.85`}
          stroke="#a99478"
          strokeWidth=".5"
        />
      ))}
      {[5, 21, 37, 53, 69, 85, 101, 117, 133, 149, 161].map((n) => (
        <Pile key={n} shore={n} channel={5.8} />
      ))}
      <g transform="translate(5 23.5)">
        <g className="harbor-sail">
          <Boat />
        </g>
      </g>
      <Footbridge />
      <Buoy shore={66} channel={22} />
      <Buoy shore={103} channel={14} />
      <g transform="translate(127 80.5)">
        <g className="harbor-fish">
          <Boat fishing />
        </g>
      </g>
      <g transform="translate(145 73)" strokeWidth=".7">
        <path d="m-3 0 4 -1.9 3.3 1.7 -4.1 2z" fill={timber} />
        <path d="M.3 1.8v-9.6m0 1 4.5 1.9" fill="none" />
        <circle cx="4.4" cy="-5.1" r="1.05" fill="#e9c35a" />
        <circle cx="-4" cy="-1.2" r="2.1" fill="#d66a49" />
        <circle cx="-4" cy="-1.2" r=".9" fill="#e8d4b3" />
      </g>
    </g>
  );
}
