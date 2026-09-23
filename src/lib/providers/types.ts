import { Token, Trade, Wallet, WalletStats, LiveEvent, Convergence, TokenCategory } from '../types'

// §22 DATA ARCHITECTURE — Provider Abstraction
// Abstraction mirrors the spec diagram:
// BLOCKCHAIN DATA PROVIDERS → DATA NORMALIZATION → TRANSACTION INDEXER → WALLET INTELLIGENCE ENGINE → ...

export interface BlockchainProvider {
  id: string
  name: string
  chain: string
  // metadata
  getSupportedChains(): string[]
  healthCheck(): Promise<boolean>

  // wallet
  getWallet(address: string): Promise<Wallet | null>
  getWalletStats(address: string): Promise<WalletStats | null>
  getWalletTrades(address: string, limit?: number): Promise<Trade[]>
  searchWallets(query: string): Promise<Wallet[]>

  // token
  getToken(addressOrSymbol: string): Promise<Token | null>
  getTokenHolders(tokenAddress:string): Promise<{ address:string, amount:number }[]>
  searchTokens(query:string): Promise<Token[]>

  // feed
  getLiveEvents(filters?: Partial<LiveEvent>): Promise<LiveEvent[]>
  getConvergences(): Promise<Convergence[]>
  getLeaderboard(category:string, limit?:number): Promise<LeaderboardEntry[]>

  // clustering
  getClusteringGraph(address:string): Promise<{nodes:{id:string,score:number,label:string}[], edges:{source:string,target:string,strength:number,signals:string[]}[]}>
}

export interface LeaderboardEntry {
  rank:number
  walletAddress:string
  guruScore:number
  roi:number
  winRate:number
  realizedPnL:number
  realizedPnLValue:number
  category:string
}

// token gating abstraction — §20
export interface TokenGateProvider {
  verifyHolding(wallet:string, minAmount:number): Promise<boolean>
  getBalance(wallet:string): Promise<number>
  hasPremiumAccess(wallet:string): Promise<boolean>
}

// notifications abstraction — §18
export interface NotificationProvider {
  id:'browser'|'email'|'telegram'|'discord'
  send(title:string, body:string, meta?:unknown): Promise<void>
  isConfigured(): boolean
}

// unified config for provider choice via env
export const PROVIDER_CONFIG = {
  primary: (import.meta as any).env?.VITE_DATA_PROVIDER || 'mock',
  heliusApiKey: (import.meta as any).env?.VITE_HELIUS_API_KEY,
  alchemyApiKey: (import.meta as any).env?.VITE_ALCHEMY_API_KEY,
  birdeyeApiKey: (import.meta as any).env?.VITE_BIRDEYE_API_KEY,
} as const
