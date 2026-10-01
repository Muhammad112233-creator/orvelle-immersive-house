<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RoomHeader from '@/components/room/RoomHeader.vue'
import Hotspot from '@/components/room/Hotspot.vue'
import EnterExitButton from '@/components/room/EnterExitButton.vue'
import Tuto from '@/components/ui/Tuto.vue'
import InfoModale from '@/components/ui/InfoModale.vue'
import InfoModaleOverlay from '@/components/ui/InfoModaleOverlay.vue'
import { rooms, interactions, TOTAL_LINES } from '@/content/rooms.js'
import { $l, site } from '@/content/site.js'
import { $store, $game } from '@/core/store.js'
import { $audio } from '@/core/audio.js'
import { $voiceover } from '@/core/voiceover.js'
import { $webgl } from '@/core/webgl/index.js'
import { device } from '@/core/device.js'
import { asset } from '@/core/asset.js'

/* ---------------------------------------------------------------------------
   Inside a room.

   The WebGL panorama renders underneath; everything here is DOM sitting on
   top of it. Each interaction is its own lazily-loaded component so a visitor
   who never picks up the telephone never downloads it.
   --------------------------------------------------------------------------- */

const INTERACTION_COMPONENTS = {
  JournalFind: defineAsyncComponent(() => import('@/components/interactions/JournalFind.vue')),
  Stereoscope: defineAsyncComponent(() => import('@/components/interactions/Stereoscope.vue')),
  Telephone:   defineAsyncComponent(() => import('@/components/interactions/Telephone.vue')),
  Quilt:       defineAsyncComponent(() => import('@/components/interactions/Quilt.vue')),
  Colours:     defineAsyncComponent(() => import('@/components/interactions/Colours.vue')),
  Product:     defineAsyncComponent(() => import('@/components/interactions/Product.vue')),
}

const route = useRoute()
const router = useRouter()

const roomId = computed(() => route.params.id)
const room = computed(() => rooms[roomId.value])

const mounted = ref(false)
const loadingHotspot = ref(null)
const openInteraction = ref(null)
const reward = ref(null)
const tutoVisible = ref(false)
const tutoText = ref('')

const roomCompleted = computed(() => $game.roomCompleted(roomId.value))
const activeComponent = computed(() =>
  openInteraction.value ? INTERACTION_COMPONENTS[interactions[openInteraction.value].component] : null)

const hotspotList = computed(() => Object.entries(room.value?.points || {}).map(([id, point]) => ({
  id,
  point,
  status: $game.statusFor(id),
  icon: point.iconID || null,
})))

/* ---------------------------------------------------------------------- setup */

async function mountRoom(id) {
  const config = rooms[id]
  if (!config) return

  $store.currentRoom = id
  mounted.value = false

  await $webgl.loadRoom(id, { src: asset(`images/rooms/${id}.jpg`), tint: config.tint })
  $webgl.registerPoints(config.points)

  const fromHome = !$webgl.currentRoomId
  if (fromHome) {
    $webgl.setActiveRoom(id)
    await $webgl.reveal({ duration: 1.1 })
  } else if ($webgl.currentRoomId !== id) {
    await $webgl.transitionTo(id, { colour: '#07081a' })
  } else {
    $webgl.setActiveRoom(id)
  }

  $audio.playAmbience(config.ambience)
  $store.isTransitioning = false
  mounted.value = true

  maybeShowTuto(id)
}

/* The vestibule nudges a first-time visitor toward the journal; every other
   room trusts the pulsing hotspots to do the work. */
function maybeShowTuto(id) {
  if (id !== 'vestibule' || $game.has(1) || $game.seenTutorials.has('start')) return
  $game.seenTutorials.add('start')
  tutoText.value = site.tuto.text.start
  tutoVisible.value = true
  setTimeout(() => { tutoVisible.value = false }, 6500)
}

/* ------------------------------------------------------------- interactions */

async function onHotspot(id) {
  if (openInteraction.value) return
  loadingHotspot.value = id
  $webgl.focusPoint(id, 0.9)

  // Give the focus push a beat to land before the panel covers the room.
  await new Promise((r) => setTimeout(r, 420))

  tutoVisible.value = false
  openInteraction.value = id
  $store.isInteractionOpen = true
  $store.activeInteraction = id
  loadingHotspot.value = null
}

function closeInteraction() {
  const id = openInteraction.value
  openInteraction.value = null
  $store.isInteractionOpen = false
  $store.activeInteraction = null
  $webgl.releaseFocus()
  $voiceover.stop()
  $audio.playSound('ui_back')
  return id
}

/** An interaction reports it has earned its journal line. */
function onInteractionComplete(sourceId) {
  const line = $game.lineFor(sourceId)
  if (!line) return
  const isNew = $game.write(line.id)
  if (!isNew) return

  $audio.playSound('note_written')

  const remaining = TOTAL_LINES - $game.count.value
  reward.value = {
    text: $l(`journal.reward_${Math.min(remaining, 4)}`),
    remaining,
    completed: remaining === 0,
  }
}

function dismissReward() {
  const done = reward.value?.completed
  reward.value = null
  closeInteraction()

  if (done) {
    $audio.playSound('complete_fanfare')
    $store.isJournalOpen = true
    $game.state.journalOpen = true
  }
}

/* ---------------------------------------------------------------- navigation */

function nextRoom() {
  const next = room.value?.next
  if (next) {
    $store.isTransitioning = true
    router.push({ name: 'room', params: { id: next } })
  } else {
    router.push({ name: 'home' })
  }
}

const exitLabel = computed(() => (room.value?.next ? $l('global.explore') : 'Back outside'))

/* --------------------------------------------------------------- lifecycle */

watch(roomId, (id) => { if (id) mountRoom(id) })

function onKey(e) {
  if (e.key === 'Escape' && openInteraction.value && !reward.value) closeInteraction()
}

onMounted(() => {
  mountRoom(roomId.value)
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  $voiceover.stop()
  $store.isInteractionOpen = false
})
</script>

<template>
  <div class="view view-room" :class="[`view-room--${roomId}`, { 'is-mounted': mounted }]">
    <Transition name="header">
      <RoomHeader v-if="mounted && !openInteraction" :room="room" @counter="$store.isJournalOpen = true" />
    </Transition>

    <!-- hotspots live above the canvas and are positioned by it -->
    <TransitionGroup name="hotspot">
      <Hotspot
        v-for="spot in hotspotList"
        v-show="mounted && !openInteraction"
        :key="spot.id"
        :id="spot.id"
        :name="`${roomId}-${spot.id}`"
        :status="spot.status"
        :custom-icon="spot.icon"
        :loading="loadingHotspot === spot.id"
        @click="onHotspot"
      />
    </TransitionGroup>

    <Transition name="cta">
      <EnterExitButton
        v-if="mounted && !openInteraction"
        :text="exitLabel"
        :room-completed="roomCompleted"
        @click="nextRoom"
      />
    </Transition>

    <Transition name="fade">
      <Tuto v-if="tutoVisible" :text="tutoText" />
    </Transition>

    <!-- interaction layer -->
    <Transition name="interaction">
      <component
        :is="activeComponent"
        v-if="activeComponent"
        :key="openInteraction"
        :source="openInteraction"
        :room="roomId"
        @complete="onInteractionComplete"
        @close="closeInteraction"
      />
    </Transition>

    <!-- reward -->
    <Transition name="fade">
      <InfoModaleOverlay v-if="reward" />
    </Transition>
    <Transition name="modale">
      <InfoModale
        v-if="reward"
        type="rewardType"
        :text="reward.text"
        :button-label="reward.completed ? $l('journal.reward_journal') : $l('journal.reward_button')"
        @action="dismissReward"
      />
    </Transition>
  </div>
</template>

<style scoped>
.view-room { position: fixed; inset: 0; z-index: 1; }

/* room header drops in from above */
.header-enter-from { transform: translateY(-5em); opacity: 0; }
.header-enter-active { transition: transform 1.5s cubic-bezier(.19, 1.51, .29, .99), opacity .8s ease; }
.header-leave-active { transition: opacity .3s ease; }
.header-leave-to { opacity: 0; }

/* exit CTA arrives from below with a little overshoot */
.cta-enter-from { transform: translateY(calc(100% + 6em)) rotate(10deg); opacity: 0; }
.cta-enter-active { transition: transform 1.5s .2s cubic-bezier(.19, 1.51, .29, .99), opacity .6s .2s ease; }
.cta-leave-active { transition: opacity .3s ease; }
.cta-leave-to { opacity: 0; }

.hotspot-enter-from { opacity: 0; }
.hotspot-enter-active { transition: opacity .5s cubic-bezier(.36, .07, .19, .97); }
.hotspot-leave-active { transition: opacity .1s cubic-bezier(.36, .07, .19, .97); }
.hotspot-leave-to { opacity: 0; }

.interaction-enter-active { transition: opacity .55s var(--ease-out-quint); }
.interaction-leave-active { transition: opacity .4s ease; }
.interaction-enter-from,
.interaction-leave-to { opacity: 0; }

.modale-enter-from { transform: translateY(calc(100% + 5em)); }
.modale-enter-active { transition: transform 1.3s cubic-bezier(.19, 1.51, .29, .99); }
.modale-leave-active { transition: transform .5s cubic-bezier(.36, .07, .19, .97); }
.modale-leave-to { transform: translateY(calc(100% + 5em)); }
</style>
