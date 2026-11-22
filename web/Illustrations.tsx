import * as React from "react";

const ink = "#4c493e";
const ivory = "#f5edd7";
const slate = "#596c67";
const glass = "#acccce";

type Face = "front" | "side";

// Draw each elevation upright, then project it onto its street-facing plane.
function Facade({
  side,
  children,
  width = 26,
}: {
  side: Face;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <g
      transform={
        side === "front"
          ? `matrix(1 .46 0 1 ${-width} ${9 - width * 0.46})`
          : "matrix(1 -.46 0 1 0 9)"
      }
    >
      {children}
    </g>
  );
}

function Cornice({
  h,
  width = 27,
  color = ivory,
}: {
  h: number;
  width?: number;
  color?: string;
}) {
  const end = 9 - width * 0.46 - h;
  const ridge = end - width * 0.46;
  return (
    <g data-layer="cornice">
      <path
        d={`M${-width} ${end} 0 ${ridge} ${width} ${end} 0 ${9 - h}Z`}
        fill={color}
      />
      <path
        d={`M${-width} ${end} 0 ${9 - h} ${width} ${end}v2L0 ${11 - h} ${-width} ${end + 2}Z`}
        fill={color}
      />
    </g>
  );
}

function Opening({
  x,
  y,
  w = 5,
  h = 8,
  arch = false,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  arch?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`} strokeWidth=".66">
      <path
        d={arch ? `M0 0v-${h - 2}q${w / 2} -4 ${w} 0V0Z` : `M0 0v-${h}h${w}V0Z`}
        className="window-glass"
        fill={glass}
      />
      <path
        d={`M${w * 0.5} -.3v-${h - 1}M.3 -${h * 0.47}h${w - 0.6}`}
        fill="none"
      />
      <path d={`M-.65 .45h${w + 1.3}`} strokeWidth="1.2" stroke="#716d60" />
    </g>
  );
}

function Body({
  height,
  front = ivory,
  side = "#c9c1a7",
  sideDetail,
  children,
  width = 26,
}: {
  height: number;
  front?: string;
  side?: string;
  sideDetail?: React.ReactNode;
  children?: React.ReactNode;
  width?: number;
}) {
  return (
    <g data-layer="walls">
      <Facade side="front" width={width}>
        <rect y={-height} width={width} height={height} fill={front} />
        {children}
      </Facade>
      <Facade side="side">
        <rect y={-height} width={width} height={height} fill={side} />
        {sideDetail}
      </Facade>
    </g>
  );
}

function Flag({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeWidth=".72">
      <path d="M0 0v-10" />
      <path fill="#d36447" d="M0-10q3-2 7-.3L1-6.5Z" />
    </g>
  );
}

function Columns({ count = 4, h = 15 }: { count?: number; h?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <g
          key={i}
          transform={`translate(${1 + i * (22 / (count - 1))} 0)`}
          strokeWidth=".53"
        >
          <path fill="#e2d6b8" d={`M0 -.6 .4 -${h}h1.8l.4 ${h - 0.6}Z`} />
          <path
            fill="#faf3df"
            d={`M-.5 -${h + 1}h3.6v1.4H-.5zM-.6 -2h3.7v1.6H-.6z`}
          />
          <path d={`M1 -.8v-${h - 2}`} stroke="#b2a88e" />
        </g>
      ))}
    </>
  );
}

function Civic({ hall }: { hall: boolean }) {
  const h = hall ? 23 : 19;
  return (
    <g>
      <Cornice h={0} width={30} color="#d9d1bc" />
      <Cornice h={2} width={28} color="#e9e0c9" />
      <g transform="translate(0 -3)">
        <Body
          height={h}
          sideDetail={
            <>
              {[3, 11, 19].map((x) => (
                <Opening key={x} x={x} y={-4} arch />
              ))}
            </>
          }
        >
          <path fill={slate} d="M9.6 0v-10q3.4-5 6.8 0V0Z" />
          <Columns h={h - 2} />
          <path d={`M0 -${h - 3}h26`} strokeWidth=".6" />
        </Body>
        <Cornice h={h} />
        {hall ? (
          <g data-layer="roof">
            <path fill="#eee3c9" d="M-13-26v-8l7-4h12l7 4v8l-7 4H-6Z" />
            {[-9, -5, 0, 5, 9].map((x) => (
              <path key={x} d={`M${x} -32v6`} strokeWidth="1.3" />
            ))}
            <ellipse cx="0" cy="-34" rx="14.3" ry="5" fill="#d3cbb4" />
            <path
              fill="#88ad9d"
              d="M-13.3-34.3q.4-12 11.7-16.4l2.7.2q10.2 4.4 12 16.2-12 6-26.4 0Z"
            />
            <path
              fill="none"
              d="M-1-50q-7.4 7.3-7.3 17.1m8.2-17.4q2 8 1.2 18.8m.3-18.1q7.7 7.1 7.8 16.2"
              stroke="#607e70"
              strokeWidth=".72"
            />
            <path
              fill="#ddae55"
              d="M-2.6-50v-2.8l2.4-1.3 2.7 1.3v2.8q-2.6 1.3-5.1 0Z"
            />
            <Flag x={0} y={-53} />
          </g>
        ) : (
          <g data-layer="roof">
            <path fill="#d8c9a5" d="M-29-22 -15-31 0-8.5Z" />
            <path fill={ivory} d="M-30-22 -15-33 1-8.5Z" />
            <path d="m-25.3-22.4 10-7.5 10.5 16.4Z" fill="#ded1ae" />
            <circle cx="-15" cy="-23" r="1.5" fill="#b59c63" />
            <path fill="#bbc2ab" d="M-15-33 11-45 28-21 1-8.5Z" />
            <path
              d="m-9-35 14 22m-6-25 14 22m-6-25 14 21"
              fill="none"
              stroke="#929982"
              strokeWidth=".58"
            />
          </g>
        )}
      </g>
    </g>
  );
}

function Clock() {
  return (
    <g>
      <Cornice h={0} width={15} color="#c6bdac" />
      <Body
        width={12}
        height={43}
        front="#e6d4ac"
        side="#bcae8f"
        sideDetail={
          <>
            <Opening x={4} y={-11} w={4} h={13} arch />
            <path d="M0-29h12" />
          </>
        }
      >
        <Opening x={4} y={-11} w={4} h={13} arch />
        <path d="M0-29h12" />
      </Body>
      <Cornice width={13} h={34} />
      <Cornice width={14} h={45} />
      {(["side", "front"] as const).map((side) => (
        <Facade key={side} side={side} width={12}>
          <circle cx="6" cy="-39.5" r="4.8" fill="#f8efdc" />
          <path d="M6-43.3v3.8l2.2 1.2" fill="none" strokeWidth="1.05" />
        </Facade>
      ))}
      <g data-layer="roof">
        <path d="m-14-42 13.7-21.3.3 27Z" fill="#76988a" />
        <path d="M-.3-63.3 14-42 0-36.3Z" fill="#4e746b" />
        <Flag x={0} y={-63} />
      </g>
    </g>
  );
}

const houseStyles: Record<string, [string, string, string, string]> = {
  house: ["#eaccad", "#d1ae88", "#c86a48", "#9d513d"],
  cottage: ["#f1dda9", "#c7b98d", "#78a694", "#558470"],
  rowhouse: ["#cfb9bb", "#ae999f", "#7f9189", "#687b74"],
  "post-office": ["#e9c9a5", "#c29f86", "#ca704f", "#aa573e"],
  workshop: ["#dbb87e", "#bc9d70", "#939e94", "#748377"],
};

function Gabled({ kind }: { kind: string }) {
  const [front, side, roof, ridge] = houseStyles[kind] ?? houseStyles.house;
  const h = kind === "rowhouse" ? 31 : kind === "cottage" ? 17 : 22;
  const office = kind === "post-office";
  return (
    <g>
      <Body
        height={h}
        front={front}
        side={side}
        sideDetail={
          <>
            {[4, 16].map((x) => (
              <Opening key={x} x={x} y={-5} w={6} h={9} />
            ))}
            {kind === "rowhouse" &&
              [4, 16].map((x) => <Opening key={x} x={x} y={-20} w={6} h={7} />)}
          </>
        }
      >
        <path d="M3 0v-12h6V0Z" fill={slate} />
        <circle cx="7.6" cy="-5.7" r=".5" fill={ivory} />
        <Opening x={14} y={-5} w={8} h={8} />
        {kind === "rowhouse" &&
          [3, 14].map((x) => <Opening key={x} x={x} y={-20} w={7} h={7} />)}
        {office ? (
          <g>
            <rect x="2" y="-20.4" width="22" height="5.4" fill="#527d70" />
            <text
              x="13"
              y="-16.4"
              textAnchor="middle"
              fill="#fff4dc"
              stroke="none"
              fontFamily="Georgia,serif"
              fontWeight="bold"
              fontSize="4.4"
            >
              POST
            </text>
            <rect x="10" y="-7" width="2.7" height="6" fill="#bf6149" />
          </g>
        ) : kind === "workshop" ? (
          <g data-layer="awning">
            <path d="M1-15h24l-2.3 4H-1.3Z" fill={ivory} />
            {[1, 7, 13, 19].map((x) => (
              <path
                key={x}
                d={`M${x}-15h3l-2.3 4h-3Z`}
                fill="#b45c49"
                strokeWidth=".32"
              />
            ))}
            <path d="M-1.3-11h24v1.4h-24Z" fill="#d49d75" />
            <rect x="11" y="-7" width="2" height="4" fill="#e3bf63" />
          </g>
        ) : (
          <g>
            <rect x="13.5" y="-5.5" width="9.3" height="2.3" fill="#b37856" />
            {[15, 18, 21].map((x) => (
              <g key={x}>
                <circle
                  cx={x}
                  cy="-6"
                  r="1.4"
                  fill="#80905f"
                  strokeWidth=".4"
                />
                <circle
                  cx={x + 0.4}
                  cy="-7"
                  r=".7"
                  fill="#df9690"
                  stroke="none"
                />
              </g>
            ))}
          </g>
        )}
      </Body>
      <g data-layer="roof" transform={`translate(0 ${-h})`}>
        <path d="M-26-3-13-16 0 9Z" fill={front} />
        <path d="m-30-2 16-18 28-13L-2-14Z" fill={ridge} />
        <path d="M-14-20 14-33 29-4 0 10Z" fill={roof} />
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`m${-10 + i * 5.4} ${-20 - i * 2.52} 13.8 26.3`}
            stroke="#665c4d"
            opacity=".45"
            strokeWidth=".6"
          />
        ))}
        <path d="M-30-2-14-20 0 10 29-4" strokeWidth="1.5" fill="none" />
        <path d="M-15-17-3 6" fill="none" stroke="#f0d8aa" strokeWidth="1.2" />
        <path d="M9-26v-9l4 1.6v9Z" fill="#d9aa89" />
        <path d="m13-33.4 3-1.4v9l-3 1.4Z" fill="#b58468" />
        <path d="m8-35.3 3.6-1.7 5.4 2.1-3.8 1.8Z" fill="#e2c3a4" />
      </g>
    </g>
  );
}

function Workplace({ exchange }: { exchange: boolean }) {
  const h = exchange ? 25 : 36;
  return (
    <g>
      <Body
        height={h}
        front={exchange ? "#e6cfac" : "#d2ccd1"}
        side={exchange ? "#baa589" : "#b3afb8"}
        sideDetail={
          <>
            {[4, 11, 18].map((x) => (
              <React.Fragment key={x}>
                <Opening x={x} y={-5} />
                <Opening x={x} y={exchange ? -16 : -23} h={6} />
              </React.Fragment>
            ))}
          </>
        }
      >
        {[3, 11, 19].map((x) => (
          <Opening
            key={x}
            x={x}
            y={exchange ? -15 : -23}
            h={7}
            arch={exchange}
          />
        ))}
        <path d="M2 0v-12h7V0Z" fill={slate} />
        <Opening x={12} y={-3} w={10} h={8} />
        {!exchange && <path d="M0-16h26v1.4H0Z" fill={ivory} />}
      </Body>
      <Cornice h={h + 1} width={28} />
      <path
        d={`m-22 ${-h - 3} 22-10 22 10-22 10Z`}
        fill="#aaafa1"
        strokeWidth=".65"
      />
      {exchange ? (
        <g data-layer="antenna">
          <path
            d="m-3-26 5-24 6 26m-9-9 7 4-5-11 4 2"
            fill="none"
            stroke={ink}
            strokeWidth="1"
          />
          <path
            d="m-5-42 16-6m-15 3 16-6m-8 3v-7"
            fill="none"
            strokeWidth="1"
          />
          {[-4, 10].map((x, i) => (
            <g key={x} transform={`translate(${x} ${-43 - i * 5})`}>
              <path d="M0 0v-3" />
              <circle cy="-3" r="1" fill="#a4bfc0" />
            </g>
          ))}
        </g>
      ) : (
        <g transform="translate(2 -39)">
          <path d="m-8-2 9-4 8 4-9 4Z" fill={ivory} />
          <path d="M-8-2v4l8 4V2Z" fill="#b5b9ad" />
          <path d="m0 2 9-4v4L0 6Z" fill="#8e9b92" />
          <path d="m-5 0 4 2m-4-.4 4 2" fill="none" strokeWidth=".45" />
        </g>
      )}
    </g>
  );
}

export function BuildingArt({
  kind,
  boarded,
}: {
  kind: string;
  boarded?: boolean;
}) {
  let art: React.ReactNode;
  switch (kind) {
    case "town-hall":
    case "bank":
      art = <Civic hall={kind === "town-hall"} />;
      break;
    case "clock-tower":
      art = <Clock />;
      break;
    case "telephone-exchange":
    case "office":
      art = <Workplace exchange={kind === "telephone-exchange"} />;
      break;
    default:
      art = <Gabled kind={kind} />;
  }
  return (
    <g
      fill="none"
      stroke={ink}
      strokeWidth=".9"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path
        data-layer="shadow"
        d="m-24 0 19-11 34 7 8 5-28 14Z"
        fill="#56553e"
        opacity=".12"
        stroke="none"
      />
      {art}
      {boarded && (
        <g
          data-layer="boards"
          transform={
            kind === "clock-tower" ? "translate(8 2)" : "translate(0 0)"
          }
        >
          <Facade side="front">
            <g fill="#ab885e" strokeWidth=".6">
              <path d="m3-11 11 6-.8 2-11-6Z" />
              <path d="m2-4 11-8 1.3 1.7L3.3-2Z" />
            </g>
          </Facade>
        </g>
      )}
    </g>
  );
}

export function Tree({ variant = 0 }: { variant?: number }) {
  const type = Math.abs(variant) % 4;
  const flower = type === 2;
  return (
    <g
      stroke={ink}
      strokeWidth=".68"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <ellipse
        cx="3"
        cy=".2"
        rx="7.5"
        ry="2.5"
        fill="#707357"
        opacity=".19"
        stroke="none"
      />
      <path d="M-.9 0v-14h1.7L1 .4Z" fill="#ac8863" />
      {type === 1 ? (
        <g>
          <path
            d="M0-32q-5.2 6-5 14.3-.8 9.4 4.7 10.4 4.7-.5 4.6-7.2.6-10-4.3-17.5Z"
            fill="#8aab76"
          />
          <path d="M.3-26q2 11-.6 17" fill="none" stroke="#69865a" />
        </g>
      ) : (
        <g>
          <path
            d="M-1-7.8q-5.2.7-6.5-3.5-3.2-1.9-1.8-6.8-1.1-4.2 2.5-5.9.6-4.4 5.2-4.4 3.7-2.6 6.7 1.4 4.2.2 4.2 5.2 3 3.3.2 7.1.8 4.3-4 5.1-2.6 2.4-6.5 1.8Z"
            fill={flower ? "#deb0ad" : type === 3 ? "#adc382" : "#9bb77e"}
          />
          <path
            d="M-7.2-14.7q1.6 4 5 2.6m4.1-11.4q3.1 0 3.5 2.6m-2.5 9.3q3.8-.4 4.2-3.5"
            fill="none"
            stroke={flower ? "#b98989" : "#748e5d"}
          />
          <path d="M-1-4.5v-7.1m.3 4 3.1-3.3" fill="none" strokeWidth=".85" />
        </g>
      )}
    </g>
  );
}
