import { useState, useEffect } from 'react'
import { provider, shortAddr } from '../lib/providers/mockProvider'
import { computeGuruScore } from '../lib/engines/scoring'
import { WalletStats, Trade } from '../lib/types'

export function Compare(){
  const [a,setA]=useState('0x91A172F')
  const [b,setB]=useState('0x71C081A')
  const [dataA,setDataA]=useState<{stats:WalletStats,trades:Trade[], score:any }|null>(null)
  const [dataB,setDataB]=useState<{stats:WalletStats,trades:Trade[], score:any }|null>(null)

  async function load(){
    const fullA = (await provider.searchWallets(a))[0]?.address || (a.startsWith('0x')? a: '')
    const fullB = (await provider.searchWallets(b))[0]?.address || (b.startsWith('0x')? b: '')
    const [sa,ta]= await Promise.all([provider.getWalletStats(fullA || a), provider.getWalletTrades(fullA || a, 30)])
    const [sb,tb]= await Promise.all([provider.getWalletStats(fullB || b), provider.getWalletTrades(fullB || b, 30)])
    if(sa) setDataA({stats:sa,trades:ta, score: computeGuruScore(sa,ta)})
    if(sb) setDataB({stats:sb,trades:tb, score: computeGuruScore(sb,tb)})
  }
  useEffect(()=>{ load() },[])

  const winner = dataA && dataB ? (dataA.score.total > dataB.score.total ? 'A':'B') : null
  const why:string[] = []
  if(dataA && dataB){
    if(dataA.score.consistency > dataB.score.consistency+4) why.push('Better consistency')
    else if(dataB.score.consistency > dataA.score.consistency+4) why.push('Better consistency (B)')
    if(dataA.score.earlyEntries > dataB.score.earlyEntries+4) why.push('Earlier entries (A)')
    else if(dataB.score.earlyEntries > dataA.score.earlyEntries+4) why.push('Earlier entries (B)')
    if(dataA.score.rugAvoidance > dataB.score.rugAvoidance+4) why.push('Lower rug exposure (A)')
    else if(dataB.score.rugAvoidance > dataA.score.rugAvoidance+4) why.push('Lower rug exposure (B)')
    if(dataA.stats.roi > dataB.stats.roi*1.2) why.push('Higher ROI (A)')
    else if(dataB.stats.roi > dataA.stats.roi*1.2) why.push('Higher ROI (B)')
  }

  return (
    <div style={{display:'grid', gap:14, paddingBottom:40}}>
      <div className="card" style={{padding:16}}>
        <div style={{fontWeight:900, fontSize:18}}>WALLET VS WALLET</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:12, alignItems:'center', marginTop:12}}>
          <input value={a} onChange={e=>setA(e.target.value)} placeholder="Wallet A (0x…)" style={{background:'#0a0f1c', border:'1px solid #1e2e4a', color:'#e5edff', padding:'10px 14px', borderRadius:999}} />
          <span style={{fontWeight:900, color:'#7d8aa6'}}>VS</span>
          <input value={b} onChange={e=>setB(e.target.value)} placeholder="Wallet B (0x…)" style={{background:'#0a0f1c', border:'1px solid #1e2e4a', color:'#e5edff', padding:'10px 14px', borderRadius:999}} />
        </div>
        <button className="btn btn-primary" style={{marginTop:12}} onClick={load}>Compare →</button>
      </div>

      {dataA && dataB && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}} className="resp2">
          {[dataA,dataB].map((d,i)=>(
            <div key={i} className="card" style={{padding:14, borderColor: (winner=== (i===0?'A':'B'))? '#b8ff33':'#1e2e4a', boxShadow: winner=== (i===0?'A':'B')? '0 0 24px rgba(184,255,51,0.12)':''}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span style={{fontWeight:800}}>WALLET {i===0?'A':'B'}</span>
                {winner=== (i===0?'A':'B') && <span className="badge badge-neon">WINNER</span>}
              </div>
              <div className="mono" style={{fontSize:12, color:'#7d8aa6'}}>{shortAddr(d.stats.address)}</div>
              <div style={{fontSize:32, fontWeight:900, marginTop:6}}>{d.score.total.toFixed(1)} <span style={{fontSize:11, color:'#7d8aa6', fontWeight:700}}>GURU SCORE</span></div>
              <div style={{marginTop:10, display:'grid', gap:6, fontSize:12}}>
                {[
                  ['PnL', `$${d.stats.totalRealizedPnL.toLocaleString()}`],
                  ['ROI', `${d.stats.roi.toFixed(1)}%`],
                  ['Win rate', `${d.stats.winRate.toFixed(1)}%`],
                  ['Trades', String(d.stats.numTrades)],
                  ['Early-entry', `${d.stats.earlyEntryRate}%`],
                  ['Rug exp', `${d.stats.rugExposure}%`],
                  ['Avg hold', `${(d.stats.avgHoldingSec/3600).toFixed(1)}h`],
                ].map(([k,v])=> <div key={k} style={{display:'flex', justifyContent:'space-between', padding:'6px 8px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid #1e2e4a'}}><span style={{color:'#7d8aa6'}}>{k}</span><span style={{fontWeight:800}}>{v}</span></div>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {winner && (
        <div className="card" style={{padding:14, borderColor:'#b8ff33', background:'rgba(184,255,51,0.06)'}}>
          <div style={{fontWeight:900}}>WINNER: WALLET {winner} <span style={{fontWeight:400, color:'#7d8aa6'}}> — based on configurable metrics</span></div>
          <ul style={{marginTop:8, display:'grid', gap:4, listStyle:'none'}}>
            {why.map(w=> <li key={w} style={{fontSize:12}}><span style={{color:'#b8ff33'}}>＋</span> {w}</li>)}
            {why.length===0 && <li style={{fontSize:12, color:'#7d8aa6'}}>Scores are close — review breakdown for nuance.</li>}
          </ul>
          <button className="btn btn-ghost" style={{marginTop:10}} onClick={()=> alert('Share comparison card — viral loop')}>♡ Share Comparison Card</button>
        </div>
      )}
      <style>{`@media(max-width:900px){.resp2{grid-template-columns:1fr !important}}`}</style>
    </div>
  )
}
