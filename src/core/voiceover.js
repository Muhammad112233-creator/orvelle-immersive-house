import { reactive } from 'vue'
import { Howl, Howler } from 'howler'
import { voiceovers, VO_BASE } from '@/content/voiceover.js'
import { $audio } from './audio.js'
import { $store } from './store.js'
import { asset } from '@/core/asset.js'

/* ---------------------------------------------------------------------------
   Narration + subtitles.

   Each recording carries its own subtitle cues. Rather than ship .srt files
   and parse them, the cue list is split across the clip's real duration once
   the audio reports it — a clip with three cues of 6 / 6 / 37 characters
   shows them for the same proportion of its runtime.

   If a recording is missing the subtitle track still runs on an estimated
   reading duration, so the experience degrades to a silent-film version
   rather than stalling.
   --------------------------------------------------------------------------- */

const READING_CPS = 13.5          // characters per second, unhurried
const MIN_CUE = 0.9               // never flash a cue faster than this

const state = reactive({
  current: null,       // active voiceover id
  subtitle: '',        // text currently on screen
  visible: false,
  playing: false,
})

const cache = new Map()
const resolved = new Map()        // id -> true/false once we know a file loads

let cueTimers = []
let activeHowl = null
let finishResolve = null

function clearTimers() {
  cueTimers.forEach(clearTimeout)
  cueTimers = []
}

function plainLength(text) {
  return text.replace(/<[^>]+>/g, '').length
}

/** Distributes `duration` across the cues in proportion to their length. */
function scheduleCues(cues, duration) {
  clearTimers()
  if (!cues.length) return

  const weights = cues.map((c) => Math.max(plainLength(c), 6))
  const total = weights.reduce((a, b) => a + b, 0)

  let offset = 0
  cues.forEach((cue, i) => {
    const share = Math.max((weights[i] / total) * duration, MIN_CUE)
    const at = offset
    cueTimers.push(setTimeout(() => {
      state.subtitle = cue
      state.visible = $store.subtitlesEnabled
    }, at * 1000))
    offset += share
  })

  cueTimers.push(setTimeout(() => {
    state.visible = false
    state.subtitle = ''
  }, duration * 1000 + 250))
}

function estimateDuration(cues) {
  const chars = cues.reduce((n, c) => n + plainLength(c), 0)
  return Math.max(chars / READING_CPS, 1.4)
}

function load(id) {
  if (cache.has(id)) return cache.get(id)
  const entry = voiceovers[id]
  if (!entry) return null

  const howl = new Howl({
    src: [asset(VO_BASE + entry.file)],
    html5: false,
    preload: true,
    volume: 1,
    onloaderror: () => resolved.set(id, false),
    onload: () => resolved.set(id, true),
  })

  cache.set(id, howl)
  return howl
}

export const $voiceover = {
  state,

  preload(id) {
    load(id)
  },

  preloadMany(ids) {
    ids.forEach((id) => load(id))
  },

  /**
   * Plays a voiceover and resolves when it finishes (or is interrupted).
   * Subtitles run even when the sound is muted — the reference does the same,
   * and it is the only way a muted first-time visitor gets the story.
   */
  play(id, { subtitlesOnly = false } = {}) {
    const entry = voiceovers[id]
    if (!entry) return Promise.resolve()

    this.stop()

    state.current = id
    state.playing = true

    return new Promise((resolve) => {
      finishResolve = resolve

      const finish = () => {
        if (state.current !== id) return
        state.playing = false
        state.visible = false
        state.subtitle = ''
        $audio.unduck()
        activeHowl = null
        const done = finishResolve
        finishResolve = null
        done?.()
      }

      const runSilent = () => {
        const duration = estimateDuration(entry.cues)
        scheduleCues(entry.cues, duration)
        cueTimers.push(setTimeout(finish, duration * 1000 + 300))
      }

      if (subtitlesOnly || $audio.state.muted) {
        runSilent()
        return
      }

      const howl = load(id)
      if (!howl) { runSilent(); return }

      const start = () => {
        const duration = howl.duration() || estimateDuration(entry.cues)
        scheduleCues(entry.cues, duration)
        $audio.duck()
        activeHowl = howl
        howl.off('end')
        howl.once('end', finish)
        howl.play()
      }

      if (howl.state() === 'loaded') {
        start()
      } else if (resolved.get(id) === false) {
        runSilent()
      } else {
        howl.once('load', start)
        howl.once('loaderror', runSilent)
        // Don't let a stalled request hold the sequence hostage.
        cueTimers.push(setTimeout(() => {
          if (howl.state() !== 'loaded' && state.current === id && !activeHowl) runSilent()
        }, 2500))
      }
    })
  },

  /** Chains several voiceovers back to back. */
  async sequence(ids, { gap = 0.25 } = {}) {
    for (const id of ids) {
      await this.play(id)
      if (gap) await new Promise((r) => setTimeout(r, gap * 1000))
    }
  },

  stop() {
    clearTimers()
    if (activeHowl) {
      activeHowl.off('end')
      activeHowl.stop()
      activeHowl = null
    }
    if (finishResolve) {
      const done = finishResolve
      finishResolve = null
      done()
    }
    state.current = null
    state.playing = false
    state.visible = false
    state.subtitle = ''
    $audio.unduck()
  },

  setGlobalVolume(v) {
    Howler.volume(v)
  },
}