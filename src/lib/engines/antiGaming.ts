// §21 ANTI-GAMING — modular detection
export function antiGamingChecks(trades: any[]){
  const flags: { type:string, confidence:'LOW'|'MEDIUM'|'HIGH', description:string}[]=[]
  if(trades.length>40){
    const span = Math.max(...trades.map(t=>t.timestamp)) - Math.min(...trades.map(t=>t.timestamp))
    if(trades.length>80 && span < 1000*60*60*24*2) flags.push({type:'burst', confidence:'MEDIUM', description:'High trade burst in <48h — possible bot'})
  }
  // wash: same token alternating buys/sells
  const byToken = new Map<string,number>()
  for(const t of trades) byToken.set(t.tokenSymbol, (byToken.get(t.tokenSymbol)||0)+1)
  for(const [tok,c] of byToken){ if(c/trades.length>0.45) flags.push({type:'concentration', confidence:'LOW', description:`${tok} concentration ${(c/trades.length*100).toFixed(0)}%`})}
  return flags
}
