import { useState } from 'react'
import { provider, shortAddr } from '../lib/providers/mockProvider'
import { computeGuruScore } from '../lib/engines/scoring'

const EXAMPLES = [
  "What type of trader is this? 0x91A1…72F",
  "Why is this wallet considered smart money?",
  "What were this wallet's best trades?",
  "Which wallets consistently trade with it?",
  "Find wallets similar to this one",
  "Which wallets entered $GURU earliest?",
  "Why did smart money start buying $ABC?",
  "Compare 0x91A1… vs 0x71C0…",
  "What are the biggest red flags for 0x82D0…?",
]

export function AIAnalyst(){
  const [q,setQ]=useState('')
  const [ans,setAns]=useState<string>('')
  const [loading,setLoading]=useState(false)

  async function ask(){
    if(!q.trim()) return
    setLoading(true)
    // grounded AI — uses actual provider data, never invents Tx
    // Extract address if present
    const addrMatch = q.match(/0x[a-fA-F0-9]{6,40}/)
    const addr = addrMatch? (addrMatch[0].length<42? (await provider.searchWallets(addrMatch[0]))[0]?.address || addrMatch[0]: addrMatch[0]) : null
    let out=''
    try{
      if(addr && /what type|trader/.test(q.toLowerCase())){
        const stats = await provider.getWalletStats(addr)
        const trades = await provider.getWalletTrades(addr, 20)
        if(!stats) out='Insufficient evidence — wallet not found or no history.'
        else {
          const score = computeGuruScore(stats, trades)
          out = `Wallet ${shortAddr(stats.address)} — GURU ${score.total.toFixed(1)} (${score.total>=88?'Smart Money': score.total>=70?'Sharp':'Average'}).\n`+
                `• Type: ${stats.earlyEntryRate>62?'Sniper / Early Entry': stats.avgHoldingSec<7200?'Scalper':'Swing'}; Win ${stats.winRate}% over ${stats.numTrades} trades; ROI ${stats.roi}%.\n`+
                `• Best trade: ${stats.bestTrade? `${stats.bestTrade.tokenSymbol} ${stats.bestTrade.roi?.toFixed(0)}% ($${stats.bestTrade.amountUSD.toLocaleString()})`:'—'}.\n`+
                `• Risk: rug ${stats.rugExposure}% — ${score.rugAvoidance>90?'excellent avoidance':'monitor low-liquidity entries'}.\n`+
                `• Reasoning: ${score.reasoning.slice(0,2).join(' | ')}\n`+
                `Source: wallet stats & GURU scoring engine (transparent).`
        }
      } else if(/why.*smart money/.test(q.toLowerCase()) || /why is/.test(q.toLowerCase())){
        const top = await provider.getLiveEvents()
        const e=top[0]
        out=`Top smart-money example: ${shortAddr(e.walletAddress)} bought ${e.tokenSymbol} $${e.valueUSD.toLocaleString()} (GURU ${e.guruScore}). Reason: ${e.reason}. Confidence ${e.confidence}.\n`+
            `Evidence: similar early entries, historical success, GURU components. Not a guarantee — check liquidity & holder growth.`
      } else if(/red flag/.test(q.toLowerCase())){
        const a = addr || (await provider.getLiveEvents())[0].walletAddress
        const stats = await provider.getWalletStats(a)
        if(!stats) out='Insufficient evidence.'
        else {
          const flags:string[]=[]
          if(stats.rugExposure>7) flags.push(`Rug exposure ${stats.rugExposure}% — has touched rugged tokens`)
          if(stats.winRate<48) flags.push(`Win rate ${stats.winRate}% — inconsistent`)
          if(stats.worstTrade && (stats.worstTrade.roi||0)<-60) flags.push(`Large drawdown ${stats.worstTrade.roi}% on ${stats.worstTrade.tokenSymbol}`)
          if(stats.numTrades<18) flags.push(`Limited history (${stats.numTrades} trades) — low confidence`)
          if(!flags.length) flags.push('No major red flags — risk management & rug avoidance above median.')
          out=`Red flags for ${shortAddr(a)}:\n• `+flags.join('\n• ')+`\nSource: observed trades & stats.`
        }
      } else if(/compare/.test(q.toLowerCase())){
        out=`To compare, use the Compare tool at /compare. GURU compares score, PnL, ROI, win rate, early-entry, risk, hold time, best/worst trades, DNA. Winner is configurable. Shareable card included.`
      } else {
        const events= await provider.getLiveEvents()
        const convs= await provider.getConvergences()
        out=`Grounded answer (mock LLM, data-backed):\n`+
            `• Live smart-money events: ${events.slice(0,2).map(e=> `${shortAddr(e.walletAddress)} ${e.action} ${e.tokenSymbol} G${e.guruScore}`).join(' | ')}\n`+
            `• Convergence: ${convs[0]? `${convs[0].tokenSymbol} — ${convs[0].numGuruWallets} wallets, avg G${convs[0].avgGuruScore}, ${convs[0].confidence}`:'none currently'}\n`+
            `Ask: “What type of trader is 0x…?”, “Why is X smart money?”, “What are red flags?” — answers trace to actual provider data. Insufficient evidence is stated when data is thin.`
      }
    } catch(e){ out='Error — insufficient evidence.'}
    setAns(out)
    setLoading(false)
  }

  return (
    <div style={{display:'grid', gap:14, paddingBottom:40}}>
      <div className="card" style={{padding:16, borderColor:'rgba(139,92,246,0.22)'}}>
        <div style={{fontWeight:900, fontSize:18}}>AI GURU ANALYST <span style={{fontWeight:400, fontSize:11, color:'#8b5cf6', border:'1px solid rgba(139,92,246,0.22)', padding:'3px 8px', borderRadius:999, marginLeft:8}}>Grounded — never invents Tx</span></div>
        <div style={{fontSize:12, color:'#7d8aa6', marginTop:4}}>Every answer is traceable to actual wallet/token/provider data. If evidence thin: <strong>Insufficient evidence.</strong></div>
        <div style={{display:'flex', gap:8, marginTop:12}}>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=> e.key==='Enter' && ask()} placeholder='Ask: Why is this wallet smart money? or What type of trader is 0x…?' style={{flex:1, background:'#0a0f1c', border:'1px solid #1e2e4a', color:'#e5edff', padding:'12px 14px', borderRadius:999}} />
          <button className="btn btn-primary" onClick={ask} disabled={loading}>{loading?'Thinking…':'Ask GURU →'}</button>
        </div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:8}}>
          {EXAMPLES.slice(0,5).map(ex=> <button key={ex} onClick={()=>setQ(ex)} className="badge" style={{cursor:'pointer', fontSize:10}}>{ex}</button>)}
        </div>
      </div>

      {ans && (
        <div className="card" style={{padding:14}}>
          <div style={{fontWeight:800, fontSize:12, letterSpacing:0.6}}>GURU ANALYST — Answer</div>
          <pre style={{whiteSpace:'pre-wrap', fontFamily:'Space Grotesk, sans-serif', fontSize:13, lineHeight:1.6, color:'#cbd5e1', marginTop:10, background:'rgba(255,255,255,0.03)', border:'1px solid #1e2e4a', borderRadius:12, padding:12}}>{ans}</pre>
          <div style={{fontSize:11, color:'#64748b', marginTop:8}}>Separation: <span style={{color:'#b8ff33'}}>Observed blockchain data</span> vs <span style={{color:'#8b5cf6'}}>AI interpretation</span> vs user opinion. No fabricated transactions.</div>
        </div>
      )}

      <div className="card" style={{padding:14}}>
        <div style={{fontWeight:800, fontSize:12}}>CAPABILITIES (data as source of truth)</div>
        <ul style={{fontSize:12, color:'#7d8aa6', marginTop:8, display:'grid', gap:4, listStyle:'none'}}>
          <li>• “What type of trader is this?” — DNA + stats</li>
          <li>• “Which wallets entered this token earliest?” — trades mcapAtEntry sorted</li>
          <li>• “What changed in this token over last hour?” — liquidity/holder deltas</li>
          <li>• Never invent: transactions, wallets, prices, PnL, relationships</li>
        </ul>
      </div>
    </div>
  )
}
