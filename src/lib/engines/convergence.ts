import { Convergence, LiveEvent, Token } from '../types'

// Smart Money Convergence — §8
// Detect when multiple high-GURU wallets converge on same token within timeframe

export function detectConvergences(events: LiveEvent[], tokens: Token[], minGuruScore=84, windowMin=90): Convergence[] {
  // group buys by token
  const buys = events.filter(e=> e.action==='BUY' && e.guruScore>=minGuruScore)
  const grouped = new Map<string, LiveEvent[]>()
  for(const e of buys){
    const key = e.tokenAddress
    if(!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(e)
  }
  const out: Convergence[] = []
  for(const [addr, evs] of grouped){
    if(evs.length < 3) continue
    // check time clustering: at least 3 within window
    evs.sort((a,b)=>a.timestamp-b.timestamp)
    let maxCluster = 0
    let clusterEntries: LiveEvent[] = []
    for(let i=0;i<evs.length;i++){
      const windowStart = evs[i].timestamp
      const inWindow = evs.filter(x=> x.timestamp>=windowStart && x.timestamp<=windowStart+ windowMin*60*1000)
      if(inWindow.length>maxCluster){ maxCluster=inWindow.length; clusterEntries=inWindow}
    }
    if(maxCluster<3) continue
    const token = tokens.find(t=>t.address===addr)
    const combined = clusterEntries.reduce((s,e)=>s+e.valueUSD,0)
    const avgScore = clusterEntries.reduce((s,e)=>s+e.guruScore,0)/clusterEntries.length
    // historical success naive: avg score mapping
    const hist = Math.min(84, 42 + avgScore*0.35)
    const confidence: Convergence['confidence'] = avgScore>90 && maxCluster>=5? 'HIGH': avgScore>86 && maxCluster>=4? 'MEDIUM':'LOW'
    out.push({
      tokenAddress: addr,
      tokenSymbol: token?.symbol || evs[0].tokenSymbol,
      tokenName: token?.name || evs[0].tokenSymbol,
      chain: evs[0].chain,
      numGuruWallets: evs.length,
      entriesLastMinutes: maxCluster,
      combinedEntriesUSD: combined,
      avgGuruScore: Math.round(avgScore*10)/10,
      historicalSuccessRate: Math.round(hist),
      confidence,
      entries: clusterEntries.map(e=>({ wallet:e.walletAddress, score:e.guruScore, amount:e.valueUSD, timestamp:e.timestamp })),
      liquidity: token?.liquidity ?? 1_200_000,
      holderChange24h: token?.holderGrowth24h ?? 6.2
    })
  }
  return out.sort((a,b)=> b.avgGuruScore*0.6 + b.combinedEntriesUSD/100000 - (a.avgGuruScore*0.6 + a.combinedEntriesUSD/100000))
}

// anti-gaming helpers — §21
export function detectSuspicious(events: LiveEvent[]): { wallet:string, reason:string, confidence:'LOW'|'MEDIUM'|'HIGH'}[]{
  const res:{wallet:string, reason:string, confidence:'LOW'|'MEDIUM'|'HIGH'}[]=[]
  // wash trading: many buys/sells same token same wallet within minutes
  const byWallet = new Map<string, LiveEvent[]>()
  for(const e of events){ if(!byWallet.has(e.walletAddress)) byWallet.set(e.walletAddress,[]); byWallet.get(e.walletAddress)!.push(e)}
  for(const [w, evs] of byWallet){
    if(evs.length>12){
      const span = Math.max(...evs.map(x=>x.timestamp)) - Math.min(...evs.map(x=>x.timestamp))
      if(span < 1000*60*30) res.push({wallet:w, reason:'High frequency burst — possible bot / wash pattern', confidence:'MEDIUM'})
    }
    // circular concentration: same token repeated
    const tokenCounts = new Map<string,number>()
    for(const e of evs) tokenCounts.set(e.tokenSymbol, (tokenCounts.get(e.tokenSymbol)||0)+1)
    for(const [tok,c] of tokenCounts){ if(c>8 && evs.length<20) res.push({wallet:w, reason:`Repeated ${tok} concentration (${c}x)`, confidence:'LOW'})}
  }
  return res
}
