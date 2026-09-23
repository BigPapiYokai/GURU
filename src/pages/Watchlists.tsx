import { useState, useEffect } from 'react'
import { shortAddr } from '../lib/providers/mockProvider'

type List = { id:string, name:string, public:boolean, wallets:string[], followers:number }

const DEFAULT: List[] = [
  { id:'1', name:'My Smart Money', public:false, wallets:['0x91A172F12345678901234567890123456789012','0x71C081A123456789012345678901234567890AB'], followers:0 },
  { id:'2', name:'Solana Gurus', public:true, wallets:['0x82D019B123456789012345678901234567890BB'], followers:182 },
  { id:'3', name:'Meme Gurus', public:true, wallets:[], followers:94 },
  { id:'4', name:'Whale Watch', public:false, wallets:[], followers:0 },
]

export function Watchlists(){
  const [lists,setLists]=useState<List[]>(()=>{
    try{ const s= localStorage.getItem('guru:watchlists'); return s? JSON.parse(s): DEFAULT }catch{ return DEFAULT}
  })
  const [newName,setNewName]=useState('')
  const [newAddr,setNewAddr]=useState('')
  const [selected,setSelected]=useState<string>(lists[0]?.id || '1')
  useEffect(()=> localStorage.setItem('guru:watchlists', JSON.stringify(lists)),[lists])
  const cur = lists.find(l=>l.id===selected)

  function createList(){
    if(!newName.trim()) return
    const id=Date.now().toString(36)
    setLists([...lists, { id, name:newName, public:false, wallets:[], followers:0 }]); setNewName(''); setSelected(id)
  }
  function addWallet(){
    if(!newAddr.trim() || !cur) return
    setLists(lists.map(l=> l.id===cur.id? {...l, wallets:[...l.wallets, newAddr.trim()]}:l)); setNewAddr('')
  }

  return (
    <div style={{display:'grid', gap:14, paddingBottom:40}}>
      <div className="card" style={{padding:16}}>
        <div style={{fontWeight:900, fontSize:18}}>WATCHLISTS</div>
        <div style={{fontSize:12, color:'#7d8aa6'}}>Create, follow, share. Token-gated lists for premium users (mock).</div>
        <div style={{display:'flex', gap:8, marginTop:12}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="New list name (e.g. Early Buyers)" style={{flex:1, background:'#0a0f1c', border:'1px solid #1e2e4a', color:'#e5edff', padding:'10px 14px', borderRadius:999}} />
          <button className="btn btn-primary" onClick={createList}>+ Create</button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'300px 1fr', gap:14}} className="resp">
        <div className="card" style={{padding:10, display:'grid', gap:8, alignContent:'start'}}>
          {lists.map(l=>(
            <div key={l.id} onClick={()=>setSelected(l.id)} style={{padding:'10px 12px', borderRadius:10, cursor:'pointer', background: selected===l.id?'rgba(184,255,51,0.08)':'rgba(255,255,255,0.03)', border:`1px solid ${selected===l.id?'rgba(184,255,51,0.18)':'#1e2e4a'}`}}>
              <div style={{fontWeight:800, fontSize:13}}>{l.name} {l.public? <span className="badge" style={{fontSize:9, marginLeft:6}}>PUBLIC</span>: <span className="badge" style={{fontSize:9, marginLeft:6, color:'#7d8aa6'}}>PRIVATE</span>}</div>
              <div style={{fontSize:11, color:'#7d8aa6'}}>{l.wallets.length} wallets • {l.followers} followers</div>
              <div style={{display:'flex', gap:6, marginTop:6}}>
                <button className="btn btn-ghost" style={{padding:'4px 8px', fontSize:11}} onClick={(e)=>{e.stopPropagation(); setLists(lists.map(x=>x.id===l.id? {...x, public:!x.public}:x))}}>{l.public?'Make private':'Make public'}</button>
                <button className="btn btn-ghost" style={{padding:'4px 8px', fontSize:11}} onClick={(e)=>{e.stopPropagation(); navigator.clipboard.writeText(`https://guru.app/list/${l.id}`); alert('Link copied')}}>Share</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{padding:14}}>
          {cur? (
            <>
              <div style={{fontWeight:800}}>{cur.name} <span style={{color:'#7d8aa6', fontWeight:400, fontSize:12}}>• {cur.public?'Public':'Private'} • Follow to get alerts</span></div>
              <div style={{display:'flex', gap:8, marginTop:10}}>
                <input value={newAddr} onChange={e=>setNewAddr(e.target.value)} placeholder="Add wallet 0x…" style={{flex:1, background:'#0a0f1c', border:'1px solid #1e2e4a', color:'#e5edff', padding:'10px 14px', borderRadius:999}} />
                <button className="btn btn-primary" onClick={addWallet}>Add</button>
                <button className="btn btn-ghost" onClick={()=> alert('Follow list — mock')}>Follow list</button>
              </div>
              <div style={{display:'grid', gap:8, marginTop:14}}>
                {cur.wallets.length===0? <div style={{padding:20, textAlign:'center', color:'#7d8aa6', border:'1px dashed #1e2e4a', borderRadius:12}}>No wallets yet — add one above.</div> :
                  cur.wallets.map(w=>(
                    <div key={w} style={{display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid #1e2e4a'}}>
                      <span className="mono" style={{fontWeight:800}}>{w.length>20? shortAddr(w): w}</span>
                      <span className="badge">GURU {Math.round(72+ Math.random()*22)}</span>
                      <button className="btn btn-ghost" style={{marginLeft:'auto', padding:'4px 8px', fontSize:11}} onClick={()=> setLists(lists.map(l=>l.id===cur.id? {...l, wallets:l.wallets.filter(x=>x!==w)}:l))}>Remove</button>
                    </div>
                  ))
                }
              </div>
            </>
          ): <div style={{color:'#7d8aa6'}}>Select a list</div>}
        </div>
      </div>
      <style>{`@media(max-width:900px){.resp{grid-template-columns:1fr !important}}`}</style>
    </div>
  )
}
