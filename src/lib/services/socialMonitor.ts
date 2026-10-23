export interface Tweet {
  id: string
  authorId: string
  authorHandle: string
  authorName: string
  text: string
  timestamp: number
  urls: string[]
  isRetweet: boolean
  isReply: boolean
  conversationId?: string
  referencedTweets?: Array<{ type: 'retweeted' | 'replied_to' | 'quoted'; id: string }>
}

export interface MonitorConfig {
  pollInterval: number
  enabled: boolean
  soundEnabled: boolean
  desktopNotifications: boolean
  keywords: string[]
  accounts: string[]
}

type TweetCallback = (tweet: Tweet) => void
type ErrorCallback = (error: Error) => void
type StatusCallback = (status: 'connecting' | 'live' | 'demo' | 'error') => void

const BEARER_TOKEN = (import.meta as any).env?.VITE_TWITTER_BEARER_TOKEN as string | undefined

const ACCOUNT_IDS: Record<string, string> = {
  realDonaldTrump: '25073877',
  elonmusk: '44196397',
}

function getDemoTweets(): Tweet[] {
  const now = Date.now()
  return [
    {
      id: 'demo-1',
      authorId: '25073877',
      authorHandle: 'realDonaldTrump',
      authorName: 'Donald J. Trump',
      text: 'Just launched $TRUMP coin on Solana! This is going to be HUGE. The best coin, maybe ever. Go to pump.fun and check it out! #TRUMP #SOLANA #CRYPTO',
      timestamp: now - 120000,
      urls: ['https://pump.fun/coin/TRUMPxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'],
      isRetweet: false,
      isReply: false,
    },
    {
      id: 'demo-2',
      authorId: '44196397',
      authorHandle: 'elonmusk',
      authorName: 'Elon Musk',
      text: 'Dogecoin to the moon! 🚀🌙 Just bought more $DOGE. Also the new $ELON token on pump.fun looks interesting. Technoking approves.',
      timestamp: now - 300000,
      urls: ['https://pump.fun/coin/ELONxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'],
      isRetweet: false,
      isReply: false,
    },
    {
      id: 'demo-3',
      authorId: '25073877',
      authorHandle: 'realDonaldTrump',
      authorName: 'Donald J. Trump',
      text: 'Bitcoin is going up! We love crypto. America will be the crypto capital of the world. $BTC $SOL #MAGA',
      timestamp: now - 600000,
      urls: [],
      isRetweet: false,
      isReply: false,
    },
    {
      id: 'demo-4',
      authorId: '44196397',
      authorHandle: 'elonmusk',
      authorName: 'Elon Musk',
      text: 'Launching $X token on Solana pump.fun today. Integration with X platform coming soon. Payments, tips, everything.',
      timestamp: now - 900000,
      urls: ['https://pump.fun/coin/XTOKENxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'],
      isRetweet: false,
      isReply: false,
    },
  ]
}

export class SocialMonitorService {
  private config: MonitorConfig
  private intervalId: ReturnType<typeof setInterval> | null = null
  private seenTweetIds = new Set<string>()
  private userIdCache = new Map<string, string>()
  private onTweetCb: TweetCallback | null = null
  private onErrorCb: ErrorCallback | null = null
  private onStatusCb: StatusCallback | null = null
  private demoMode = false
  private demoIndex = 0

  constructor(config: MonitorConfig) {
    this.config = config
    this.demoMode = !BEARER_TOKEN
  }

  onTweet(cb: TweetCallback) { this.onTweetCb = cb }
  onError(cb: ErrorCallback) { this.onErrorCb = cb }
  onStatusChange(cb: StatusCallback) { this.onStatusCb = cb }

  private setStatus(s: 'connecting' | 'live' | 'demo' | 'error') {
    this.onStatusCb?.(s)
  }

  private async fetchUserId(handle: string): Promise<string | null> {
    if (this.userIdCache.has(handle)) return this.userIdCache.get(handle)!
    if (ACCOUNT_IDS[handle]) {
      this.userIdCache.set(handle, ACCOUNT_IDS[handle])
      return ACCOUNT_IDS[handle]
    }
    if (!BEARER_TOKEN) return null
    try {
      const res = await fetch(`https://api.twitter.com/2/users/by/username/${handle}`, {
        headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
      })
      if (!res.ok) return null
      const data = await res.json()
      if (data.data?.id) {
        this.userIdCache.set(handle, data.data.id)
        return data.data.id
      }
    } catch { /* ignore */ }
    return null
  }

  private async fetchTweets(userId: string): Promise<Tweet[]> {
    if (!BEARER_TOKEN) return []
    try {
      const res = await fetch(
        `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=created_at,entities,referenced_tweets,conversation_id&exclude=retweets,replies`,
        { headers: { Authorization: `Bearer ${BEARER_TOKEN}` } }
      )
      if (res.status === 429) {
        throw new Error('Rate limited - increase poll interval')
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(`Twitter API ${res.status}: ${err.detail || res.statusText}`)
      }
      const data = await res.json()
      if (!data.data) return []
      return data.data.map((t: any) => this.parseTweet(t, userId))
    } catch (e) {
      throw e
    }
  }

  private parseTweet(t: any, authorId: string): Tweet {
    const handle = authorId === '25073877' ? 'realDonaldTrump' : authorId === '44196397' ? 'elonmusk' : 'unknown'
    const name = authorId === '25073877' ? 'Donald J. Trump' : authorId === '44196397' ? 'Elon Musk' : 'Unknown'
    const urls = t.entities?.urls?.map((u: any) => u.expanded_url || u.url) || []
    const isRetweet = t.referenced_tweets?.some((r: any) => r.type === 'retweeted') || false
    const isReply = t.referenced_tweets?.some((r: any) => r.type === 'replied_to') || false
    return {
      id: t.id,
      authorId,
      authorHandle: handle,
      authorName: name,
      text: t.text,
      timestamp: new Date(t.created_at).getTime(),
      urls,
      isRetweet,
      isReply,
      conversationId: t.conversation_id,
      referencedTweets: t.referenced_tweets,
    }
  }

  private async poll() {
    if (!this.config.enabled) return

    if (this.demoMode) {
      this.setStatus('demo')
      const demoTweets = getDemoTweets()
      const newTweets = demoTweets.slice(this.demoIndex, this.demoIndex + 1)
      this.demoIndex = (this.demoIndex + 1) % demoTweets.length
      for (const tweet of newTweets) {
        if (!this.seenTweetIds.has(tweet.id)) {
          this.seenTweetIds.add(tweet.id)
          this.onTweetCb?.(tweet)
        }
      }
      return
    }

    this.setStatus('connecting')

    try {
      for (const handle of this.config.accounts) {
        const userId = await this.fetchUserId(handle)
        if (!userId) continue
        const tweets = await this.fetchTweets(userId)
        for (const tweet of tweets) {
          if (!this.seenTweetIds.has(tweet.id)) {
            this.seenTweetIds.add(tweet.id)
            this.onTweetCb?.(tweet)
          }
        }
      }
      this.setStatus('live')
    } catch (err) {
      this.setStatus('error')
      this.onErrorCb?.(err instanceof Error ? err : new Error(String(err)))
    }
  }

  start() {
    if (this.intervalId) return
    this.poll()
    this.intervalId = setInterval(() => this.poll(), this.config.pollInterval)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  updateConfig(config: Partial<MonitorConfig>) {
    this.config = { ...this.config, ...config }
    if (this.intervalId) {
      this.stop()
      this.start()
    }
  }

  getConfig(): MonitorConfig {
    return { ...this.config }
  }
}