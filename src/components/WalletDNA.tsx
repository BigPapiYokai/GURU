import { WalletDNA as DNAType } from '../lib/types'

export function WalletDNA({ dna }: { dna: DNAType }){
  return (
    <div className="card" style={{padding:16, display:'grid', gap:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{fontWeight:800, letterSpacing:0.5}}>WALLET DNA</div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>{dna.archetypes.map(a=> <span key={a} className="badge" style={{background:'rgba(139,92,246,0.12)', color:'#a78bfa', borderColor:'rgba(139,92,246,0.28)', fontSize:10}}>{a}</span>)}</div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
        <div style={{display:'grid', gap:8}}>
          {dna.traits.map(t=>(
            <div key={t.label}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:700}}><span style={{color:'#cbd5e1'}}>{t.label}</span><span style={{color: t.score>88?'#b8ff33': t.score>70?'#00ffa6':'#7d8aa6'}}>{t.score}</span></div>
              <div style={{height:6, borderRadius:999, background:'#0f172a', border:'1px solid #1e2e4a', overflow:'hidden', marginTop:4}}>
                <div style={{width:`${t.score}%`, height:'100%', background: t.score>88? 'linear-gradient(90deg,#b8ff33,#00ffa6)': t.score>70? '#00ffa6':'#3b4a67'}}/>
              </div>
              <div style={{fontSize:10, color:'#64748b', marginTop:2}}>{t.description} • {t.confidence}</div>
            </div>
          ))}
        </div>

        {/* Radar */}
        <div style={{display:'grid', placeItems:'center', background:'radial-gradient(300px 200px at 50% 50%, rgba(139,92,246,0.18), transparent)', border:'1px solid #1e2e4a', borderRadius:12, padding:10}}>
          <RadarChart data={dna.radar} />
          <div style={{display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', marginTop:8}}>
            {dna.achievements.slice(0,4).map(a=>(
              <span key={a.id} className="badge" style={{background:'rgba(250,204,21,0.08)', borderColor:'rgba(250,204,21,0.22)', color:'#facc15', fontSize:10}}>{a.icon} {a.title}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function RadarChart({ data }: { data:{dimension:string,value:number}[]}){
  const size=160, cx=size/2, cy=size/2, r=62, n=data.length
  const pts = data.map((d,i)=>{
    const ang = (Math.PI*2 * i / n) - Math.PI/2
    const rad = (d.value/100)*r
    return [cx + Math.cos(ang)*rad, cy + Math.sin(ang)*rad, ang]
  })
  const grid = [0.25,0.5,0.75,1].map(lvl=> data.map((_,i)=>{
    const ang = (Math.PI*2 * i / n) - Math.PI/2
    return [cx+ Math.cos(ang)*r*lvl, cy+ Math.sin(ang)*r*lvl]
  }).map(p=>p.join(',')).join(' '))
  const path = pts.map(p=>p.slice(0,2).join(',')).join(' ')
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow:'visible'}}>
      {grid.map((g,i)=> <polygon key={i} points={g} fill="none" stroke="#1e2e4a" strokeWidth={1} opacity={0.9-(i*0.15)} />)}
      {data.map((d,i)=>{
        const ang = (Math.PI*2 * i / n) - Math.PI/2
        return <line key={i} x1={cx} y1={cy} x2={cx+Math.cos(ang)*r} y2={cy+Math.sin(ang)*r} stroke="#1e2e4a" strokeWidth={1} />
      })}
      <polygon points={path} fill="rgba(184,255,51,0.22)" stroke="#b8ff33" strokeWidth={1.5} />
      {pts.map((p,i)=> <circle key={i} cx={p[0]} cy={p[1]} r={3} fill="#b8ff33" stroke="#0a0f1c" strokeWidth={1} />)}
      {data.map((d,i)=>{
        const ang = (Math.PI*2 * i / n) - Math.PI/2
        const lx = cx + Math.cos(ang)*(r+18)
        const ly = cy + Math.sin(ang)*(r+14)
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={7} fontWeight={800} fill="#7d8aa6">{d.dimension.toUpperCase()}</text>
      })}
    </svg>
  )
}
