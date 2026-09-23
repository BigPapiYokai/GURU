import { BlockchainProvider, LeaderboardEntry } from './types'
import { Wallet, WalletStats, Trade, Token, LiveEvent, TokenCategory, Chain, Dex } from '../types'

// Production-grade mock that implements the full interface
// Replace with Helius/Alchemy/Birdeye in production via env switch

const CHAINS: Chain[] = ['solana','ethereum','base','arbitrum']
const DEXES: Dex[] = ['Jupiter','Uniswap','Orca','Raydium']
const CATS: TokenCategory[] = ['meme','defi','ai','gaming','infra']

function hash(str:string){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h+= (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24)} return Math.abs(h) }
function pseudo(seed:string, min=0,max=1){ const h=hash(seed); return min + (h % 10000)/10000 * (max-min) }
function addrFromSeed(seed:string){ const h=hash(seed).toString(16).padStart(8,'0'); const a=hash(seed+'a').toString(16).padStart(8,'0'); const b=hash(seed+'b').toString(16).padStart(6,'0'); return `0x${h}${a}${b}`.slice(0,42).padEnd(42,'1') }

const TOKEN_SEEDS = [
  { sym:'$PEPE', name:'Pepe', cat:'meme' as TokenCategory, mcap: 820_000_000, price:0.0000073 },
  { sym:'$WIF', name:'dogwifhat', cat:'meme' as TokenCategory, mcap: 1_200_000_000, price:1.42 },
  { sym:'$BONK', name:'Bonk', cat:'meme' as TokenCategory, mcap: 890_000_000, price:0.000018 },
  { sym:'$GURU', name:'Guru', cat:'meme' as TokenCategory, mcap: 12_400_000, price:0.0124 },
  { sym:'$JUP', name:'Jupiter', cat:'defi' as TokenCategory, mcap: 1_500_000_000, price:0.72 },
  { sym:'$ORCA', name:'Orca', cat:'defi' as TokenCategory, mcap: 88_000_000, price:1.9 },
  { sym:'$TAO', name:'Bittensor', cat:'ai' as TokenCategory, mcap: 2_100_000_000, price:310 },
  { sym:'$ABC', name:'ABC Protocol', cat:'meme' as TokenCategory, mcap: 2_400_000, price:0.023 },
  { sym:'$XYZ', name:'XYZ Labs', cat:'ai' as TokenCategory, mcap: 6_800_000, price:0.41 },
  { sym:'$DEF', name:'DeFi Edge', cat:'defi' as TokenCategory, mcap: 14_000_000, price:0.55 },
  { sym:'$GHI', name:'GHI Meme', cat:'meme' as TokenCategory, mcap: 3_200_000, price:0.00092 },
]

export const MOCK_TOKENS: Token[] = TOKEN_SEEDS.map((t,i)=> ({
  address: addrFromSeed(t.sym+i),
  symbol: t.sym,
  name: t.name,
  chain: CHAINS[i % CHAINS.length] as Chain,
  category: t.cat,
  price: t.price,
  priceChange24h: pseudo(t.sym+'chg', -12, 22),
  marketCap: t.mcap * pseudo(t.sym+'mcap2',0.82,1.22),
  liquidity: t.mcap * 0.08 * pseudo(t.sym+'liq',0.6,1.4),
  volume24h: t.mcap * 0.14 * pseudo(t.sym+'vol',0.5,1.5),
  holders: Math.round(pseudo(t.sym+'holders', 1200, 62000)),
  holderGrowth24h: pseudo(t.sym+'hg', -1.2, 9.4),
  ageDays: Math.round(pseudo(t.sym+'age', 12, 820)),
  risk: (pseudo(t.sym+'risk',0,1) >0.73? 'HIGH': pseudo(t.sym+'risk2',0,1)>0.5?'MEDIUM':'LOW') as any,
  concentrationTop10: pseudo(t.sym+'conc', 12, 48),
}))

// add guru token lookup both by symbol and address
const GURU_TOKEN = MOCK_TOKENS.find(t=>t.symbol==='$GURU')!

function makeWalletStats(address:string): WalletStats {
  const seed = address
  const numTrades = Math.round(pseudo(seed+'nt', 18, 340))
  const winRate = pseudo(seed+'wr', 44, 78)
  const roi = pseudo(seed+'roi', -8, 620)
  const avgTrade = pseudo(seed+'avg', 800, 42000)
  const largest = avgTrade * pseudo(seed+'large',1.8,9.5)
  const profitable = Math.round(numTrades * winRate/100)
  const avgHoldSec = pseudo(seed+'hold', 600, 86400*22)
  const earlyRate = pseudo(seed+'early', 28, 84)
  const exitEff = pseudo(seed+'exit', 56, 94)
  const rugExp = pseudo(seed+'rug', 0.6, 14)
  const realized = (roi/100) * avgTrade * numTrades * 0.42 + pseudo(seed+'real', -8000, 120000)
  const unreal = pseudo(seed+'unreal', -15000, 90000)
  const positions = Array.from({length: Math.round(pseudo(seed+'pos',1,6))}, (_,j)=>{
    const tok = MOCK_TOKENS[Math.floor(pseudo(seed+'tok'+j,0,MOCK_TOKENS.length))]
    const amt = pseudo(seed+'amt'+j, 5000, 80000)
    const entry = tok.price * pseudo(seed+'entry'+j,0.7,1.22)
    const curr = tok.price
    return {
      tokenAddress: tok.address, tokenSymbol: tok.symbol, amount: amt,
      valueUSD: amt*curr, avgEntry: entry, currentPrice: curr, pnl: amt*(curr-entry), roi: ((curr/entry)-1)*100
    }
  })
  const curve = Array.from({length:30},(_,i)=>({ t: Date.now()- (30-i)*86400000, value: realized * (0.22 + 0.78*i/30) * pseudo(seed+'curve'+i,0.88,1.12)}))
  const monthlyPnL = ['Jan','Feb','Mar','Apr','May','Jun'].map(m=>({ month:m, pnl: pseudo(seed+m, -12000, 52000)}))
  const chains = [CHAINS[Math.floor(pseudo(seed+'ch',0,CHAINS.length))] as Chain]
  const preferredCats = [CATS[Math.floor(pseudo(seed+'cat',0,CATS.length))] as TokenCategory]
  // trades will be separate but best/worst derived
  return {
    address,
    totalRealizedPnL: Math.round(realized),
    unrealizedPnL: Math.round(unreal),
    roi: Math.round(roi*10)/10,
    winRate: Math.round(winRate*10)/10,
    avgTradeSize: Math.round(avgTrade),
    largestTrade: Math.round(largest),
    numTrades,
    profitableTrades: profitable,
    losingTrades: numTrades-profitable,
    avgHoldingSec: Math.round(avgHoldSec),
    bestTrade: null as any,
    worstTrade: null as any,
    tradingFrequency: Math.round(pseudo(seed+'freq',1.2,22)*10)/10,
    earlyEntryRate: Math.round(earlyRate*10)/10,
    exitEfficiency: Math.round(exitEff),
    rugExposure: Math.round(rugExp*10)/10,
    whaleBehavior: Math.round(pseudo(seed+'whale',12,89)),
    currentPositions: positions,
    historicalPnLCurve: curve,
    monthlyPnL,
    // ageDays added ad-hoc
    // @ts-ignore
    ageDays: Math.round(pseudo(seed+'age', 45, 980)),
    // internal
    // @ts-ignore
    chains, preferredCategories: preferredCats, preferredDexs: [DEXES[Math.floor(pseudo(seed+'dex',0,DEXES.length))] as Dex]
  } as WalletStats
}

function makeTrades(address:string, limit=60): Trade[]{
  const stats = makeWalletStats(address)
  const n = Math.min(limit, stats.numTrades)
  return Array.from({length:n},(_,i)=>{
    const tok = MOCK_TOKENS[Math.floor(pseudo(address+i+'tok',0,MOCK_TOKENS.length))]
    const sideRnd = pseudo(address+i+'side',0,1)
    const side = sideRnd>0.58? 'BUY' as const : sideRnd>0.3? 'SELL' as const : 'BUY' as const
    const usd = Math.round(pseudo(address+i+'usd', 420, stats.largestTrade*0.9))
    const price = tok.price * pseudo(address+i+'price',0.72,1.38)
    const mcap = tok.marketCap * pseudo(address+i+'mcap',0.6,1.12)
    // roi per trade
    const roi = pseudo(address+i+'roi', -62, 420)
    const ts = Date.now() - pseudo(address+i+'ts', 0, 1000*60*60*24*120)
    return {
      id: hash(address+i+'id').toString(16),
      walletAddress: address,
      tokenAddress: tok.address,
      tokenSymbol: tok.symbol,
      chain: tok.chain,
      dex: DEXES[Math.floor(pseudo(address+i+'dex',0,DEXES.length))] as Dex,
      side,
      amountToken: usd/price,
      amountUSD: usd,
      price,
      marketCapAtEntry: Math.round(mcap),
      timestamp: Math.round(ts),
      txHash: '0x'+hash(address+i+'tx').toString(16).padStart(64,'0').slice(0,64),
      pnl: Math.round(roi/100*usd),
      roi: Math.round(roi*10)/10,
      holdDurationSec: Math.round(pseudo(address+i+'hold', 300, 86400*14))
    }
  }).sort((a,b)=> b.timestamp - a.timestamp)
}

// enrich stats with best/worst
function enrichStats(address:string){
  const base = makeWalletStats(address)
  const trades = makeTrades(address, 80)
  const sortedByRoi = [...trades].sort((a,b)=> (b.roi||0)-(a.roi||0))
  base.bestTrade = sortedByRoi[0] || null
  base.worstTrade = sortedByRoi[sortedByRoi.length-1] || null
  return { stats: base, trades }
}

const KNOWN_WALLETS = [
  '0x7F3E...9a2',
  '0x4B1C...c03',
  '0x9E2A...7f6',
  '0x3A7B...b91',
  '0xD2cA...a8F',
  '0x91A1...72F',
  '0x71C0...81A',
  '0x82D0...19B',
  '0x5A1C...2CC',
]

// expand to full addresses deterministically
export const FULL_WALLETS = KNOWN_WALLETS.map(k=> addrFromSeed(k)).concat(
  Array.from({length:22},(_,i)=> addrFromSeed('gen'+i))
)
export const WALLET_LABELS = FULL_WALLETS.map((a,i)=> ({ address:a, label: KNOWN_WALLETS[i] || `0x${a.slice(2,6)}…${a.slice(-3)}` }))

export const mockProvider: BlockchainProvider = {
  id:'mock',
  name:'Mock Provider (dev)',
  chain:'multi',
  getSupportedChains(){ return [...CHAINS] },
  async healthCheck(){ return true },
  async getWallet(address:string){
    const norm = address.toLowerCase()
    const exists = FULL_WALLETS.find(w=>w.toLowerCase()===norm) || (address.startsWith('0x')? address : null)
    if(!exists) {
      // still return a wallet for any 0x addr — allow search
      if(!address.startsWith('0x') || address.length<10) return null
      const a = address
      return { address:a, ens: pseudo(a+'ens',0,1)>0.82? `${a.slice(2,6)}.eth`: undefined, ageDays: Math.round(pseudo(a+'age',40,800)), createdAt: Date.now()- pseudo(a+'age',40,800)*86400000, chains:['solana'], preferredDexs:['Jupiter'], preferredCategories:['meme'] } as Wallet
    }
    return { address: exists, ens: pseudo(exists+'ens',0,1)>0.74? `guru${hash(exists)%100}.eth`:undefined, ageDays: Math.round(pseudo(exists+'age',40,900)), createdAt: Date.now()- pseudo(exists+'age',40,900)*86400000, chains:['solana'], preferredDexs:['Jupiter'], preferredCategories:['meme'] } as Wallet
  },
  async getWalletStats(address:string){
    const { stats } = enrichStats(address.toLowerCase())
    return stats
  },
  async getWalletTrades(address:string, limit=60){
    return makeTrades(address.toLowerCase(), limit)
  },
  async searchWallets(query:string){
    const q=query.toLowerCase()
    const filtered = FULL_WALLETS.filter(a=> a.toLowerCase().includes(q) || q.length<3).slice(0,8)
    const res = await Promise.all(filtered.map(a=> this.getWallet(a)))
    return res.filter(Boolean) as Wallet[]
  },
  async getToken(addressOrSymbol:string){
    const q=addressOrSymbol.toLowerCase()
    return MOCK_TOKENS.find(t=> t.symbol.toLowerCase()===q || t.address.toLowerCase()===q || t.name.toLowerCase().includes(q) ) || null
  },
  async getTokenHolders(_tokenAddress:string){
    return FULL_WALLETS.slice(0,6).map(a=> ({ address:a, amount: pseudo(a+'hold', 8000, 120000)}))
  },
  async searchTokens(query:string){
    const q=query.toLowerCase()
    if(!q) return MOCK_TOKENS.slice(0,5)
    return MOCK_TOKENS.filter(t=> t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.address.toLowerCase().includes(q)).slice(0,6)
  },
  async getLiveEvents(){
    const now=Date.now()
    const events: LiveEvent[] = []
    for(let i=0;i<18;i++){
      const wallet = FULL_WALLETS[Math.floor(pseudo('evw'+i,0,FULL_WALLETS.length))]
      const token = MOCK_TOKENS[Math.floor(pseudo('evt'+i,0,MOCK_TOKENS.length))]
      const action = (pseudo('eva'+i,0,1)>0.72? 'SELL':'BUY') as LiveEvent['action']
      const value = Math.round(pseudo('evval'+i, 8000, 129000))
      const score = Math.round(74 + pseudo('evscore'+i,0,22)) // 74-96
      const reasons = ['Early entry','Smart-money convergence','Profit-taking','Historical pattern','14 similar entries + liquidity up','3 whales + social surge']
      const reason = reasons[Math.floor(pseudo('evreas'+i,0,reasons.length))]
      const cfgScore = score
      events.push({
        id:'ev'+i, walletAddress:wallet, walletScore: score, walletLabels:[ score>88? 'Smart Money': score>80?'Sharp':'Active'],
        action, tokenSymbol: token.symbol, tokenAddress: token.address, valueUSD: value, reason,
        confidence: score>90? 'HIGH': score>84?'MEDIUM':'LOW', timestamp: now - Math.round(pseudo('evts'+i,0, 1000*60*120)), chain: token.chain, guruScore: cfgScore
      })
    }
    return events.sort((a,b)=> b.timestamp-a.timestamp)
  },
  async getConvergences(){
    const events = await this.getLiveEvents()
    const { detectConvergences } = await import('../engines/convergence')
    return detectConvergences(events, MOCK_TOKENS as any)
  },
  async getLeaderboard(category:string, limit=20){
    const all = FULL_WALLETS.slice(0,30).map(a=>{
      const { stats } = enrichStats(a)
      // compute guru quickly approx
      const approx = Math.round(62 + pseudo(a+'guru',0,34) + (stats.roi>200?6:0))
      return { walletAddress:a, guruScore: Math.min(97.6, approx + pseudo(a+'jitter',-2,4)), roi: stats.roi, winRate: stats.winRate, realizedPnL: stats.totalRealizedPnL, realizedPnLValue: stats.totalRealizedPnL, category }
    })
    let sorted: typeof all = []
    switch(category){
      case 'roi': sorted = [...all].sort((a,b)=> b.roi-a.roi); break;
      case 'consistency': sorted=[...all].sort((a,b)=> b.winRate-a.winRate); break;
      case 'early': sorted=[...all].sort((a,b)=> pseudo(b.walletAddress+'early',0,1)- pseudo(a.walletAddress+'early',0,1)); break;
      case 'meme': sorted=[...all].filter((_,i)=>i%2===0).sort((a,b)=> b.guruScore-a.guruScore); break;
      default: sorted=[...all].sort((a,b)=> b.guruScore-a.guruScore)
    }
    return sorted.slice(0,limit).map((e,i)=> ({...e, rank:i+1}))
  },
  async getClusteringGraph(address:string){
    const related = FULL_WALLETS.filter(a=>a!==address).slice(0,6)
    const nodes = [{id:address, score: Math.round(82+ pseudo(address+'s',0,14)), label:'TARGET'}, ...related.map(a=>({id:a, score: Math.round(70+ pseudo(a+'cs',0,24)), label: `0x${a.slice(2,6)}…` }))]
    const edges = related.slice(0,4).map((a,i)=> ({
      source: address, target:a, strength: pseudo(address+a,0.42,0.92),
      signals: [
        ['Common funding','Repeated buys','Shared timing'][i%3],
        ['Similar token selections','Transfers between'][i%2]
      ].flat().slice(0,2)
    }))
    // add inter-related
    edges.push({ source: related[0], target: related[1], strength:0.58, signals:['Repeated simultaneous buys'] })
    return { nodes, edges }
  }
}

export const provider = mockProvider
// convenience re-exports
export function shortAddr(a:string){ return a.length>12? `${a.slice(0,6)}…${a.slice(-4)}`:a }
export { addrFromSeed, pseudofn as pseudoFn }
function pseudofn(a:string,b:number,c:number){ return pseudo(a,b,c)}
export const MOCK_WALLETS = FULL_WALLETS
