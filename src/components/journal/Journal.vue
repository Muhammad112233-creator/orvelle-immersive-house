<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import JournalItem from './JournalItem.vue'
import CounterAction from '@/components/ui/CounterAction.vue'
import RectButton from '@/components/ui/RectButton.vue'
import CloseButton from '@/components/ui/CloseButton.vue'
import { journalLines } from '@/content/rooms.js'
import { site, $l, BRAND } from '@/content/site.js'
import { $store, $game } from '@/core/store.js'
import { $audio } from '@/core/audio.js'

/* ---------------------------------------------------------------------------
   The journal.

   A scrollable paper surface rather than a modal list. Entries sit at
   slightly different angles on a sheet of warm stock, taped down, with the
   unwritten ones left as blanks. The counter rides along at the top and turns
   blue on the fifth note.
   --------------------------------------------------------------------------- */

const emit = defineEmits(['complete'])

const router = useRouter()
const scroller = ref(null)
const scrolling = ref(false)
const scrolled = ref(0)
const mounted = ref(false)

const completed = computed(() => $game.isGameCompleted.value)

let scrollTimer = null

function onScroll(e) {
  scrolled.value = e.target.scrollTop
  scrolling.value = true
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => { scrolling.value = false }, 180)
}

function close() {
  $audio.playSound('journal_close')
  $store.isJournalOpen = false
  $game.state.journalOpen = false
}

function goto(roomId) {
  close()
  router.push({ name: 'room', params: { id: roomId } })
}

function onKey(e) { if (e.key === 'Escape') close() }

onMounted(() => {
  requestAnimationFrame(() => { mounted.value = true })
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  clearTimeout(scrollTimer)
})
</script>

<template>
  <section class="manifesto" :class="{ 'is-mounted': mounted, 'is-scrolling': scrolling }">

    <!-- paper -->
    <div class="manifesto__bg">
      <div class="manifesto__bg-color" />
      <div class="manifesto__bg-paper" :style="{ transform: `translateY(${scrolled * -0.06}px)` }" />
      <div class="manifesto__bg-text manifesto__bg-text--top" :style="{ transform: `translateY(${scrolled * -0.18}px)` }">
        {{ BRAND }}
      </div>
      <div class="manifesto__bg-text manifesto__bg-text--bottom" :style="{ transform: `translateY(${scrolled * -0.3}px)` }">
        {{ site.journal.title }}
      </div>
    </div>

    <CloseButton :aria-label="$l('aria.close_journal')" :hidden="false" @click="close" />

    <div class="manifesto__counter">
      <CounterAction @click="emit('complete')" />
    </div>

    <div ref="scroller" class="manifesto__scroll" @scroll="onScroll">
      <div class="manifesto__container">

        <header class="manifesto__header">
          <h2 class="manifesto__title">
            <span class="manifesto__title-bg" />
            <span class="manifesto__title-text">{{ site.journal.title }}</span>
          </h2>
          <p class="manifesto__description" v-html="site.journal.description" />
        </header>

        <div class="manifesto__content">
          <JournalItem
            v-for="(line, i) in journalLines"
            :key="line.id"
            :line="line"
            :index="i"
            :written="$game.has(line.id)"
            @goto="goto"
          />
        </div>

        <footer class="manifesto__footer">
          <template v-if="completed">
            <p class="manifesto__footer-text" v-html="site.journal.reward_0" />
            <RectButton
              :text="$l('end.discover.label')"
              icon="arrow"
              @click="emit('complete')"
            />
          </template>
          <template v-else>
            <p class="manifesto__footer-text">
              {{ $game.remaining.value }} {{ $game.remaining.value === 1 ? 'note' : 'notes' }} still to write.
            </p>
            <RectButton :text="$l('aria.close_journal')" icon="door" @click="close" />
          </template>
        </footer>

        <!-- decorations: drawn, not photographed -->
        <span class="manifesto__decors manifesto__decors--1" />
        <span class="manifesto__decors manifesto__decors--2" />
        <span class="manifesto__decors manifesto__decors--3" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.manifesto {
  position: fixed;
  inset: 0;
  z-index: 9;
  color: #2b2113;
}

/* ---- paper --------------------------------------------------------------- */

.manifesto__bg { position: absolute; inset: 0; overflow: hidden; }
.manifesto__bg-color { position: absolute; inset: 0; background: var(--ui-color-paper); }
.manifesto__bg-paper {
  position: absolute;
  inset: -6%;
  background: url('/images/textures/paper.jpg') center / cover no-repeat;
  mix-blend-mode: multiply;
  opacity: .55;
}
.manifesto__bg-text {
  position: absolute;
  left: 50%;
  font-size: 22vw;
  font-weight: 700;
  letter-spacing: -.02em;
  text-transform: uppercase;
  color: rgba(120, 92, 48, .09);
  white-space: nowrap;
  transform: translateX(-50%);
  pointer-events: none;
}
.manifesto__bg-text--top { top: 2vh; }
.manifesto__bg-text--bottom { bottom: 2vh; }

/* ---- chrome -------------------------------------------------------------- */

.manifesto__counter {
  position: absolute;
  top: calc(var(--header-height) + 2em);
  right: 2em;
  z-index: 4;
}
.manifesto__counter :deep(.counter-action__button) { transform: rotate(-5deg); border-radius: .1em; }

/* ---- scroller ------------------------------------------------------------ */

.manifesto__scroll {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 92, 48, .4) transparent;
}
.manifesto__scroll::-webkit-scrollbar { width: 6px; }
.manifesto__scroll::-webkit-scrollbar-thumb { background: rgba(120, 92, 48, .4); border-radius: 3px; }

.manifesto__container {
  position: relative;
  width: min(108em, 90vw);
  padding: 14em 0 10em;
  margin: 0 auto;
}

/* ---- header -------------------------------------------------------------- */

.manifesto__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4em;
  margin-bottom: 4em;
  text-align: center;
  opacity: 0;
  transform: translateY(2em);
  transition: opacity .9s .15s var(--ease-out-quint), transform 1.1s .15s var(--ease-out-expo);
}
.is-mounted .manifesto__header { opacity: 1; transform: none; }

.manifesto__title { position: relative; display: inline-block; padding: .1em .5em; }
.manifesto__title-bg {
  position: absolute;
  inset: 0;
  background: var(--ui-color-bg-primary);
  transform: rotate(-1.6deg);
}
.manifesto__title-text {
  position: relative;
  font-size: 7em;
  font-weight: 700;
  letter-spacing: -.01em;
  text-transform: uppercase;
  color: var(--ui-color-paper);
}

.manifesto__description {
  max-width: 28em;
  font-size: 1.7em;
  line-height: 1.5;
  color: rgba(50, 38, 22, .8);
}
.manifesto__description :deep(strong) { color: var(--ui-color-blue); font-weight: 700; }

/* ---- content ------------------------------------------------------------- */

.manifesto__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 2em;
}
.manifesto__content > * {
  opacity: 0;
  transform: translateY(3em);
  transition: opacity .8s var(--ease-out-quint), transform 1s var(--ease-out-expo);
}
.is-mounted .manifesto__content > * { opacity: 1; transform: translateY(0) rotate(var(--tilt)); }
.is-mounted .manifesto__content > *:nth-child(1) { transition-delay: .18s; }
.is-mounted .manifesto__content > *:nth-child(2) { transition-delay: .26s; }
.is-mounted .manifesto__content > *:nth-child(3) { transition-delay: .34s; }
.is-mounted .manifesto__content > *:nth-child(4) { transition-delay: .42s; }
.is-mounted .manifesto__content > *:nth-child(5) { transition-delay: .50s; }

/* a hand-ruled divider between entries */
.manifesto__content > * + * { border-top: 1px dashed rgba(120, 92, 48, .3); }

/* ---- footer -------------------------------------------------------------- */

.manifesto__footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.8em;
  padding-top: 5em;
  text-align: center;
}
.manifesto__footer-text {
  max-width: 26em;
  font-size: 1.8em;
  line-height: 1.45;
  color: rgba(50, 38, 22, .85);
}
.manifesto__footer-text :deep(strong) { color: var(--ui-color-blue); font-weight: 700; }

/* ---- decorations --------------------------------------------------------- */

.manifesto__decors {
  position: absolute;
  z-index: 1;
  pointer-events: none;
  opacity: .5;
}
.manifesto__decors--1 {
  top: 10%; right: -6%;
  width: 18em; height: 18em;
  border: 2px dashed rgba(120, 92, 48, .3);
  border-radius: 50%;
  transform: rotate(14deg);
}
.manifesto__decors--2 {
  top: 44%; left: -8%;
  width: 22em; height: 12em;
  background: repeating-linear-gradient(-14deg, rgba(120, 92, 48, .16) 0 1px, transparent 1px 11px);
  transform: rotate(-8deg);
}
.manifesto__decors--3 {
  right: 2%; bottom: 14%;
  width: 14em; height: 14em;
  border: 2px solid rgba(38, 90, 223, .2);
  transform: rotate(-22deg);
}

@media (max-width: 1023px) {
  .manifesto__container { width: 88vw; padding: 12em 0 8em; }
  .manifesto__title-text { font-size: 4.4em; }
  .manifesto__counter { right: 1.4em; }
  .manifesto__decors { display: none; }
}
</style>
