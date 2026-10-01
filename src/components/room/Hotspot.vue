<script setup>
import { computed, watch, onMounted } from 'vue'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import { useOdometer } from '@/composables/useOdometer.js'
import { $webgl } from '@/core/webgl/index.js'
import { $audio } from '@/core/audio.js'
import { $l } from '@/content/site.js'

/* ---------------------------------------------------------------------------
   A hotspot is a DOM button driven by a WebGL projection.

   Its transform is written every frame from $webgl.domPoints, so it tracks
   the object it marks as you look around the room. The blob behind it is a
   lopsided shape rather than a circle, and two expanding rings pulse out of
   it on a two-second cycle so an unvisited hotspot keeps asking politely.
   --------------------------------------------------------------------------- */

const props = defineProps({
  id: { type: String, default: null },
  name: { type: String, default: null },
  status: { type: String, default: 'idle' },      // idle | done
  customIcon: { type: String, default: null },
  progress: { type: Number, default: null },
  animated: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  actionCurrent: { type: Number, default: 0 },
  actionTotal: { type: Number, default: 0 },
  showCounter: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

const isDone = computed(() => props.status === 'done')
const iconId = computed(() => (isDone.value ? null : props.customIcon || 'pencil'))

const CIRCUMFERENCE = 2 * Math.PI * 60
const dashOffset = computed(() =>
  props.progress === null ? CIRCUMFERENCE : CIRCUMFERENCE * (1 - props.progress / 100))

const point = computed(() => $webgl.domPoints[props.id] ?? { x: 0, y: 0, visible: false })

const { digitStyles, reelRefs, setNumber, REPEATS } = useOdometer({ digits: 1, duration: 300 })
onMounted(() => setNumber(props.actionCurrent))
watch(() => props.actionCurrent, (v) => setNumber(v))

function onClick() {
  if (props.disabled || props.loading) return
  $audio.playSound('ui_click')
  emit('click', props.id)
}
</script>

<template>
  <button
    class="hotspot"
    :class="[
      name, id,
      {
        'hotspot--completed': isDone,
        'hotspot--with-progress': progress !== null,
        'hotspot--animated': animated && !loading,
        'hotspot--loading': loading,
        'is-hidden': !point.visible,
        disabled,
        'is-placed': !!name,
      },
    ]"
    :aria-label="$l('aria.hotspot_interaction')"
    :style="{ transform: `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)` }"
    @click="onClick"
    @mouseenter="$audio.playSound('ui_hover', { volume: .35 })"
  >
    <SvgIcon id="blob" class="hotspot__blob" />

    <SvgIcon v-if="isDone" id="check" class="hotspot__icon" />
    <SvgIcon
      v-else
      :id="iconId"
      class="hotspot__icon"
      :class="{ 'is-faded': showCounter }"
    />

    <span v-if="actionTotal > 0" class="hotspot__counter" :class="{ 'is-active': showCounter }">
      <span class="hotspot__odometer">
        <span
          v-for="(style, i) in digitStyles"
          :key="i"
          :ref="(el) => { if (el) reelRefs[i] = el }"
          class="hotspot__reel"
          :style="style"
        >
          <span v-for="n in 10 * REPEATS" :key="n">{{ (n - 1) % 10 }}</span>
        </span>
      </span>
      <span>/</span>
      <span>{{ actionTotal }}</span>
    </span>

    <svg v-if="progress !== null" class="hotspot__progress" viewBox="0 0 100 100">
      <circle class="hotspot__progress-bg" cx="50" cy="50" r="60" />
      <circle
        class="hotspot__progress-bar"
        cx="50" cy="50" r="60"
        :style="{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: dashOffset }"
      />
    </svg>

    <svg v-if="loading" class="hotspot__loading" viewBox="0 0 100 100">
      <circle class="hotspot__loading-track" cx="50" cy="50" r="60" />
      <circle
        class="hotspot__loading-bar"
        cx="50" cy="50" r="60"
        :style="{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: CIRCUMFERENCE * 0.65 }"
      />
    </svg>

    <span v-if="name" class="additionalzone" />
  </button>
</template>

<style scoped>
.hotspot {
  position: absolute;
  top: 0; left: 0;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4.5em;
  aspect-ratio: 1;
  padding: .5em;
  color: #000;
  cursor: pointer;
  border: none;
  border-radius: 50%;
  background: transparent;
  transition: opacity .4s ease;
}
@media (min-width: 640px) { .hotspot { width: 6.5vh; } }

@media (hover: hover) {
  .hotspot:hover :deep(.hotspot__icon) { animation: jitter-subtle .4s infinite ease-in-out; }
  .hotspot:hover :deep(.hotspot__blob) { transform: scale(1.125); }
}

.hotspot--completed { width: 4.1vh; }
.hotspot--completed :deep(.hotspot__icon) { width: 85%; }

.hotspot::before,
.hotspot::after {
  position: absolute;
  top: 50%; left: 50%;
  z-index: -1;
  width: 100%; height: 100%;
  content: '';
  border: 1px solid rgba(255, 255, 255, .6);
  border-radius: 50%;
  opacity: 0;
}
.hotspot--animated::before,
.hotspot--animated::after {
  animation: pulseMiddleOutCircle 2s cubic-bezier(.215, .61, .355, 1) infinite;
}
.hotspot::after { animation-delay: 1s; }

.hotspot.is-hidden { pointer-events: none !important; opacity: 0; }
.hotspot.disabled { opacity: .5 !important; }

.hotspot :deep(.hotspot__blob) {
  position: absolute;
  width: 100%;
  height: auto;
  color: #fff;
  transition: transform .6s cubic-bezier(.23, 1, .32, 1);
}
.hotspot--loading :deep(.hotspot__blob) { transform: scale(.64); }

.hotspot :deep(.hotspot__icon) {
  position: relative;
  width: 55%;
  height: auto;
  pointer-events: none;
  opacity: 1;
  transition: opacity .3s cubic-bezier(.36, .07, .19, .97);
}
.hotspot--loading :deep(.hotspot__icon),
.hotspot :deep(.hotspot__icon.is-faded) { opacity: 0; }

.hotspot__counter {
  position: absolute;
  display: flex;
  gap: .1em;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
  line-height: 1;
  pointer-events: none;
  opacity: 0;
  transition: opacity .3s cubic-bezier(.36, .07, .19, .97);
}
.hotspot__counter.is-active { opacity: 1; }
.hotspot__odometer { display: inline-flex; align-items: flex-start; height: 1em; overflow: hidden; }
.hotspot__reel { display: flex; flex-direction: column; transition: transform .3s ease-out; }
.hotspot__reel > span {
  display: flex; flex-shrink: 0; align-items: center; justify-content: center; height: 1em;
}

.hotspot__progress,
.hotspot__loading {
  position: absolute;
  top: 50%; left: 50%;
  width: 140%; height: 140%;
  overflow: visible;
  pointer-events: none;
  transform: translate(-50%, -50%) rotate(-90deg);
}
.hotspot__progress-bg { fill: none; stroke: rgba(255, 255, 255, .4); stroke-width: 1.5; }
.hotspot__progress-bar {
  fill: none; stroke: #fff; stroke-width: 1.5; stroke-linecap: round;
  transition: stroke-dashoffset var(--transition-duration, .8s) cubic-bezier(.55, 0, .1, 1);
}
.hotspot--loading { pointer-events: none; }
.hotspot__loading { animation: hotspotLoadingSpin 1s linear infinite; }
.hotspot__loading-track { fill: none; stroke: rgba(255, 255, 255, .2); stroke-width: 1.5; }
.hotspot__loading-bar { fill: none; stroke: #fff; stroke-width: 1.5; stroke-linecap: round; }

@keyframes hotspotLoadingSpin {
  0%   { transform: translate(-50%, -50%) rotate(-90deg); }
  100% { transform: translate(-50%, -50%) rotate(270deg); }
}
@keyframes pulseMiddleOutCircle {
  0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2.2); }
}

/* An invisible extra target over the object itself, so clicking the lamp
   works as well as clicking the marker floating beside it. */
.additionalzone {
  position: absolute;
  width: var(--msize, 10vh);
  aspect-ratio: 1 / 1;
  pointer-events: auto;
  opacity: 0;
  transform: translate(var(--mx, 0), var(--my, 0));
}
.is-hidden .additionalzone { pointer-events: none !important; }
@media (min-aspect-ratio: 1/1) {
  .additionalzone {
    width: var(--size, 10vw);
    transform: translate(var(--x, 0), var(--y, 0));
  }
}

.vestibule-journal .additionalzone { --size: 18vh; --msize: 13vh; --x: 20%; --y: 95%; --mx: -16%; --my: 125%; aspect-ratio: 2.5/1; }
.parlour-phone   .additionalzone { --size: 19vh; --msize: 12vh; --x: -5%; --y: -4%; --mx: -39%; --my: -13%; aspect-ratio: 2.2/1; }
.parlour-bag     .additionalzone { --size: 13.2vh; --msize: 8.7vh; --x: -22%; --y: 59%; --mx: 47%; --my: 60%; }
.parlour-viewer  .additionalzone { --size: 19.2vh; --msize: 13vh; --x: 32%; --y: 52%; --mx: 45%; --my: 65%; aspect-ratio: 1.8/1; }
.atelier-colors  .additionalzone { --size: 14vh; --msize: 9.5vh; --y: 45%; --mx: 67%; --my: -5%; }
.atelier-quilt   .additionalzone { --size: 15vh; --msize: 12.6vh; --x: 46%; --y: 12%; --mx: 10%; --my: 28%; }
.atelier-bag     .additionalzone { --size: 13vh; --msize: 9.5vh; --y: -14%; --mx: -68%; --my: -10%; }
</style>
