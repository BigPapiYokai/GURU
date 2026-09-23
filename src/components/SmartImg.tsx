// GURU — resilient coin image with gateway fallbacks.
// Pump.fun images live on IPFS; public gateways are flaky, so cycle them.

export function gatewayVariants(uri: string): string[] {
  if (!uri) return []
  if (uri.startsWith('ipfs://')) {
    const cid = uri.slice(7)
    return [
      `https://ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`,
    ]
  }
  if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}|^baf[a-z0-9]+/i.test(uri)) {
    return [
      `https://ipfs.io/ipfs/${uri}`,
      `https://cloudflare-ipfs.com/ipfs/${uri}`,
      `https://gateway.pinata.cloud/ipfs/${uri}`,
    ]
  }
  if (uri.startsWith('ar://')) return [`https://arweave.net/${uri.slice(5)}`, uri]
  return [uri]
}

import { useState } from 'react'

export function SmartImg({
  src, alt = '', size = 44, radius = 10,
}: {
  src?: string; alt?: string; size?: number; radius?: number
}) {
  const variants = gatewayVariants(src || '')
  const [idx, setIdx] = useState(0)
  if (!src || idx >= variants.length) {
    return (
      <div style={{ width: size, height: size, borderRadius: radius, background: 'linear-gradient(135deg,#1a2a4a,#2a1a4a)', border: '1px solid #1e2e4a', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: size * 0.45 }}>◎</div>
    )
  }
  return (
    <img
      src={variants[idx]} alt={alt} loading="lazy"
      onError={() => setIdx((i) => i + 1)}
      style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', border: '1px solid #1e2e4a', flexShrink: 0 }}
    />
  )
}
