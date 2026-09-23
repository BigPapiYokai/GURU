import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SearchBar } from '../components/SearchBar'
import { provider, shortAddr } from '../lib/providers/mockProvider'
import { MOCK_TOKENS } from '../lib/providers/mockProvider'
import { LiveEvent, Token } from '../lib/types'
import { Sparkline } from '../components/Charts'

export function Home(){
  const [events,setEvents]=useState<LiveEvent[]>([])
  const [filter,setFilter]=useState<'ALL'|'BUY'|'SELL'>('ALL')
  const [chain,setChain]=useState<string>('ALL')
  const [guruMin,setGuruMin]=useState(0)
  const nav=useNavigate()
  useEffect(()=>{ provider.getLiveEvents().then(setEvents) },[])
  const filtered = events.filter(e=> (filter==='ALL'|| e.action===filter) && (chain==='ALL'|| e.chain===chain) && e.guruScore>=guruMin)

  return (
    <div style={{display:'grid', gap:18, paddingBottom:40}}>
      {/* HERO — §3 */}
      <div style={{position:'relative', overflow:'hidden', borderRadius:20, border:'1px solid rgba(184,255,51,0.14)', background:'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(7,10,20,0.98) 100%)', padding:'22px 18px 18px'}}>
        <div style={{position:'absolute', inset:0, background:'radial-gradient(800px 400px at 25% 0%, rgba(184,255,51,0.08), transparent 60%), radial-gradient(600px 300px at 90% 20%, rgba(255,46,157,0.07), transparent 60%)'}}/>
        <div style={{position:'relative', display:'grid', gridTemplateColumns:'1.15fr 0.85fr', gap:18, alignItems:'center'}}>
          <div>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <span className="badge badge-neon" style={{fontSize:10}}>ON-CHAIN INTELLIGENCE × SOCIAL TRADING × MEME COIN</span>
              <span style={{fontSize:10, color:'#7d8aa6', fontWeight:700}}>REAL UTILITY • REAL DATA • REAL ALPHA</span>
            </div>
            <h1 className="guru-title" style={{fontSize:54, lineHeight:0.9, marginTop:12, letterSpacing:-2}}><span style={{color:'#b8ff33', textShadow:'0 0 18px rgba(184,255,51,0.5)'}}>$GURU</span></h1>
            <div style={{fontSize:22, fontWeight:900, letterSpacing:1.2, color:'#e5edff', marginTop:4}}>SPOT THE SMART MONEY.</div>
            <div style={{fontSize:13, color:'#7d8aa6', marginTop:8, maxWidth:560}}>Analyze wallets. Discover smart money. Track behavior. Find the gurus before everyone else. <span style={{color:'#ff2e9d', fontWeight:700}}>Every wallet has a reputation.</span></div>
            <div style={{marginTop:16, maxWidth:640}}>
              <SearchBar large />
              <div style={{display:'flex', gap:6, marginTop:8, flexWrap:'wrap'}}>
                {['Same chain. Different brains.','Don’t chase coins. Follow behavior.','Find the wallets worth watching.'].map(s=> <span key={s} style={{fontSize:11, color:'#64748b', border:'1px solid #1e2e4a', padding:'4px 8px', borderRadius:999, background:'rgba(255,255,255,0.02)'}}>{s}</span>)}
              </div>
            </div>
          </div>

          {/* mascot / hero card */}
          <div style={{position:'relative', display:'grid', placeItems:'center'}}>
            <div style={{position:'absolute', inset:0, background:'radial-gradient(400px 260px at 50% 50%, rgba(184,255,51,0.12), transparent 70%)'}}/>
            <img src="./guru-mascot.png" alt="GURU mascot" style={{width:'100%', maxWidth:420, height:320, objectFit:'cover', objectPosition:'top center', borderRadius:18, border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 12px 40px rgba(0,0,0,0.45)'}} onError={e=> (e.currentTarget.style.display='none')} />
            <div style={{position:'absolute', bottom:10, left:10, right:10, display:'flex', gap:8, justifyContent:'center'}}>
              <span className="badge" style={{background:'#0a0f1c', borderColor:'rgba(184,255,51,0.25)', color:'#b8ff33'}}>🐸 Hood • Gold Chain • Cigar • Degen Billionaire</span>
            </div>
          </div>
        </div>

        {/* secondary slogans */}
        <div style={{position:'relative', marginTop:16, display:'flex', gap:8, flexWrap:'wrap'}}>
          {[
            'Find them before everyone else does.',
            'Track the gurus.',
            'The memecoin that actually works.',
            'On-chain intelligence for degens.',
          ].map(s=> <span key={s} style={{fontSize:11, fontWeight:700, color:'#0a0f1c', background:'#b8ff33', padding:'5px 10px', borderRadius:999}}>{s}</span>)}
        </div>
      </div>

      {/* LIVE SMART MONEY — spec table */}
      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <div className="live-bar" />
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', borderBottom:'1px solid #1e2e4a'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <span className="pulse-dot" />
            <span style={{fontWeight:800, letterSpacing:0.6}}>LIVE SMART MONEY</span>
            <span className="mono" style={{fontSize:11, color:'#7d8aa6'}}>{filtered.length} events • auto-refresh</span>
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <select value={filter} onChange={e=>setFilter(e.target.value as any)} style={{background:'#0a0f1c', border:'1px solid #1e2e4a', color:'#e5edff', padding:'6px 10px', borderRadius:999, fontSize:12, fontWeight:700}}>
              <option value="ALL">All</option><option value="BUY">BUY</option><option value="SELL">SELL</option>
            </select>
            <select value={chain} onChange={e=>setChain(e.target.value)} style={{background:'#0a0f1c', border:'1px solid #1e2e4a', color:'#e5edff', padding:'6px 10px', borderRadius:999, fontSize:12, fontWeight:700}}>
              <option value="ALL">All chains</option><option value="solana">Solana</option><option value="ethereum">Ethereum</option><option value="base">Base</option>
            </select>
            <span style={{fontSize:11, color:'#7d8aa6', fontWeight:700}}>Min GURU</span>
            <input type="range" min={0} max={95} value={guruMin} onChange={e=> setGuruMin(parseInt(e.target.value))} className="range" style={{width:80}} />
            <span className="mono" style={{fontSize:12, fontWeight:800, color:'#b8ff33', minWidth:24}}>{guruMin}</span>
            <Link to="/feed" style={{fontSize:12, fontWeight:800, color:'#8b5cf6'}}>View All →</Link>
          </div>
        </div>

        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
            <thead>
              <tr style={{textAlign:'left', color:'#7d8aa6', fontSize:10, letterSpacing:0.8, borderBottom:'1px solid #1e2e4a'}}>
                <th style={{padding:'10px 14px'}}>WALLET</th>
                <th>ACTION</th>
                <th>TOKEN</th>
                <th style={{textAlign:'right'}}>VALUE</th>
                <th style={{textAlign:'right'}}>GURU SCORE</th>
                <th>REASON</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,8).map(e=>(
                <tr key={e.id} style={{borderBottom:'1px solid rgba(30,46,74,0.6)', cursor:'pointer'}} onClick={()=>nav(`/wallet/${e.walletAddress}`)}>
                  <td style={{padding:'10px 14px'}}><span className="mono" style={{fontWeight:700, color:'#00e5ff'}}>{shortAddr(e.walletAddress)}</span> <span className="badge" style={{marginLeft:6, fontSize:10, background: e.guruScore>90?'rgba(184,255,51,0.12)':'rgba(255,255,255,0.04)', color: e.guruScore>90?'#b8ff33':'#7d8aa6'}}>{e.walletLabels[0]}</span></td>
                  <td><span style={{padding:'4px 8px', borderRadius:999, fontWeight:800, fontSize:11, background: e.action==='BUY'?'rgba(34,197,94,0.14)':'rgba(239,68,68,0.14)', color: e.action==='BUY'?'#22c55e':'#ef4444', border:`1px solid ${e.action==='BUY'?'rgba(34,197,94,0.28)':'rgba(239,68,68,0.28)'}`}}>{e.action}</span></td>
                  <td style={{fontWeight:800}}>{e.tokenSymbol}</td>
                  <td style={{textAlign:'right'}} className="mono">${e.valueUSD.toLocaleString()}</td>
                  <td style={{textAlign:'right'}}><span style={{fontWeight:900, color: e.guruScore>92?'#b8ff33': e.guruScore>86?'#00ffa6':'#e5edff', background: e.guruScore>92?'rgba(184,255,51,0.1)':'transparent', padding:'2px 8px', borderRadius:999}}>{e.guruScore}</span></td>
                  <td style={{color:'#7d8aa6', fontSize:12}}>{e.reason} <span style={{color: e.confidence==='HIGH'? '#b8ff33': '#64748b', fontSize:10, fontWeight:800}}> • {e.confidence}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* three columns: Top Traders / Token Intelligence / Wallet DNA preview */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:12}}>
        <TopTraders />
        <TokenIntelligenceCard token={MOCK_TOKENS.find(t=>t.symbol==='$GURU') as Token} />
        <div className="card" style={{padding:14}}>
          <div style={{fontWeight:800, fontSize:12, letterSpacing:0.6}}>WALLET DNA — Preview</div>
          <div style={{marginTop:8, display:'grid', placeItems:'center', background:'rgba(139,92,246,0.06)', border:'1px solid #1e2e4a', borderRadius:12, padding:10}}>
             <svg width={180} height={140} viewBox="0 0 180 140">
              <polygon points="90,18 150,52 135,118 45,118 30,52" fill="none" stroke="#1e2e4a" />
              <polygon points="90,36 128,62 118,104 62,104 52,62" fill="rgba(184,255,51,0.18)" stroke="#b8ff33" strokeWidth={1.4} />
              {[[90,18],[150,52],[135,118],[45,118],[30,52]].map((p,i)=> <circle key={i} cx={(90 + (p[0]-90)*0.62)} cy={(70 + (p[1]-70)*0.62)} r={3} fill="#b8ff33" />)}
              <text x={90} y={10} textAnchor="middle" fontSize={8} fontWeight={800} fill="#7d8aa6">EARLY ENTRY</text>
              <text x={160} y={50} textAnchor="middle" fontSize={7} fill="#7d8aa6">CONVICTION</text>
              <text x={140} y={132} textAnchor="middle" fontSize={7} fill="#7d8aa6">RISK MGMT</text>
              <text x={40} y={132} textAnchor="middle" fontSize={7} fill="#7d8aa6">PATIENCE</text>
              <text x={20} y={50} textAnchor="middle" fontSize={7} fill="#7d8aa6">PROFIT</text>
            </svg>
          </div>
          <div style={{marginTop:8, display:'grid', gap:6}}>
            {[
              ['Smart Money',94],
              ['Early Entry',97],
              ['Risk Mgmt',84],
            ].map(([l,v])=>(
              <div key={l as string} style={{display:'flex', alignItems:'center', gap:8, fontSize:11, fontWeight:700}}>
                <span style={{width:96, color:'#7d8aa6'}}>{l as string}</span>
                <span style={{flex:1, height:6, background:'#0f172a', border:'1px solid #1e2e4a', borderRadius:999, overflow:'hidden'}}><span style={{display:'block', width:`${v as number}%`, height:'100%', background:'linear-gradient(90deg,#b8ff33,#00ffa6)'}}/></span>
                <span>{v as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Wallets strip */}
      <div className="card" style={{padding:14}}>
        <div style={{fontWeight:800, fontSize:12, letterSpacing:0.6, display:'flex', justifyContent:'space-between'}}>
          <span>TOP PERFORMING WALLETS</span>
          <Link to="/leaderboard" style={{color:'#b8ff33', fontSize:12}}>Leaderboard →</Link>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:10, marginTop:10}}>
          {[
            { addr:'0x7F3…9a2', roi:'+482.3%', label:'Smart Money', score:94.7, color:'#b8ff33'},
            { addr:'0x4B1…c03', roi:'+391.2%', label:'Whale', score:92.1, color:'#00ffa6'},
            { addr:'0x9E2…7f6', roi:'+276.5%', label:'Narrative Trader', score:90.8, color:'#8b5cf6'},
            { addr:'0x3A7…b91', roi:'+198.4%', label:'Swing Trader', score:88.2, color:'#ff2e9d'},
          ].map(c=>(
            <div key={c.addr} style={{background:'rgba(255,255,255,0.03)', border:'1px solid #1e2e4a', borderRadius:12, padding:10}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span className="mono" style={{fontWeight:800, fontSize:12}}>{c.addr}</span>
                <span style={{fontSize:11, fontWeight:800, color: c.color, background:`${c.color}18`, border:`1px solid ${c.color}33`, padding:'2px 6px', borderRadius:999}}>{c.label}</span>
              </div>
              <div style={{marginTop:6, fontSize:12, fontWeight:800, color:'#22c55e'}}>{c.roi}</div>
              <div style={{fontSize:11, color:'#7d8aa6'}}>GURU {c.score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TopTraders(){
  const [rows,setRows]=useState<any[]>([])
  useEffect(()=>{ provider.getLeaderboard('overall',5).then(setRows)},[])
  return (
    <div className="card" style={{padding:14}}>
      <div style={{fontWeight:800, fontSize:12, letterSpacing:0.6, display:'flex', justifyContent:'space-between'}}><span>TOP TRADERS</span><span style={{color:'#7d8aa6', fontSize:11}}>GURU</span></div>
      <div style={{display:'grid', gap:8, marginTop:10}}>
        {rows.map((r,i)=>(
          <Link key={r.walletAddress} to={`/wallet/${r.walletAddress}`} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, background: i===0?'rgba(184,255,51,0.08)':'rgba(255,255,255,0.03)', border:`1px solid ${i===0?'rgba(184,255,51,0.18)':'#1e2e4a'}`, textDecoration:'none'}}>
            <span style={{fontWeight:900, fontSize:12, color: i<3?'#b8ff33':'#7d8aa6'}}>#{i+1}</span>
            <span className="mono" style={{fontSize:12, fontWeight:700, color:'#e5edff'}}>{shortAddr(r.walletAddress)}</span>
            <span style={{marginLeft:'auto', fontWeight:900, fontSize:12, color:'#b8ff33'}}>{r.guruScore.toFixed(1)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function TokenIntelligenceCard({ token }: { token: Token }){
  // mini chart fake
  const pts = Array.from({length:18},(_,i)=> ({t: Date.now()- (18-i)*600000, value: token.price* (1+ (Math.sin(i*0.8)*0.06 + (i/18)*0.04))}))
  return (
    <div className="card" style={{padding:14}}>
      <div style={{fontWeight:800, fontSize:12, letterSpacing:0.6}}>TOKEN INTELLIGENCE</div>
      <div style={{display:'flex', alignItems:'center', gap:10, marginTop:8}}>
        <div style={{width:34,height:34, borderRadius:999, background:'linear-gradient(135deg,#b8ff33,#00ffa6)', display:'grid', placeItems:'center', fontWeight:900, color:'#05070f'}}>G</div>
        <div>
          <div style={{fontWeight:900}}>{token.symbol} <span style={{fontWeight:400, color:'#7d8aa6', fontSize:12}}>${token.price} <span style={{color: token.priceChange24h>=0?'#22c55e':'#ef4444'}}>{token.priceChange24h>=0?'+':''}{token.priceChange24h.toFixed(1)}%</span></span></div>
          <div className="mono" style={{fontSize:11, color:'#7d8aa6'}}>MC ${(token.marketCap/1_000_000).toFixed(1)}M • Liq ${(token.liquidity/1000).toFixed(0)}k • {token.holders.toLocaleString()} holders</div>
        </div>
      </div>
      <div style={{marginTop:10}}>
        <Sparkline data={pts} color={token.priceChange24h>=0?'#b8ff33':'#ef4444'} height={64} />
      </div>
      <div style={{display:'flex', gap:6, marginTop:8, flexWrap:'wrap'}}>
        <span className="badge" style={{fontSize:10}}>24h Vol ${(token.volume24h/1000).toFixed(0)}k</span>
        <span className="badge" style={{fontSize:10, color: token.risk==='LOW'?'#22c55e': token.risk==='HIGH'?'#ef4444':'#f59e0b'}}>{token.risk} RISK</span>
        <span className="badge" style={{fontSize:10}}>{token.chain}</span>
      </div>
    </div>
  )
}
