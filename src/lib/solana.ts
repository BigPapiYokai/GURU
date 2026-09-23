// GURU — real Solana wallet lookups over public RPC (no key).
// Free tier has no wallet trade-history API, but RPC gives us enough to make
// search useful: validity, SOL balance, tx count, last activity — plus links
// out to Solscan + the wallet's pump.fun profile page.

import { Connection, PublicKey } from '@solana/web3.js'

const DEFAULT_RPC =
  ((import.meta as any).env?.VITE_SOLANA_RPC as string) ||
  'https://api.mainnet-beta.solana.com'

export interface SolanaWalletSnapshot {
  address: string
  balanceSol: number | null
  txCount: number | null // signatures fetched (cap) — lower bound when capped
  txCountCapped: boolean
  lastActive: number | null
  recentSigs: { signature: string; slot: number; blockTime: number | null | undefined }[]
  rpc: string
}

/** True for plausible base58 Solana addresses (wallets, mints, programs). */
export function isSolanaAddress(q: string): boolean {
  const t = q.trim()
  if (t.startsWith('0x') || t.includes('.')) return false
  if (t.length < 32 || t.length > 44) return false
  try {
    new PublicKey(t)
    return true
  } catch {
    return false
  }
}

const cache = new Map<string, { at: number; snap: SolanaWalletSnapshot }>()
const CACHE_MS = 45_000

export async function getSolanaWallet(address: string, rpc = DEFAULT_RPC): Promise<SolanaWalletSnapshot> {
  const addr = address.trim()
  const hit = cache.get(addr)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.snap

  const conn = new Connection(rpc, 'confirmed')
  const pubkey = new PublicKey(addr)
  const [balanceLamports, sigs] = await Promise.all([
    conn.getBalance(pubkey).catch(() => null),
    conn.getSignaturesForAddress(pubkey, { limit: 25 }).catch(() => null),
  ])
  if (balanceLamports === null && sigs === null) {
    throw new Error('RPC unreachable (rate-limited?). Check connection or set VITE_SOLANA_RPC and retry.')
  }
  const recent = (sigs ?? []).map((s) => ({
    signature: s.signature,
    slot: s.slot,
    blockTime: s.blockTime,
  }))
  const times = recent.map((r) => r.blockTime).filter((t): t is number => typeof t === 'number')
  const snap: SolanaWalletSnapshot = {
    address: addr,
    balanceSol: balanceLamports == null ? null : balanceLamports / 1_000_000_000,
    txCount: sigs == null ? null : sigs.length,
    txCountCapped: (sigs?.length ?? 0) >= 25,
    lastActive: times.length ? Math.max(...times) * 1000 : null,
    recentSigs: recent,
    rpc,
  }
  cache.set(addr, { at: Date.now(), snap })
  return snap
}

export function shortSol(a: string) {
  return a.length > 12 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a
}
