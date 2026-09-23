import { useEffect, useState } from 'react'
import { provider, shortAddr } from '../lib/providers/mockProvider'
import { Convergence as ConvType } from '../lib/types'
import { Link } from 'react-router-dom'

export function ConvergencePage(){
  const [convs,setConvs]=useState<ConvType[]>([])
  useEffect(()=>{ provider.getConvergences().then(setConvs)},[])
  return (
    <div style={{display:'grid', gap:14, paddingBottom:40}}>
      <div className="card" style={{padding:16, borderColor:'rgba(184,255,51,0.18)'}}>
        <div style={{fontWeight:900, fontSize:18}}>SMART MONEY CONVERGENCE</div>
        <div style={{fontSize:12, color:'#7d8aa6', marginTop:4}}>Detect when multiple high-quality wallets begin interacting with the same token. <strong style={{color:'#b8ff33'}}>Observable evidence</strong> — never guaranteed profit.</div>
      </div>

      {convs.length===0? <div className="card" style={{padding:20, color:'#7d8aa6'}}>Insufficient evidence — no convergence currently. Criteria: ≥3 GURU ≥84 wallets within 90m.</div> :
      <div style={{display:'grid', gap:12}}>
        {convs.map(c=>(
          <div key={c.tokenAddress} className="card" style={{padding:0, overflow:'hidden', borderColor: c.confidence==='HIGH'?'rgba(184,255,51,0.24)':'#1e2e4a'}}>
            <div style={{display:'flex', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid #1e2e4a', background: c.confidence==='HIGH'?'rgba(184,255,51,0.06)':'transparent'}}>
              <div>
                <div style={{fontWeight:900}}>{c.tokenSymbol} <span style={{fontWeight:400, color:'#7d8aa6'}}>• {c.chain} • {(c.liquidity/1000).toFixed(0)}k liq</span> <span className="badge" style={{marginLeft:6, background: c.confidence==='HIGH'?'#b8ff33':'#1e2e4a', color: c.confidence==='HIGH'?'#05070f':'#7d8aa6'}}>{c.confidence} CONFIDENCE</span></div>
                <div className="mono" style={{fontSize:11, color:'#7d8aa6'}}>{c.tokenAddress}</div>
              </div>
              <Link to={`/token/${c.tokenAddress}`} className="btn btn-ghost" style={{padding:'6px 12px', fontSize:12}}>Token →</Link>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:10, padding:14}}>
              {[
                ['GURU wallets holding', String(c.numGuruWallets)],
                ['Entered within 90m', String(c.entriesLastMinutes)],
                ['Combined entries', `$${c.combinedEntriesUSD.toLocaleString()}`],
                ['Avg GURU Score', String(c.avgGuruScore)],
                ['Historical success', `${c.historicalSuccessRate}%`],
                ['Holder change 24h', `${c.holderChange24h.toFixed(1)}%`],
              ].map(([k,v])=>(
                <div key={k} style={{background:'rgba(255,255,255,0.03)', border:'1px solid #1e2e4a', borderRadius:10, padding:10}}>
                  <div style={{fontSize:10, fontWeight:800, color:'#7d8aa6', letterSpacing:0.6}}>{k}</div>
                  <div style={{fontWeight:900, marginTop:4}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{padding:'0 14px 14px'}}>
              <div style={{fontSize:11, fontWeight:800, color:'#7d8aa6'}}>ENTRIES</div>
              <div style={{display:'grid', gap:6, marginTop:6}}>
                {c.entries.map((e,i)=>(
                  <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 10px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid #1e2e4a', fontSize:12}}>
                    <Link to={`/wallet/${e.wallet}`} className="mono" style={{color:'#00e5ff', textDecoration:'none'}}>{shortAddr(e.wallet)}</Link>
                    <span className="badge" style={{fontSize:10}}>GURU {e.score}</span>
                    <span className="mono">${e.amount.toLocaleString()}</span>
                    <span className="mono" style={{fontSize:11, color:'#7d8aa6'}}>{new Date(e.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
              <div style={{marginTop:10, padding:'8px 10px', borderRadius:10, background:'rgba(0,229,255,0.06)', border:'1px solid rgba(0,229,255,0.14)', fontSize:11, color:'#cbd5e1'}}>
                Intelligence: {c.numGuruWallets} high-quality wallets converging. {c.entriesLastMinutes} entries in last 90m. Liquidity { (c.liquidity/1000).toFixed(0)}k. Historical pattern {c.historicalSuccessRate}% positive — not a guarantee. Research holder growth & liquidity before sizing.
              </div>
            </div>
          </div>
        ))}
      </div>
      }

      <div className="card" style={{padding:14, background:'rgba(239,68,68,0.04)', borderColor:'rgba(239,68,68,0.14)'}}>
        <div style={{fontWeight:800, fontSize:12, color:'#fca5a5'}}>RISK DISCLOSURE</div>
        <div style={{fontSize:11, color:'#7d8aa6', marginTop:4}}>Convergence is evidence of clustered smart-money behavior, not prediction. Tokens can drop after convergence. Always verify liquidity, holder concentration, and dev activity.</div>
      </div>
    </div>
  )
}
