import { useEffect, useState } from 'react'
import { PumpToken, pumpPortalLive } from '../lib/providers/pumpportal'
import { enrichToken, dexChartUrl, fmtUsd, DexTokenInfo } from '../lib/providers/dexscreener'
import { SmartImg } from './SmartImg'
import {
  executeTrade, importSessionKey, forgetSessionKey, hasSessionWallet,
  sessionPublicKey, getSessionBalance, TradeAction, TradePool,
} from '../lib/trading/pumpportalTrade'

const DEFAULT_RPC =
  ((import.meta as any).env?.VITE_SOLANA_RPC as string) ||
  'https://api.mainnet-beta.solana.com'

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0a0f1c', border: '1px solid #1e2e4a',
  color: '#e5edff', padding: '8px 12px', borderRadius: 10, fontSize: 13,
}

export function PumpTokenModal({ token, onClose }: { token: PumpToken; onClose: () => void }) {
  const [dex, setDex] = useState<DexTokenInfo | null>(null)
  const [img, setImg] = useState<string | undefined>(token.imageUrl)
  const [dexChecked, setDexChecked] = useState(false)
  const [dexRetry, setDexRetry] = useState(0)

  // trade ticket
  const [action, setAction] = useState<TradeAction>('buy')
  const [amount, setAmount] = useState('0.05')
  const [slippage, setSlippage] = useState('10')
  const [pool, setPool] = useState<TradePool>('auto')
  const [rpc, setRpc] = useState(DEFAULT_RPC)
  const [stage, setStage] = useState('')
  const [err, setErr] = useState('')
  const [txUrl, setTxUrl] = useState('')
  const [busy, setBusy] = useState(false)

  // wallet
  const [hasWallet, setHasWallet] = useState(hasSessionWallet())
  const [pubkey, setPubkey] = useState<string | null>(sessionPublicKey())
  const [balance, setBalance] = useState<number | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)

  // live token updates (image arrives async) + dex enrichment
  useEffect(() => {
    let alive = true
    pumpPortalLive.ensureMetadata([token.mint]).then(() => {
      if (!alive) return
      setImg(pumpPortalLive.getToken(token.mint)?.imageUrl)
    }).catch(() => {})
    enrichToken(token.mint).then((d) => {
      if (!alive) return
      setDex(d)
      setDexChecked(true)
      if (d?.imageUrl && !pumpPortalLive.getToken(token.mint)?.imageUrl) setImg(d.imageUrl)
    }).catch(() => { if (alive) setDexChecked(true) })
    return () => { alive = false }
  }, [token.mint, dexRetry])

  useEffect(() => {
    if (!hasWallet) { setBalance(null); return }
    getSessionBalance(rpc).then(setBalance).catch(() => setBalance(null))
  }, [hasWallet, rpc])

  // esc closes
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const isDemo = token.mint.startsWith('DEMO')
  const displayImg = img || dex?.imageUrl

  function connectKey() {
    setErr('')
    try {
      const pk = importSessionKey(keyInput)
      setKeyInput('')
      setHasWallet(true)
      setPubkey(pk)
    } catch (e: any) {
      setErr(e?.message || 'Key import failed.')
    }
  }

  async function doTrade() {
    setErr(''); setTxUrl(''); setStage('')
    setBusy(true)
    try {
      const r = await executeTrade({
        mint: token.mint,
        action,
        amount: amount.trim(),
        denominatedInSol: action === 'buy' ? true : !amount.trim().endsWith('%'),
        slippage: Number(slippage) || 10,
        priorityFee: 0.00005,
        pool,
      }, rpc.trim() || DEFAULT_RPC, setStage)
      setTxUrl(r.solscanUrl)
      setStage('Confirmed — view on Solscan.')
      getSessionBalance(rpc).then(setBalance).catch(() => {})
    } catch (e: any) {
      setErr(e?.message || 'Trade failed.')
      setStage('')
    } finally {
      setBusy(false)
    }
  }

  const best = dex?.best

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(2,4,10,0.78)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: 'min(1060px, 100%)', maxHeight: '92vh', overflowY: 'auto', padding: 0 }}
      >
        {/* header — pumpfun style: image + name + symbol */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid #1e2e4a' }}>
          <SmartImg src={displayImg} size={46} radius={12} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>
              {token.name || dex?.name || 'Unnamed coin'}{' '}
              <span style={{ color: '#b8ff33' }}>{token.symbol || dex?.symbol || ''}</span>{' '}
              {token.migrated && <span className="badge badge-neon" style={{ fontSize: 10 }}>GRADUATED</span>}
            </div>
            <div className="mono" style={{ fontSize: 11, color: '#7d8aa6' }} title={token.mint}>
              {token.mint.slice(0, 8)}…{token.mint.slice(-6)} • by{' '}
              <a href={`https://pump.fun/profile/${token.creator}`} target="_blank" rel="noreferrer" style={{ color: '#00e5ff' }}>
                {token.creator.slice(0, 4)}…{token.creator.slice(-4)}
              </a>{' '}
              <span style={{ color: '#4b5a78' }}>(pump.fun username only visible on pump.fun — <a href={`https://pump.fun/profile/${token.creator}`} target="_blank" rel="noreferrer" style={{ color: '#7d8aa6' }}>view profile →</a>)</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {!isDemo && (
              <>
                <a className="badge" style={{ fontSize: 10 }} href={`https://pump.fun/coin/${token.mint}`} target="_blank" rel="noreferrer">pump.fun →</a>
                <a className="badge" style={{ fontSize: 10 }} href={`https://solscan.io/token/${token.mint}`} target="_blank" rel="noreferrer">Solscan →</a>
              </>
            )}
            <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onClose}>✕</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 0 }} className="modal-grid">
          {/* chart */}
          <div style={{ padding: 14, borderRight: '1px solid #1e2e4a', minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              {[
                ['Price', best?.priceUsd != null ? fmtUsd(best.priceUsd) : '—'],
                ['Mkt Cap', fmtUsd(best?.marketCap ?? best?.fdv)],
                ['Liquidity', fmtUsd(best?.liquidityUsd)],
                ['24h Vol', fmtUsd(best?.volumeH24)],
                ['24h', best?.priceChangeH24 != null ? `${best.priceChangeH24.toFixed(1)}%` : '—'],
              ].map(([l, v]) => (
                <div key={l} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2e4a', borderRadius: 10, padding: '6px 12px' }}>
                  <div style={{ fontSize: 10, color: '#7d8aa6' }}>{l}</div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{v}</div>
                </div>
              ))}
            </div>
            {isDemo ? (
              <div style={{ height: 420, display: 'grid', placeItems: 'center', color: '#7d8aa6', border: '1px dashed #1e2e4a', borderRadius: 12 }}>
                Demo token — no chart. Open a live token for candles.
              </div>
            ) : !dexChecked ? (
              <div style={{ height: 420, display: 'grid', placeItems: 'center', color: '#7d8aa6', border: '1px solid #1e2e4a', borderRadius: 12 }}>
                Looking up chart data…
              </div>
            ) : !dex || dex.pairsCount === 0 ? (
              <div style={{ minHeight: 300, display: 'grid', placeItems: 'center', border: '1px dashed #1e2e4a', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#e5edff' }}>Too new to chart here</div>
                  <div style={{ fontSize: 12, color: '#7d8aa6', marginTop: 6, maxWidth: 380 }}>
                    DexScreener hasn't indexed this launch yet (usual lag: minutes for fresh bonding-curve coins).
                    Trade from the ticket → or watch it live where it was born:
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                    <a className="btn btn-primary" style={{ fontSize: 12 }} href={`https://pump.fun/coin/${token.mint}`} target="_blank" rel="noreferrer">Open on pump.fun →</a>
                    <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { setDexChecked(false); setDexRetry((r) => r + 1) }}>Retry chart</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', height: 420, borderRadius: 12, overflow: 'hidden', border: '1px solid #1e2e4a', background: '#070b16' }}>
                <iframe
                  title={`chart-${token.mint}`}
                  src={dexChartUrl(token.mint, best?.pairAddress)}
                  style={{ width: '100%', height: '100%', border: 0 }}
                />
              </div>
            )}
            {!isDemo && dex && dex.pairsCount > 0 && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                Candles by DexScreener (free embed) •{' '}
                <a href={best?.url || `https://dexscreener.com/solana/${token.mint}`} target="_blank" rel="noreferrer" style={{ color: '#7d8aa6' }}>open chart →</a>
              </div>
            )}
            {token.description && <div style={{ fontSize: 12, color: '#7d8aa6', marginTop: 10 }}>{token.description}</div>}
          </div>

          {/* trade ticket */}
          <div style={{ padding: 14, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 12 }}>TRADE • self-custody via PumpPortal trade-local</div>
            {isDemo ? (
              <div style={{ fontSize: 12, color: '#7d8aa6', marginTop: 8 }}>Demo token — trading disabled. Open a live token to trade.</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {(['buy', 'sell'] as TradeAction[]).map((a) => (
                    <button
                      key={a} onClick={() => setAction(a)} className="btn"
                      style={{
                        flex: 1, textTransform: 'uppercase',
                        background: action === a ? (a === 'buy' ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.04)',
                        color: action === a ? '#05070f' : '#7d8aa6',
                        borderColor: action === a ? 'transparent' : '#1e2e4a',
                      }}
                    >{a}</button>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  <label style={{ fontSize: 11, color: '#7d8aa6' }}>
                    {action === 'buy' ? 'Amount (SOL)' : 'Amount (tokens, or % e.g. 100%)'}
                    <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={action === 'buy' ? '0.05' : '100%'} style={{ ...inputStyle, marginTop: 4 }} />
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label style={{ fontSize: 11, color: '#7d8aa6', flex: 1 }}>
                      Slippage %
                      <input value={slippage} onChange={(e) => setSlippage(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
                    </label>
                    <label style={{ fontSize: 11, color: '#7d8aa6', flex: 1 }}>
                      Pool
                      <select value={pool} onChange={(e) => setPool(e.target.value as TradePool)} style={{ ...inputStyle, marginTop: 4 }}>
                        {(['auto', 'pump', 'pump-amm', 'raydium', 'launchlab', 'raydium-cpmm', 'bonk'] as TradePool[]).map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label style={{ fontSize: 11, color: '#7d8aa6' }}>
                    RPC endpoint
                    <input value={rpc} onChange={(e) => setRpc(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} className="mono" />
                  </label>
                </div>

                {/* wallet */}
                <div style={{ marginTop: 12, padding: 10, borderRadius: 12, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.05)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#ef4444' }}>HOT WALLET • SESSION ONLY — never stored</div>
                  {hasWallet ? (
                    <div style={{ marginTop: 6 }}>
                      <div className="mono" style={{ fontSize: 12, color: '#e5edff' }}>{pubkey?.slice(0, 6)}…{pubkey?.slice(-6)}</div>
                      <div style={{ fontSize: 11, color: '#7d8aa6' }}>Balance: {balance == null ? '…' : `${balance.toFixed(4)} SOL`}</div>
                      <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 12 }} onClick={() => { forgetSessionKey(); setHasWallet(false); setPubkey(null) }}>
                        Forget key
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 11, color: '#7d8aa6' }}>Paste a dedicated trading-wallet secret key (base58). Small funds only — never a vault key.</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <input
                          type={showKey ? 'text' : 'password'} value={keyInput}
                          onChange={(e) => setKeyInput(e.target.value)}
                          placeholder="base58 secret key" style={{ ...inputStyle, flex: 1 }} className="mono"
                        />
                        <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowKey((v) => !v)}>{showKey ? 'Hide' : 'Show'}</button>
                      </div>
                      <button className="btn btn-primary" style={{ marginTop: 8, fontSize: 12, width: '100%' }} onClick={connectKey}>Connect (memory only)</button>
                    </div>
                  )}
                </div>

                {stage && <div style={{ fontSize: 12, color: '#00e5ff', marginTop: 8 }}>{stage}</div>}
                {err && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>{err}</div>}
                {txUrl && <div style={{ fontSize: 12, marginTop: 8 }}><a href={txUrl} target="_blank" rel="noreferrer" style={{ color: '#b8ff33' }}>View transaction on Solscan →</a></div>}

                <button
                  className="btn" disabled={busy || !hasWallet}
                  onClick={doTrade}
                  style={{
                    width: '100%', marginTop: 10, opacity: busy || !hasWallet ? 0.5 : 1,
                    background: action === 'buy' ? '#22c55e' : '#ef4444', color: '#05070f', fontWeight: 800,
                  }}
                >
                  {busy ? 'Working…' : !hasWallet ? 'Connect wallet to trade' : `${action.toUpperCase()} ${token.symbol || ''}`}
                </button>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>
                  trade-local = no PumpPortal fee. Network + bonding-curve fees apply. Transactions are irreversible.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:860px){.modal-grid{grid-template-columns:1fr !important}}`}</style>
    </div>
  )
}
