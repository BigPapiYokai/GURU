import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const NAV = [
  { label:'Home', path:'/', icon:'◎' },
  { label:'Smart Money', path:'/convergence', icon:'◉' },
  { label:'Wallets', path:'/wallets', icon:'⬡' },
  { label:'Tokens', path:'/tokens', icon:'▣' },
  { label:'Leaderboard', path:'/leaderboard', icon:'♛' },
  { label:'Live Feed', path:'/feed', icon:'◐' },
  { label:'Watchlists', path:'/watchlists', icon:'☆' },
  { label:'Alerts', path:'/alerts', icon:'⬢' },
  { label:'AI Analyst', path:'/ai', icon:'◆' },
  { label:'PumpFun', path:'/pumpfun', icon:'🚀' },
  { label:'Compare', path:'/compare', icon:'⇄' },
  { label:'Social', path:'/social', icon:'◈' },
]

export function Navbar(){
  const [mobileOpen,setMobileOpen]=useState(false)
  const nav = useNavigate()
  return (
    <>
      {/* top bar */}
      <header style={{position:'sticky',top:0,zIndex:40, backdropFilter:'blur(12px)', background:'rgba(5,7,15,0.82)', borderBottom:'1px solid #1e2e4a'}}>
        <div style={{maxWidth:1440, margin:'0 auto', padding:'10px 18px', display:'flex', alignItems:'center', gap:16}}>
          <div style={{display:'flex',alignItems:'center', gap:10, cursor:'pointer'}} onClick={()=>nav('/')}>
            <div style={{width:36,height:36, borderRadius:10, background:'linear-gradient(135deg,#b8ff33,#00ffa6)', display:'grid',placeItems:'center', fontWeight:900, color:'#05070f', fontSize:18}}>$</div>
            <div>
              <div style={{fontWeight:900, letterSpacing:-1, fontSize:18, lineHeight:1}}>GURU <span style={{fontWeight:400, fontSize:10, color:'#7d8aa6', letterSpacing:2}}> $GURU</span></div>
              <div style={{fontSize:9, color:'#00ffa6', fontWeight:700, letterSpacing:1.2}}>SPOT THE SMART MONEY.</div>
            </div>
          </div>

          <div style={{flex:1, display:'flex', justifyContent:'center'}} className="hide-mobile">
            <div style={{display:'flex', gap:6, background:'rgba(255,255,255,0.04)', padding:4, borderRadius:999, border:'1px solid rgba(255,255,255,0.06)'}}>
              {NAV.slice(0,7).map(n=>(
                <NavLink key={n.path} to={n.path} className={({isActive})=> isActive? 'nav-active':''} style={({isActive})=>({padding:'6px 12px', borderRadius:999, fontSize:12, fontWeight:700, color: isActive? '#b8ff33':'#7d8aa6', textDecoration:'none'})}>{n.label}</NavLink>
              ))}
            </div>
          </div>

          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <div className="hide-mobile" style={{fontSize:11, color:'#7d8aa6', border:'1px solid #1e2e4a', padding:'6px 10px', borderRadius:999, background:'rgba(255,255,255,0.03)'}}><span style={{color:'#b8ff33'}}>●</span> Solana • Ethereum • Base</div>
            <button className="btn btn-primary" style={{padding:'8px 14px', fontSize:12}} onClick={()=>nav('/wallets')}>Connect Wallet</button>
            <button className="show-mobile" onClick={()=>setMobileOpen(v=>!v)} style={{background:'rgba(255,255,255,0.06)', border:'1px solid #1e2e4a', color:'#e5edff', padding:'8px 10px', borderRadius:10}}>☰</button>
          </div>
        </div>
        {mobileOpen && (
          <div style={{padding:'12px 18px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, borderTop:'1px solid #1e2e4a', background:'#05070f'}}>
            {NAV.map(n=> <NavLink key={n.path} to={n.path} onClick={()=>setMobileOpen(false)} style={({isActive})=>({padding:'10px 12px', borderRadius:10, background: isActive? 'rgba(184,255,51,0.12)':'rgba(255,255,255,0.04)', border:'1px solid #1e2e4a', color: isActive? '#b8ff33':'#e5edff', fontSize:13, fontWeight:700})}>{n.icon} {n.label}</NavLink>)}
          </div>
        )}
      </header>
      <style>{`@media(max-width:900px){.hide-mobile{display:none !important} .show-mobile{display:inline-flex !important}} @media(min-width:901px){.show-mobile{display:none !important}}`}</style>
    </>
  )
}

export function Sidebar(){
  const nav = useNavigate()
  return (
    <aside style={{width:220, minWidth:220, borderRight:'1px solid #1e2e4a', background:'rgba(8,12,22,0.6)', padding:'14px 10px', display:'flex', flexDirection:'column', gap:10, position:'sticky', top:61, height:'calc(100vh - 61px)', overflowY:'auto'}} className="hide-mobile">
      <div className="card" style={{padding:10, background:'linear-gradient(135deg, rgba(184,255,51,0.08), rgba(0,255,166,0.06))', borderColor:'rgba(184,255,51,0.16)'}}>
        <div style={{fontSize:10, fontWeight:800, letterSpacing:1, color:'#b8ff33'}}>WALLET REPUTATION</div>
        <div style={{fontSize:28, fontWeight:900, lineHeight:1}}>94.2</div>
        <div style={{fontSize:11, color:'#00ffa6'}}>Top 2.8% • Smart Money</div>
        <button className="btn btn-primary" style={{width:'100%', marginTop:10, padding:'8px'}} onClick={()=>nav('/wallet/0x91A172F')}>View Profile</button>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:4}}>
        {NAV.map(n=>(
          <NavLink key={n.path} to={n.path} style={({isActive})=>({display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10, background: isActive?'rgba(184,255,51,0.10)':'transparent', border: isActive?'1px solid rgba(184,255,51,0.18)':'1px solid transparent', color: isActive?'#b8ff33':'#7d8aa6', fontWeight:700, fontSize:13})}>
            <span style={{width:18, textAlign:'center'}}>{n.icon}</span> {n.label}
          </NavLink>
        ))}
      </div>
      <div style={{marginTop:'auto', padding:10, borderRadius:12, background:'rgba(255,46,157,0.08)', border:'1px solid rgba(255,46,157,0.18)'}}>
        <div style={{fontSize:11, fontWeight:800, color:'#ff2e9d'}}> $GURU UTILITY</div>
        <div style={{fontSize:11, color:'#7d8aa6', marginTop:4}}>Premium analytics • Real-time alerts • API</div>
        <div style={{fontSize:10, color:'#e5edff', marginTop:8, fontWeight:700}}>Ticker: $GURU • Solana (initially)</div>
      </div>
    </aside>
  )
}
