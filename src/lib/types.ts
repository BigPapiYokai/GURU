// GURU — Core Domain Types
// Mirrors §23 DATABASE + §22 DATA ARCHITECTURE

export type Chain = 'solana' | 'ethereum' | 'base' | 'arbitrum' | 'bsc'
export type Dex = 'Jupiter' | 'Uniswap' | 'Orca' | 'Raydium' | 'PancakeSwap' | '1inch'
export type TokenCategory = 'meme' | 'defi' | 'ai' | 'gaming' | 'infra' | 'rwa' | 'stable' | 'other'

export type TxSide = 'BUY' | 'SELL' | 'TRANSFER' | 'LP_ADD' | 'LP_REMOVE'

export interface Token {
  address: string
  symbol: string
  name: string
  image?: string
  chain: Chain
  category: TokenCategory
  price: number
  priceChange24h: number
  marketCap: number
  liquidity: number
  volume24h: number
  holders: number
  holderGrowth24h: number
  ageDays: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  concentrationTop10: number // %
}

export interface Trade {
  id: string
  walletAddress: string
  tokenAddress: string
  tokenSymbol: string
  chain: Chain
  dex: Dex
  side: TxSide
  amountToken: number
  amountUSD: number
  price: number
  marketCapAtEntry: number
  timestamp: number
  txHash: string
  pnl?: number
  roi?: number // %
  holdDurationSec?: number
}

export interface Wallet {
  address: string
  ens?: string
  avatar?: string
  ageDays: number
  createdAt: number
  chains: Chain[]
  preferredDexs: Dex[]
  preferredCategories: TokenCategory[]
}

export interface WalletStats {
  address: string
  totalRealizedPnL: number
  unrealizedPnL: number
  roi: number
  winRate: number // 0-100
  avgTradeSize: number
  largestTrade: number
  numTrades: number
  profitableTrades: number
  losingTrades: number
  avgHoldingSec: number
  bestTrade: Trade | null
  worstTrade: Trade | null
  tradingFrequency: number // trades / week
  earlyEntryRate: number // %
  exitEfficiency: number // 0-100
  rugExposure: number // 0-100 lower better? tract as rugs touched %
  whaleBehavior: number // 0-100
  currentPositions: Position[]
  historicalPnLCurve: { t:number, value:number }[]
  monthlyPnL: { month:string, pnl:number }[]
  ageDays: number
  chains: Chain[]
  preferredDexs: Dex[]
  preferredCategories: TokenCategory[]
}

export interface Position {
  tokenAddress: string
  tokenSymbol: string
  amount: number
  valueUSD: number
  avgEntry: number
  currentPrice: number
  pnl: number
  roi: number
}

export interface GuruScoreBreakdown {
  total: number // 0-100
  profitability: number
  consistency: number
  earlyEntries: number
  riskManagement: number
  rugAvoidance: number
  timing: number
  longevity: number
  positionManagement: number
  // transparency
  reasoning: string[]
}

export interface WalletDNA {
  traits: { label: string, score: number, confidence: 'LOW'|'MEDIUM'|'HIGH', description:string }[]
  radar: { dimension:string, value:number }[] // 6-8 axes
  archetypes: string[] // ["Smart Money","Sniper"...]
  achievements: Achievement[]
}

export interface Achievement {
  id:string
  icon:string
  title:string
  description:string
  rarity:'COMMON'|'RARE'|'EPIC'|'LEGENDARY'
  unlockedAt?: number
}

export interface LiveEvent {
  id:string
  walletAddress:string
  walletScore:number
  walletLabels:string[]
  action:TxSide
  tokenSymbol:string
  tokenAddress:string
  valueUSD:number
  reason:string
  confidence:'LOW'|'MEDIUM'|'HIGH'
  timestamp:number
  chain:Chain
  guruScore:number
}

export interface Convergence {
  tokenAddress:string
  tokenSymbol:string
  tokenName:string
  chain:Chain
  numGuruWallets:number
  entriesLastMinutes:number
  combinedEntriesUSD:number
  avgGuruScore:number
  historicalSuccessRate:number // %
  confidence:'LOW'|'MEDIUM'|'HIGH'
  entries:{wallet:string,score:number,amount:number,timestamp:number}[]
  liquidity:number
  holderChange24h:number
}

export interface LeaderboardEntry {
  rank:number
  walletAddress:string
  guruScore:number
  roi:number
  winRate:number
  realizedPnL:number
  category:string
}

export interface ClusteringEdge {
  source:string
  target:string
  strength:number // 0-1
  signals:string[]
  label:string // "Strong behavioral overlap"
}

export interface AlertConfig {
  id:string
  type:string
  enabled:boolean
  threshold?:number
  walletAddress?:string
  tokenAddress?:string
  channel:'browser'|'email'|'telegram'|'discord'
}

// Social / Watchlists
export interface Watchlist {
  id:string
  name:string
  description:string
  public:boolean
  wallets:string[]
  followers:number
  owner:string
  createdAt:number
}

export interface UserProfile {
  handle:string
  guruScore:number
  percentile:number
  followers:number
  following:number
  trackedWallets:number
  publicLists:number
}
