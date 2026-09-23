import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Navbar, Sidebar } from './components/Navbar'
import { Home } from './pages/Home'
import { WalletProfile } from './pages/WalletProfile'
import { Wallets } from './pages/Wallets'
import { Tokens, TokenDetail } from './pages/Tokens'
import { Leaderboard } from './pages/Leaderboard'
import { Feed } from './pages/Feed'
import { ConvergencePage } from './pages/Convergence'
import { Compare } from './pages/Compare'
import { Watchlists } from './pages/Watchlists'
import { Alerts } from './pages/Alerts'
import { AIAnalyst } from './pages/AIA'
import { Social } from './pages/Social'
import { PumpFun } from './pages/PumpFun'
import { SolanaWallet } from './pages/SolanaWallet'

function Layout({ children }: { children:React.ReactNode }){
  const loc = useLocation()
  const isHome = loc.pathname==='/' 
  return (
    <div style={{minHeight:'100vh', background:'var(--bg-0)'}}>
      <Navbar />
      <div style={{maxWidth:1440, margin:'0 auto', display:'flex'}}>
        <Sidebar />
        <main style={{flex:1, minWidth:0, padding: isHome? '16px 16px' : '16px 16px', background:'transparent'}}>
          {children}
        </main>
      </div>

      {/* footer */}
      <footer style={{borderTop:'1px solid #1e2e4a', background:'rgba(5,7,15,0.9)', padding:'18px 16px', marginTop:12}}>
        <div style={{maxWidth:1440, margin:'0 auto', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12, fontSize:11, color:'#64748b'}}>
          <div><strong style={{color:'#b8ff33'}}>GURU — SPOT THE SMART MONEY.</strong> The reputation layer for blockchain wallets. On-chain intelligence × social trading × $GURU.</div>
          <div className="mono">Analysis, evidence, historical behavior, probability — not guaranteed profit.</div>
        </div>
        <div style={{maxWidth:1440, margin:'0 auto', marginTop:10, display:'flex', gap:8, flexWrap:'wrap'}}>
          <span className="badge" style={{fontSize:10}}>Provider: Mock (swap via VITE_DATA_PROVIDER)</span>
          <span className="badge" style={{fontSize:10}}>Chain: Solana (initially) • Multi-chain ready</span>
          <span className="badge" style={{fontSize:10}}>$GURU — modular utility, not required for core value</span>
          <span className="badge" style={{fontSize:10, color:'#ef4444', borderColor:'rgba(239,68,68,0.22)'}}>Never share seed phrase • No private keys</span>
        </div>
      </footer>
    </div>
  )
}

export default function App(){
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/wallets" element={<Wallets/>} />
          <Route path="/wallet/:address" element={<WalletProfile/>} />
          <Route path="/tokens" element={<Tokens/>} />
          <Route path="/token/:address" element={<TokenDetail/>} />
          <Route path="/leaderboard" element={<Leaderboard/>} />
          <Route path="/feed" element={<Feed/>} />
          <Route path="/convergence" element={<ConvergencePage/>} />
          <Route path="/compare" element={<Compare/>} />
          <Route path="/watchlists" element={<Watchlists/>} />
          <Route path="/alerts" element={<Alerts/>} />
          <Route path="/ai" element={<AIAnalyst/>} />
          <Route path="/social" element={<Social/>} />
          <Route path="/pumpfun" element={<PumpFun/>} />
          <Route path="/sw/:address" element={<SolanaWallet/>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}
