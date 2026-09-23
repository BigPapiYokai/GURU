import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { provider, shortAddr } from '../lib/providers/mockProvider'

const CATS = [
  { id:'overall', label:'Best Overall' },
  { id:'roi', label:'Highest ROI' },
  { id:'consistency', label:'Most Consistent' },
  { id:'early', label:'Best Early Entries' },
  { id:'meme', label:'Best Meme Traders' },
  { id:'recent', label:'Best Recent' },
  { id:'risk', label:'Best Risk-Adjusted' },
]

export function Leaderboard(){
  const [cat,setCat]=useState('overall')
  const [rows,setRows]=useState<any[]>([])
  useEffect(()=>{ provider.getLeaderboard(cat,20).then(setRows)},[cat])
  return (
    <div style={{display:'grid', gap:14, paddingBottom:40}}>
      <div className="card" style={{padding:16}}>
        <div style={{fontWeight:900, fontSize:18}}>SMART MONEY LEADERBOARD</div>
        <div style={{fontSize:12, color:'#7d8aa6'}}>Competitive ranking • Not just PnL • Risk-adjusted, consistency-weighted. Addictive by design.</div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:12}}>
          {CATS.map(c=> <button key={c.id} onClick={()=>setCat(c.id)} className="btn" style={{background: cat===c.id?'#b8ff33':'rgba(255,255,255,0.04)', color: cat===c.id?'#05070f':'#7d8aa6', borderColor: cat===c.id?'#b8ff33':'#1e2e4a', fontSize:12}}>{c.label}</button>)}
        </div>
      </div>

      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <div style={{display:'flex', justifyContent:'space-between', padding:'12px 14px', borderBottom:'1px solid #1e2e4a'}}>
          <span style={{fontWeight:800, fontSize:12}}>{CATS.find(c=>c.id===cat)?.label.toUpperCase()} • Top 20</span>
          <span style={{fontSize:11, color:'#7d8aa6'}}>Updated now • Competitive season</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
            <thead><tr style={{textAlign:'left', color:'#7d8aa6', fontSize:10, borderBottom:'1px solid #1e2e4a'}}><th style={{padding:'10px 14px'}}>#</th><th>WALLET</th><th style={{textAlign:'right'}}>GURU SCORE</th><th style={{textAlign:'right'}}>ROI</th><th style={{textAlign:'right'}}>WIN RATE</th><th style={{textAlign:'right'}}>REALIZED</th><th></th></tr></thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.walletAddress} style={{borderBottom:'1px solid rgba(30,46,74,0.6)', background: r.rank<=3?'rgba(184,255,51,0.04)':''}}>
                  <td style={{padding:'10px 14px', fontWeight:900, color: r.rank===1?'#facc15': r.rank===2?'#94a3b8': r.rank===3?'#f97316':'#7d8aa6'}}>#{r.rank}</td>
                  <td><Link to={`/wallet/${r.walletAddress}`} className="mono" style={{fontWeight:800, color:'#00e5ff', textDecoration:'none'}}>{shortAddr(r.walletAddress)}</Link></td>
                  <td style={{textAlign:'right', fontWeight:900, color:'#b8ff33'}}>{r.guruScore.toFixed(1)}</td>
                  <td style={{textAlign:'right', fontWeight:700, color: r.roi>=0?'#22c55e':'#ef4444'}}>{r.roi>=0?'+':''}{r.roi.toFixed(1)}%</td>
                  <td style={{textAlign:'right'}}>{r.winRate.toFixed(1)}%</td>
                  <td style={{textAlign:'right'}} className="mono">${r.realizedPnL.toLocaleString()}</td>
                  <td><Link to={`/wallet/${r.walletAddress}`} className="badge" style={{fontSize:10}}>View →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{padding:12, display:'flex', justifyContent:'center'}}>
          <button className="btn btn-ghost" onClick={()=> alert('Share leaderboard card — viral loop')}>♡ Share Leaderboard Card (X-ready)</button>
        </div>
      </div>
    </div>
  )
}
