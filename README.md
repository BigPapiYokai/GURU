# GURU — The On-Chain Intelligence Network

**SPOT THE SMART MONEY.**

GURU identifies who actually knows what they're doing on-chain. Wallet intelligence + reputation + social trading platform, powered by the eventual `$GURU` token.

> Every wallet has a reputation. Find the wallets worth watching. Don't chase coins. Follow behavior.

## Brand
- **Name:** GURU / **Ticker:** $GURU
- **Tagline:** SPOT THE SMART MONEY.
- **Personality:** Crypto-native, degen, funny, slightly arrogant, memeable — backed by serious analytics.
- **Visual:** Bloomberg Terminal × Arkham × neon crypto charts × frog guru mascot (hood, gold chain, cigar, sunglasses, gold coin).

## Core Concept
User enters a wallet address → GURU analyzes observable blockchain history → produces **Wallet Reputation Profile** (trading style, profitability, consistency, early entries, risk, rugs, token prefs, related wallets, live activity, pattern resemblance).

## Features Implemented (spec §§3–40)
- Hero + search (wallet/token/ENS) + LIVE SMART MONEY feed with filters (§3, §9)
- Wallet Profiles: PnL, ROI, win rate, trades, traits, charts (§4)
- **GURU Score** 0–100 transparent weighted engine — NOT just PnL (§5, §21 anti-gaming)
- **Wallet DNA** traits + radar + archetypes + achievements (§6, §28)
- Smart Money Engine + multiple leaderboards (§7, §27)
- **Smart Money Convergence** — clustered entries (§8)
- Live Feed with polling / WebSocket-ready (§9)
- Why This Matters — evidence-grounded, never invents Tx (§10)
- Wallet Clustering graph — “potentially related” language (§11)
- Wallet vs Wallet comparison + shareable card (§12)
- Token Intelligence (§13)
- Watchlists (localStorage, public/private, follow) (§14)
- Social profiles + viral cards (§15, §16)
- AI Guru Analyst — grounded, traceable (§17)
- Alert System — browser/email/telegram/discord modular (§18)
- Token Utility: premium analytics, real-time alerts, alerts, clustering, API, gated features — **product works with zero token value** (§19)
- Modular Token Service (§20)
- Anti-gaming detection (§21)
- Provider Abstraction: `BlockchainProvider` interface → mock + helius/alchemy swappable (§22)
- DB schema design (§23)
- Performance: cached scores, incremental indexing note (§24)
- Dark neon UI: Bloomberg/Arkham/trading terminal/degen (§25)
- Main nav (§26), achievements (§28), public wallet pages (§29), monetization tiers (§30), legal language (§31)

## Architecture
```
BLOCKCHAIN DATA PROVIDERS → DATA NORMALIZATION → TRANSACTION INDEXER → WALLET INTELLIGENCE ENGINE → TOKEN INTELLIGENCE ENGINE → REPUTATION ENGINE → RELATIONSHIP/GRAPH ENGINE → AI ANALYST → BACKEND API → WEB APPLICATION
```
- `src/lib/providers/types.ts` — BlockchainProvider, TokenGateProvider, NotificationProvider interfaces
- `src/lib/providers/mockProvider.ts` — dev implementation (swap via VITE_DATA_PROVIDER)
- `src/lib/engines/scoring.ts` — GURU Score documented engine
- `src/lib/engines/dna.ts` — Wallet DNA
- `src/lib/engines/convergence.ts` — convergence detection
- `src/lib/db/schema.ts` — scalable Postgres schema

## Tech
- Vite + React 18 + TypeScript + React Router
- No private keys / no seed phrases — wallet connect via providers only
- LocalStorage for watchlists/alerts (mock backend)
- Responsive: desktop dense, mobile prioritizes search/feed

## Run
```bash
npm install
npm run dev    # http://localhost:5173
npm run build
npm run preview
```

## Env
Copy `.env.example` → `.env`. For live chain data, set `VITE_HELIUS_API_KEY` etc. and implement a real `BlockchainProvider`.

## Viral Loop
Discover → Search → Score → Smart Money → Follow → Alert → Share Card → New User. Every major view is shareable.

## Legal
Analytics/intelligence only. No guaranteed profit. Language: analysis, evidence, historical behavior, probability, signals.
