import { reactive, computed, ref } from 'vue'
import { TOTAL_LINES, journalLines, rooms } from '@/content/rooms.js'

/* ---------------------------------------------------------------------------
   $store — transient UI state (what is open, what is muted).
   $game  — durable progress (which lines are written), persisted to
            localStorage so a refresh mid-house doesn't wipe the journal.
   --------------------------------------------------------------------------- */

const STORAGE_KEY = 'orvelle.progress.v1'

export const $store = reactive({
  isReady: false,          // preloader dismissed, app visible
  isEntered: false,        // user pressed Enter
  isMuted: true,           // autoplay policy: start muted, unlock on gesture
  isJournalOpen: false,
  isEndPageOpen: false,
  isInteractionOpen: false,
  isProductOpen: false,
  isVideoOpen: false,
  fromHome: false,
  currentRoom: null,
  activeInteraction: null,
  uiHidden: false,
  isTransitioning: false,
  loadProgress: 0,
  subtitlesEnabled: true,
})

/* ---------------------------------------------------------------------------
   Progress
   --------------------------------------------------------------------------- */

function readProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((n) => Number.isInteger(n)) : []
  } catch {
    return []
  }
}

const written = ref(readProgress())
const seenTutorials = reactive(new Set())

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(written.value))
  } catch {
    /* private browsing — progress simply won't survive a reload */
  }
}

export const $game = {
  state: reactive({
    journalOpen: false,
    rewardVisible: false,
    rewardLine: null,
    tutorialStep: 0,
    hasStarted: false,
  }),

  written,
  seenTutorials,

  count: computed(() => written.value.length),
  remaining: computed(() => TOTAL_LINES - written.value.length),
  isGameCompleted: computed(() => written.value.length >= TOTAL_LINES),

  has(lineId) {
    return written.value.includes(lineId)
  },

  /** Writes a line and returns true only the first time it is written. */
  write(lineId) {
    if (!lineId || written.value.includes(lineId)) return false
    written.value = [...written.value, lineId].sort((a, b) => a - b)
    persist()
    return true
  },

  lineFor(sourceId) {
    return journalLines.find((l) => l.source === sourceId) || null
  },

  /** Hotspot status drives the pencil / tick icon swap. */
  statusFor(sourceId) {
    const line = journalLines.find((l) => l.source === sourceId)
    if (!line) return 'idle'
    return written.value.includes(line.id) ? 'done' : 'idle'
  },

  roomCompleted(roomId) {
    const ids = journalLines.filter((l) => l.room === roomId).map((l) => l.id)
    return ids.length > 0 && ids.every((id) => written.value.includes(id))
  },

  /** The next room that still has an unwritten note, for the reward redirect. */
  nextIncompleteRoom(fromRoom) {
    const order = Object.values(rooms).sort((a, b) => a.index - b.index)
    const startIndex = rooms[fromRoom]?.index ?? -1
    const rotated = [...order.slice(startIndex + 1), ...order.slice(0, startIndex + 1)]
    return rotated.find((r) => !this.roomCompleted(r.id))?.id || null
  },

  reset() {
    written.value = []
    seenTutorials.clear()
    persist()
  },
}

if (typeof window !== 'undefined') {
  // Handy during review: orvelle.reset() in the console clears the journal.
  window.orvelle = {
    reset: () => { $game.reset(); location.reload() },
    complete: () => { journalLines.forEach((l) => $game.write(l.id)) },
  }
}
