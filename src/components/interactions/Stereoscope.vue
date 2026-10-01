<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import ActionWrapper from './ActionWrapper.vue'
import RectButton from '@/components/ui/RectButton.vue'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import { site, $l } from '@/content/site.js'
import { $audio } from '@/core/audio.js'
import { $voiceover } from '@/core/voiceover.js'
import { device } from '@/core/device.js'
import { asset } from '@/core/asset.js'

/* ---------------------------------------------------------------------------
   The stereoscope.

   Five slides on a reel. Pulling the lever rotates the reel one stop, the
   shutter blacks out for a frame, and the next slide drops in — the left and
   right eyepieces show the same photograph offset by a few pixels, which is
   what gives a real viewer its depth. Each slide carries one line of
   narration; the fifth writes the journal line.
   --------------------------------------------------------------------------- */

const emit = defineEmits(['complete', 'close'])

const SLIDES = [
  { src: 'images/viewer/slide-1.jpg', vo: 'viewer_1' },
  { src: 'images/viewer/slide-2.jpg', vo: 'viewer_2' },
  { src: 'images/viewer/slide-3.jpg', vo: 'viewer_3' },
  { src: 'images/viewer/slide-4.jpg', vo: 'viewer_4' },
  { src: 'images/viewer/slide-5.jpg', vo: 'viewer_5' },
]

const index = ref(0)
const shuttering = ref(false)
const reelAngle = ref(0)
const started = ref(false)
const finished = ref(false)
const leverPulled = ref(false)

const slide = computed(() => SLIDES[index.value])
const progress = computed(() => ((index.value + 1) / SLIDES.length) * 100)
const isLast = computed(() => index.value === SLIDES.length - 1)
const tutoText = computed(() =>
  device.isTouch ? site.viewer.tuto.text_mobile : site.viewer.tuto.text)

let busy = false
let cancelled = false

async function advance() {
  if (busy || cancelled) return
  busy = true

  if (!started.value) {
    // First pull just reveals slide one.
    started.value = true
    pullLever()
    $audio.playSound('viewer_advance')
    await wait(380)
    await playCurrent()
    busy = false
    return
  }

  if (isLast.value) { busy = false; return }

  pullLever()
  $audio.playSound('viewer_advance')
  shuttering.value = true
  reelAngle.value += 360 / SLIDES.length

  await wait(230)
  if (cancelled) return
  index.value += 1
  await wait(220)
  shuttering.value = false

  await playCurrent()
  busy = false
}

function pullLever() {
  leverPulled.value = true
  setTimeout(() => { leverPulled.value = false }, 320)
}

async function playCurrent() {
  await $voiceover.play(slide.value.vo)
  if (cancelled) return
  if (isLast.value) {
    finished.value = true
    $audio.playSound('reward_chime')
  }
}

function onKey(e) {
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); advance() }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

onMounted(() => {
  $audio.playSound('paper_turn')
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  cancelled = true
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <ActionWrapper
    class="viewer"
    colour="#120c0d"
    :dim="0.94"
    :label="site.viewer.rotating.text2"
    @close="emit('close')"
  >
    <div class="viewer__inner" :class="{ 'is-started': started }">

      <div class="viewer__device">
        <!-- body -->
        <div class="viewer__body">
          <span class="viewer__brow" />
          <div class="viewer__eyes">
            <div v-for="side in ['left', 'right']" :key="side" class="viewer__eye" :class="side">
              <div class="viewer__lens">
                <div class="viewer__shutter" :class="{ 'is-closed': shuttering || !started }" />
                <img
                  v-if="started"
                  :key="slide.src"
                  class="viewer__slide"
                  :src="asset(slide.src)"
                  alt=""
                  :style="{ transform: `translateX(${side === 'left' ? -1.1 : 1.1}%) scale(1.06)` }"
                >
                <div class="viewer__vignette" />
                <div class="viewer__flare" />
              </div>
            </div>
          </div>
          <span class="viewer__bridge" />
          <span class="viewer__plate">{{ site.viewer.rotating.text1 }}</span>
        </div>

        <!-- reel behind the body -->
        <div class="viewer__reel" :style="{ transform: `rotate(${reelAngle}deg)` }">
          <span v-for="n in SLIDES.length" :key="n" class="viewer__reel-slot" :style="{ '--n': n - 1, '--total': SLIDES.length }" />
        </div>

        <!-- lever -->
        <button
          class="viewer__lever"
          :class="{ 'is-pulled': leverPulled, 'is-done': finished }"
          :aria-label="tutoText.replace(/<br>/g, ' ')"
          @click="advance"
        >
          <span class="viewer__lever-arm" />
          <span class="viewer__lever-knob" />
        </button>
      </div>

      <!-- progress pips -->
      <ol class="viewer__pips" :aria-label="`Slide ${index + 1} of ${SLIDES.length}`">
        <li
          v-for="(s, i) in SLIDES"
          :key="i"
          class="viewer__pip"
          :class="{ 'is-active': started && i === index, 'is-seen': started && i < index }"
        />
      </ol>

      <Transition name="hint">
        <p v-if="!started" class="viewer__hint" v-html="tutoText" />
      </Transition>

      <Transition name="hint">
        <div v-if="finished" class="viewer__outro">
          <p class="viewer__outro-text" v-html="site.viewer.tuto_reward" />
          <RectButton :text="$l('journal.reward_button')" icon="arrow" @click="emit('complete', 'viewer')" />
        </div>
      </Transition>

    </div>
  </ActionWrapper>
</template>

<style scoped>
.viewer__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.6em;
  width: 100%;
}

/* ---- device -------------------------------------------------------------- */

.viewer__device {
  position: relative;
  width: min(72em, 92vw);
  filter: drop-shadow(0 4em 7em rgba(0, 0, 0, .7));
}

.viewer__body {
  position: relative;
  z-index: 3;
  padding: 3.4em 3em 2.6em;
  background:
    linear-gradient(185deg, #e5262c 0%, var(--ui-color-viewer-red) 38%, #96090e 100%);
  border-radius: 46% 46% 30% 30% / 26% 26% 22% 22%;
  box-shadow:
    inset 0 .4em 1.2em rgba(255, 255, 255, .25),
    inset 0 -1em 2.4em rgba(0, 0, 0, .35);
}

.viewer__brow {
  position: absolute;
  top: 1.2em; left: 50%;
  width: 34%;
  height: .55em;
  background: rgba(0, 0, 0, .18);
  border-radius: 1em;
  transform: translateX(-50%);
}

.viewer__eyes {
  display: flex;
  gap: 3.2em;
  justify-content: center;
}

.viewer__eye {
  position: relative;
  width: 40%;
  max-width: 26em;
  aspect-ratio: 1;
  padding: 1em;
  background: radial-gradient(circle at 36% 28%, #3c3c3c, #141414 70%);
  border-radius: 50%;
  box-shadow:
    inset 0 .3em .9em rgba(0, 0, 0, .8),
    0 .4em 1.2em rgba(0, 0, 0, .45);
}

.viewer__lens {
  position: relative;
  width: 100%; height: 100%;
  overflow: hidden;
  background: #07070a;
  border-radius: 50%;
  box-shadow: inset 0 0 3em rgba(0, 0, 0, .95);
}

.viewer__slide {
  position: absolute;
  inset: -3%;
  width: 106%; height: 106%;
  object-fit: cover;
  animation: slide-drop .55s var(--ease-out-expo) both;
}
@keyframes slide-drop {
  from { opacity: 0; transform: translateY(-14%) scale(1.1); }
  to   { opacity: 1; }
}

.viewer__shutter {
  position: absolute;
  inset: 0;
  z-index: 4;
  background: #000;
  opacity: 0;
  transition: opacity .18s ease;
}
.viewer__shutter.is-closed { opacity: 1; }

.viewer__vignette {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: radial-gradient(circle, transparent 46%, rgba(0, 0, 0, .85) 96%);
}
.viewer__flare {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: linear-gradient(128deg, rgba(255, 255, 255, .2), transparent 38%);
  mix-blend-mode: screen;
}

.viewer__bridge {
  position: absolute;
  top: 46%; left: 50%;
  width: 3.4em; height: 1.4em;
  background: rgba(0, 0, 0, .25);
  border-radius: 1em;
  transform: translate(-50%, -50%);
}

.viewer__plate {
  display: block;
  margin-top: 1.6em;
  font-family: 'SometypeMono', monospace;
  font-size: 1.3em;
  font-weight: 500;
  letter-spacing: .42em;
  text-align: center;
  text-transform: uppercase;
  color: var(--ui-color-viewer-beige);
  text-indent: .42em;
  opacity: .85;
}

/* the paper reel peeking out of the top of the body */
.viewer__reel {
  position: absolute;
  top: -16%; left: 50%;
  z-index: 1;
  width: 34%;
  aspect-ratio: 1;
  background: radial-gradient(circle, #f4e7c4 0 18%, var(--ui-color-viewer-beige) 19% 100%);
  border: .4em solid #d8c8a0;
  border-radius: 50%;
  transform-origin: center;
  transition: transform .45s var(--ease-in-out-quart);
  translate: -50% 0;
}
.viewer__reel-slot {
  position: absolute;
  top: 8%; left: 50%;
  width: 16%;
  aspect-ratio: 1;
  background: #241f18;
  border-radius: 50%;
  transform-origin: 50% 525%;
  rotate: calc(var(--n) * (360deg / var(--total)));
  translate: -50% 0;
}

/* ---- lever --------------------------------------------------------------- */

.viewer__lever {
  position: absolute;
  top: 34%; right: -3%;
  z-index: 4;
  width: 12%;
  aspect-ratio: 1 / 2.1;
  background: none;
  transform-origin: 50% 0;
  transition: transform .3s var(--ease-paper);
}
.viewer__lever:hover { transform: rotate(-6deg); }
.viewer__lever.is-pulled { transform: rotate(-28deg); }
.viewer__lever.is-done { opacity: .35; pointer-events: none; }

.viewer__lever-arm {
  position: absolute;
  top: 0; left: 36%;
  width: 28%; height: 72%;
  background: linear-gradient(90deg, #ffb703, #e08c00);
  border-radius: .4em;
  box-shadow: inset -.2em 0 .4em rgba(0, 0, 0, .3);
}
.viewer__lever-knob {
  position: absolute;
  bottom: 0; left: 50%;
  width: 92%;
  aspect-ratio: 1;
  background: radial-gradient(circle at 34% 30%, #ffc94d, #e08c00 62%, #a25f00);
  border-radius: 50%;
  box-shadow: 0 .4em 1em rgba(0, 0, 0, .5);
  translate: -50% 0;
}

/* ---- chrome -------------------------------------------------------------- */

.viewer__pips { display: flex; gap: .9em; }
.viewer__pip {
  width: .9em;
  aspect-ratio: 1;
  background: rgba(255, 255, 255, .22);
  border-radius: 50%;
  transition: background-color .4s ease, transform .4s var(--ease-paper);
}
.viewer__pip.is-seen { background: rgba(255, 255, 255, .55); }
.viewer__pip.is-active { background: var(--ui-color-yellow); transform: scale(1.5); }

.viewer__hint,
.viewer__outro-text {
  font-family: 'WorkSans', sans-serif;
  font-size: 1.8em;
  line-height: 1.3;
  text-align: center;
  color: #fff;
  text-shadow: 0 2px 14px rgba(0, 0, 0, .6);
}
.viewer__outro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4em;
}
.viewer__outro-text :deep(strong) { color: var(--ui-color-yellow); font-weight: 700; }

.hint-enter-active { transition: opacity .6s .2s ease, transform .7s .2s var(--ease-out-expo); }
.hint-leave-active { transition: opacity .25s ease; position: absolute; bottom: 10%; }
.hint-enter-from { opacity: 0; transform: translateY(1.2em); }
.hint-leave-to { opacity: 0; }

@media (max-width: 767px) {
  .viewer__eyes { gap: 1.2em; }
  .viewer__body { padding: 2.4em 1.4em 1.8em; }
  .viewer__hint, .viewer__outro-text { font-size: 1.6em; }
  .viewer__lever { right: -6%; width: 16%; }
}
</style>
