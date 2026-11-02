import { useEffect, useState } from 'react'
import { pumpPortalLive, PumpToken } from '../lib/providers/pumpportal'

interface BullishScore {
  token: PumpToken
  score: number
  reasons: string[]
}

export function PumpFunBullish() {
  const [snap, setSnap] = useState(pumpPortalLive.getSnapshot())
  const [topPicks, setTopPicks] = useState<BullishScore[]>([])
  const [feedStatus, setFeedStatus] = useState('connecting')

  useEffect(() => {
    pumpPortalLive.start()
    const unsub = pumpPortalLive.subscribe((s) => {
      setSnap(s)
      setFeedStatus(s.status)
      const picks = computeBullish(s.recentTokens.slice(0, 30))
      setTopPicks(picks)
    })
    return () => unsub()
  }, [])

  function computeBullish(tokens: PumpToken[]): BullishScore[] {
    const out: BullishScore[] = []
    for (const t of tokens) {
      if (t.mint.startsWith('DEMO')) continue
      let score = 0
      const reasons: string[] = []
      // Fresh / new tokens are often bullish in pump markets
      const ageMin = (Date.now() - t.createdAt) / 60000
      if (ageMin < 60) { score += 25; reasons.push('Very fresh (<1h)') }
      else if (ageMin < 240) { score += 15; reasons.push('Fresh (<4h)') }
      // Graduation is extremely bullish
      if (t.migrated) { score += 30; reasons.push('Graduated to Raydium') }
      // Creator has graduated tokens
      const walletScore = snap.wallets?.find(w => w.address === t.creator)?.score ?? 0
      if (walletScore > 60) { score += 20; reasons.push(`Smart creator (score ${walletScore})`) }
      // Market cap presence suggests traction
      if (t.marketCapSol && t.marketCapSol > 10) { score += 15; reasons.push(`Market cap ${t.marketCapSol.toFixed(1)} SOL`) }
      else if (t.marketCapSol && t.marketCapSol > 2) { score += 10; reasons.push('Early traction') }
      // Symbol/name patterns often indicate hype
      const sym = (t.symbol || '').toLowerCase()
      const name = (t.name || '').toLowerCase()
      if (sym.includes('trump') || sym.includes('elon') || sym.includes('musk')) { score += 10; reasons.push('Celebrity ticker') }
      if (sym.length <= 4 && sym.length >= 2) { score += 5; reasons.push('Short ticker') }

      if (score >= 40) {
        out.push({ token: t, score, reasons })
      }
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 10)
  }

  return (
    <div style={{ display: 'grid', gap: 14, paddingBottom: 40 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>BULLISH RECOMMENDER • PUMPFUN</div>
        <div style={{ fontSize: 12, color: '#7d8aa6', marginTop: 6, maxWidth: 760 }}>
          Real-time scan of PumpFun tokens. Scores based on freshness, graduation, smart-wallet creator history, market cap, and ticker patterns. Higher score = stronger bullish signal. Not financial advice.
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          <span className="badge" style={{ fontSize: 10, color: feedStatus === 'live' ? '#b8ff33' : '#facc15', borderColor: feedStatus === 'live' ? '#b8ff33' : '#facc15' }}>
            {feedStatus.toUpperCase()}
          </span>
          <span className="badge" style={{ fontSize: 10 }}>{snap.tokensSeen ?? 0} tokens scanned</span>
          <span className="badge" style={{ fontSize: 10 }}>{topPicks.length} bullish picks</span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {topPicks.length === 0 ? (
          <div className="card" style={{ padding: 20, textAlign: 'center', color: '#7d8aa6' }}>
            Waiting for fresh PumpFun data... Connect live feed for recommendations.
          </div>
        ) : (
          topPicks.map((pick, i) => {
            const t = pick.token
            return (
              <div key={t.mint} className="card" style={{ padding: 14, borderColor: i === 0 ? 'rgba(184,255,51,0.3)' : '#1e2e4a', background: i === 0 ? 'rgba(184,255,51,0.05)' : 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: i === 0 ? '#b8ff33' : '#e5edff' }}>{t.name || 'Unknown'}</div>
                    <div style={{ fontSize: 12, color: '#7d8aa6' }}>{t.symbol || '---'} • {t.mint.slice(0, 8)}...{t.mint.slice(-4)}</div>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: pick.score > 60 ? '#b8ff33' : pick.score > 40 ? '#facc15' : '#00e5ff' }}>{pick.score}<span style={{ fontSize: 11, color: '#7d8aa6' }}>/100</span></div>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {pick.reasons.map((r, idx) => (
                    <span key={idx} className="badge" style={{ fontSize: 10, background: 'rgba(184,255,51,0.08)', borderColor: 'rgba(184,255,51,0.2)', color: '#b8ff33' }}>{r}</span>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: '#cbd5e1', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span>Market Cap: {t.marketCapSol ? `${t.marketCapSol.toFixed(1)} SOL` : 'N/A'}</span>
                  <span>Created: {new Date(t.createdAt).toLocaleTimeString()}</span>
                  <span>{t.migrated ? '✅ Graduated' : '🔄 Bonding Curve'}</span>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                  <a className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 11 }} href={`https://pump.fun/coin/${t.mint}`} target="_blank" rel="noreferrer">View PumpFun</a>
                  {t.uri && <a className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 11 }} href={t.uri} target="_blank" rel="noreferrer">Metadata</a>}
                </div>
              </div>
            )
          }))
        )}
      </div>
    </div>
  )
}
