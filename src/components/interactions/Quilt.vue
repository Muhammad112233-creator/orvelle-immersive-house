<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import ActionWrapper from './ActionWrapper.vue'
import RectButton from '@/components/ui/RectButton.vue'
import { site, $l } from '@/content/site.js'
import { $audio } from '@/core/audio.js'
import { $voiceover } from '@/core/voiceover.js'
import { device } from '@/core/device.js'
import { asset } from '@/core/asset.js'

/* ---------------------------------------------------------------------------
   Matelassé.

   You rub the surface and the construction shows through. A canvas sits over
   the finished leather holding an opaque quilted skin; dragging erases it,
   and when enough has been worn away the next stage of the build fades in
   underneath and the skin re-forms. Five stages, five lines of narration.

   The erase brush is a soft radial gradient composited with
   destination-out — cheap, and it feels like a thumb rather than a cursor.
   --------------------------------------------------------------------------- */

const emit = defineEmits(['complete', 'close'])

const STAGES = [
  { src: 'images/quilt/stage-1.jpg', vo: 'quilt_1', label: 'Nappa' },
  { src: 'images/quilt/stage-2.jpg', vo: 'quilt_2', label: 'Wadding' },
  { src: 'images/quilt/stage-3.jpg', vo: 'quilt_3', label: 'Elastic ground' },
  { src: 'images/quilt/stage-4.jpg', vo: 'quilt_4', label: 'Stitch' },
  { src: 'images/quilt/stage-5.jpg', vo: 'quilt_5', label: 'Press' },
]

const THRESHOLD = 0.52        // share of the skin that must be worn away

const canvas = ref(null)
const stageIndex = ref(0)
const revealed = ref(0)
const started = ref(false)
const finished = ref(false)
const transitioning = ref(false)

const stage = computed(() => STAGES[stageIndex.value])
const nextStage = computed(() => STAGES[Math.min(stageIndex.value + 1, STAGES.length - 1)])
const progress = computed(() =>
  Math.min(((stageIndex.value + revealed.value) / STAGES.length) * 100, 100))
const hintText = computed(() =>
  device.isTouch ? site.quilt.tuto.text_mobile : site.quilt.tuto.text)

let ctx = null
let painting = false
let cancelled = false
let lastPoint = null
let lastSound = 0
let sampleTimer = null

/* ---- the quilted skin drawn onto the canvas ----------------------------- */

function paintSkin() {
  if (!ctx) return
  const { width: w, height: h } = canvas.value

  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, '#d79a52')
  grad.addColorStop(0.5, '#c07c34')
  grad.addColorStop(1, '#9a5c21')
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // diamond quilting: two sets of diagonal seams plus a puff highlight
  const step = Math.max(w, h) / 11
  ctx.lineWidth = Math.max(1.5, step * 0.02)

  for (const dir of [1, -1]) {
    for (let i = -h; i < w + h; i += step) {
      ctx.beginPath()
      ctx.moveTo(i, dir > 0 ? 0 : h)
      ctx.lineTo(i + h * dir, dir > 0 ? h : 0)
      ctx.strokeStyle = 'rgba(80, 42, 10, 0.42)'
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(i + ctx.lineWidth * 1.6, dir > 0 ? 0 : h)
      ctx.lineTo(i + h * dir + ctx.lineWidth * 1.6, dir > 0 ? h : 0)
      ctx.strokeStyle = 'rgba(255, 215, 165, 0.22)'
      ctx.stroke()
    }
  }

  // soft padding between the seams
  for (let y = 0; y < h + step; y += step) {
    for (let x = 0; x < w + step; x += step) {
      const r = ctx.createRadialGradient(x, y, 0, x, y, step * 0.62)
      r.addColorStop(0, 'rgba(255, 220, 175, 0.20)')
      r.addColorStop(1, 'rgba(255, 220, 175, 0)')
      ctx.fillStyle = r
      ctx.beginPath()
      ctx.arc(x, y, step * 0.62, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function sizeCanvas() {
  const el = canvas.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  el.width = Math.round(rect.width * dpr)
  el.height = Math.round(rect.height * dpr)
  ctx = el.getContext('2d', { willReadFrequently: true })
  paintSkin()
}

/* ---- erasing ------------------------------------------------------------- */

function toLocal(e) {
  const rect = canvas.value.getBoundingClientRect()
  const dpr = canvas.value.width / rect.width
  const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
  const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
  return { x: (cx - rect.left) * dpr, y: (cy - rect.top) * dpr }
}

function erase(x, y) {
  const radius = Math.max(canvas.value.width, canvas.value.height) * 0.085
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
  g.addColorStop(0, 'rgba(0,0,0,1)')
  g.addColorStop(0.55, 'rgba(0,0,0,0.85)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

function onDown(e) {
  if (transitioning.value || finished.value) return
  painting = true
  started.value = true
  const p = toLocal(e)
  lastPoint = p
  erase(p.x, p.y)
}

function onMove(e) {
  if (!painting || transitioning.value) return
  const p = toLocal(e)

  // Interpolate between frames so a fast drag doesn't leave gaps.
  if (lastPoint) {
    const dist = Math.hypot(p.x - lastPoint.x, p.y - lastPoint.y)
    const steps = Math.ceil(dist / (canvas.value.width * 0.02))
    for (let i = 1; i <= steps; i++) {
      erase(
        lastPoint.x + (p.x - lastPoint.x) * (i / steps),
        lastPoint.y + (p.y - lastPoint.y) * (i / steps),
      )
    }
  }
  lastPoint = p

  const now = performance.now()
  if (now - lastSound > 160) {
    lastSound = now
    $audio.playSound('quilt_press', { volume: 0.5 })
  }
}

function onUp() { painting = false; lastPoint = null }

/* ---- progress sampling --------------------------------------------------- */

function sample() {
  if (!ctx || transitioning.value || finished.value) return
  const { width: w, height: h } = canvas.value
  const step = 12
  const data = ctx.getImageData(0, 0, w, h).data
  let clear = 0
  let total = 0
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      total++
      if (data[(y * w + x) * 4 + 3] < 80) clear++
    }
  }
  revealed.value = total ? clear / total : 0
  if (revealed.value >= THRESHOLD) nextStageStep()
}

async function nextStageStep() {
  if (transitioning.value) return
  transitioning.value = true
  painting = false

  await $voiceover.play(stage.value.vo)
  if (cancelled) return

  if (stageIndex.value >= STAGES.length - 1) {
    finished.value = true
    revealed.value = 1
    $audio.playSound('reward_chime')
    transitioning.value = false
    return
  }

  stageIndex.value += 1
  $audio.playSound('paper_turn')
  await nextTick()
  await new Promise((r) => setTimeout(r, 420))
  if (cancelled) return

  revealed.value = 0
  paintSkin()
  transitioning.value = false
}

/* ---- lifecycle ----------------------------------------------------------- */

function onResize() { sizeCanvas() }

onMounted(() => {
  sizeCanvas()
  window.addEventListener('resize', onResize)
  window.addEventListener('pointerup', onUp)
  sampleTimer = setInterval(sample, 260)
  $audio.playSound('paper_turn')
})

onBeforeUnmount(() => {
  cancelled = true
  clearInterval(sampleTimer)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('pointerup', onUp)
})
</script>

<template>
  <ActionWrapper
    class="quilt"
    colour="#1d1409"
    :dim="0.95"
    :label="stage.label"
    @close="emit('close')"
  >
    <div class="quilt__inner" :class="{ 'is-finished': finished }">

      <div class="quilt__frame">
        <!-- what lies underneath -->
        <div class="quilt__layers">
          <img
            v-for="(s, i) in STAGES"
            :key="s.src"
            class="quilt__layer"
            :class="{ 'is-current': i === stageIndex }"
            :src="asset(s.src)"
            alt=""
          >
          <div class="quilt__fallback" />
        </div>

        <!-- the skin you wear away -->
        <canvas
          ref="canvas"
          class="quilt__canvas"
          :class="{ 'is-fading': transitioning }"
          @pointerdown="onDown"
          @pointermove="onMove"
        />

        <span class="quilt__edge" />

        <!-- progress ring -->
        <svg class="quilt__progress" viewBox="0 0 120 120" aria-hidden="true">
          <circle class="quilt__progress-bg" cx="60" cy="60" r="54" />
          <circle
            class="quilt__progress-bar"
            cx="60" cy="60" r="54"
            :style="{
              strokeDasharray: 2 * Math.PI * 54,
              strokeDashoffset: 2 * Math.PI * 54 * (1 - progress / 100),
            }"
          />
        </svg>
      </div>

      <Transition name="hint">
        <p v-if="!started" class="quilt__hint" v-html="hintText" />
      </Transition>

      <Transition name="hint">
        <div v-if="finished" class="quilt__outro">
          <p class="quilt__outro-text" v-html="site.quilt.tuto_reward" />
          <RectButton :text="$l('journal.reward_button')" icon="arrow" @click="emit('complete', 'quilt')" />
        </div>
      </Transition>

    </div>
  </ActionWrapper>
</template>

<style scoped>
.quilt__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.4em;
  width: 100%;
}

.quilt__frame {
  position: relative;
  width: min(86em, 92vw);
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: .4em;
  box-shadow: 0 4em 8em rgba(0, 0, 0, .75);
  animation: quilt-in 1.1s var(--ease-out-expo) both;
}
@keyframes quilt-in {
  from { opacity: 0; transform: translateY(3em) scale(.97); }
  to   { opacity: 1; }
}

.quilt__layers { position: absolute; inset: 0; }
.quilt__layer {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.05);
  transition: opacity 1s var(--ease-out-quint), transform 2.4s var(--ease-out-quint);
}
.quilt__layer.is-current { opacity: 1; transform: scale(1); }

/* Shown through the canvas if a stage photograph has not loaded, so the
   interaction never reveals an empty rectangle. */
.quilt__fallback {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    repeating-linear-gradient(45deg, rgba(0,0,0,.18) 0 2px, transparent 2px 34px),
    repeating-linear-gradient(-45deg, rgba(0,0,0,.18) 0 2px, transparent 2px 34px),
    linear-gradient(150deg, #7a4a1d, #3b2210);
}

.quilt__canvas {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%; height: 100%;
  cursor: grab;
  touch-action: none;
  transition: opacity .45s ease;
}
.quilt__canvas:active { cursor: grabbing; }
.quilt__canvas.is-fading { opacity: .25; pointer-events: none; }
.is-finished .quilt__canvas { opacity: 0; pointer-events: none; }

.quilt__edge {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  box-shadow: inset 0 0 8em rgba(0, 0, 0, .7);
}

.quilt__progress {
  position: absolute;
  right: 1.6em; bottom: 1.6em;
  z-index: 4;
  width: 5.4em;
  pointer-events: none;
  transform: rotate(-90deg);
}
.quilt__progress-bg { fill: none; stroke: rgba(255, 255, 255, .25); stroke-width: 4; }
.quilt__progress-bar {
  fill: none;
  stroke: var(--ui-color-yellow);
  stroke-width: 4;
  stroke-linecap: round;
  transition: stroke-dashoffset .5s var(--ease-out-quint);
}

.quilt__hint,
.quilt__outro-text {
  font-size: 1.8em;
  line-height: 1.3;
  text-align: center;
  color: #fff;
  text-shadow: 0 2px 14px rgba(0, 0, 0, .6);
}
.quilt__outro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2em;
}
.quilt__outro-text :deep(strong) { color: var(--ui-color-yellow); font-weight: 700; }

.hint-enter-active { transition: opacity .6s .3s ease, transform .7s .3s var(--ease-out-expo); }
.hint-leave-active { transition: opacity .25s ease; position: absolute; bottom: 8%; }
.hint-enter-from { opacity: 0; transform: translateY(1.2em); }
.hint-leave-to { opacity: 0; }

@media (max-width: 767px) {
  .quilt__frame { aspect-ratio: 4 / 5; }
  .quilt__hint, .quilt__outro-text { font-size: 1.6em; }
}
</style>
