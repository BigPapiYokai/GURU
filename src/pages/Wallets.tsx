import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { provider, shortAddr } from '../lib/providers/mockProvider'
import { isSolanaAddress } from '../lib/solana'
import { shortSolAddr } from '../lib/providers/pumpportal'
import { SearchBar } from '../components/SearchBar'

export function Wallets(){
  const nav = useNavigate()
  const [q,setQ]=useState('')
  const [rows,setRows]=useState<any[]>([])
  const [solHit,setSolHit]=useState<string|null>(null)
  const [loading,setLoading]=useState(false)
  const [tracked,setTracked]=useState<Record<string,{name:string,added:number}>>(()=>{
    try{ const s=localStorage.getItem('guru:wallet-names'); return s? JSON.parse(s): {} }catch{ return {} }
  })
  const [nickName,setNickName]=useState('')
  const [editAddr,setEditAddr]=useState<string|null>(null)
  async function doSearch(v:string){
    setQ(v); if(v.length<2) return
    // real Solana address → direct hit, no mock needed
    if(isSolanaAddress(v)){ setSolHit(v.trim()); setRows([]); return }
    setSolHit(null)
    setLoading(true)
    const w=await provider.searchWallets(v)
    // enrich with scores
    const enriched = await Promise.all(w.map(async (x:any)=>{
      const s=await provider.getWalletStats(x.address)
      return { wallet:x, stats:s }
    }))
    setRows(enriched as any)
    setLoading(false)
  }
  useEffect(()=>{ doSearch('0x') },[])
  useEffect(()=>{ localStorage.setItem('guru:wallet-names', JSON.stringify(tracked)) },[tracked])

  return (
    <div style={{display:'grid', gap:14, paddingBottom:40}}>
      <div className="card" style={{padding:16}}>
        <div style={{fontWeight:900, fontSize:18}}>WALLETS</div>
        <div style={{fontSize:12, color:'#7d8aa6', marginTop:4}}>Every wallet has a reputation. Search any address, ENS, or token.</div>
        <div style={{marginTop:12, display:'flex', gap:8}}>
          <input value={q} onChange={e=> doSearch(e.target.value)} placeholder="Paste address, ENS, or search…" style={{flex:1, background:'#0a0f1c', border:'1px solid #1e2e4a', color:'#e5edff', padding:'10px 14px', borderRadius:999}} />
          <SearchBar />
        </div>
      </div>

      <div style={{display:'grid', gap:10}}>
        {solHit? (
          <div className="card" onClick={()=>nav(`/sw/${solHit}`)} style={{padding:14, display:'flex', alignItems:'center', gap:14, cursor:'pointer', borderColor:'rgba(184,255,51,0.25)'}}>
            <div style={{width:42,height:42, borderRadius:999, background:'linear-gradient(135deg,#b8ff33,#00ffa6)', display:'grid', placeItems:'center', color:'#05070f', fontWeight:900}}>◎</div>
            <div style={{flex:1}}>
              <div className="mono" style={{fontWeight:800}}>Solana wallet <span style={{color:'#7d8aa6', fontWeight:400, fontSize:12}}>{shortSolAddr(solHit)}</span></div>
              <div style={{fontSize:11, color:'#7d8aa6'}}>Live RPC balance + activity + pump.fun launcher record</div>
            </div>
            <div className="badge badge-neon" style={{fontSize:10}}>Analyze →</div>
          </div>
        ):null}
        {loading? <div className="card" style={{padding:20, color:'#7d8aa6'}}>Indexing… (mock)</div> :
          rows.map(({wallet,stats}:any)=>{
            const addr = wallet.address
            const nick = tracked[addr]?.name || ''
            const isEditing = editAddr === addr
            return (
            <div key={addr} className="card" style={{padding:14, display:'flex', alignItems:'center', gap:14}}>
              <Link to={`/wallet/${addr}`} style={{textDecoration:'none', flex:1, display:'flex', alignItems:'center', gap:14}}>
                <div style={{width:42,height:42,borderRadius:999,background:'linear-gradient(135deg,#0f172a,#1e2e4a)',border:'1px solid #1e2e4a',display:'grid',placeItems:'center'}}>⬡</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span className="mono" style={{fontWeight:800}}>{nick || wallet.ens || shortAddr(addr)} <span style={{color:'#7d8aa6',fontWeight:400,fontSize:12}}>{shortAddr(addr)}</span></span>
                    {nick && <span className="badge" style={{fontSize:9,background:'rgba(184,255,51,0.15)',color:'#b8ff33'}}>TRACKED</span>}
                  </div>
                  <div style={{fontSize:11,color:'#7d8aa6'}}>{wallet.ageDays}d old • {stats?.numTrades} trades • {stats?.winRate?.toFixed(1)}% win • ROI {stats?.roi?.toFixed(0)}%</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:900,color:'#b8ff33'}}>{(stats? 70+ (stats.roi/12)+ (stats.winRate/8) : 72).toFixed(1).slice(0,4)} <span style={{fontSize:11,color:'#7d8aa6'}}>GURU</span></div>
                  <div className="badge" style={{fontSize:10,marginTop:4}}>View Profile →</div>
                </div>
              </Link>
              <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                {isEditing ? (
                  <>
                    <input value={nickName} onChange={e=>setNickName(e.target.value)} placeholder="Nickname" style={{width:100,background:'#0a0f1c',border:'1px solid #b8ff33',color:'#e5edff',padding:'4px 8px',borderRadius:6,fontSize:11}} />
                    <button className="btn btn-primary" style={{padding:'4px 10px',fontSize:11}} onClick={()=>{ setTracked({...tracked,[addr]:{name:nickName.trim()||addr,added:Date.now()}}); setEditAddr(null); setNickName(''); }}>
                      Save
                    </button>
                    <button className="btn btn-ghost" style={{padding:'4px 8px',fontSize:11}} onClick={()=>{setEditAddr(null);setNickName('');}}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-ghost" style={{padding:'4px 10px',fontSize:11}} onClick={()=>{setEditAddr(addr);setNickName(nick||'');}}>
                      {nick ? 'Edit' : 'Nickname'}
                    </button>
                    <button className="btn btn-ghost" style={{padding:'4px 10px',fontSize:11}} onClick={()=>{ const t={...tracked}; delete t[addr]; setTracked(t); }}>
                      {nick ? 'Untrack' : 'Track'}
                    </button>
                  </>
                )}
              </div>
            </div>)
          }))
        }
        </div>
      </div>
    </div>
  )
}
