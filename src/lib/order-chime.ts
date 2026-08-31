let ctx: AudioContext | null = null
let loopTimer: ReturnType<typeof setInterval> | null = null
let unlocked = false
let pending = false

function getCtx() {
  if (typeof window === 'undefined') return null
  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null
  if (!ctx) ctx = new AudioCtx()
  return ctx
}

export function unlockOrderChime() {
  unlocked = true
  const audio = getCtx()
  if (audio && audio.state === 'suspended') void audio.resume()
  if (pending) startOrderChime()
}

function tone(audio: AudioContext, freq: number, start: number, duration: number) {
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.14, start + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

function playPhrase() {
  const audio = getCtx()
  if (!audio || audio.state !== 'running') return
  const t = audio.currentTime + 0.02
  tone(audio, 784, t, 0.16)
  tone(audio, 988, t + 0.18, 0.16)
  tone(audio, 1175, t + 0.36, 0.28)
  tone(audio, 988, t + 0.7, 0.22)
}

export function startOrderChime() {
  if (!unlocked) {
    pending = true
    return
  }
  pending = false
  const audio = getCtx()
  if (audio && audio.state === 'suspended') void audio.resume()
  if (loopTimer != null) return
  playPhrase()
  loopTimer = setInterval(playPhrase, 2000)
}

export function stopOrderChime() {
  pending = false
  if (loopTimer != null) {
    clearInterval(loopTimer)
    loopTimer = null
  }
}

export const ORDERS_CHANGED_EVENT = 'flower-admin-orders-changed'

export function notifyOrdersChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT))
}
