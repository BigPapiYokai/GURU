// GURU — DexScreener free enrichment (no API key)
// Docs: https://docs.dexscreener.com/api/reference
// Endpoints used:
//   GET https://api.dexscreener.com/tokens/v1/solana/{mint[,mint...]}  (batch OK)
//   Chart embed (undocumented but frameable):
//   https://dexscreener.com/solana/{mint}?embed=1&theme=dark
// Rate limits (~60-300/min) → in-memory cache + batching. All failures are
// non-fatal: cards fall back to PumpPortal text data + outbound links.

export interface DexPairInfo {
  pairAddress?: string
  dexId?: string
  priceUsd?: number
  priceNative?: number
  liquidityUsd?: number
  volumeH24?: number
  marketCap?: number
  fdv?: number
  priceChangeH24?: number
  txnsH24Buys?: number
  txnsH24Sells?: number
  imageUrl?: string
  url?: string
}

export interface DexTokenInfo {
  mint: string
  name?: string
  symbol?: string
  imageUrl?: string
  best?: DexPairInfo
  pairsCount: number
}

const cache = new Map<string, { at: number; info: DexTokenInfo }>()
const CACHE_MS = 60_000
const pending = new Map<string, Promise<DexTokenInfo | null>>()

function mapPair(p: any): DexPairInfo {
  return {
    pairAddress: p?.pairAddress,
    dexId: p?.dexId,
    priceUsd: p?.priceUsd ? Number(p.priceUsd) : undefined,
    priceNative: p?.priceNative ? Number(p.priceNative) : undefined,
    liquidityUsd: p?.liquidity?.usd,
    volumeH24: p?.volume?.h24,
    marketCap: p?.marketCap,
    fdv: p?.fdv,
    priceChangeH24: p?.priceChange?.h24,
    txnsH24Buys: p?.txns?.h24?.buys,
    txnsH24Sells: p?.txns?.h24?.sells,
    imageUrl: p?.info?.imageUrl,
    url: p?.url,
  }
}

function mapToken(mint: string, pairs: any[]): DexTokenInfo {
  const mapped = pairs.map(mapPair)
  const best =
    mapped.sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0))[0] ?? undefined
  const first = pairs[0]
  return {
    mint,
    name: first?.baseToken?.name,
    symbol: first?.baseToken?.symbol,
    imageUrl: best?.imageUrl,
    best,
    pairsCount: mapped.length,
  }
}

/** Batched + cached enrichment for a list of Solana mints. */
export async function enrichTokens(mints: string[]): Promise<Map<string, DexTokenInfo>> {
  const out = new Map<string, DexTokenInfo>()
  const now = Date.now()
  const fresh = mints.filter((m) => !m.startsWith('DEMO'))
  const need: string[] = []
  for (const m of fresh) {
    const hit = cache.get(m)
    if (hit && now - hit.at < CACHE_MS) out.set(m, hit.info)
    else need.push(m)
  }
  // batch in chunks of 20 (endpoint supports comma batch)
  for (let i = 0; i < need.length; i += 20) {
    const chunk = need.slice(i, i + 20)
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 9000)
      const res = await fetch(
        `https://api.dexscreener.com/tokens/v1/solana/${chunk.join(',')}`,
        { signal: ctrl.signal }
      )
      clearTimeout(timer)
      if (!res.ok) continue
      const arr = await res.json()
      // response: array of pairs (not keyed) — group by baseToken.address
      const byMint = new Map<string, any[]>()
      for (const p of Array.isArray(arr) ? arr : []) {
        const addr = p?.baseToken?.address
        if (!addr) continue
        const list = byMint.get(addr) ?? []
        list.push(p)
        byMint.set(addr, list)
      }
      for (const m of chunk) {
        const info = mapToken(m, byMint.get(m) ?? [])
        cache.set(m, { at: now, info })
        if (info.pairsCount > 0) out.set(m, info)
        else pending.delete(m)
      }
    } catch { /* rate-limited/offline — keep PumpPortal data */ }
  }
  return out
}

export async function enrichToken(mint: string): Promise<DexTokenInfo | null> {
  const all = await enrichTokens([mint])
  return all.get(mint) ?? null
}

/** Embeddable candle chart URL (DexScreener, dark). Prefer the pair address when
 *  known — mint URLs only resolve once DexScreener has indexed the token, which
 *  lags fresh bonding-curve launches by minutes. Undocumented embed — callers
 *  must keep an outbound-link fallback. */
export function dexChartUrl(mint: string, pairAddress?: string): string {
  const id = pairAddress || mint
  return `https://dexscreener.com/solana/${id}?embed=1&theme=dark&chartTheme=dark&chartType=usd&interval=15&trades=0&info=0`
}

export function fmtUsd(n?: number): string {
  if (n == null || Number.isNaN(n)) return '—'
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  if (Math.abs(n) >= 1) return `$${n.toFixed(2)}`
  return `$${n.toPrecision(3)}`
}
