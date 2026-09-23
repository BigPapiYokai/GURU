import { useEffect, useRef, useState } from 'react'
import { pumpPortalLive, PumpSnapshot, PumpToken, shortSolAddr } from '../lib/providers/pumpportal'
import { enrichTokens, DexTokenInfo } from '../lib/providers/dexscreener'
import { PumpTokenModal } from '../components/PumpTokenModal'
import { SmartImg } from '../components/SmartImg'

function timeAgo(ts: number) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export function PumpFun() {
  const [snap, setSnap] = useState<PumpSnapshot>(() => pumpPortalLive.getSnapshot())
  const [dexMap, setDexMap] = useState<Map<string, DexTokenInfo>>(new Map())
  const [selected, setSelected] = useState<PumpToken | null>(null)
  const enrichKey = useRef('')

  useEffect(() => {
    pumpPortalLive.start()
    return pumpPortalLive.subscribe(setSnap)
  }, [])

  // lazy images: pump metadata first, DexScreener as fallback/enrichment
  useEffect(() => {
    const mints = snap.recentTokens.map((t) => t.mint)
    const key = mints.join(',')
    if (!mints.length || key === enrichKey.current) return
    enrichKey.current = key
    pumpPortalLive.ensureMetadata(mints).catch(() => {})
    enrichTokens(mints).then((m) => setDexMap((prev) => new Map([...prev, ...m]))).catch(() => {})
  }, [snap.recentTokens])

  // fresh launches often aren't indexed yet — retry enrichment until data lands
  useEffect(() => {
    const id = setInterval(() => {
      const mints = pumpPortalLive.getSnapshot().recentTokens.map((t) => t.mint)
      if (!mints.length) return
      pumpPortalLive.ensureMetadata(mints).catch(() => {})
      enrichTokens(mints).then((m) => {
        if (m.size) setDexMap((prev) => new Map([...prev, ...m]))
      }).catch(() => {})
    }, 30000)
    return () => clearInterval(id)
  }, [])

  // keep selected token fresh as live updates arrive
  const liveSelected = selected ? snap.recentTokens.find((t) => t.mint === selected.mint) ?? selected : null

  const live = snap.status === 'live'
  const statusColor = live ? '#b8ff33' : snap.status === 'demo' ? '#facc15' : snap.status === 'error' ? '#ef4444' : '#00e5ff'

  return (
    <div style={{ display: 'grid', gap: 14, paddingBottom: 40 }}>
      {/* header */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>PUMPFUN SMART MONEY</div>
          <span className="badge" style={{ fontSize: 10, color: statusColor, borderColor: `${statusColor}44` }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: statusColor, display: 'inline-block' }} />
            {snap.status.toUpperCase()} • PumpPortal free feed
          </span>
          <span className="badge" style={{ fontSize: 10 }}>No API key • WS: new tokens + migrations</span>
        </div>
        <div style={{ fontSize: 12, color: '#7d8aa6', marginTop: 6, maxWidth: 760 }}>
          Live Pump.fun launcher intelligence. Tracks every token creation + graduation (migration to Raydium)
          on the free PumpPortal stream, then ranks <strong style={{ color: '#e5edff' }}>creator wallets by graduation hit-rate</strong>.
          Click any coin for candles + trading. Free tier has no per-wallet trade history — scores are graduation-based, not full PnL.
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          {[
            [`${snap.tokensSeen}`, 'tokens tracked'],
            [`${snap.walletsTracked}`, 'launchers'],
            [`${snap.migrationsSeen}`, 'graduations seen'],
            [snap.connectedAt ? timeAgo(snap.connectedAt) : '—', 'feed since'],
          ].map(([v, l]) => (
            <div key={l} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2e4a', borderRadius: 12, padding: '8px 14px', minWidth: 120 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#e5edff' }}>{v}</div>
              <div style={{ fontSize: 11, color: '#7d8aa6' }}>{l}</div>
            </div>
          ))}
        </div>
        <div className="mono" style={{ fontSize: 11, color: '#64748b', marginTop: 10 }}>{snap.note}</div>
      </div>

      {/* leaderboard */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #1e2e4a', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 12 }}>TOP PUMPFUN LAUNCHERS • by graduation score</span>
          <span style={{ fontSize: 11, color: '#7d8aa6' }}>Score = graduation rate (70) + volume (20) + base (10)</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#7d8aa6', fontSize: 10, borderBottom: '1px solid #1e2e4a' }}>
                <th style={{ padding: '10px 14px' }}>#</th>
                <th>WALLET</th>
                <th style={{ textAlign: 'right' }}>SCORE</th>
                <th style={{ textAlign: 'right' }}>CREATED</th>
                <th style={{ textAlign: 'right' }}>GRADUATED</th>
                <th style={{ textAlign: 'right' }}>GRAD RATE</th>
                <th>LAST ACTIVE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {snap.wallets.map((w, i) => (
                <tr key={w.address} style={{ borderBottom: '1px solid rgba(30,46,74,0.6)', background: i < 3 ? 'rgba(184,255,51,0.04)' : '' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 900, color: i === 0 ? '#facc15' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : '#7d8aa6' }}>#{i + 1}</td>
                  <td className="mono" style={{ fontWeight: 800, color: '#00e5ff' }} title={w.address}>
                    {shortSolAddr(w.address)}
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 400 }}>{w.reasoning[0]}</div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 900, color: '#b8ff33' }}>{w.score.toFixed(1)}</td>
                  <td style={{ textAlign: 'right' }}>{w.created}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: w.graduated > 0 ? '#22c55e' : '#7d8aa6' }}>{w.graduated}</td>
                  <td style={{ textAlign: 'right' }}>{w.gradRate.toFixed(1)}%</td>
                  <td style={{ fontSize: 12, color: '#7d8aa6' }}>{timeAgo(w.lastSeen)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {w.address.startsWith('DEMO') ? (
                      <span className="badge" style={{ fontSize: 10 }}>demo</span>
                    ) : (
                      <>
                        <a className="badge" style={{ fontSize: 10, marginRight: 4 }} href={`https://pump.fun/profile/${w.address}`} target="_blank" rel="noreferrer" title="pump.fun profile (usernames live on pump.fun — login-walled API)">pump.fun profile →</a>
                        <a className="badge" style={{ fontSize: 10 }} href={`https://solscan.io/account/${w.address}`} target="_blank" rel="noreferrer">Solscan →</a>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {snap.wallets.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 20, color: '#7d8aa6' }}>Waiting for first token creation event…</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '8px 14px', fontSize: 11, color: '#64748b', borderTop: '1px solid #1e2e4a' }}>
          pump.fun usernames live behind pump.fun's login-walled API (no free lookup) — profile links open the wallet's pump.fun page where its username shows.
        </div>
      </div>

      {/* recent launches — pumpfun style: image + name + symbol */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: 0.6 }}>RECENT LAUNCHES • live — click for chart + trade</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px,1fr))', gap: 10, marginTop: 10 }}>
          {snap.recentTokens.map((t) => {
            const img = t.imageUrl || dexMap.get(t.mint)?.imageUrl
            return (
              <div
                key={t.mint}
                onClick={() => setSelected(t)}
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.migrated ? 'rgba(184,255,51,0.25)' : '#1e2e4a'}`, borderRadius: 12, padding: 10, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <SmartImg src={img} size={44} radius={10} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.name || dexMap.get(t.mint)?.name || 'Unnamed'}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#b8ff33' }}>{t.symbol || dexMap.get(t.mint)?.symbol || shortSolAddr(t.mint)}</div>
                  </div>
                  {t.migrated
                    ? <span className="badge badge-neon" style={{ fontSize: 10, flexShrink: 0 }}>GRADUATED</span>
                    : <span className="badge" style={{ fontSize: 10, flexShrink: 0 }}>bonding</span>}
                </div>
                <div style={{ fontSize: 11, color: '#7d8aa6', marginTop: 6 }}>
                  by <a href={`https://pump.fun/profile/${t.creator}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="mono" style={{ color: '#00e5ff' }}>{shortSolAddr(t.creator)}</a>
                  {' '}• <span className="mono">{t.marketCapSol ? `${t.marketCapSol.toFixed(1)} SOL` : ''} {timeAgo(t.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <span className="badge badge-neon" style={{ fontSize: 10 }}>Chart + Trade →</span>
                  {!t.mint.startsWith('DEMO') && (
                    <a className="badge" style={{ fontSize: 10 }} href={`https://pump.fun/coin/${t.mint}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>pump.fun →</a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* methodology */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 12 }}>METHODOLOGY • free-feed honest</div>
        <ul style={{ fontSize: 12, color: '#7d8aa6', marginTop: 8, paddingLeft: 18, display: 'grid', gap: 4 }}>
          <li>Source: <span className="mono">wss://pumpportal.fun/api/data</span> — <span className="mono">subscribeNewToken</span> + <span className="mono">subscribeMigration</span> (free, no key).</li>
          <li>Images/names: token metadata <span className="mono">uri</span> from creation events + DexScreener fallback.</li>
          <li>Charts: DexScreener free embed. Trading: self-custody via PumpPortal <span className="mono">trade-local</span> — you sign locally, keys stay in session memory only.</li>
          <li>Usernames: pump.fun's profile API needs login — no free lookup. Profile links open the wallet on pump.fun where its name shows.</li>
          <li>Track cache persists in localStorage — leaderboard compounds the longer you leave the app open.</li>
        </ul>
      </div>

      {liveSelected && <PumpTokenModal token={liveSelected} onClose={() => setSelected(null)} />}
    </div>
  )
}
