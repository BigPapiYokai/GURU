import { useEffect, useState } from 'react'
import { provider, shortAddr } from '../lib/providers/mockProvider'
import { LiveEvent } from '../lib/types'
import { Link } from 'react-router-dom'

export function Feed(){
  const [events,setEvents]=useState<LiveEvent[]>([])
  const [filterAction,setFilterAction]=useState<string>('ALL')
  const [minScore,setMinScore]=useState(0)
  const [chain,setChain]=useState('ALL')
  useEffect(()=>{ provider.getLiveEvents().then(setEvents)},[] )
  // polling mock
  useEffect(()=>{
    const id=setInterval(()=> provider.getLiveEvents().then(setEvents), 8000)
    return ()=>clearInterval(id)
  },[])

  const filtered = events.filter(e=> (filterAction==='ALL'|| e.action===filterAction) && e.guruScore>=minScore && (chain==='ALL'|| e.chain===chain))

  return (
    <div style={{display:'grid', gap:14, paddingBottom:40}}>
      <div className="card" style={{padding:16}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{fontWeight:900}}>LIVE WALLET FEED</div>
          <span className="badge badge-neon"><span className="pulse-dot" style={{width:6,height:6}}/> LIVE • WebSocket (mock)</span>
        </div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:10, alignItems:'center'}}>
          <select value={filterAction} onChange={e=>setFilterAction(e.target.value)} style={{background:'#0a0f1c', border:'1px solid #1e2e4a', color:'#e5edff', padding:'8px 12px', borderRadius:999, fontWeight:700}}>
            <option value="ALL">All</option><option value="BUY">Buys</option><option value="SELL">Sells</option>
          </select>
          <select value={chain} onChange={e=>setChain(e.target.value)} style={{background:'#0a0f1c', border:'1px solid #1e2e4a', color:'#e5edff', padding:'8px 12px', borderRadius:999, fontWeight:700}}>
            <option value="ALL">All chains</option><option value="solana">Solana</option><option value="ethereum">Ethereum</option><option value="base">Base</option>
          </select>
          <span style={{fontSize:11, fontWeight:800, color:'#7d8aa6'}}>Min GURU</span>
          <input type="range" min={0} max={95} value={minScore} onChange={e=> setMinScore(parseInt(e.target.value))} className="range" style={{width:120}} />
          <span className="mono" style={{fontWeight:800, color:'#b8ff33'}}>{minScore}</span>
        </div>
        <div style={{fontSize:11, color:'#7d8aa6', marginTop:8}}>Events: smart-money buys/sells, whale moves, dev-wallet, liquidity, clustering. Filter by token, chain, score, value, wallet type, mcap, time.</div>
      </div>

      <div style={{display:'grid', gap:8}}>
        {filtered.map(e=>(
          <div key={e.id} className="card" style={{padding:12, display:'flex', alignItems:'center', gap:12, borderLeft:`3px solid ${e.action==='BUY'?'#22c55e':'#ef4444'}`}}>
            <div className="mono" style={{fontSize:12, fontWeight:800, color:'#00e5ff'}}><Link to={`/wallet/${e.walletAddress}`} style={{color:'#00e5ff', textDecoration:'none'}}>{shortAddr(e.walletAddress)}</Link></div>
            <span style={{padding:'4px 8px', borderRadius:999, fontWeight:800, fontSize:11, background: e.action==='BUY'?'rgba(34,197,94,0.14)':'rgba(239,68,68,0.14)', color: e.action==='BUY'?'#22c55e':'#ef4444'}}>{e.action}</span>
            <span style={{fontWeight:800}}>{e.tokenSymbol}</span>
            <span className="mono" style={{color:'#e5edff'}}>${e.valueUSD.toLocaleString()}</span>
            <span className="badge" style={{background: e.guruScore>90?'rgba(184,255,51,0.12)':'rgba(255,255,255,0.04)', color: e.guruScore>90?'#b8ff33':'#7d8aa6'}}>GURU {e.guruScore}</span>
            <span style={{fontSize:11, color:'#7d8aa6', flex:1}}>{e.reason} • {e.confidence} • {e.chain}</span>
            <span className="mono" style={{fontSize:11, color:'#64748b'}}>{new Date(e.timestamp).toLocaleTimeString()}</span>
            <Link to={`/token/${e.tokenAddress}`} className="badge" style={{fontSize:10}}>Token →</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
