let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

function isElectron(): boolean {
  return !!(window as any).guruElectron
}

async function playViaElectron(type: 'alert' | 'match'): Promise<boolean> {
  if (!isElectron()) return false
  try {
    const result = await (window as any).guruElectron.playSound(type)
    return result.success
  } catch {
    return false
  }
}

export const PlaySound = {
  async alert() {
    const electronPlayed = await playViaElectron('alert')
    if (electronPlayed) return
    // Fallback to Web Audio API
    try {
      const ctx = getAudioContext()
      if (ctx.state === 'suspended') ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } catch { /* ignore */ }
  },

  async match() {
    const electronPlayed = await playViaElectron('match')
    if (electronPlayed) return
    // Fallback to Web Audio API
    try {
      const ctx = getAudioContext()
      if (ctx.state === 'suspended') ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(660, ctx.currentTime)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1)
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } catch { /* ignore */ }
  },

  async playFile(path: string) {
    try {
      const ctx = getAudioContext()
      if (ctx.state === 'suspended') await ctx.resume()
      const res = await fetch(path)
      const arrayBuffer = await res.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)
      source.start()
    } catch { /* ignore */ }
  },
}