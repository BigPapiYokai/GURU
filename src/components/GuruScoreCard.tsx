import { GuruScoreBreakdown } from '../lib/types'
import { tierForScore } from '../lib/engines/scoring'

export function GuruScoreCard({ breakdown, address }: { breakdown: GuruScoreBreakdown, address?: string }){
  const tier = tierForScore(breakdown.total)
  return (
    <div className="card card-neon" style={{padding:16, display:'grid', gap:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
        <div>
          <div style={{fontSize:10, fontWeight:800, letterSpacing:1.2, color:'#7d8aa6'}}>GURU SCORE</div>
          <div style={{display:'flex', alignItems:'baseline', gap:8, marginTop:4}}>
            <span style={{fontSize:42, fontWeight:900, letterSpacing:-1}}>{breakdown.total.toFixed(1)}</span>
            <span className="badge" style={{background:tier.color+'18', color:tier.color, borderColor:tier.color+'55'}}>{tier.label}</span>
          </div>
          <div style={{fontSize:11, color:'#7d8aa6'}}>Top {(100-breakdown.total).toFixed(1)}% • Ranked vs 12,400 wallets</div>
        </div>
        <div style={{width:86,height:86, borderRadius:999, background:`conic-gradient(${tier.color} ${breakdown.total}%, #1e2e4a 0)`, display:'grid', placeItems:'center', padding:4}}>
          <div style={{width:'100%',height:'100%', borderRadius:999, background:'#0a0f1c', display:'grid', placeItems:'center'}}>
            <span style={{fontWeight:900, fontSize:20, color:tier.color}}>{Math.round(breakdown.total)}</span>
          </div>
        </div>
      </div>

      <div style={{display:'grid', gap:7}}>
        {[
          ['Profitability', breakdown.profitability],
          ['Consistency', breakdown.consistency],
          ['Early Entries', breakdown.earlyEntries],
          ['Risk Management', breakdown.riskManagement],
          ['Rug Avoidance', breakdown.rugAvoidance],
          ['Timing', breakdown.timing],
          ['Longevity', breakdown.longevity],
          ['Position Mgmt', breakdown.positionManagement],
        ].map(([label,val])=>(
          <div key={label as string} style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:110, fontSize:11, fontWeight:700, color:'#7d8aa6'}}>{label as string}</div>
            <div style={{flex:1, height:6, borderRadius:999, background:'#0f172a', border:'1px solid #1e2e4a', overflow:'hidden'}}>
              <div style={{width:`${val as number}%`, height:'100%', background: (val as number)>88? '#b8ff33': (val as number)>70?'#00ffa6':'#8b5cf6'}} />
            </div>
            <div style={{width:28, textAlign:'right', fontSize:12, fontWeight:800}}>{val as number}</div>
          </div>
        ))}
      </div>

      <div style={{background:'rgba(184,255,51,0.06)', border:'1px solid rgba(184,255,51,0.14)', borderRadius:12, padding:10}}>
        <div style={{fontSize:11, fontWeight:800, color:'#b8ff33'}}>WHY THIS SCORE?</div>
        <ul style={{marginTop:6, display:'grid', gap:4, listStyle:'none'}}>
          {breakdown.reasoning.slice(0,5).map((r,i)=> <li key={i} style={{fontSize:11, color:'#cbd5e1', display:'flex', gap:6}}><span style={{color:'#b8ff33'}}>•</span> {r}</li>)}
        </ul>
        <div style={{marginTop:8, fontSize:10, color:'#7d8aa6'}}>Score = 22% profit +18% consistency +14% early +12% risk +10% rug +10% timing +7% longevity +7% position. Dampened for &lt;20 trades.</div>
      </div>

      {address && <div className="mono" style={{fontSize:10, color:'#4b5a78', textAlign:'center'}}>Wallet {address.slice(0,6)}…{address.slice(-4)} • Scored at {new Date().toLocaleTimeString()}</div>}
    </div>
  )
}
