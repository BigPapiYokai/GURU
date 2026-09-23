// GURU — PumpPortal FREE live intel (no API key)
// Free tier: subscribeNewToken + subscribeMigration over wss://pumpportal.fun/api/data
// Metered (paid) streams — subscribeTokenTrade / subscribeAccountTrade — are NOT used here.
//
// What the free streams give us per event:
//   create: { mint, traderPublicKey (creator), signature, initialBuy, marketCapSol,
//             name, symbol, uri, ... }
//   migration: { mint, ... } — token graduated bonding curve → Raydium
//
// Smart-money model (free-data honest):
//   - graduation (migration) hit-rate is the strongest free signal
//   - creation volume + recency add context, never dominate
//   - scores are creator/graduation-based, NOT full PnL — page labels this clearly.
// Upgrade path: add API key + funded wallet → subscribeAccountTrade for per-wallet
// trade history → feed into computeGuruScore() for full 8-dimension scoring.

export interface PumpToken {
  mint: string
  name?: string
  symbol?: string
  creator: string
  signature?: string
  createdAt: number
  marketCapSol?: number
  initialBuy?: number
  migrated: boolean
  migratedAt?: number
  uri?: string
  imageUrl?: string
  description?: string
}

export interface PumpWalletStats {
  address: string
  created: number
  graduated: number
  gradRate: number // 0-100
  score: number // 0-100
  reasoning: string[]
  firstSeen: number
  lastSeen: number
  recentMints: string[]
}

export interface PumpSnapshot {
  status: 'connecting' | 'live' | 'demo' | 'error'
  tokensSeen: number
  walletsTracked: number
  migrationsSeen: number
  connectedAt: number | null
  wallets: PumpWalletStats[]
  recentTokens: PumpToken[]
  note: string
}

const WS_URL =
  ((import.meta as any).env?.VITE_PUMPPORTAL_WS as string) ||
  'wss://pumpportal.fun/api/data'

const STORE_KEY = 'guru-pumpfun-v1'
const MAX_TOKENS = 400
const MAX_WALLETS = 500

function shortAddr(a: string) {
  return a.length > 12 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a
}

/** ipfs:// / arweave → fetchable https gateway. Pass-through otherwise. */
export function resolveGateway(uri: string): string {
  if (uri.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${uri.slice(7)}`
  if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}|^baf[a-z0-9]+/i.test(uri)) return `https://ipfs.io/ipfs/${uri}`
  return uri
}

/** Ordered gateway list for one metadata/image URI (for fallback rotation). */
export function gatewayVariantsFor(uri: string): string[] {
  if (!uri) return []
  if (uri.startsWith('ipfs://')) {
    const cid = uri.slice(7)
    return [
      `https://ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`,
    ]
  }
  if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}|^baf[a-z0-9]+/i.test(uri)) {
    return [
      `https://ipfs.io/ipfs/${uri}`,
      `https://cloudflare-ipfs.com/ipfs/${uri}`,
      `https://gateway.pinata.cloud/ipfs/${uri}`,
    ]
  }
  if (uri.startsWith('ar://')) return [`https://arweave.net/${uri.slice(5)}`]
  return [uri]
}

/** Transparent graduation-based score. Honest about free-data limits. */
export function scorePumpWallet(created: number, graduated: number): { score: number; reasoning: string[] } {
  const gradRate = created > 0 ? (graduated / created) * 100 : 0
  // graduation rate dominates (0-70 pts), volume adds up to 20, consistency floor 10
  const ratePts = Math.min(70, gradRate * 1.4) // 50% grad rate → 70 pts
  const volPts = Math.min(20, Math.log10(Math.max(1, created)) * 14) // 1→0, 5→9.8, 10→14, 30→20
  const base = 10
  const score = Math.round(Math.min(99.9, base + ratePts + volPts) * 10) / 10
  const reasoning: string[] = []
  if (graduated > 0) reasoning.push(`${graduated}/${created} graduated (${gradRate.toFixed(0)}% grad rate)`)
  else reasoning.push(`${created} launched, none graduated yet`)
  if (gradRate >= 25 && created >= 3) reasoning.push('Elite graduation hit-rate — top of free feed')
  else if (gradRate >= 10) reasoning.push('Above-average graduation rate')
  if (created >= 10) reasoning.push('High creation volume — experienced launcher')
  reasoning.push('Free-feed score: graduations + volume only — no PnL yet')
  return { score, reasoning }
}

type Listener = (snap: PumpSnapshot) => void

class PumpPortalLive {
  private ws: WebSocket | null = null
  private tokens = new Map<string, PumpToken>()
  private walletCreated = new Map<string, Set<string>>() // wallet -> mints created
  private walletGraduated = new Map<string, Set<string>>() // wallet -> mints graduated
  private walletFirst = new Map<string, number>()
  private walletLast = new Map<string, number>()
  private migrationsSeen = 0
  private status: PumpSnapshot['status'] = 'connecting'
  private connectedAt: number | null = null
  private listeners = new Set<Listener>()
  private started = false
  private note = 'Connecting to PumpPortal free feed…'

  start() {
    if (this.started) return
    this.started = true
    this.restore()
    // Seed demo content instantly so the page is never empty; live events prepend.
    if (this.tokens.size === 0) this.seedDemo()
    try {
      this.connect()
    } catch {
      this.setStatus('demo', 'WS unavailable — showing seeded demo. Check connection to enable live feed.')
    }
    // Reconnect watchdog
    setInterval(() => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) this.connect()
    }, 15000)
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    fn(this.snapshot())
    return () => { this.listeners.delete(fn) }
  }

  getSnapshot(): PumpSnapshot {
    return this.snapshot()
  }

  getToken(mint: string): PumpToken | undefined {
    return this.tokens.get(mint)
  }

  /**
   * Lazy metadata (image/description) fetch for visible tokens.
   * Pump.fun metadata lives at the event's `uri` (often IPFS) — fetched on demand,
   * cached on the token, persisted. Never blocks the live feed.
   */
  async ensureMetadata(mints: string[]): Promise<void> {
    const jobs = mints
      .map((m) => this.tokens.get(m))
      .filter((t): t is PumpToken => !!t && !t.imageUrl && !!t.uri && !t.mint.startsWith('DEMO'))
      .slice(0, 12)
    if (jobs.length === 0) return
    await Promise.all(jobs.map((t) => this.fetchMeta(t)))
    this.persist()
    this.emit()
  }

  private async fetchMeta(t: PumpToken): Promise<void> {
    // Try metadata JSON across gateways — ipfs.io is often slow/down.
    const cands = gatewayVariantsFor(t.uri!)
    for (const url of cands.slice(0, 3)) {
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 7000)
        const res = await fetch(url, { signal: ctrl.signal })
        clearTimeout(timer)
        if (!res.ok) continue
        const j = await res.json()
        if (typeof j?.image === 'string') t.imageUrl = j.image
        if (!t.name && typeof j?.name === 'string') t.name = j.name
        if (!t.symbol && typeof j?.symbol === 'string') t.symbol = j.symbol
        if (typeof j?.description === 'string') t.description = j.description.slice(0, 280)
        return // success — stop rotating gateways
      } catch { /* try next gateway */ }
    }
  }

  private setStatus(s: PumpSnapshot['status'], note?: string) {
    this.status = s
    if (note) this.note = note
    this.emit()
  }

  private connect() {
    try {
      const ws = new WebSocket(WS_URL)
      this.ws = ws
      ws.onopen = () => {
        this.status = 'live'
        this.connectedAt = Date.now()
        this.note = 'Live — PumpPortal free feed (new tokens + migrations).'
        try {
          ws.send(JSON.stringify({ method: 'subscribeNewToken' }))
          ws.send(JSON.stringify({ method: 'subscribeMigration' }))
        } catch { /* ignore */ }
        this.emit()
      }
      ws.onmessage = (ev) => this.onMessage(ev.data)
      ws.onerror = () => {
        if (this.tokens.size > 0) this.setStatus('demo', 'Feed error — showing tracked + seeded data. Retrying…')
        else this.setStatus('error', 'Feed unreachable — retrying. Seeded demo follows when available.')
      }
      ws.onclose = () => {
        if (this.status === 'live') this.setStatus('demo', 'Feed disconnected — showing tracked data. Reconnecting…')
      }
    } catch {
      this.setStatus('demo', 'WS unavailable — showing seeded demo.')
    }
  }

  private onMessage(raw: any) {
    let msg: any
    try { msg = JSON.parse(typeof raw === 'string' ? raw : String(raw)) } catch { return }
    // PumpPortal wraps some payloads; normalize
    const d = msg?.data ?? msg
    if (!d || typeof d !== 'object') return
    if (d.txType === 'create' && d.mint && d.traderPublicKey) {
      this.addToken({
        mint: String(d.mint),
        name: d.name ? String(d.name) : undefined,
        symbol: d.symbol ? String(d.symbol) : undefined,
        creator: String(d.traderPublicKey),
        signature: d.signature ? String(d.signature) : undefined,
        createdAt: Date.now(),
        marketCapSol: typeof d.marketCapSol === 'number' ? d.marketCapSol : undefined,
        initialBuy: typeof d.initialBuy === 'number' ? d.initialBuy : undefined,
        migrated: false,
        uri: d.uri ? String(d.uri) : undefined,
      })
    } else if (
      (d.txType === 'migrate' || d.txType === 'migration' || msg?.method?.includes?.('migration') || d.migrated === true) &&
      d.mint
    ) {
      this.markMigrated(String(d.mint))
    } else if (d.mint && (msg?.method === 'migrationEvent' || d.pool === 'raydium')) {
      // defensive: any migration-shaped payload with a known mint
      this.markMigrated(String(d.mint))
    }
  }

  private addToken(t: PumpToken) {
    if (this.tokens.has(t.mint)) return
    this.tokens.set(t.mint, t)
    // trim
    if (this.tokens.size > MAX_TOKENS) {
      const oldest = [...this.tokens.values()].sort((a, b) => a.createdAt - b.createdAt)[0]
      if (oldest) this.tokens.delete(oldest.mint)
    }
    let set = this.walletCreated.get(t.creator)
    if (!set) { set = new Set(); this.walletCreated.set(t.creator, set) }
    set.add(t.mint)
    if (!this.walletFirst.has(t.creator)) this.walletFirst.set(t.creator, t.createdAt)
    this.walletLast.set(t.creator, t.createdAt)
    // trim wallets
    if (this.walletCreated.size > MAX_WALLETS) {
      const oldestW = [...this.walletLast.entries()].sort((a, b) => a[1] - b[1])[0]
      if (oldestW) {
        this.walletCreated.delete(oldestW[0])
        this.walletGraduated.delete(oldestW[0])
        this.walletFirst.delete(oldestW[0])
        this.walletLast.delete(oldestW[0])
      }
    }
    this.persist()
    this.emit()
  }

  private markMigrated(mint: string) {
    const t = this.tokens.get(mint)
    this.migrationsSeen += 1
    if (t && !t.migrated) {
      t.migrated = true
      t.migratedAt = Date.now()
      let set = this.walletGraduated.get(t.creator)
      if (!set) { set = new Set(); this.walletGraduated.set(t.creator, set) }
      set.add(mint)
      this.walletLast.set(t.creator, Date.now())
      this.persist()
      this.emit()
    } else if (!t) {
      // migration for a token we never saw created — track minimal record
      this.tokens.set(mint, {
        mint, creator: 'unknown', createdAt: Date.now(), migrated: true, migratedAt: Date.now(),
      })
      this.emit()
    } else {
      this.emit()
    }
  }

  private wallets(): PumpWalletStats[] {
    const out: PumpWalletStats[] = []
    for (const [addr, mints] of this.walletCreated) {
      if (addr === 'unknown') continue
      const grad = this.walletGraduated.get(addr)?.size ?? 0
      const { score, reasoning } = scorePumpWallet(mints.size, grad)
      out.push({
        address: addr,
        created: mints.size,
        graduated: grad,
        gradRate: mints.size ? Math.round((grad / mints.size) * 1000) / 10 : 0,
        score,
        reasoning,
        firstSeen: this.walletFirst.get(addr) ?? Date.now(),
        lastSeen: this.walletLast.get(addr) ?? Date.now(),
        recentMints: [...mints].slice(-4).reverse(),
      })
    }
    return out.sort((a, b) => b.score - a.score || b.graduated - a.graduated || b.created - a.created)
  }

  private recentTokens(): PumpToken[] {
    return [...this.tokens.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, 14)
  }

  private snapshot(): PumpSnapshot {
    return {
      status: this.status,
      tokensSeen: this.tokens.size,
      walletsTracked: this.walletCreated.size,
      migrationsSeen: this.migrationsSeen,
      connectedAt: this.connectedAt,
      wallets: this.wallets().slice(0, 60),
      recentTokens: this.recentTokens(),
      note: this.note,
    }
  }

  private emit() {
    const s = this.snapshot()
    for (const fn of this.listeners) {
      try { fn(s) } catch { /* ignore */ }
    }
  }

  private persist() {
    try {
      const data = {
        tokens: [...this.tokens.values()].slice(-MAX_TOKENS),
        graduated: [...this.walletGraduated.entries()].map(([k, v]) => [k, [...v]] as [string, string[]]),
        first: [...this.walletFirst.entries()],
        last: [...this.walletLast.entries()],
        migrationsSeen: this.migrationsSeen,
      }
      localStorage.setItem(STORE_KEY, JSON.stringify(data))
    } catch { /* storage full/blocked */ }
  }

  private restore() {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (!raw) return
      const d = JSON.parse(raw)
      for (const t of d.tokens ?? []) {
        if (t?.mint && t?.creator) {
          this.tokens.set(t.mint, t)
          let set = this.walletCreated.get(t.creator)
          if (!set) { set = new Set(); this.walletCreated.set(t.creator, set) }
          set.add(t.mint)
        }
      }
      for (const [k, v] of d.graduated ?? []) this.walletGraduated.set(k, new Set(v))
      for (const [k, v] of d.first ?? []) this.walletFirst.set(k, v)
      for (const [k, v] of d.last ?? []) this.walletLast.set(k, v)
      this.migrationsSeen = d.migrationsSeen ?? 0
      if (this.tokens.size > 0) this.note = 'Restored tracked feed from local cache. Connecting live…'
    } catch { /* ignore */ }
  }

  /** Clearly-labeled demo seed so the page explains the model before live data arrives. */
  private seedDemo() {
    const now = Date.now()
    const demoCreators = [
      { addr: 'DEMO7xSmartMoney11111111111111111111111111', created: 14, graduated: 6 },
      { addr: 'DEMO3xGradHunter22222222222222222222222222', created: 9, graduated: 3 },
      { addr: 'DEMO9xLauncherPro33333333333333333333333333', created: 22, graduated: 2 },
      { addr: 'DEMO5xFreshDegen44444444444444444444444444', created: 3, graduated: 1 },
      { addr: 'DEMO2xSprayNPray55555555555555555555555555', created: 31, graduated: 0 },
    ]
    demoCreators.forEach((w, wi) => {
      for (let i = 0; i < w.created; i++) {
        const mint = `DEMO${wi}MINT${i}xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.slice(0, 44)
        const idx = i < w.graduated
        this.tokens.set(mint, {
          mint,
          name: `Demo Token ${wi}-${i}`,
          symbol: `$DEMO${wi}${i}`,
          creator: w.addr,
          createdAt: now - (wi * 3600_000 + i * 420_000),
          marketCapSol: 28 + ((wi + i) % 6),
          migrated: idx,
          migratedAt: idx ? now - i * 300_000 : undefined,
        })
        let set = this.walletCreated.get(w.addr)
        if (!set) { set = new Set(); this.walletCreated.set(w.addr, set) }
        set.add(mint)
        if (idx) {
          let g = this.walletGraduated.get(w.addr)
          if (!g) { g = new Set(); this.walletGraduated.set(w.addr, g) }
          g.add(mint)
        }
      }
      this.walletFirst.set(w.addr, now - 86400_000)
      this.walletLast.set(w.addr, now - wi * 600_000)
    })
    this.note = 'Demo seed — connect live feed to replace with real PumpPortal events.'
    if (this.status === 'connecting') this.status = 'demo'
  }
}

export const pumpPortalLive = new PumpPortalLive()
export { shortAddr as shortSolAddr }
