import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { provider } from '../lib/providers/mockProvider'
import { Token } from '../lib/types'

export function Tokens(){
  const [tokens,setTokens]=useState<Token[]>([])
  const [q,setQ]=useState('')
  useEffect(()=>{ provider.searchTokens('').then(setTokens) },[])
  async function search(v:string){ setQ(v); const r=await provider.searchTokens(v); setTokens(r as any)}
  return (
    <div style={{display:'grid', gap:14, paddingBottom:40}}>
      <div className="card" style={{padding:16}}>
        <div style={{fontWeight:900, fontSize:18}}>TOKEN INTELLIGENCE</div>
        <div style={{fontSize:12, color:'#7d8aa6', marginTop:4}}>Evidence over calls. Holder growth, liquidity, smart-money inflows — not BUY/SELL.</div>
        <div style={{marginTop:12, display:'flex', gap:8}}>
          <input value={q} onChange={e=>search(e.target.value)} placeholder="Search $GURU, $PEPE, address…" style={{flex:1, background:'#0a0f1c', border:'1px solid #1e2e4a', color:'#e5edff', padding:'10px 14px', borderRadius:999}} />
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px,1fr))', gap:12}}>
        {tokens.map(t=>(
          <Link key={t.address} to={`/token/${t.address}`} style={{textDecoration:'none'}} className="card" >
            <div style={{padding:14, display:'grid', gap:8}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{fontWeight:900}}>{t.symbol} <span style={{fontWeight:400, color:'#7d8aa6', fontSize:12}}>{t.name}</span></span>
                <span className="badge" style={{background: t.risk==='LOW'?'rgba(34,197,94,0.12)': t.risk==='HIGH'?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.12)', color: t.risk==='LOW'?'#22c55e': t.risk==='HIGH'?'#ef4444':'#f59e0b'}}>{t.risk} RISK</span>
              </div>
              <div style={{fontSize:12, color:'#7d8aa6'}} className="mono">{t.chain} • ${t.price} <span style={{color: t.priceChange24h>=0?'#22c55e':'#ef4444'}}> {t.priceChange24h>=0?'+':''}{t.priceChange24h.toFixed(1)}%</span></div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, fontSize:11}}>
                <div style={{background:'rgba(255,255,255,0.03)', padding:8, borderRadius:8, border:'1px solid #1e2e4a'}}><div style={{color:'#7d8aa6'}}>MCAP</div><div style={{fontWeight:800}}>${(t.marketCap/1_000_000).toFixed(1)}M</div></div>
                <div style={{background:'rgba(255,255,255,0.03)', padding:8, borderRadius:8, border:'1px solid #1e2e4a'}}><div style={{color:'#7d8aa6'}}>LIQ</div><div style={{fontWeight:800}}>${(t.liquidity/1000).toFixed(0)}k</div></div>
                <div style={{background:'rgba(255,255,255,0.03)', padding:8, borderRadius:8, border:'1px solid #1e2e4a'}}><div style={{color:'#7d8aa6'}}>HOLDERS</div><div style={{fontWeight:800}}>{t.holders.toLocaleString()}</div></div>
              </div>
              <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                <span className="badge" style={{fontSize:10}}>{t.category}</span>
                <span className="badge" style={{fontSize:10}}>Vol ${(t.volume24h/1000).toFixed(0)}k</span>
                <span className="badge" style={{fontSize:10}}>Top10 {t.concentrationTop10.toFixed(0)}%</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function TokenDetail(){
  const addr = window.location.pathname.split('/').pop() || ''
  const [token,setToken]=useState<Token|null>(null)
  const [holders,setHolders]=useState<any[]>([])
  const [convergences,setConvergences]=useState<any[]>([])
  useEffect(()=>{
    provider.getToken(addr).then(setToken as any)
    provider.getTokenHolders(addr).then(setHolders)
    provider.getConvergences().then(c=> setConvergences(c.filter(x=> x.tokenAddress.toLowerCase()===addr.toLowerCase())))
  },[addr])
  if(!token) return <div style={{padding:40, color:'#7d8aa6'}}>Loading token intelligence…</div>
  return (
    <div style={{display:'grid', gap:14, paddingBottom:40}}>
      <div className="card" style={{padding:16}}>
        <div style={{display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12}}>
          <div>
            <div style={{fontWeight:900, fontSize:22}}>{token.symbol} <span style={{fontWeight:400, color:'#7d8aa6', fontSize:14}}>{token.name} • {token.chain}</span></div>
            <div className="mono" style={{fontSize:11, color:'#7d8aa6'}}>{token.address}</div>
            <div style={{marginTop:8, display:'flex', gap:8, flexWrap:'wrap'}}>
              <span className="badge badge-neon">${token.price} • {token.priceChange24h>=0?'+':''}{token.priceChange24h.toFixed(2)}% 24h</span>
              <span className="badge">MC ${(token.marketCap/1_000_000).toFixed(2)}M</span>
              <span className="badge">Liq ${(token.liquidity/1000).toFixed(0)}k</span>
              <span className="badge">Holders {token.holders.toLocaleString()} ({token.holderGrowth24h>=0?'+':''}{token.holderGrowth24h.toFixed(1)}% 24h)</span>
            </div>
          </div>
          <div style={{textAlign:'right', minWidth:160}}>
            <div style={{fontSize:10, fontWeight:800, letterSpacing:0.8, color:'#7d8aa6'}}>RISK INDICATORS</div>
            <div style={{marginTop:6, display:'grid', gap:6}}>
              <div style={{padding:'6px 10px', borderRadius:999, background: token.risk==='LOW'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)', border:'1px solid rgba(255,255,255,0.08)', fontWeight:800, fontSize:12, color: token.risk==='LOW'?'#22c55e':'#ef4444'}}>{token.risk} • Top10 {token.concentrationTop10.toFixed(0)}%</div>
              <div style={{fontSize:11, color:'#7d8aa6'}}>Age {token.ageDays}d • 24h Vol ${(token.volume24h/1000).toFixed(0)}k</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:14}} className="resp">
        <div className="card" style={{padding:14}}>
          <div style={{fontWeight:800, fontSize:12}}>HOLDERS & CONCENTRATION</div>
          <div style={{display:'grid', gap:8, marginTop:10}}>
            {holders.map((h:any)=>(
              <div key={h.address} style={{display:'flex', justifyContent:'space-between', padding:'8px 10px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid #1e2e4a'}}>
                <span className="mono" style={{fontSize:12}}>{h.address.slice(0,6)}…{h.address.slice(-4)}</span>
                <span className="mono" style={{fontWeight:700}}>{h.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:10, fontSize:11, color:'#7d8aa6'}}>Holder concentration indicates whale control risk. High concentration ≠ imminent rug, but observable risk.</div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontWeight:800, fontSize:12}}>SMART MONEY ACTIVITY</div>
          {convergences.length? convergences.map((c:any)=>(
            <div key={c.tokenAddress} style={{marginTop:10, padding:10, borderRadius:12, background:'rgba(184,255,51,0.06)', border:'1px solid rgba(184,255,51,0.14)'}}>
              <div style={{fontWeight:800}}>{c.numGuruWallets} guru wallets • avg {c.avgGuruScore}</div>
              <div className="mono" style={{fontSize:11, color:'#7d8aa6'}}>Combined ${c.combinedEntriesUSD.toLocaleString()} • {c.entriesLastMinutes} in 90m • {c.confidence}</div>
              <div style={{fontSize:11, color:'#cbd5e1', marginTop:6}}>Historical success {c.historicalSuccessRate}% — presented as observable evidence.</div>
            </div>
          )): <div style={{marginTop:10, padding:14, borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid #1e2e4a', fontSize:12, color:'#7d8aa6'}}>Insufficient evidence — no convergence detected currently.</div>}
          <div style={{marginTop:10, fontSize:11, color:'#7d8aa6'}}>Not a buy/sell signal. Track evidence: entries, liquidity, holder changes over time.</div>
        </div>
      </div>

      <style>{`@media(max-width:900px){.resp{grid-template-columns:1fr !important}}`}</style>
    </div>
  )
}
