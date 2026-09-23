// GURU — In-app Pump.fun trading via PumpPortal trade-local (no API key)
// Flow (docs: https://pumpportal.fun/local-trading-api/trading-api/):
//   1. POST https://pumpportal.fun/api/trade-local { publicKey, action, mint,
//      amount, denominatedInSol, slippage, priorityFee, pool }
//   2. Deserialize returned VersionedTransaction, sign LOCALLY with the user's
//      keypair, send via the user's own RPC endpoint.
//   3. PumpPortal never sees the private key.
//
// SECURITY MODEL — read before funding:
//   - The private key lives ONLY in module memory (never localStorage/disk).
//   - It is wiped on page refresh, wallet disconnect, or via "Forget key".
//   - Treat any imported wallet as a HOT trading wallet: fund with dust/small
//     amounts only. NEVER import a vault/savings key. GURU cannot recover funds.
//   - trade-local carries no PumpPortal fee; normal Solana + bonding-curve fees
//     still apply. Lightning (API-key) trading is NOT implemented (0.5% fee,
//     custodial) — this keeps keys fully self-custodied.

import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js'
import bs58 from 'bs58'

export type TradeAction = 'buy' | 'sell'
export type TradePool = 'auto' | 'pump' | 'pump-amm' | 'raydium' | 'launchlab' | 'raydium-cpmm' | 'bonk'

export interface TradeParams {
  mint: string
  action: TradeAction
  /** SOL amount (buy) or token amount / "50%" (sell) */
  amount: string
  denominatedInSol: boolean
  slippage: number
  priorityFee: number
  pool: TradePool
}

export interface TradeResult {
  signature: string
  solscanUrl: string
}

const TRADE_LOCAL_URL = 'https://pumpportal.fun/api/trade-local'
const DEFAULT_RPC =
  ((import.meta as any).env?.VITE_SOLANA_RPC as string) ||
  'https://api.mainnet-beta.solana.com'

// ---- session-only wallet (memory only, never persisted) ----
let sessionKeypair: Keypair | null = null

export function hasSessionWallet(): boolean {
  return sessionKeypair !== null
}

export function sessionPublicKey(): string | null {
  return sessionKeypair ? sessionKeypair.publicKey.toBase58() : null
}

/** Import base58 secret key into MEMORY ONLY. Returns the public key. */
export function importSessionKey(secretBase58: string): string {
  const trimmed = secretBase58.trim()
  if (!trimmed) throw new Error('Empty key.')
  let bytes: Uint8Array
  try {
    bytes = bs58.decode(trimmed)
  } catch {
    throw new Error('Not a valid base58 secret key.')
  }
  if (bytes.length !== 64) throw new Error(`Invalid key length (${bytes.length} bytes, need 64). Export the full secret key from Phantom (Settings → Export Private Key).`)
  sessionKeypair = Keypair.fromSecretKey(bytes)
  bytes.fill(0)
  return sessionKeypair.publicKey.toBase58()
}

export function forgetSessionKey() {
  sessionKeypair = null
}

export async function getSessionBalance(rpc = DEFAULT_RPC): Promise<number | null> {
  if (!sessionKeypair) return null
  try {
    const conn = new Connection(rpc, 'confirmed')
    const lamports = await conn.getBalance(sessionKeypair.publicKey)
    return lamports / 1_000_000_000
  } catch {
    return null
  }
}

function buildBody(pubkey: string, p: TradeParams): Record<string, unknown> {
  return {
    publicKey: pubkey,
    action: p.action,
    mint: p.mint,
    denominatedInSol: p.denominatedInSol ? 'true' : 'false',
    amount: p.denominatedInSol || p.action === 'buy' ? Number(p.amount) : p.amount,
    slippage: p.slippage,
    priorityFee: p.priorityFee,
    pool: p.pool,
  }
}

/** Build (unsigned) tx via PumpPortal, sign locally, broadcast via own RPC. */
export async function executeTrade(
  params: TradeParams,
  rpc = DEFAULT_RPC,
  onStage?: (stage: string) => void
): Promise<TradeResult> {
  if (!sessionKeypair) throw new Error('No wallet connected. Import a hot-wallet key first.')
  if (!params.mint || params.mint.length < 32) throw new Error('Invalid token mint.')
  const amt = Number(params.amount)
  if (params.action === 'buy' && !(amt > 0)) throw new Error('Enter a SOL amount > 0.')
  if (params.action === 'sell' && !params.amount) throw new Error('Enter a token amount or % (e.g. 100%).')

  onStage?.('Building transaction via PumpPortal…')
  const res = await fetch(TRADE_LOCAL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildBody(sessionKeypair.publicKey.toBase58(), params)),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`PumpPortal build failed (${res.status}): ${text.slice(0, 220)}`)
  }
  const buf = new Uint8Array(await res.arrayBuffer())
  if (buf.length < 100) throw new Error('PumpPortal returned an empty transaction. Try again.')

  onStage?.('Signing locally…')
  const tx = VersionedTransaction.deserialize(buf)
  tx.sign([sessionKeypair])

  onStage?.('Broadcasting to Solana…')
  const conn = new Connection(rpc, 'confirmed')
  const signature = await conn.sendTransaction(tx, { skipPreflight: false })
  return { signature, solscanUrl: `https://solscan.io/tx/${signature}` }
}
