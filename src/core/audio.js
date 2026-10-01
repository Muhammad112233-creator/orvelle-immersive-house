import { reactive } from 'vue'
import { $store } from './store.js'

/* ---------------------------------------------------------------------------
   Sound engine.

   Interface sounds and room ambience are synthesised in the Web Audio graph
   rather than shipped as files. A sprite sheet of thirty short UI noises would
   cost more to download than the rest of the interface put together, and
   synthesis lets every click be slightly different — which is what stops a
   repeated sound from turning into a tic.

   Voiceover (real recordings) is handled separately in voiceover.js.
   --------------------------------------------------------------------------- */

const state = reactive({
  unlocked: false,
  muted: true,
})

let ctx = null
let master = null
let sfxBus = null
let ambienceBus = null
let voiceBus = null
let noiseBuffer = null
let currentAmbience = null

function makeNoiseBuffer(context) {
  const length = context.sampleRate * 2
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const data = buffer.getChannelData(0)
  // Slightly brown-ish noise: less hissy than pure white, reads as "room".
  let lastOut = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    lastOut = (lastOut + 0.02 * white) / 1.02
    data[i] = lastOut * 3.5
  }
  return buffer
}

function ensureContext() {
  if (ctx) return ctx
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null

  ctx = new AudioCtx()

  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  sfxBus = ctx.createGain()
  sfxBus.gain.value = 0.9
  sfxBus.connect(master)

  ambienceBus = ctx.createGain()
  ambienceBus.gain.value = 0.0
  ambienceBus.connect(master)

  voiceBus = ctx.createGain()
  voiceBus.gain.value = 1
  voiceBus.connect(master)

  noiseBuffer = makeNoiseBuffer(ctx)
  return ctx
}

/* ---------------------------------------------------------------------------
   Primitive voices
   --------------------------------------------------------------------------- */

function env(node, { attack = 0.004, decay = 0.12, peak = 1, start = 0 }) {
  const t = ctx.currentTime + start
  node.gain.cancelScheduledValues(t)
  node.gain.setValueAtTime(0.0001, t)
  node.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack)
  node.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  return t + attack + decay
}

function tone({
  freq = 440, type = 'sine', duration = 0.12, volume = 0.3,
  detune = 0, slideTo = null, start = 0, bus = null,
}) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.detune.value = detune
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(slideTo, 1), ctx.currentTime + start + duration,
    )
  }
  osc.connect(gain)
  gain.connect(bus || sfxBus)
  const end = env(gain, { attack: 0.006, decay: duration, peak: volume, start })
  osc.start(ctx.currentTime + start)
  osc.stop(end + 0.05)
}

function noise({
  duration = 0.15, volume = 0.3, filterType = 'bandpass',
  freq = 1200, q = 1, start = 0, bus = null,
}) {
  if (!ctx) return
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = filterType
  filter.frequency.value = freq
  filter.Q.value = q

  const gain = ctx.createGain()
  src.connect(filter)
  filter.connect(gain)
  gain.connect(bus || sfxBus)

  const end = env(gain, { attack: 0.005, decay: duration, peak: volume, start })
  src.start(ctx.currentTime + start)
  src.stop(end + 0.05)
}

/* A touch of randomness keeps repeated UI sounds from sounding mechanical. */
const vary = (n, amount = 0.06) => n * (1 + (Math.random() * 2 - 1) * amount)

/* ---------------------------------------------------------------------------
   The sprite sheet, expressed as recipes
   --------------------------------------------------------------------------- */

const RECIPES = {
  ui_click() {
    tone({ freq: vary(880), type: 'triangle', duration: 0.05, volume: 0.1 })
    noise({ freq: vary(3200), duration: 0.03, volume: 0.07, q: 2 })
  },

  ui_hover() {
    tone({ freq: vary(1400), type: 'sine', duration: 0.04, volume: 0.035 })
  },

  ui_back() {
    tone({ freq: vary(520), type: 'triangle', duration: 0.09, volume: 0.1, slideTo: 300 })
  },

  paper_turn() {
    noise({ freq: vary(2600), duration: 0.22, volume: 0.16, filterType: 'highpass', q: 0.6 })
    noise({ freq: vary(900), duration: 0.14, volume: 0.07, start: 0.06 })
  },

  paper_tear() {
    for (let i = 0; i < 7; i++) {
      noise({ freq: vary(2800, 0.3), duration: 0.05, volume: 0.1, start: i * 0.022, q: 1.4 })
    }
  },

  pencil_write() {
    for (let i = 0; i < 12; i++) {
      noise({
        freq: vary(1800, 0.4), duration: 0.04, volume: 0.05,
        start: i * 0.045, filterType: 'bandpass', q: 3,
      })
    }
  },

  stamp() {
    noise({ freq: 260, duration: 0.1, volume: 0.3, filterType: 'lowpass' })
    tone({ freq: 90, type: 'sine', duration: 0.14, volume: 0.22 })
  },

  shutter() {
    noise({ freq: 5200, duration: 0.025, volume: 0.22, q: 1 })
    noise({ freq: 1400, duration: 0.05, volume: 0.16, start: 0.035 })
    tone({ freq: 190, type: 'square', duration: 0.05, volume: 0.07, start: 0.03 })
  },

  polaroid_eject() {
    noise({ freq: 700, duration: 0.6, volume: 0.1, filterType: 'bandpass', q: 0.8 })
    tone({ freq: 70, type: 'sawtooth', duration: 0.55, volume: 0.04 })
  },

  viewer_advance() {
    noise({ freq: 1100, duration: 0.07, volume: 0.2, q: 1.5 })
    tone({ freq: vary(170), type: 'square', duration: 0.07, volume: 0.1, slideTo: 110 })
    noise({ freq: 600, duration: 0.05, volume: 0.12, start: 0.085 })
  },

  dial_tick() {
    noise({ freq: vary(2400), duration: 0.025, volume: 0.13, q: 3 })
  },

  dial_return(steps = 6) {
    for (let i = 0; i < steps; i++) {
      noise({ freq: vary(2200), duration: 0.02, volume: 0.1, start: i * 0.055, q: 3 })
    }
  },

  phone_pickup() {
    noise({ freq: 500, duration: 0.09, volume: 0.18, filterType: 'lowpass' })
    tone({ freq: 140, type: 'sine', duration: 0.1, volume: 0.1 })
  },

  phone_ring() {
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 14; i++) {
        tone({
          freq: 1050, type: 'sine', duration: 0.02, volume: 0.08,
          start: r * 0.9 + i * 0.028,
        })
      }
    }
  },

  phone_hangup() {
    noise({ freq: 380, duration: 0.14, volume: 0.22, filterType: 'lowpass' })
  },

  quilt_press() {
    noise({ freq: vary(420, 0.25), duration: 0.18, volume: 0.12, filterType: 'lowpass', q: 0.5 })
    tone({ freq: vary(120), type: 'sine', duration: 0.16, volume: 0.07 })
  },

  colour_pop() {
    tone({ freq: vary(620), type: 'sine', duration: 0.1, volume: 0.12, slideTo: vary(1300) })
    noise({ freq: 4200, duration: 0.04, volume: 0.06, start: 0.02 })
  },

  note_written() {
    const steps = [523.25, 659.25, 783.99]
    steps.forEach((f, i) => tone({
      freq: f, type: 'triangle', duration: 0.3, volume: 0.1, start: i * 0.085,
    }))
    RECIPES.pencil_write()
  },

  journal_open() {
    noise({ freq: 1800, duration: 0.3, volume: 0.14, filterType: 'highpass' })
    tone({ freq: 220, type: 'sine', duration: 0.4, volume: 0.07, slideTo: 330 })
  },

  journal_close() {
    noise({ freq: 900, duration: 0.2, volume: 0.14, filterType: 'lowpass' })
    tone({ freq: 300, type: 'sine', duration: 0.3, volume: 0.06, slideTo: 180 })
  },

  door_open() {
    noise({ freq: 320, duration: 0.9, volume: 0.14, filterType: 'lowpass', q: 0.5 })
    tone({ freq: 60, type: 'sine', duration: 0.8, volume: 0.1 })
  },

  transition_whoosh() {
    noise({ freq: 400, duration: 0.7, volume: 0.18, filterType: 'bandpass', q: 0.4 })
    tone({ freq: 180, type: 'sine', duration: 0.6, volume: 0.06, slideTo: 60 })
  },

  reward_chime() {
    ;[659.25, 880, 1174.66].forEach((f, i) => tone({
      freq: f, type: 'sine', duration: 0.5, volume: 0.09, start: i * 0.1,
    }))
  },

  complete_fanfare() {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({
      freq: f, type: 'triangle', duration: 0.8, volume: 0.1, start: i * 0.13,
    }))
  },

  error_buzz() {
    tone({ freq: 180, type: 'sawtooth', duration: 0.18, volume: 0.09 })
    tone({ freq: 172, type: 'sawtooth', duration: 0.18, volume: 0.09, start: 0.02 })
  },
}

/* ---------------------------------------------------------------------------
   Ambience — a slow filtered drone per room, cross-faded on navigation
   --------------------------------------------------------------------------- */

const AMBIENCES = {
  amb_hall:     { freq: 320, q: 0.7, gain: 0.12, lfo: 0.05 },
  amb_indoor:   { freq: 220, q: 0.9, gain: 0.14, lfo: 0.07 },
  amb_workshop: { freq: 480, q: 0.6, gain: 0.10, lfo: 0.11 },
}

function buildAmbience(preset) {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = preset.freq
  filter.Q.value = preset.q

  const gain = ctx.createGain()
  gain.gain.value = 0

  // A very slow LFO on the filter stops the drone from sitting perfectly
  // still, which is the thing that makes looped ambience sound looped.
  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.frequency.value = preset.lfo
  lfoGain.gain.value = preset.freq * 0.25
  lfo.connect(lfoGain)
  lfoGain.connect(filter.frequency)

  src.connect(filter)
  filter.connect(gain)
  gain.connect(ambienceBus)

  src.start()
  lfo.start()

  return { src, gain, lfo, preset }
}

/* --------------------------------------------------------------------------- */

export const $audio = {
  state,

  init() {
    ensureContext()
  },

  /** Must be called from inside a user gesture. */
  async unlock() {
    const context = ensureContext()
    if (!context) return
    if (context.state === 'suspended') {
      try { await context.resume() } catch { /* ignore */ }
    }
    state.unlocked = true
  },

  get context() { return ctx },
  get voiceBus() { return voiceBus },

  setMuted(muted) {
    state.muted = muted
    $store.isMuted = muted
    if (!master) return
    const target = muted ? 0 : 1
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setTargetAtTime(target, ctx.currentTime, 0.25)
  },

  toggleMute() {
    this.setMuted(!state.muted)
    if (!state.muted) this.playSound('ui_click')
    return state.muted
  },

  playSound(name, { volume = 1, delay = 0 } = {}) {
    if (!ctx || state.muted) return
    const recipe = RECIPES[name]
    if (!recipe) return
    const run = () => {
      const prev = sfxBus.gain.value
      sfxBus.gain.value = prev * volume
      try { recipe() } finally { sfxBus.gain.value = prev }
    }
    if (delay) setTimeout(run, delay * 1000)
    else run()
  },

  playAmbience(id, { fade = 2 } = {}) {
    if (!ctx) return
    const preset = AMBIENCES[id]
    if (!preset) return
    if (currentAmbience?.preset === preset) return

    const previous = currentAmbience
    if (previous) {
      previous.gain.gain.setTargetAtTime(0, ctx.currentTime, fade / 3)
      setTimeout(() => {
        try { previous.src.stop(); previous.lfo.stop() } catch { /* already stopped */ }
      }, fade * 1000 + 500)
    }

    currentAmbience = buildAmbience(preset)
    currentAmbience.gain.gain.setTargetAtTime(preset.gain, ctx.currentTime, fade / 3)
    ambienceBus.gain.setTargetAtTime(1, ctx.currentTime, 0.5)
  },

  /** Ducks ambience while a voiceover plays so the narration stays legible. */
  duck(amount = 0.25, time = 0.4) {
    if (!ambienceBus) return
    ambienceBus.gain.setTargetAtTime(amount, ctx.currentTime, time)
  },

  unduck(time = 0.8) {
    if (!ambienceBus) return
    ambienceBus.gain.setTargetAtTime(1, ctx.currentTime, time)
  },

  stopAmbience(fade = 1) {
    if (!currentAmbience) return
    currentAmbience.gain.gain.setTargetAtTime(0, ctx.currentTime, fade / 3)
    const prev = currentAmbience
    currentAmbience = null
    setTimeout(() => {
      try { prev.src.stop(); prev.lfo.stop() } catch { /* already stopped */ }
    }, fade * 1000 + 500)
  },
}
