export function Social(){
  const profiles = [
    { handle:'guru_alfa', score:92.4, pct:1.2, followers:1284, wallets:23, lists:7 },
    { handle:'degen_sniper', score:88.1, pct:3.4, followers:892, wallets:18, lists:4 },
    { handle:'whale_watcher', score:85.6, pct:5.1, followers:543, wallets:41, lists:2 },
  ]
  return (
    <div style={{display:'grid', gap:14, paddingBottom:40}}>
      <div className="card" style={{padding:16}}>
        <div style={{fontWeight:900, fontSize:18}}>SOCIAL • GURU PROFILES</div>
        <div style={{fontSize:12, color:'#7d8aa6'}}>Follow users, wallets, public lists. Share analyses, DNA, comparisons, reputation cards. Viral loop built-in.</div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:12}}>
        {profiles.map(p=>(
          <div key={p.handle} className="card" style={{padding:14}}>
            <div style={{display:'flex', gap:10, alignItems:'center'}}>
              <div style={{width:44,height:44, borderRadius:999, background:'linear-gradient(135deg,#1a2a4a,#2a1a4a)', border:'1px solid #1e2e4a', display:'grid', placeItems:'center', fontWeight:900, color:'#b8ff33'}}>@</div>
              <div>
                <div style={{fontWeight:900}}>@{p.handle}</div>
                <div style={{fontSize:11, color:'#7d8aa6'}}>{p.followers.toLocaleString()} followers • {p.wallets} wallets • {p.lists} lists</div>
              </div>
              <button className="btn btn-primary" style={{marginLeft:'auto', padding:'6px 12px', fontSize:12}}>Follow</button>
            </div>
            <div style={{display:'flex', gap:8, marginTop:10}}>
              <span className="badge badge-neon" style={{fontSize:11}}>GURU {p.score}</span>
              <span className="badge" style={{fontSize:11}}>TOP {p.pct}%</span>
            </div>
            <div style={{marginTop:10, display:'flex', gap:6}}>
              <button className="btn btn-ghost" style={{padding:'6px 10px', fontSize:11}}>Share profile</button>
              <button className="btn btn-ghost" style={{padding:'6px 10px', fontSize:11}}>View lists</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{padding:14}}>
        <div style={{fontWeight:800, fontSize:12}}>VIRAL GROWTH LOOP</div>
        <div className="mono" style={{fontSize:11, color:'#7d8aa6', marginTop:8, lineHeight:1.8}}>
          DISCOVER GURU → SEARCH WALLET → RECEIVE GURU SCORE → DISCOVER SMART MONEY → FOLLOW WALLET → RECEIVE ALERT → SHARE GURU CARD → FRIEND CLICKS → NEW USER
        </div>
        <div style={{marginTop:10, display:'flex', gap:8, flexWrap:'wrap'}}>
          {['Share Wallet Reputation','Share Wallet DNA','Share Comparison','Share Convergence','Share Leaderboard'].map(s=> <span key={s} className="badge" style={{fontSize:10, background:'rgba(184,255,51,0.06)', borderColor:'rgba(184,255,51,0.14)', color:'#b8ff33'}}>{s}</span>)}
        </div>
      </div>

      <div className="card" style={{padding:14, borderColor:'rgba(255,46,157,0.18)'}}>
        <div style={{fontWeight:800, fontSize:12, color:'#ff2e9d'}}>$GURU MEME IDENTITY</div>
        <div style={{fontSize:12, color:'#7d8aa6', marginTop:6}}>Green frog/GURU • Gold chain • Sunglasses • Cigar • Hood • Giant gold coin • Neon charts • Degen billionaire. Professional terminal + degen memeable — serious analytics, ridiculous confidence.</div>
        <div style={{marginTop:10, display:'flex', gap:8, flexWrap:'wrap'}}>
          {['Who is your GURU?','Follow the GURU.','Find the GURU before CT does.','Stop chasing coins. Find the GURU.'].map(s=> <span key={s} className="badge" style={{fontSize:11}}>{s}</span>)}
        </div>
      </div>
    </div>
  )
}
