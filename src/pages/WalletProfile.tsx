import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { provider, shortAddr } from '../lib/providers/mockProvider'
import { Wallet, WalletStats, Trade } from '../lib/types'
import { computeGuruScore } from '../lib/engines/scoring'
import { computeWalletDNA } from '../lib/engines/dna'
import { GuruScoreCard } from '../components/GuruScoreCard'
import { WalletDNA } from '../components/WalletDNA'
import { Bars, Sparkline } from '../components/Charts'
import { ViralCard } from '../components/ViralCard'

export function WalletProfile(){
  const { address = '' } = useParams()
  const [wallet,setWallet]=useState<Wallet|null>(null)
  const [stats,setStats]=useState<WalletStats|null>(null)
  const [trades,setTrades]=useState<Trade[]>([])
  const [tab,setTab]=useState<'overview'|'trades'|'clustering'|'why'>('overview')
  const [cluster,setCluster]=useState<any>(null)

  useEffect(()=>{
    if(!address) return
    provider.getWallet(address).then(setWallet)
    provider.getWalletStats(address).then(s=>{ setStats(s); if(s) provider.getWalletTrades(address,40).then(t=>{ setTrades(t); if(s) { /* enrich best/worst handled in provider */ }})})
    provider.getClusteringGraph(address).then(setCluster)
  },[address])

  if(!stats) return <div style={{padding:40, color:'#7d8aa6'}}>Loading wallet intelligence…</div>
  const score = computeGuruScore(stats, trades)
  const dna = computeWalletDNA(stats, trades)

  return (
    <div style={{display:'grid', gap:14, paddingBottom:40}}>
      {/* header */}
      <div className="card" style={{padding:16, display:'flex', flexWrap:'wrap', gap:14, alignItems:'center'}}>
        <div style={{width:52,height:52, borderRadius:999, background:'linear-gradient(135deg,#1a2a4a,#2a1a4a)', border:'1px solid #1e2e4a', display:'grid', placeItems:'center', fontSize:20}}>⬡</div>
        <div style={{flex:1, minWidth:260}}>
          <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
            <span className="mono" style={{fontWeight:900, fontSize:16}}>{wallet?.ens || shortAddr(stats.address)}</span>
            <span className="mono" style={{fontSize:11, color:'#7d8aa6', background:'rgba(255,255,255,0.04)', padding:'4px 8px', borderRadius:999, border:'1px solid #1e2e4a'}}>{shortAddr(stats.address)}</span>
            <span className="badge badge-neon">{dna.archetypes[0]}</span>
            <span className="badge" style={{fontSize:10}}>Age { (stats as any).ageDays ?? wallet?.ageDays ?? 120 }d • {stats.chains.join(',')} • {stats.preferredDexs.join(',')}</span>
          </div>
          <div style={{marginTop:6, display:'flex', gap:6, flexWrap:'wrap'}}>
            {['Every wallet has a reputation.','Find the wallets worth watching.'].map(s=> <span key={s} style={{fontSize:11, color:'#64748b'}}>{s}</span>)}
          </div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn btn-ghost" onClick={()=> navigator.clipboard.writeText(stats.address)}>Copy</button>
          <button className="btn btn-primary" onClick={()=> alert('Followed — alerts enabled (mock)')}>+ Follow</button>
          <Link to={`/compare?walletA=${stats.address}`} className="btn btn-ghost">Compare →</Link>
        </div>
      </div>

      <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
        {(['overview','trades','clustering','why'] as const).map(t=> <button key={t} onClick={()=>setTab(t)} className="btn" style={{background: tab===t?'#b8ff33':'rgba(255,255,255,0.04)', color: tab===t?'#05070f':'#7d8aa6', borderColor: tab===t?'#b8ff33':'#1e2e4a', textTransform:'capitalize'}}>{t}</button>)}
      </div>

      {tab==='overview' && (
      <div style={{display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:14}} className="resp-grid">
        <div style={{display:'grid', gap:14}}>
          <GuruScoreCard breakdown={score} address={stats.address} />
          <WalletDNA dna={dna} />

          <div className="card" style={{padding:14}}>
            <div style={{fontWeight:800, fontSize:12, letterSpacing:0.6}}>PORTFOLIO & PnL</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:10}}>
              {[
                ['Realized PnL', `$${stats.totalRealizedPnL.toLocaleString()}`],
                ['Unrealized', `$${stats.unrealizedPnL.toLocaleString()}`],
                ['ROI', `${stats.roi.toFixed(1)}%`],
                ['Win Rate', `${stats.winRate.toFixed(1)}%`],
                ['Avg Trade', `$${stats.avgTradeSize.toLocaleString()}`],
                ['Largest', `$${stats.largestTrade.toLocaleString()}`],
                ['Trades', `${stats.numTrades}`],
                ['Profitable', `${stats.profitableTrades}`],
                ['Losing', `${stats.losingTrades}`],
                ['Avg Hold', `${(stats.avgHoldingSec/3600).toFixed(1)}h`],
                ['Best Trade', stats.bestTrade? `${stats.bestTrade.roi?.toFixed(0)}% ${stats.bestTrade.tokenSymbol}`:'—'],
                ['Worst', stats.worstTrade? `${stats.worstTrade.roi?.toFixed(0)}%`:'—'],
              ].map(([k,v])=>(
                <div key={k} style={{background:'rgba(255,255,255,0.03)', border:'1px solid #1e2e4a', borderRadius:10, padding:10}}>
                  <div style={{fontSize:10, fontWeight:800, letterSpacing:0.6, color:'#7d8aa6'}}>{k}</div>
                  <div style={{fontWeight:900, fontSize:13, marginTop:4}}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:14}}>
              <div>
                <div style={{fontSize:11, fontWeight:800, color:'#7d8aa6'}}>PNL CURVE (30d)</div>
                <div style={{marginTop:6, background:'rgba(255,255,255,0.02)', border:'1px solid #1e2e4a', borderRadius:10, padding:8}}>
                  <Sparkline data={stats.historicalPnLCurve} color="#b8ff33" />
                </div>
              </div>
              <div>
                <div style={{fontSize:11, fontWeight:800, color:'#7d8aa6'}}>MONTHLY PNL</div>
                <div style={{marginTop:6, background:'rgba(255,255,255,0.02)', border:'1px solid #1e2e4a', borderRadius:10, padding:8}}>
                  <Bars data={stats.monthlyPnL} />
                </div>
              </div>
            </div>

            <div style={{marginTop:12, display:'grid', gap:8}}>
              <div style={{fontSize:11, fontWeight:800, color:'#7d8aa6'}}>CURRENT POSITIONS</div>
              {stats.currentPositions.map(p=>(
                <div key={p.tokenAddress} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid #1e2e4a'}}>
                  <span style={{fontWeight:800}}>{p.tokenSymbol} <span className="mono" style={{fontSize:12, color:'#7d8aa6'}}>${p.valueUSD.toLocaleString()}</span></span>
                  <span style={{fontSize:12, fontWeight:800, color: p.pnl>=0?'#22c55e':'#ef4444'}}>{p.pnl>=0?'+':''}${p.pnl.toFixed(0)} ({p.roi.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:'grid', gap:14, alignContent:'start'}}>
          <div className="card" style={{padding:14}}>
            <div style={{fontWeight:800, fontSize:12, letterSpacing:0.6}}>WALLET TRAITS & STATS</div>
            <div style={{marginTop:10, display:'grid', gap:8, fontSize:12}}>
              <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'#7d8aa6'}}>Early-entry rate</span><span style={{fontWeight:800}}>{stats.earlyEntryRate}%</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'#7d8aa6'}}>Exit efficiency</span><span style={{fontWeight:800}}>{stats.exitEfficiency}</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'#7d8aa6'}}>Rug exposure</span><span style={{fontWeight:800}}>{stats.rugExposure}%</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'#7d8aa6'}}>Whale behavior</span><span style={{fontWeight:800}}>{stats.whaleBehavior}</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'#7d8aa6'}}>Frequency</span><span style={{fontWeight:800}}>{stats.tradingFrequency}/wk</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'#7d8aa6'}}>Preferred chains</span><span style={{fontWeight:800}}>{stats.chains.join(', ')}</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'#7d8aa6'}}>Preferred DEXs</span><span style={{fontWeight:800}}>{stats.preferredDexs.join(', ')}</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'#7d8aa6'}}>Categories</span><span style={{fontWeight:800}}>{(stats as any).preferredCategories?.join(', ')}</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'#7d8aa6'}}>Avg mcap at entry</span><span style={{fontWeight:800}}>${Math.round(trades.reduce((s,t)=>s+t.marketCapAtEntry,0)/Math.max(1,trades.length)/1000)}k</span></div>
            </div>
          </div>

          <div className="card" style={{padding:14}}>
            <div style={{fontWeight:800, fontSize:12, letterSpacing:0.6}}>ACHIEVEMENTS</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10}}>
              {dna.achievements.map(a=>(
                <div key={a.id} style={{background:'rgba(250,204,21,0.06)', border:'1px solid rgba(250,204,21,0.18)', borderRadius:10, padding:10}}>
                  <div style={{fontSize:16}}>{a.icon}</div>
                  <div style={{fontWeight:800, fontSize:12, marginTop:4}}>{a.title} <span style={{fontSize:9, color:'#facc15', background:'rgba(250,204,21,0.14)', padding:'2px 6px', borderRadius:999}}>{a.rarity}</span></div>
                  <div style={{fontSize:11, color:'#7d8aa6', marginTop:2}}>{a.description}</div>
                </div>
              ))}
            </div>
          </div>

          <ViralCard title="WALLET REPUTATION" score={score.total} subtitle={`Top ${(100-score.total).toFixed(1)}%`} traits={[{label:'Early Entry', value: score.earlyEntries},{label:'Consistency', value: score.consistency},{label:'Rug Avoidance', value: score.rugAvoidance}]} address={stats.address} />

          <div className="card" style={{padding:14, borderColor:'rgba(255,46,157,0.22)'}}>
            <div style={{fontWeight:800, fontSize:12}}>WHY THIS MATTERS</div>
            <div style={{fontSize:12, color:'#cbd5e1', marginTop:8, lineHeight:1.5}}>
              This wallet historically enters similar tokens before major liquidity expansion. Current activity resembles <strong>9 previous entries, 6 of which reached positive return within 48h</strong> (observed, not guaranteed). <br/>
              <span style={{color:'#7d8aa6'}}>Evidence: avg entry mcap ${(Math.round(trades[0]?.marketCapAtEntry/1000) || 0)}k, win rate {stats.winRate}%, early-entry {stats.earlyEntryRate}%.</span><br/>
              <span style={{color:'#b8ff33', fontWeight:800}}>Presenting observable evidence — not a buy/sell call.</span>{' '}
              {stats.rugExposure>8 && <span style={{color:'#ef4444'}}>Risk: Elevated rug exposure — size accordingly.</span>}
            </div>
            {stats.numTrades<12 && <div style={{marginTop:8, padding:'8px 10px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)', fontSize:11, color:'#fca5a5'}}>Insufficient evidence for high-confidence pattern — limited trade history.</div>}
          </div>
        </div>
      </div>
      )}

      {tab==='trades' && (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div style={{padding:'12px 14px', borderBottom:'1px solid #1e2e4a', fontWeight:800}}>TRADES ({trades.length}) • Interactive</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
              <thead><tr style={{textAlign:'left', color:'#7d8aa6', fontSize:10, borderBottom:'1px solid #1e2e4a'}}><th style={{padding:'8px 12px'}}>TIME</th><th>TOKEN</th><th>SIDE</th><th>DEX</th><th style={{textAlign:'right'}}>VALUE</th><th style={{textAlign:'right'}}>MCAP AT ENTRY</th><th style={{textAlign:'right'}}>ROI</th><th>TX</th></tr></thead>
              <tbody>
                {trades.map(t=>(
                  <tr key={t.id} style={{borderBottom:'1px solid rgba(30,46,74,0.5)'}}>
                    <td style={{padding:'8px 12px'}} className="mono">{new Date(t.timestamp).toLocaleDateString()}</td>
                    <td style={{fontWeight:800}}>{t.tokenSymbol}</td>
                    <td><span style={{padding:'2px 8px', borderRadius:999, fontWeight:800, background: t.side==='BUY'?'rgba(34,197,94,0.14)':'rgba(239,68,68,0.14)', color: t.side==='BUY'?'#22c55e':'#ef4444'}}>{t.side}</span></td>
                    <td style={{color:'#7d8aa6'}}>{t.dex}</td>
                    <td style={{textAlign:'right'}} className="mono">${t.amountUSD.toLocaleString()}</td>
                    <td style={{textAlign:'right'}} className="mono">${(t.marketCapAtEntry/1000).toFixed(0)}k</td>
                    <td style={{textAlign:'right', fontWeight:800, color:(t.roi||0)>=0?'#22c55e':'#ef4444'}}>{t.roi?.toFixed(1)}%</td>
                    <td className="mono" style={{fontSize:10, color:'#64748b'}}>{t.txHash.slice(0,10)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='clustering' && (
        <ClusterView cluster={cluster} address={stats.address} />
      )}

      {tab==='why' && (
        <div className="card" style={{padding:16}}>
          <div style={{fontWeight:800}}>WHY THIS WALLET IS {score.total>=88?'SMART MONEY':'RANKED '+score.total.toFixed(1)}</div>
          <ul style={{marginTop:10, display:'grid', gap:8, listStyle:'none'}}>
            {score.reasoning.map((r,i)=> <li key={i} style={{padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid #1e2e4a', fontSize:12}}>{r}</li>)}
            <li style={{padding:'10px 12px', borderRadius:10, background:'rgba(184,255,51,0.06)', border:'1px solid rgba(184,255,51,0.14)', fontSize:12}}>
              Methodology: Multi-factor weighted. Whale PnL dampened above $2M. Early entries measured vs liquidity/holder growth. Anti-gaming: wash/circular flags lower consistency. Confidence shown per trait.
            </li>
          </ul>
        </div>
      )}

      <style>{`@media(max-width:900px){.resp-grid{grid-template-columns:1fr !important}}`}</style>
    </div>
  )
}

function ClusterView({ cluster, address }: { cluster:any, address:string }){
  if(!cluster) return <div className="card" style={{padding:20, color:'#7d8aa6'}}>Loading relationship graph…</div>
  const nodes = cluster.nodes as {id:string,score:number,label:string}[]
  const edges = cluster.edges as {source:string,target:string,strength:number,signals:string[]}[]
  // simple force layout circular
  const size=520, cx=size/2, cy=size/2, R=150
  const pos = new Map<string,{x:number,y:number}>()
  nodes.forEach((n,i)=>{
    if(n.id===address) pos.set(n.id,{x:cx,y:cy})
    else {
      const ang = (Math.PI*2*(i-1)/(nodes.length-1)) - Math.PI/2
      pos.set(n.id,{x:cx+Math.cos(ang)*R, y:cy+Math.sin(ang)*R})
    }
  })
  return (
    <div className="card" style={{padding:14}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{fontWeight:800}}>WALLET CLUSTERING — Relationship Graph</div>
        <span className="badge" style={{background:'rgba(239,68,68,0.08)', color:'#fca5a5', borderColor:'rgba(239,68,68,0.18)', fontSize:10}}>Never claim same person without authoritative evidence</span>
      </div>
      <div style={{marginTop:6, fontSize:11, color:'#7d8aa6'}}>Signals: common funding, shared patterns, simultaneous buys/sells, transfers. Labels use: <em>Potentially related / Strong behavioral overlap</em>.</div>
      <svg viewBox={`0 0 ${size} ${size}`} style={{width:'100%', height:420, marginTop:12, background:'radial-gradient(400px 300px at 50% 50%, rgba(139,92,246,0.08), transparent)', borderRadius:12, border:'1px solid #1e2e4a'}}>
        {edges.map((e,i)=>{
          const a=pos.get(e.source)!, b=pos.get(e.target)!
          return <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ e.strength>0.75?'#b8ff33': e.strength>0.58?'#00ffa6':'#334155'} strokeWidth={ e.strength*3} opacity={0.9} strokeDasharray={ e.strength<0.6? '6 4':''} />
            <text x={(a.x+b.x)/2} y={(a.y+b.y)/2 -6} textAnchor="middle" fontSize={7} fontWeight={700} fill="#7d8aa6" style={{background:'#05070f'}}>{e.signals[0]}</text>
          </g>
        })}
        {nodes.map(n=>{
          const p=pos.get(n.id)!
          const isTarget=n.id===address
          return <g key={n.id}>
            <circle cx={p.x} cy={p.y} r={isTarget?22:16} fill={isTarget?'#b8ff33':'#0f172a'} stroke={isTarget?'#b8ff33':'#1e2e4a'} strokeWidth={2} />
            <text x={p.x} y={p.y+1} textAnchor="middle" fontSize={ isTarget?10:8} fontWeight={900} fill={isTarget?'#05070f':'#e5edff'}>{isTarget?'◉': '⬡'}</text>
            <text x={p.x} y={p.y+32} textAnchor="middle" fontSize={9} fontWeight={700} fill="#cbd5e1" className="mono">{n.label}</text>
            <text x={p.x} y={p.y+42} textAnchor="middle" fontSize={8} fill="#7d8aa6">GURU {n.score}</text>
          </g>
        })}
      </svg>
      <div style={{display:'grid', gap:6, marginTop:10}}>
        {edges.map((e,i)=> <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 10px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid #1e2e4a', fontSize:12}}><span className="mono">{shortAddr(e.source)} → {shortAddr(e.target)}</span><span style={{color: e.strength>0.75?'#b8ff33':'#7d8aa6'}}>{e.strength>0.75?'Strong behavioral overlap': e.strength>0.6?'Possible coordinated activity':'Similar trading pattern'} • {(e.strength*100).toFixed(0)}%</span></div>)}
      </div>
    </div>
  )
}
