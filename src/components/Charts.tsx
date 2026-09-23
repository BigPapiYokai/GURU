export function Sparkline({ data, color='#b8ff33', height=48 }: { data:{t:number,value:number}[], color?:string, height?:number }){
  if(!data.length) return null
  const w=260, pad=6
  const min=Math.min(...data.map(d=>d.value)), max=Math.max(...data.map(d=>d.value))
  const range = max-min || 1
  const pts = data.map((d,i)=> {
    const x = pad + (i/(data.length-1))*(w-pad*2)
    const y = height-pad - ((d.value-min)/range)*(height-pad*2)
    return `${x},${y}`
  }).join(' ')
  // gradient area
  const area = `${pts} ${w-pad},${height-pad} ${pad},${height-pad}`
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${height}`} style={{display:'block'}}>
      <polygon points={area} fill={color} opacity={0.12} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function Bars({ data }: { data:{month:string,pnl:number}[]}){
  const w=300, h=96, pad=14
  const maxPnl = Math.max(...data.map(d=>Math.abs(d.pnl)), 1)
  const barW = (w-pad*2)/data.length -6
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{display:'block'}}>
      <line x1={pad} x2={w-pad} y1={h/2} y2={h/2} stroke="#1e2e4a" strokeDasharray="4 4" />
      {data.map((d,i)=>{
        const x = pad + i*((w-pad*2)/data.length) +3
        const bh = Math.abs(d.pnl)/maxPnl * (h/2 -12)
        const y = d.pnl>=0? h/2 - bh : h/2
        return <g key={d.month}>
          <rect x={x} y={y} width={barW} height={bh} rx={3} fill={d.pnl>=0? '#b8ff33':'#ef4444'} opacity={0.9} />
          <text x={x+barW/2} y={h-4} textAnchor="middle" fontSize={8} fontWeight={700} fill="#64748b">{d.month}</text>
        </g>
      })}
    </svg>
  )
}

export function PnLLine({ data }: { data:{t:number,value:number}[] }){
  return <Sparkline data={data} color="#00ffa6" />
}
