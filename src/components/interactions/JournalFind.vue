<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ActionWrapper from './ActionWrapper.vue'
import RectButton from '@/components/ui/RectButton.vue'
import { site, $l } from '@/content/site.js'
import { $audio } from '@/core/audio.js'
import { $voiceover } from '@/core/voiceover.js'
import { TOTAL_LINES } from '@/content/rooms.js'
import { asset } from '@/core/asset.js'

/* ---------------------------------------------------------------------------
   The journal, found.

   Chapter one of the house. The book is presented closed, then opens on a
   hinge and the narration writes the first line onto the page a word at a
   time while the subtitles run underneath. The handwriting appears by
   un-blurring and settling rather than typing, which reads as ink drying
   rather than as a terminal.
   --------------------------------------------------------------------------- */

const emit = defineEmits(['complete', 'close'])

const STAGE = { FOUND: 'found', OPENING: 'opening', WRITING: 'writing', DONE: 'done' }
const stage = ref(STAGE.FOUND)
const writtenWords = ref([])
const firstLine = site.journal.lines.title_1

let cancelled = false

async function open() {
  if (stage.value !== STAGE.FOUND) return
  stage.value = STAGE.OPENING
  $audio.playSound('journal_open')
  await wait(1200)
  if (cancelled) return

  stage.value = STAGE.WRITING

  // Narration and handwriting run together, not one after the other.
  const narration = $voiceover.play('intro')
  await writeLine(firstLine)
  await narration
  if (cancelled) return

  $audio.playSound('stamp')
  stage.value = STAGE.DONE
}

async function writeLine(line) {
  const words = line.split(' ')
  for (let i = 0; i < words.length; i++) {
    if (cancelled) return
    writtenWords.value = words.slice(0, i + 1)
    $audio.playSound('pencil_write', { volume: 0.3 })
    await wait(210 + words[i].length * 22)
  }
}

function finish() {
  emit('complete', 'journal')
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

onMounted(() => { setTimeout(open, 900) })
onBeforeUnmount(() => { cancelled = true })
</script>

<template>
  <ActionWrapper
    class="journal-find"
    colour="#0c0f60"
    :dim="0.9"
    :closable="stage !== 'writing'"
    @close="emit('close')"
  >
    <div class="journal-find__inner" :class="`is-${stage}`">

      <header class="journal-find__heading">
        <span class="journal-find__eyebrow">{{ $l('notebook.title') }}</span>
        <h2 class="journal-find__title">{{ $l('notebook.subtitle') }}</h2>
      </header>

      <div class="journal-find__book" @click="open">
        <!-- back cover / spread -->
        <div class="journal-find__spread">
          <div class="journal-find__page journal-find__page--left">
            <span class="journal-find__rule" v-for="n in 7" :key="`l${n}`" />
          </div>
          <div class="journal-find__page journal-find__page--right">
            <span class="journal-find__rule" v-for="n in 7" :key="`r${n}`" />
            <p class="journal-find__handwriting">
              <span
                v-for="(word, i) in writtenWords"
                :key="i"
                class="journal-find__word"
                :style="{ '--i': i }"
              >{{ word }}</span>
            </p>
            <span class="journal-find__number">01</span>
          </div>
        </div>

        <!-- front cover, hinged on its left edge -->
        <div class="journal-find__cover">
          <img :src="asset('images/journal/cover-cut.png')" alt="" aria-hidden="true">
          <span class="journal-find__cover-shine" />
        </div>
      </div>

      <Transition name="cta">
        <RectButton
          v-if="stage === 'found'"
          class="journal-find__cta"
          icon="journal"
          :text="$l('tuto.btn.journal')"
          @click="open"
        />
      </Transition>

      <Transition name="cta">
        <div v-if="stage === 'done'" class="journal-find__outro">
          <p
            class="journal-find__outro-text"
            v-html="$l('tuto.text.reward', { number: TOTAL_LINES - 1 })"
          />
          <RectButton :text="$l('tuto.btn.reward')" icon="arrow" @click="finish" />
        </div>
      </Transition>

    </div>
  </ActionWrapper>
</template>

<style scoped>
.journal-find__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.6em;
  width: 100%;
  max-width: 78em;
}

/* ---- heading ------------------------------------------------------------- */

.journal-find__heading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .6em;
  text-align: center;
  transform: rotate(-1deg);
  transition: opacity .7s ease, transform .9s var(--ease-out-quint);
}
.is-writing .journal-find__heading,
.is-done .journal-find__heading { opacity: 0; transform: translateY(-2em) rotate(-1deg); }

.journal-find__eyebrow {
  font-family: 'SometypeMono', monospace;
  font-size: 1.3em;
  letter-spacing: .3em;
  text-transform: uppercase;
  color: var(--ui-color-yellow);
}
.journal-find__title {
  font-size: 4.4em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .01em;
  color: #fff;
}

/* ---- book ---------------------------------------------------------------- */

.journal-find__book {
  position: relative;
  width: min(62em, 86vw);
  aspect-ratio: 16 / 10;
  cursor: pointer;
  perspective: 180em;
  transform: rotate(-1.4deg);
}
.is-writing .journal-find__book,
.is-done .journal-find__book { cursor: default; }

.journal-find__spread {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--ui-color-paper);
  border-radius: .3em;
  box-shadow:
    0 3em 8em rgba(0, 0, 0, .65),
    inset 0 0 6em rgba(145, 110, 60, .18);
  opacity: 0;
  transform: scale(.96);
  transition: opacity .5s .35s ease, transform 1s .35s var(--ease-out-expo);
}
.is-opening .journal-find__spread,
.is-writing .journal-find__spread,
.is-done .journal-find__spread { opacity: 1; transform: scale(1); }

/* the gutter shadow down the middle of the spread */
.journal-find__spread::after {
  position: absolute;
  top: 0; bottom: 0; left: 50%;
  width: 7em;
  content: '';
  background: radial-gradient(ellipse at center, rgba(90, 60, 20, .3), transparent 72%);
  transform: translateX(-50%);
  pointer-events: none;
}

.journal-find__page {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2.4em;
  padding: 3.6em 3em;
  overflow: hidden;
}
.journal-find__rule {
  display: block;
  height: 1px;
  background: rgba(120, 90, 50, .22);
}
.journal-find__page--left .journal-find__rule:nth-child(odd) { opacity: .6; }

.journal-find__handwriting {
  position: absolute;
  top: 50%; left: 3em; right: 3em;
  display: flex;
  flex-wrap: wrap;
  gap: .22em .34em;
  font-family: 'Marginalia', cursive;
  font-size: 3.4em;
  line-height: 1.12;
  color: #22317a;
  transform: translateY(-50%) rotate(-1.6deg);
}
.journal-find__word {
  display: inline-block;
  animation: ink-settle .5s var(--ease-out-quint) both;
}
@keyframes ink-settle {
  from { opacity: 0; filter: blur(5px); transform: translateY(.14em) rotate(2deg); }
  to   { opacity: 1; filter: blur(0);   transform: none; }
}

.journal-find__number {
  position: absolute;
  right: 2.2em; bottom: 1.6em;
  font-family: 'SometypeMono', monospace;
  font-size: 1.3em;
  color: rgba(100, 75, 40, .5);
}

/* ---- cover --------------------------------------------------------------- */

.journal-find__cover {
  position: absolute;
  top: 0; left: 50%;
  width: 50%;
  height: 100%;
  overflow: hidden;
  background: #1b2168;
  border-radius: .3em;
  box-shadow: 0 3em 8em rgba(0, 0, 0, .7);
  transform-origin: left center;
  transform: rotateY(0deg);
  transition: transform 1.25s var(--ease-in-out-quart), box-shadow 1.25s ease;
  backface-visibility: hidden;
}
.journal-find__cover img {
  width: 100%; height: 100%;
  object-fit: cover;
  object-position: center;
}
.journal-find__cover-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, rgba(255, 255, 255, .22), transparent 42%);
  pointer-events: none;
}
.is-opening .journal-find__cover,
.is-writing .journal-find__cover,
.is-done .journal-find__cover {
  transform: rotateY(-168deg);
  box-shadow: 0 1em 3em rgba(0, 0, 0, .4);
}

/* the closed book sits centred, not off to the right */
.is-found .journal-find__cover { left: 25%; }

/* ---- footers ------------------------------------------------------------- */

.journal-find__outro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.6em;
  text-align: center;
}
.journal-find__outro-text {
  max-width: 24em;
  font-size: 1.7em;
  line-height: 1.4;
  color: #fff;
}
.journal-find__outro-text :deep(strong) { color: var(--ui-color-yellow); font-weight: 700; }

.cta-enter-active { transition: opacity .6s .2s ease, transform .8s .2s var(--ease-out-expo); }
.cta-leave-active { transition: opacity .25s ease; position: absolute; }
.cta-enter-from { opacity: 0; transform: translateY(1.6em); }
.cta-leave-to { opacity: 0; }

@media (max-width: 767px) {
  .journal-find__title { font-size: 3em; }
  .journal-find__book { aspect-ratio: 1 / 1; }
  .journal-find__handwriting { font-size: 2.2em; left: 1.4em; right: 1.4em; }
  .journal-find__page { padding: 2em 1.4em; gap: 1.4em; }
}
</style>
