import { WalletDNA, WalletStats, Trade } from '../types'
import { computeGuruScore } from './scoring'

export function computeWalletDNA(stats: WalletStats, trades: Trade[]): WalletDNA {
  const score = computeGuruScore(stats, trades)

  // radar dimensions — normalized 0-100
  const radar = [
    { dimension: 'Profitability', value: score.profitability },
    { dimension: 'Consistency', value: score.consistency },
    { dimension: 'Early Entry', value: score.earlyEntries },
    { dimension: 'Risk Mgmt', value: score.riskManagement },
    { dimension: 'Rug Avoid', value: score.rugAvoidance },
    { dimension: 'Timing', value: score.timing },
  ]

  const traits: WalletDNA['traits'] = []

  const add = (label:string, val:number, desc:string, conf:'LOW'|'MEDIUM'|'HIGH'='MEDIUM')=>{
    traits.push({ label, score: Math.round(val), confidence: conf, description: desc })
  }

  // archetype logic
  const archetypes: string[] = []
  if(score.total>=88) archetypes.push('Smart Money')
  if(stats.earlyEntryRate>62 && score.earlyEntries>85) archetypes.push('Sniper')
  if(stats.avgHoldingSec< 2*3600 && stats.tradingFrequency>18) archetypes.push('Scalper')
  else if(stats.avgHoldingSec> 86400*7 && stats.avgHoldingSec< 86400*60) archetypes.push('Swing Trader')
  if(stats.totalRealizedPnL>400_000 && Math.max(...stats.currentPositions.map(p=>p.valueUSD),0)>150_000) archetypes.push('Whale')
  if(stats.winRate>62 && stats.monthlyPnL.filter(m=>m.pnl>0).length/ Math.max(1,stats.monthlyPnL.length) >0.73) archetypes.push('Consistent')
  if(score.rugAvoidance>92) archetypes.push('Rug Dodger')
  if(stats.preferredCategories?.includes('meme' as any) && stats.roi>120) archetypes.push('Meme Trader')
  if(stats.preferredCategories?.includes('defi' as any)) archetypes.push('DeFi Farmer')
  if(trades.filter(t=> (t.roi||0) > 200).length >=3 && stats.avgHoldingSec < 3600*6) archetypes.push('Momentum Trader')
  if(stats.avgHoldingSec> 86400*90) archetypes.push('Long-Term Holder')
  if(trades.length>80 && stats.winRate<48 && score.riskManagement<52) archetypes.push('High-Risk Trader')
  // insider pattern heuristic (LOW confidence unless repeated)
  const earlyWins = trades.filter(t=>t.marketCapAtEntry<200_000 && (t.roi||0)>150).length
  if(earlyWins>=4) archetypes.push('Potential Insider Pattern')

  if(archetypes.length===0) archetypes.push('Active Trader')

  // trait scores
  const avgMcap = trades.length? trades.reduce((a,t)=>a+t.marketCapAtEntry,0)/trades.length: 2_000_000
  add('Smart Money', score.total, 'Overall reputation based on risk-adjusted multi-factor engine', score.total>85?'HIGH':'MEDIUM')
  add('Early Entry', score.earlyEntries, avgMcap<500_000? `Avg entry mcap $${(avgMcap/1000).toFixed(0)}k — very early`:`Avg entry $${(avgMcap/1000).toFixed(0)}k`, score.earlyEntries>80?'HIGH':'MEDIUM')
  add('Risk Management', score.riskManagement, stats.worstTrade? `Worst drawdown ${(stats.worstTrade.roi||0).toFixed(1)}%`:`No extreme drawdown`, 'MEDIUM')
  add('Conviction', Math.min(98, 58 + (stats.largestTrade/ Math.max(1,stats.avgTradeSize))*7), stats.largestTrade> stats.avgTradeSize*5? 'Takes concentrated high-conviction positions':'Balanced sizing', 'MEDIUM')
  add('Patience', (()=>{ const h=stats.avgHoldingSec/3600; if(h> 24*14) return 88; if(h>24*3) return 74; if(h>6) return 58; return 42 })(), `Avg hold ${(stats.avgHoldingSec/3600).toFixed(1)}h`, 'MEDIUM')
  add('Momentum', score.timing, score.timing>85? 'Catches momentum expansions early':'Selective momentum', score.timing>80?'HIGH':'LOW')
  add('Rug Avoidance', score.rugAvoidance, `${stats.rugExposure.toFixed(1)}% rugs touched — ${score.rugAvoidance>90?'elite': score.rugAvoidance>75?'good':'needs caution'}`, score.rugAvoidance>88?'HIGH':'MEDIUM')
  // conviction already, but ensure 6 main
  traits.sort((a,b)=>b.score-a.score)

  // achievements — data-driven
  const achievements: WalletDNA['achievements'] = []
  if(score.earlyEntries>88) achievements.push({ id:'early-bird', icon:'🏆', title:'Early Bird', description:'Entered successful tokens unusually early', rarity:'EPIC' })
  if(stats.avgHoldingSec> 86400*14 && score.profitability>75) achievements.push({ id:'diamond-hands', icon:'💎', title:'Diamond Hands', description:'Held profitable positions through volatility', rarity:'RARE' })
  if(score.earlyEntries>92 && score.timing>88) achievements.push({ id:'sniper', icon:'🎯', title:'Sniper', description:'Consistently enters before major moves', rarity:'EPIC' })
  if(score.total>=95) achievements.push({ id:'guru', icon:'🧠', title:'GURU', description:'Exceptional historical performance', rarity:'LEGENDARY' })
  if(stats.totalRealizedPnL>400_000) achievements.push({ id:'whale', icon:'🐋', title:'Whale', description:'Large capital deployment', rarity:'RARE' })
  if(score.rugAvoidance>95) achievements.push({ id:'rug-dodger', icon:'🛡', title:'Rug Dodger', description:'Strong historical avoidance of rugs', rarity:'EPIC' })
  if(traits.find(t=>t.label==='Conviction')!.score>88) achievements.push({ id:'conviction', icon:'🔥', title:'Conviction', description:'Repeated concentrated high-conviction positions', rarity:'RARE' })
  if(stats.winRate>68) achievements.push({ id:'consistency', icon:'📈', title:'Consistent', description:`Win rate ${stats.winRate.toFixed(0)}% across ${stats.numTrades} trades`, rarity:'RARE' })

  return { traits: traits.slice(0,6), radar, archetypes: archetypes.slice(0,4), achievements }
}
