const graphite = '#49483f'
const cream = '#f4ecd6'
const cabColors = ['#c9694e', '#daba5c', '#75a298', '#d2908b', '#9b96b4', '#e9c375']
const seats = Array.from({ length: 10 }, (_, index) => {
  const angle = (index * 2 * Math.PI) / 10
  return { x: 23 * Math.cos(angle), y: 23 * Math.sin(angle) }
})

export function FairStyles() {
  return <style>{`
    .fair-wheel-rim { animation: fair-wheel-turn 52s linear infinite; transform-origin: 0 0; }
    .fair-wheel-cab { animation: fair-wheel-turn 52s linear infinite reverse; transform-origin: 0 0; }
    @keyframes fair-wheel-turn { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
    @media (prefers-reduced-motion: reduce) {
      .fair-wheel-rim, .fair-wheel-cab { animation: none; }
    }
  `}</style>
}

function Legs({ rear = false }: { rear?: boolean }) {
  return <g transform={rear ? 'translate(4 -2)' : undefined} fill={rear ? '#849581' : '#bccbb0'}>
    <path d="M-1-36-15-1l3.2 1.3L1-32.5 12-.9l3.3-1.3L2-36Z"/>
    <path d="m-9.7-12.6 18.3-1.2.8 2.1-19.9 1.2Z" fill="#c3a479"/>
    <path d="m-9.6-10.5 17.4-7.1m-15.4-.8 17.1 5.8" fill="none" strokeWidth=".64"/>
  </g>
}

function Car({ color }: { color: string }) {
  return <g transform="matrix(1.162 -.16 0 .952 0 0)" strokeWidth=".63">
    <path d="m0 0-2.3 4.3m2.3-4.3 2.5 4.2" fill="none"/>
    <path d="M-3.3 2.7q2.5-1.8 5.4-.8l1.2 1-5.4.9Z" fill={cream}/>
    <path d="m-2.5 3.5.5 3.6m4-4.3.3 3.4" fill="none"/>
    <path d="m-2.9 6.1 5.6-.9.5 2.5-1 1.3-3.8.5-1.1-1.1Z" fill={color}/>
    <path d="m-1.1 7.2 2.4-.4" fill="none" stroke={cream} strokeWidth=".55"/>
  </g>
}

export function FerrisWheel() {
  return <g stroke={graphite} strokeWidth=".8" strokeLinejoin="round" strokeLinecap="round">
    <path d="m-20 0 9-5 32 4-11 6Z" fill="#686c53" opacity=".15" stroke="none"/>
    <path d="m-17-1.6 8-3.5 26 3.3-8.4 4.2Z" fill="#d2c7a7"/>
    <Legs rear/>
    <g transform="matrix(.86 .145 0 1.05 0 -37)">
      <g className="fair-wheel-rim">
        <g fill="none">
          <circle cx="3" cy="-1.5" r="23" stroke="#827e67" strokeWidth="1.4"/>
          {seats.map(({x,y},i) => <g key={i}>
            <path d={`M3-1.5 ${x+3} ${y-1.5} ${x} ${y} 0 0`} stroke="#8f9581" strokeWidth=".65"/>
            <path d={`M${x*.4} ${y*.4} ${seats[(i+1)%seats.length].x*.77} ${seats[(i+1)%seats.length].y*.77}`} stroke="#b39577" strokeWidth=".55"/>
          </g>)}
          <circle r="23" stroke="#a35f4b" strokeWidth="1.65"/>
          <circle r="19.6" stroke="#b4805b" strokeWidth=".82"/>
          <circle r="9" stroke="#8a9d80" strokeWidth=".7"/>
        </g>
        {seats.map(({x,y},i) => <g key={i} transform={`translate(${x} ${y})`}>
          <g className="fair-wheel-cab"><Car color={cabColors[i%cabColors.length]}/></g>
        </g>)}
      </g>
    </g>
    <Legs/>
    <ellipse cx="0" cy="-36.5" rx="3" ry="3.2" fill="#d7ae55"/>
    <circle cy="-36.5" r="1.05" fill="#936e4b"/>
  </g>
}

export function MarketStall({ color }: { color: string }) {
  return <g stroke={graphite} strokeWidth=".65" strokeLinejoin="round" strokeLinecap="round">
    <path d="m-13-1 10-4 17 4-10 6Z" stroke="none" fill="#615d48" opacity=".14"/>
    <path d="M-9-3v-16m17 16.5v-16" strokeWidth="1.6" stroke="#897654"/>
    <g data-layer="vendor">
      <path d="M-2.3-7v-3.2q.2-2 2.4-2.1 2 .3 2.2 2.1V-7Z" fill="#6f978e"/>
      <circle cy="-13.7" r="1.7" fill="#d9a47d"/>
      <path d="M-2-14.8q.8-2.1 3-1.1l.6 1-3.6.7Z" fill={cream}/>
    </g>
    <path fill="#d6ac77" d="m-11-6 8-3.8 14.6 6.1-8.1 4Z"/>
    <path fill="#bd9266" d="m-11-6 14.5 6.3v4.2L-11-1.7Z"/>
    <path fill="#a58260" d="m3.5.3 8.1-4v4.3l-8.1 3.9Z"/>
    <path d="m-9.5-4.3 11 4.8m-11-3.3 11 4.8m3.7-.5 5-2.3" fill="none" stroke="#897554" strokeWidth=".45"/>
    {['#c36a45','#d5a444','#9dad64'].map((fruit,i)=><g key={fruit} transform={`translate(${-6+i*4.6} ${-6+i*1.94})`}>
      <path d="m-2 0 3.4-1.6 4.1 1.7-3.6 1.6Z" fill="#be956b"/>
      {[0,1,2,3].map(n=><circle key={n} cx={(n%2)*1.6+(n>1?1.05:0)} cy={(n%2)*.58-(n>1?.88:0)} r=".93" strokeWidth=".32" fill={fruit}/>)}
    </g>)}
    <path d="M-11-5.6v-9.6M4.1.3v-9.5" strokeWidth="1.35" stroke="#917854"/>
    <g data-layer="awning">
      <path d="m-12.7-16 8.2-6.4 2.4 1 14.8 6.3-8.1 6.4Z" fill={cream}/>
      {Array.from({length:4},(_,i)=><path key={i} d={`m${-12.7+i*4.3} ${-16+i*1.82} 8.2-6.4 2.2.92-8.2 6.4Z`} fill={color} strokeWidth=".26"/>)}
      {Array.from({length:8},(_,i)=><path key={i} d={`m${-12.7+i*2.15} ${-16+i*.91} 2.15.91v1.6q-.9 1.2-2.15-.9Z`} fill={i%2 ? cream : color} strokeWidth=".42"/>)}
      <path d="m4.6-8.7 8.1-6.4-.1 1.8-8 6.2Z" fill={color}/>
    </g>
  </g>
}
