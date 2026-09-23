import { useState, useEffect } from 'react'

type Alert = { id:string, type:string, enabled:boolean, channel:string, threshold?:string }

const DEFAULT: Alert[] = [
  { id:'1', type:'GURU wallet buys token', enabled:true, channel:'browser' },
  { id:'2', type:'Smart-money convergence detected', enabled:true, channel:'browser' },
  { id:'3', type:'Whale movement (> $100k)', enabled:false, channel:'telegram' },
  { id:'4', type:'Dev wallet moves funds', enabled:true, channel:'discord' },
  { id:'5', type:'Wallet reputation changes', enabled:false, channel:'email' },
]

export function Alerts(){
  const [alerts,setAlerts]=useState<Alert[]>(()=>{
    try{ const s=localStorage.getItem('guru:alerts'); return s? JSON.parse(s): DEFAULT }catch{ return DEFAULT}
  })
  const [perm,setPerm]=useState<string>(typeof Notification !=='undefined'? Notification.permission: 'unsupported')
  useEffect(()=> localStorage.setItem('guru:alerts', JSON.stringify(alerts)),[alerts])

  async function enableBrowser(){
    if(typeof Notification==='undefined') return alert('Notifications not supported')
    const p=await Notification.requestPermission(); setPerm(p)
    if(p==='granted') new Notification('GURU — Alerts enabled', { body:'You will receive smart-money alerts' })
  }

  return (
    <div style={{display:'grid', gap:14, paddingBottom:40}}>
      <div className="card" style={{padding:16}}>
        <div style={{fontWeight:900, fontSize:18}}>ALERT SYSTEM</div>
        <div style={{fontSize:12, color:'#7d8aa6'}}>Configurable • Modular providers (browser/email/discord/telegram). Premium: higher-frequency.</div>
        <div style={{display:'flex', gap:8, marginTop:10, alignItems:'center'}}>
          <span className="badge" style={{background: perm==='granted'?'rgba(34,197,94,0.14)':'rgba(239,68,68,0.1)', color: perm==='granted'?'#22c55e':'#ef4444'}}>Browser: {perm}</span>
          <button className="btn btn-primary" style={{padding:'6px 12px', fontSize:12}} onClick={enableBrowser}>Enable Browser Notifications</button>
          <span className="badge">Email • Discord • Telegram (modular)</span>
        </div>
      </div>

      <div className="card" style={{padding:14}}>
        <div style={{fontWeight:800, fontSize:12}}>ALERT CONFIGS</div>
        <div style={{display:'grid', gap:8, marginTop:10}}>
          {alerts.map(a=>(
            <div key={a.id} style={{display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid #1e2e4a'}}>
              <label style={{display:'flex', alignItems:'center', gap:8, flex:1}}>
                <input type="checkbox" checked={a.enabled} onChange={e=> setAlerts(alerts.map(x=> x.id===a.id? {...x, enabled:e.target.checked}:x))} />
                <span style={{fontWeight:700, fontSize:13}}>{a.type}</span>
              </label>
              <select value={a.channel} onChange={e=> setAlerts(alerts.map(x=> x.id===a.id? {...x, channel:e.target.value}:x))} style={{background:'#0a0f1c', border:'1px solid #1e2e4a', color:'#e5edff', padding:'6px 10px', borderRadius:999, fontSize:12}}>
                <option value="browser">Browser</option><option value="email">Email</option><option value="discord">Discord</option><option value="telegram">Telegram</option>
              </select>
              <span className="badge" style={{fontSize:10, background: a.enabled?'rgba(184,255,51,0.12)':'rgba(255,255,255,0.04)', color: a.enabled?'#b8ff33':'#7d8aa6'}}>{a.enabled?'ON':'OFF'}</span>
            </div>
          ))}
        </div>
        <div style={{marginTop:10, display:'flex', gap:8}}>
          <button className="btn btn-ghost" onClick={()=>{
            if(typeof Notification!=='undefined' && Notification.permission==='granted') new Notification('GURU Test', { body:'Smart-money convergence detected for $ABC — demo'})
            else alert('Test alert — enable browser notifications first (mock event)')
          }}>Send Test Alert</button>
          <span style={{fontSize:11, color:'#7d8aa6', alignSelf:'center'}}>Premium users get real-time (&lt; 30s) vs free 5m.</span>
        </div>
      </div>

      <div className="card" style={{padding:14, borderColor:'rgba(250,204,21,0.18)', background:'rgba(250,204,21,0.04)'}}>
        <div style={{fontWeight:800, fontSize:12, color:'#facc15'}}>TOKEN-GATED PREMIUM</div>
        <div style={{fontSize:12, color:'#cbd5e1', marginTop:6}}>Hold <strong>$GURU</strong> to unlock advanced alerts, higher frequency, API. <span style={{color:'#7d8aa6'}}>Free tier is useful on its own — token enhances, not required. Token service is modular, upgradeable.</span></div>
        <div style={{marginTop:8, display:'flex', gap:8}}>
          <span className="badge">Premium Analytics</span><span className="badge">Real-Time Intel</span><span className="badge">API Access</span>
        </div>
      </div>
    </div>
  )
}
