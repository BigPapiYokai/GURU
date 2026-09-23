import { useRef } from 'react'

export function ViralCard({ title, score, subtitle, traits, address }: { title:string, score:number, subtitle:string, traits?:{label:string,value:number}[], address?:string }){
  const ref=useRef<HTMLDivElement>(null)
  async function download(){
    if(!ref.current) return
    // simple canvas fallback — create image via html2canvas-like manual
    // For brevity, trigger print via data url using svg foreignObject hack (not perfect) — just alert
    const html = ref.current.outerHTML
    const blob = new Blob([html], {type:'text/html'})
    const url = URL.createObjectURL(blob)
    const a=document.createElement('a'); a.href=url; a.download=`guru-card-${score}.html`; a.click(); URL.revokeObjectURL(url)
  }
  return (
    <div>
      <div ref={ref} style={{width:420, background:'linear-gradient(135deg,#0a0f1c 0%, #111d33 50%, #0f172a 100%)', border:'1px solid rgba(184,255,51,0.22)', borderRadius:16, padding:16, position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', inset:0, background:'radial-gradient(400px 200px at 70% 0%, rgba(184,255,51,0.12), transparent)', pointerEvents:'none'}}/>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative'}}>
          <div style={{fontWeight:900, letterSpacing:1, color:'#b8ff33'}}>GURU • SPOT THE SMART MONEY</div>
          <div style={{fontSize:10, color:'#7d8aa6'}}>$GURU</div>
        </div>
        <div style={{marginTop:10, fontWeight:900, fontSize:12, letterSpacing:1.2, color:'#7d8aa6'}}>{title}</div>
        <div style={{display:'flex', alignItems:'baseline', gap:10, marginTop:6}}>
          <span style={{fontSize:44, fontWeight:900, color:'#b8ff33'}}>{score.toFixed(1)}</span>
          <span style={{fontSize:12, fontWeight:700, color:'#00ffa6', background:'rgba(0,255,166,0.12)', border:'1px solid rgba(0,255,166,0.22)', padding:'4px 8px', borderRadius:999}}>{subtitle}</span>
        </div>
        {traits && (
          <div style={{marginTop:10, display:'grid', gap:6}}>
            {traits.slice(0,3).map(t=>(
              <div key={t.label} style={{display:'flex', alignItems:'center', gap:8, fontSize:11, fontWeight:700}}>
                <span style={{width:110, color:'#7d8aa6'}}>{t.label}</span>
                <span style={{flex:1, height:6, background:'#0f172a', borderRadius:999, border:'1px solid #1e2e4a'}}><span style={{display:'block', width:`${t.value}%`, height:'100%', background:'#b8ff33', borderRadius:999}}/></span>
                <span style={{color:'#e5edff'}}>{t.value}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mono" style={{marginTop:10, fontSize:10, color:'#4b5a78'}}>{address? `${address.slice(0,6)}…${address.slice(-4)} • guru.app/wallet/${address}`:'guru.app • Every wallet has a reputation.'}</div>
        <div style={{marginTop:8, textAlign:'right', fontSize:10, fontWeight:800, color:'#ff2e9d'}}>SPOT THE SMART MONEY.</div>
      </div>
      <button className="btn btn-ghost" style={{marginTop:8, width:'100%'}} onClick={download}>⬇ Share Card (download)</button>
    </div>
  )
}
