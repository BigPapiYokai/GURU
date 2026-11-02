import { useEffect, useState } from 'react'
import { pumpPortalLive, PumpToken } from '../lib/providers/pumpportal'

interface BullishScore { token: PumpToken; score: number; reasons: string[] }

export function PumpFunBullish() {
  const [snap, setSnap] = useState(pumpPortalLive.getSnapshot())
  const [topPicks, setTopPicks] = useState<BullishScore[]>([])
  const [feedStatus, setFeedStatus] = useState('connecting')

  useEffect(() => {
    pumpPortalLive.start()
    const unsub = pumpPortalLive.subscribe((s) => {
      setSnap(s); setFeedStatus(s.status)
      setTopPicks(computeBullish(s.recentTokens.slice(0, 30)))
    })
    return () => unsub()
  }, [])

  function computeBullish(tokens: PumpToken[]): BullishScore[] {
    const out: BullishScore[] = []
    for (const t of tokens) {
      if (t.mint.startsWith('DEMO')) continue
      let score = 0; const reasons: string[] = []
      const ageMin = (Date.now() - t.createdAt) / 60000
      if (ageMin < 60) { score += 25; reasons.push('Very fresh (<1h)') }
      else if (ageMin < 240) { score += 15; reasons.push('Fresh (<4h)') }
      if (t.migrated) { score += 30; reasons.push('Graduated') }
      const ws = snap.wallets?.find((w: any) => w.address === t.creator)?.score ?? 0
      if (ws > 60) { score += 20; reasons.push('Smart creator') }
      if (t.marketCapSol && t.marketCapSol > 10) { score += 15; reasons.push('Market cap ' + t.marketCapSol.toFixed(1) + ' SOL') }
      else if (t.marketCapSol && t.marketCapSol > 2) { score += 10; reasons.push('Early traction') }
      if (score >= 40) out.push({ token: t, score, reasons })
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 10)
  }

  return (
    <div style={{ display: 'grid', gap: 14, paddingBottom: 40 }}>
      <div className="card" style={{ padding: 16 }}>
        <h2>BULLISH RECOMMENDER • PUMPFUN</h2>
        <div style={{ fontSize: 12, color: '#7d8aa6', marginTop: 6 }}>Real-time PumpFun scan — freshness, graduation, wallet score.</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          <span className="badge">{feedStatus.toUpperCase()}</span>
          <span className="badge">{snap.tokensSeen ?? 0} scanned</span>
          <span className="badge">{topPicks.length} picks</span>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {topPicks.map((pick, i) => {
          const t = pick.token
          return (
            <div key={t.mint} className="card" style={{ padding: 14, borderColor: i === 0 ? 'rgba(184,255,51,0.3)' : '#1e2e4a' }}>
              <div style={{ fontWeight: 900, fontSize: 14 }}>{t.name || 'Unknown'} <span style={{ color: '#7d8aa6', fontSize: 11 }}>{t.symbol}</span></div>
              <div style={{ fontWeight: 900, fontSize: 22, color: pick.score > 60 ? '#b8ff33' : '#facc15' }}>{pick.score}<span style={{ fontSize: 10, color: '#7d8aa6' }}>/100</span></div>
              <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>{pick.reasons.map((r, idx) => <span key={idx} className="badge" style={{ fontSize: 10 }}>{r}</span>)}</div>
              <a href={`https://pump.fun/coin/${t.mint}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 10, padding: '6px 12px', background: '#b8ff33', color: '#05070f', textDecoration: 'none', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>View PumpFun</a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
