<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import WebglCanvas from '@/components/room/WebglCanvas.vue'
import ButtonSound from '@/components/ui/ButtonSound.vue'
import ButtonJournal from '@/components/ui/ButtonJournal.vue'
import VoiceoverSubtitles from '@/components/ui/VoiceoverSubtitles.vue'
import Journal from '@/components/journal/Journal.vue'
import EndPage from '@/components/end/EndPage.vue'
import { initPreloader } from '@/core/preloader.js'
import { $store, $game } from '@/core/store.js'
import { $audio } from '@/core/audio.js'
import { $voiceover } from '@/core/voiceover.js'
import { $webgl } from '@/core/webgl/index.js'
import { rooms, ROOM_IDS } from '@/content/rooms.js'
import { asset } from '@/core/asset.js'

/* ---------------------------------------------------------------------------
   App shell.

   Owns the preloader hand-off, the persistent chrome (sound, journal) and the
   two full-screen overlays. Views slot in between.
   --------------------------------------------------------------------------- */

const router = useRouter()
const ready = ref(false)
const unread = ref(0)

const showChrome = computed(() =>
  ready.value && !$store.isEndPageOpen && !$store.isTransitioning)

const uiClasses = computed(() => ({
  'ui-hidden': $store.uiHidden,
  'is-journal-open': $store.isJournalOpen,
  'is-interaction-open': $store.isInteractionOpen,
}))

/* Count notes written while the journal was shut, so the badge means
   "there is something new in here" rather than just "you have notes". */
watch($game.count, (next, prev) => {
  if (next > (prev ?? 0) && !$store.isJournalOpen) unread.value += next - (prev ?? 0)
})
watch(() => $store.isJournalOpen, (open) => { if (open) unread.value = 0 })

/* Preload the room textures behind the preloader so entering is instant. */
async function warmUp(onProgress) {
  const jobs = ROOM_IDS.map((id) => ({ id, src: asset(`images/rooms/${id}.jpg`), tint: rooms[id].tint }))
  let done = 0
  await Promise.all(jobs.map(async (job) => {
    try {
      await $webgl.loadRoom(job.id, job)
    } catch {
      /* a missing room should not trap the visitor on the preloader */
    }
    done += 1
    onProgress(done / jobs.length)
  }))
}

onMounted(async () => {
  $audio.init()
  const preloader = initPreloader()

  // The facade image is what you see first, so it gets its own wait.
  const facade = new Image()
  facade.src = asset('images/facade.jpg')

  await warmUp((p) => {
    $store.loadProgress = p
    preloader.setProgress(p * 0.9)
  })

  await new Promise((resolve) => {
    if (facade.complete) return resolve()
    facade.onload = facade.onerror = resolve
  })

  preloader.setProgress(1)
  await preloader.ready

  // First real gesture: unlock audio and turn the sound on, since the
  // preloader asked for it.
  await $audio.unlock()
  $audio.setMuted(false)
  $voiceover.preloadMany(['intro'])

  ready.value = true
  $store.isReady = true
  $store.isEntered = true

  await preloader.dismiss()
  $webgl.reveal({ duration: 1.2 })
})

function openEndPage() {
  $store.isJournalOpen = false
  $store.isEndPageOpen = true
  $store.fromHome = router.currentRoute.value.name === 'home'
}
</script>

<template>
  <WebglCanvas />

  <div class="ui" :class="uiClasses">
    <RouterView v-slot="{ Component }">
      <Transition name="view" mode="out-in">
        <component :is="Component" v-if="ready" />
      </Transition>
    </RouterView>

    <Transition name="fade">
      <ButtonSound v-if="showChrome" />
    </Transition>

    <Transition name="fade">
      <ButtonJournal v-if="showChrome && $store.isEntered" :unread="unread" />
    </Transition>

    <VoiceoverSubtitles />

    <Transition name="journal">
      <Journal v-if="$store.isJournalOpen" @complete="openEndPage" />
    </Transition>

    <Transition name="end">
      <EndPage v-if="$store.isEndPageOpen" @close="$store.isEndPageOpen = false" />
    </Transition>
  </div>
</template>

<style scoped>
.view-enter-active { transition: opacity .8s var(--ease-out-quint); }
.view-leave-active { transition: opacity .45s ease; }
.view-enter-from,
.view-leave-to { opacity: 0; }

.journal-enter-active { transition: opacity .5s ease; }
.journal-leave-active { transition: opacity .4s ease .1s; }
.journal-enter-from,
.journal-leave-to { opacity: 0; }

.end-enter-active { transition: opacity .9s var(--ease-out-quint); }
.end-leave-active { transition: opacity .5s ease; }
.end-enter-from,
.end-leave-to { opacity: 0; }
</style>
