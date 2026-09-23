import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSolanaWallet, shortSol, SolanaWalletSnapshot } from '../lib/solana'
import { pumpPortalLive, scorePumpWallet } from '../lib/providers/pumpportal'

function timeAgo(ts: number) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

/** Real Solana wallet view: RPC balance/activity + Pump.fun launcher record. */
export function SolanaWallet() {
  const { address = '' } = useParams()
  const [snap, setSnap] = useState<SolanaWalletSnapshot | null>(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) return
    setLoading(true); setErr(''); setSnap(null)
    pumpPortalLive.start()
    getSolanaWallet(address)
      .then(setSnap)
      .catch((e: any) => setErr(e?.message || 'Lookup failed.'))
      .finally(() => setLoading(false))
  }, [address])

  // pump.fun launcher record from the local live feed
  const feed = pumpPortalLive.getSnapshot()
  const launched = feed.recentTokens.filter((t) => t.creator === address)
  const createdTotal = feed.wallets.find((w) => w.address === address)
  const created = createdTotal?.created ?? launched.length
  const graduated = createdTotal?.graduated ?? launched.filter((t) => t.migrated).length
  const { score } = scorePumpWallet(Math.max(created, 1), graduated)

  return (
    <div style={{ display: 'grid', gap: 14, paddingBottom: 40 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 48, height: 48, borderRadius: 999, background: 'linear-gradient(135deg,#1a2a4a,#2a1a4a)', border: '1px solid #1e2e4a', display: 'grid', placeItems: 'center', fontSize: 20 }}>◎</div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="mono" style={{ fontWeight: 900, fontSize: 16 }} title={address}>{shortSol(address)}</div>
            <div className="mono" style={{ fontSize: 11, color: '#7d8aa6', wordBreak: 'break-all' }}>{address}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <a className="badge" style={{ fontSize: 10 }} href={`https://pump.fun/profile/${address}`} target="_blank" rel="noreferrer">pump.fun profile →</a>
            <a className="badge" style={{ fontSize: 10 }} href={`https://solscan.io/account/${address}`} target="_blank" rel="noreferrer">Solscan →</a>
            <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => navigator.clipboard.writeText(address)}>Copy</button>
          </div>
        </div>

        {loading && <div style={{ marginTop: 12, color: '#7d8aa6', fontSize: 13 }}>Querying Solana RPC…</div>}
        {err && <div style={{ marginTop: 12, color: '#ef4444', fontSize: 13 }}>{err}</div>}

        {snap && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            {[
              [snap.balanceSol == null ? '—' : `${snap.balanceSol.toFixed(4)} SOL`, 'balance'],
              [snap.txCount == null ? '—' : `${snap.txCount}${snap.txCountCapped ? '+' : ''}`, 'recent txs'],
              [snap.lastActive ? timeAgo(snap.lastActive) : '—', 'last active'],
              [`${score.toFixed(1)}`, 'pump launcher score'],
              [`${created} created • ${graduated} graduated`, 'pump.fun (tracked feed)'],
            ].map(([v, l]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2e4a', borderRadius: 12, padding: '8px 14px', minWidth: 130 }}>
                <div style={{ fontWeight: 900, fontSize: 15 }}>{v}</div>
                <div style={{ fontSize: 11, color: '#7d8aa6' }}>{l}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 10 }}>
          On-chain summary via public Solana RPC + your tracked PumpPortal feed. Full per-trade PnL needs the metered trade-history stream.
          pump.fun usernames only show on pump.fun itself (login-walled API) — use the profile link above.
        </div>
      </div>

      {launched.length > 0 && (
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 12 }}>LAUNCHED (tracked feed) • {launched.length}</div>
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            {launched.map((t) => (
              <div key={t.mint} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2e4a', borderRadius: 10, padding: '8px 12px' }}>
                <span style={{ fontWeight: 800 }}>{t.symbol || shortSol(t.mint)}</span>
                <span style={{ fontSize: 12, color: '#7d8aa6' }}>{t.name}</span>
                {t.migrated && <span className="badge badge-neon" style={{ fontSize: 10 }}>GRADUATED</span>}
                <a className="badge" style={{ fontSize: 10, marginLeft: 'auto' }} href={`https://pump.fun/coin/${t.mint}`} target="_blank" rel="noreferrer">pump.fun →</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {snap && snap.recentSigs.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e2e4a', fontWeight: 800, fontSize: 12 }}>RECENT TRANSACTIONS • via RPC</div>
          <div style={{ display: 'grid' }}>
            {snap.recentSigs.map((s) => (
              <a key={s.signature} href={`https://solscan.io/tx/${s.signature}`} target="_blank" rel="noreferrer"
                style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid rgba(30,46,74,0.6)', fontSize: 12 }} className="mono">
                <span style={{ color: '#00e5ff' }}>{s.signature.slice(0, 12)}…{s.signature.slice(-8)}</span>
                <span style={{ color: '#7d8aa6' }}>slot {s.slot}</span>
                <span style={{ color: '#64748b', marginLeft: 'auto' }}>{s.blockTime ? timeAgo(s.blockTime * 1000) : ''}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
