import { useEffect, useRef, useState } from 'react'
import { pumpPortalLive, PumpToken } from '../lib/providers/pumpportal'
import { SocialMonitorService, Tweet, MonitorConfig } from '../lib/services/socialMonitor'
import { PlaySound } from '../lib/utils/sound'

interface MonitoredAccount {
  id: string
  handle: string
  name: string
  avatar: string
  verified: boolean
  enabled: boolean
}

const DEFAULT_ACCOUNTS: MonitoredAccount[] = [
  { id: 'trump', handle: 'realDonaldTrump', name: 'Donald J. Trump', avatar: '🇺🇸', verified: true, enabled: true },
  { id: 'elon', handle: 'elonmusk', name: 'Elon Musk', avatar: '🚀', verified: true, enabled: true },
]

export function SocialMonitor() {
  const [accounts, setAccounts] = useState<MonitoredAccount[]>(() => {
    try {
      const saved = localStorage.getItem('guru:social-monitor:accounts')
      return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS
    } catch { return DEFAULT_ACCOUNTS }
  })
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [matchedCoins, setMatchedCoins] = useState<{ tweet: Tweet; coin: PumpToken; matchType: string; confidence: number }[]>([])
  const [config, setConfig] = useState<MonitorConfig>(() => {
    try {
      const saved = localStorage.getItem('guru:social-monitor:config')
      return saved ? JSON.parse(saved) : {
        pollInterval: 60000,
        enabled: true,
        soundEnabled: true,
        desktopNotifications: true,
        keywords: ['trump', 'musk', 'elon', 'doge', 'bitcoin', 'crypto', 'solana', 'pump', 'launch', 'token', 'coin', 'meme'],
        accounts: ['realDonaldTrump', 'elonmusk'],
      }
    } catch { return {
      pollInterval: 60000,
      enabled: true,
      soundEnabled: true,
      desktopNotifications: true,
      keywords: ['trump', 'musk', 'elon', 'doge', 'bitcoin', 'crypto', 'solana', 'pump', 'launch', 'token', 'coin', 'meme'],
      accounts: ['realDonaldTrump', 'elonmusk'],
    }}
  })
  const [status, setStatus] = useState<'connecting' | 'live' | 'demo' | 'error'>('connecting')
  const [lastPoll, setLastPoll] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const serviceRef = useRef<SocialMonitorService | null>(null)
  const pumpSnapRef = useRef(pumpPortalLive.getSnapshot())
  const isElectron = !!(window as any).guruElectron

  useEffect(() => {
    localStorage.setItem('guru:social-monitor:accounts', JSON.stringify(accounts))
  }, [accounts])

  useEffect(() => {
    localStorage.setItem('guru:social-monitor:config', JSON.stringify(config))
  }, [config])

  useEffect(() => {
    pumpPortalLive.start()
    const unsub = pumpPortalLive.subscribe((snap) => {
      pumpSnapRef.current = snap
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!config.enabled) {
      setStatus('demo')
      return
    }

    const service = new SocialMonitorService(config)
    serviceRef.current = service

    const isElectron = !!(window as any).guruElectron

    service.onTweet(async (tweet) => {
      setTweets(prev => [tweet, ...prev].slice(0, 50))
      setLastPoll(Date.now())
      setStatus('live')
      setError(null)

      if (config.desktopNotifications) {
        if (isElectron) {
          await (window as any).guruElectron.notify({
            title: `${tweet.authorName} (@${tweet.authorHandle})`,
            body: tweet.text.slice(0, 200),
            sound: config.soundEnabled ? 'alert' : undefined,
            tag: tweet.id,
          })
        } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`${tweet.authorName} (@${tweet.authorHandle})`, {
            body: tweet.text.slice(0, 200),
            icon: '/guru-favicon.svg',
            tag: tweet.id,
          })
        }
      } else if (config.soundEnabled) {
        PlaySound.alert()
      }

      await checkCoinMatches(tweet)
    })

    service.onError((err) => {
      setError(err.message)
      setStatus('error')
    })

    service.onStatusChange((s) => setStatus(s))

    service.start()

    return () => {
      service.stop()
      serviceRef.current = null
    }
  }, [config.enabled, config.pollInterval, config.accounts, config.keywords, config.desktopNotifications, config.soundEnabled])

  async function checkCoinMatches(tweet: Tweet) {
    const snap = pumpSnapRef.current
    if (!snap || !snap.recentTokens.length) return

    const tweetText = tweet.text.toLowerCase()
    const tweetKeywords = config.keywords.filter(k => tweetText.includes(k.toLowerCase()))

    for (const token of snap.recentTokens) {
      if (token.mint.startsWith('DEMO')) continue

      const tokenName = (token.name || '').toLowerCase()
      const tokenSymbol = (token.symbol || '').toLowerCase()
      const tokenDesc = (token.description || '').toLowerCase()

      let matchType = ''
      let confidence = 0

      if (tokenName && (tweetText.includes(tokenName) || tokenName.includes('trump') || tokenName.includes('elon') || tokenName.includes('musk') || tokenName.includes('doge'))) {
        matchType = 'name'
        confidence += 40
      }
      if (tokenSymbol && (tweetText.includes(tokenSymbol) || tokenSymbol.includes('trump') || tokenSymbol.includes('elon') || tokenSymbol.includes('musk') || tokenSymbol.includes('doge'))) {
        matchType = matchType ? `${matchType}+symbol` : 'symbol'
        confidence += 35
      }
      if (tokenDesc && (tweetText.includes(tokenDesc) || tokenDesc.includes('trump') || tokenDesc.includes('elon') || tokenDesc.includes('musk') || tokenDesc.includes('doge'))) {
        matchType = matchType ? `${matchType}+desc` : 'description'
        confidence += 25
      }

      for (const kw of tweetKeywords) {
        if (tokenName.includes(kw) || tokenSymbol.includes(kw) || tokenDesc.includes(kw)) {
          confidence += 10
        }
      }

      if (confidence >= 30) {
        setMatchedCoins(prev => {
          const exists = prev.some(m => m.coin.mint === token.mint && m.tweet.id === tweet.id)
          if (exists) return prev
          return [{ tweet, coin: token, matchType, confidence: Math.min(95, confidence) }, ...prev].slice(0, 20)
        })

        if (config.desktopNotifications) {
          if (isElectron) {
            await (window as any).guruElectron.notify({
              title: `🚨 COIN MATCH: ${token.symbol || token.name || token.mint.slice(0,8)}`,
              body: `${tweet.authorName}: "${tweet.text.slice(0, 100)}..." — Match: ${matchType} (${confidence}%)`,
              sound: config.soundEnabled ? 'match' : undefined,
              tag: `match-${token.mint}-${tweet.id}`,
            })
          } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(`🚨 COIN MATCH: ${token.symbol || token.name || token.mint.slice(0,8)}`, {
              body: `${tweet.authorName}: "${tweet.text.slice(0, 100)}..." — Match: ${matchType} (${confidence}%)`,
              icon: '/guru-favicon.svg',
              tag: `match-${token.mint}-${tweet.id}`,
            })
          }
        } else if (config.soundEnabled) {
          PlaySound.match()
        }
      }
    }
  }

  function toggleAccount(id: string) {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  }

  function updateConfig(key: keyof MonitorConfig, value: any) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  async function requestNotificationPermission() {
    if (isElectron) {
      const supported = await (window as any).guruElectron.checkNotificationPermission()
      if (supported) {
        await (window as any).guruElectron.notify({
          title: 'GURU Social Monitor',
          body: 'Desktop notifications enabled for social alerts',
          sound: 'alert',
        })
      }
      return
    }
    if (typeof Notification === 'undefined') return alert('Notifications not supported')
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      new Notification('GURU Social Monitor', { body: 'Desktop notifications enabled for social alerts' })
    }
  }

  function formatTime(ts: number) {
    const s = Math.max(1, Math.round((Date.now() - ts) / 1000))
    if (s < 60) return `${s}s ago`
    const m = Math.round(s / 60)
    if (m < 60) return `${m}m ago`
    const h = Math.round(m / 60)
    return `${h}h ago`
  }

  const statusColor = status === 'live' ? '#b8ff33' : status === 'demo' ? '#facc15' : status === 'error' ? '#ef4444' : '#00e5ff'

  return (
    <div style={{ display: 'grid', gap: 14, paddingBottom: 40 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>SOCIAL MONITOR • X INTEL</div>
          <span className="badge" style={{ fontSize: 10, color: statusColor, borderColor: `${statusColor}44` }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: statusColor, display: 'inline-block' }} />
            {status.toUpperCase()}
          </span>
          <span className="badge" style={{ fontSize: 10 }}>Twitter API v2 • PumpFun Cross-Ref</span>
        </div>
        <div style={{ fontSize: 12, color: '#7d8aa6', marginTop: 6, maxWidth: 760 }}>
          Real-time monitoring of <strong style={{ color: '#e5edff' }}>@realDonaldTrump</strong> & <strong style={{ color: '#e5edff' }}>@elonmusk</strong> X accounts.
          Instant desktop alerts with sound on new posts. Automatic cross-reference with live PumpFun launches —
          detects token names, symbols, tickers, and crypto keywords in tweets.
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={config.enabled} onChange={e => updateConfig('enabled', e.target.checked)} /> Enabled
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={config.soundEnabled} onChange={e => updateConfig('soundEnabled', e.target.checked)} /> Sound Alerts
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={config.desktopNotifications} onChange={e => updateConfig('desktopNotifications', e.target.checked)} /> Desktop Notifications
          </label>
          <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 11 }} onClick={requestNotificationPermission} disabled={isElectron || (typeof Notification !== 'undefined' && Notification.permission === 'granted')}>
            {isElectron ? '✓ Electron Notifications' : (typeof Notification !== 'undefined' && Notification.permission === 'granted' ? '✓ Notifications On' : 'Enable Notifications')}
          </button>
          <div style={{ fontSize: 11, color: '#7d8aa6', alignSelf: 'center' }}>Poll: {(config.pollInterval / 1000).toFixed(0)}s • Last: {lastPoll ? formatTime(lastPoll) : '—'}</div>
        </div>
        {error && <div className="mono" style={{ fontSize: 11, color: '#ef4444', marginTop: 10 }}>{error}</div>}
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: 0.6 }}>MONITORED ACCOUNTS</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          {accounts.map(acc => (
            <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${acc.enabled ? 'rgba(184,255,51,0.2)' : '#1e2e4a'}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, background: 'linear-gradient(135deg,#1a2a4a,#2a1a4a)', border: '1px solid #1e2e4a', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 16 }}>{acc.avatar}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 800 }}>{acc.name}</span>
                  <span style={{ fontSize: 11, color: '#b8ff33' }}>@{acc.handle}</span>
                  {acc.verified && <span style={{ color: '#00e5ff', fontSize: 10 }}>✓</span>}
                </div>
                <div style={{ fontSize: 11, color: '#7d8aa6' }}>{acc.enabled ? 'Monitoring active' : 'Paused'}</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', cursor: 'pointer' }}>
                <input type="checkbox" checked={acc.enabled} onChange={() => toggleAccount(acc.id)} />
                <span style={{ fontSize: 11, fontWeight: 700 }}>{acc.enabled ? 'ON' : 'OFF'}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 12 }}>LIVE TWEETS</div>
          <span className="badge" style={{ fontSize: 10 }}>{tweets.length} tweets</span>
        </div>
        <div style={{ display: 'grid', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
          {tweets.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#7d8aa6' }}>
              {status === 'live' ? 'Waiting for new tweets...' : status === 'demo' ? 'Enable monitoring to start' : 'Error - check configuration'}
            </div>
          ) : (
            tweets.map(tweet => (
              <div key={tweet.id} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2e4a' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 999, background: 'linear-gradient(135deg,#1a2a4a,#2a1a4a)', border: '1px solid #1e2e4a', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 12, flexShrink: 0 }}>
                    {tweet.authorHandle === 'realDonaldTrump' ? '🇺🇸' : '🚀'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800 }}>{tweet.authorName}</span>
                      <span style={{ color: '#7d8aa6', fontSize: 12 }}>@{tweet.authorHandle}</span>
                      <span style={{ color: '#64748b', fontSize: 11 }}>{formatTime(tweet.timestamp)}</span>
                      {tweet.isRetweet && <span className="badge" style={{ fontSize: 9, background: 'rgba(250,204,21,0.15)', borderColor: 'rgba(250,204,21,0.3)', color: '#facc15' }}>RETWEET</span>}
                      {tweet.isReply && <span className="badge" style={{ fontSize: 9, background: 'rgba(0,229,255,0.15)', borderColor: 'rgba(0,229,255,0.3)', color: '#00e5ff' }}>REPLY</span>}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5, color: '#e5edff', whiteSpace: 'pre-wrap' }}>{tweet.text}</div>
                    {tweet.urls.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {tweet.urls.slice(0, 3).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer" className="badge" style={{ fontSize: 10, textDecoration: 'none' }}>{url.slice(0, 40)}...</a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 14, borderColor: 'rgba(255,46,157,0.25)', background: 'rgba(255,46,157,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 12, color: '#ff2e9d' }}>🚨 PUMPFUN COIN MATCHES</div>
          <span className="badge" style={{ fontSize: 10, background: 'rgba(255,46,157,0.15)', borderColor: 'rgba(255,46,157,0.3)', color: '#ff2e9d' }}>{matchedCoins.length} matches</span>
        </div>
        <div style={{ display: 'grid', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
          {matchedCoins.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#7d8aa6' }}>
              No coin matches detected yet. Matches appear when tweet keywords align with new PumpFun launches.
            </div>
          ) : (
            matchedCoins.map((match, i) => (
              <div key={`${match.tweet.id}-${match.coin.mint}`} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,46,157,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 900, fontSize: 14, color: '#ff2e9d' }}>{match.coin.symbol || match.coin.name || match.coin.mint.slice(0, 8)}</span>
                      <span className="badge badge-neon" style={{ fontSize: 10 }}>CONFIDENCE: {match.confidence}%</span>
                      <span className="badge" style={{ fontSize: 10, background: 'rgba(184,255,51,0.12)', borderColor: 'rgba(184,255,51,0.2)', color: '#b8ff33' }}>Match: {match.matchType}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#cbd5e1', fontStyle: 'italic' }}>"{match.tweet.text.slice(0, 150)}..."</div>
                    <div style={{ fontSize: 11, color: '#7d8aa6', marginTop: 4 }}>
                      By @{match.tweet.authorHandle} • {formatTime(match.tweet.timestamp)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <a className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 11 }} href={`https://pump.fun/coin/${match.coin.mint}`} target="_blank" rel="noreferrer">View on PumpFun</a>
                    <a className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 11 }} href={`https://x.com/${match.tweet.authorHandle}/status/${match.tweet.id}`} target="_blank" rel="noreferrer">View Tweet</a>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>Market Cap: {match.coin.marketCapSol ? `${match.coin.marketCapSol.toFixed(1)} SOL` : 'N/A'}</span>
                  <span>Creator: {match.coin.creator.slice(0, 8)}...</span>
                  <span>{match.coin.migrated ? '✅ Graduated' : '🔄 Bonding Curve'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 12 }}>CONFIGURATION</div>
        <div style={{ display: 'grid', gap: 12, marginTop: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#7d8aa6', marginBottom: 4 }}>Poll Interval (seconds)</label>
            <select value={config.pollInterval} onChange={e => updateConfig('pollInterval', parseInt(e.target.value))} style={{ width: '100%', maxWidth: 200, background: '#0a0f1c', border: '1px solid #1e2e4a', color: '#e5edff', padding: '8px 10px', borderRadius: 8, fontSize: 12 }}>
              <option value={30000}>30s (Aggressive)</option>
              <option value={60000}>60s (Default)</option>
              <option value={120000}>120s (Conservative)</option>
              <option value={300000}>300s (Low freq)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#7d8aa6', marginBottom: 4 }}>Keywords to Track (comma-separated)</label>
            <textarea value={config.keywords.join(', ')} onChange={e => updateConfig('keywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} style={{ width: '100%', maxWidth: 600, minHeight: 80, background: '#0a0f1c', border: '1px solid #1e2e4a', color: '#e5edff', padding: '8px 10px', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', resize: 'vertical' }} />
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>Keywords are matched against tweet text AND token name/symbol/description</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 12 }}>SETUP & REQUIREMENTS</div>
        <ul style={{ fontSize: 12, color: '#7d8aa6', marginTop: 8, paddingLeft: 18, display: 'grid', gap: 6 }}>
          <li>Requires <strong>Twitter API v2 Bearer Token</strong> (Essential/Elevated access) — set <code className="mono" style={{color:'#b8ff33'}}>VITE_TWITTER_BEARER_TOKEN</code> in <code className="mono" style={{color:'#b8ff33'}}>.env</code></li>
          <li>Free tier: 1 request/15min per endpoint — use 60s+ poll interval to stay within limits</li>
          <li>Desktop notifications require browser permission (click "Enable Notifications" above)</li>
          <li>Sound alerts use Web Audio API — works in Electron and modern browsers</li>
          <li>Cross-referencing runs locally — matches tweet keywords against live PumpFun token metadata</li>
          <li>Demo mode shows simulated data when API not configured</li>
        </ul>
      </div>
    </div>
  )
}