import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockProvider, shortAddr } from '../lib/providers/mockProvider'
import { isSolanaAddress } from '../lib/solana'
import { shortSolAddr } from '../lib/providers/pumpportal'

export function SearchBar({ large }: { large?: boolean }){
  const [q,setQ]=useState('')
  const [res,setRes]=useState<{wallets: any[], tokens:any[]}>({wallets:[],tokens:[]})
  const [open,setOpen]=useState(false)
  const nav=useNavigate()
  async function onChange(v:string){
    setQ(v)
    if(v.length<2){ setRes({wallets:[],tokens:[]}); setOpen(false); return}
    const [w,t]=await Promise.all([mockProvider.searchWallets(v), mockProvider.searchTokens(v)])
    setRes({wallets:w as any, tokens:t as any})
    setOpen(true)
  }
  function goWallet(addr:string){ setOpen(false); nav(`/wallet/${addr}`)}
  function goToken(addr:string){ setOpen(false); nav(`/token/${addr}`)}
  function goSolana(addr:string){ setOpen(false); nav(`/sw/${addr.trim()}`)}
  function submit(e:React.FormEvent){
    e.preventDefault()
    if(!q) return
    // heuristic: 0x → mock wallet, base58 → real Solana wallet, else token
    if(q.startsWith('0x') && q.length>10) goWallet(q)
    else if(isSolanaAddress(q)) goSolana(q)
    else if(res.tokens[0]) goToken(res.tokens[0].address)
    else if(res.wallets[0]) goWallet(res.wallets[0].address)
  }
  const solHint = isSolanaAddress(q)
  return (
    <form onSubmit={submit} style={{position:'relative', width: large? '100%':'420px', maxWidth:'100%'}}>
      <div style={{display:'flex', alignItems:'center', gap:8, background:'rgba(10,16,32,0.92)', border:'1px solid #1e2e4a', borderRadius: large? 16:999, padding: large? '10px 14px':'8px 14px', boxShadow:'0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)'}}>
        <span style={{color:'#7d8aa6'}}>⌕</span>
        <input value={q} onChange={e=>onChange(e.target.value)} onFocus={()=> q.length>=2 && setOpen(true)} placeholder="Search wallet, token, ENS, or address..." style={{flex:1, background:'transparent', border:'none', color:'#e5edff', fontSize: large?15:13, fontWeight:500}} />
        <button type="submit" style={{background:'#b8ff33', color:'#05070f', border:'none', borderRadius:999, padding: large?'9px 16px':'7px 12px', fontWeight:800, fontSize:12, cursor:'pointer'}}>Analyze →</button>
      </div>
      {open && (res.wallets.length || res.tokens.length || solHint) ? (
        <div className="card" style={{position:'absolute', top:'calc(100% + 8px)', left:0, right:0, zIndex:30, padding:8, display:'grid', gap:6}}>
          {solHint ? (
            <div onClick={()=>goSolana(q)} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, cursor:'pointer', background:'rgba(184,255,51,0.07)', border:'1px solid rgba(184,255,51,0.22)'}}>
              <div style={{width:28,height:28,borderRadius:999, background:'linear-gradient(135deg,#b8ff33,#00ffa6)', display:'grid',placeItems:'center', fontSize:12, color:'#05070f', fontWeight:900}}>◎</div>
              <div style={{flex:1}}><div style={{fontSize:13, fontWeight:700}}>Solana wallet detected</div><div className="mono" style={{fontSize:11, color:'#7d8aa6'}}>{shortSolAddr(q.trim())} • balance, activity, pump.fun record</div></div>
              <span className="badge badge-neon" style={{fontSize:10}}>ANALYZE</span>
            </div>
          ):null}
          {res.wallets.length? <div style={{fontSize:10, fontWeight:800, letterSpacing:1, color:'#7d8aa6', padding:'4px 8px'}}>WALLETS</div>:null}
          {res.wallets.map((w:any)=>(
            <div key={w.address} onClick={()=>goWallet(w.address)} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, cursor:'pointer', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)'}}>
              <div style={{width:28,height:28,borderRadius:999, background:'linear-gradient(135deg,#1a2a4a,#2a1a4a)', display:'grid',placeItems:'center', fontSize:12}}>⬡</div>
              <div style={{flex:1}}><div style={{fontSize:13, fontWeight:700}}>{w.ens || shortAddr(w.address)}</div><div className="mono" style={{fontSize:11, color:'#7d8aa6'}}>{shortAddr(w.address)} • {w.ageDays}d old</div></div>
              <span className="badge badge-neon" style={{fontSize:10}}>ANALYZE</span>
            </div>
          ))}
          {res.tokens.length? <div style={{fontSize:10, fontWeight:800, letterSpacing:1, color:'#7d8aa6', padding:'4px 8px', marginTop:4}}>TOKENS</div>:null}
          {res.tokens.map((t:any)=>(
            <div key={t.address} onClick={()=>goToken(t.address)} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, cursor:'pointer', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)'}}>
              <div style={{width:28,height:28,borderRadius:999, background:'#0f172a', border:'1px solid #1e2e4a', display:'grid',placeItems:'center', fontSize:11, fontWeight:800, color:'#b8ff33'}}>{t.symbol.slice(0,3)}</div>
              <div style={{flex:1}}><div style={{fontSize:13, fontWeight:700}}>{t.symbol} <span style={{fontWeight:400, color:'#7d8aa6', fontSize:12}}>{t.name}</span></div><div className="mono" style={{fontSize:11, color:'#7d8aa6'}}>${t.price} • MC ${(t.marketCap/1_000_000).toFixed(1)}M</div></div>
              <span className="badge" style={{fontSize:10, color:'#00e5ff', borderColor:'rgba(0,229,255,0.3)'}}>TOKEN</span>
            </div>
          ))}
        </div>
      ):null}
    </form>
  )
}
