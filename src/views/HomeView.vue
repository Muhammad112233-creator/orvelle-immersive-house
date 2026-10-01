<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import RectButton from '@/components/ui/RectButton.vue'
import ButtonNav from '@/components/ui/ButtonNav.vue'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import { rooms, ROOM_IDS } from '@/content/rooms.js'
import { $l } from '@/content/site.js'
import { $store, $game } from '@/core/store.js'
import { $audio } from '@/core/audio.js'
import { device } from '@/core/device.js'
import { onTick, damp } from '@/core/raf.js'
import { asset } from '@/core/asset.js'

/* ---------------------------------------------------------------------------
   Outside the house.

   You arrive on the pavement looking at a blank stone wall with three lit
   windows cut into it. Moving along the facade is the room chooser; the glow
   behind each window is the room you are about to walk into. The "Enter the
   room" button tracks the active window horizontally rather than sitting in a
   fixed place, so the CTA always belongs to what you are looking at.
   --------------------------------------------------------------------------- */

const router = useRouter()

const WINDOW_GAP = 62          // vw between window centres
const list = ROOM_IDS.map((id) => rooms[id])

const current = ref(0)
const railX = ref(0)
const targetX = ref(0)
const parallax = ref({ x: 0, y: 0 })
const entering = ref(false)
const mounted = ref(false)

const activeRoom = computed(() => list[current.value])
const canPrev = computed(() => current.value > 0)
const canNext = computed(() => current.value < list.length - 1)

function windowOffset(i) {
  return (i - (list.length - 1) / 2) * WINDOW_GAP
}

function go(delta) {
  const next = Math.min(Math.max(current.value + delta, 0), list.length - 1)
  if (next === current.value) return
  current.value = next
  $audio.playSound('transition_whoosh', { volume: 0.5 })
}

watch(current, (i) => { targetX.value = -windowOffset(i) })

/* ---- pointer / keyboard / wheel navigation ------------------------------ */

let dragStart = null
let dragged = 0

function onPointerDown(e) {
  if (e.target.closest('button, a')) return
  dragStart = e.clientX ?? e.touches?.[0]?.clientX
  dragged = 0
}

function onPointerMove(e) {
  const x = e.clientX ?? e.touches?.[0]?.clientX
  parallax.value.x = (x / window.innerWidth) * 2 - 1
  parallax.value.y = ((e.clientY ?? e.touches?.[0]?.clientY ?? 0) / window.innerHeight) * 2 - 1
  if (dragStart === null) return
  dragged = x - dragStart
}

function onPointerUp() {
  if (dragStart !== null && Math.abs(dragged) > 60) go(dragged < 0 ? 1 : -1)
  dragStart = null
  dragged = 0
}

let wheelLock = false
function onWheel(e) {
  if (wheelLock) return
  if (Math.abs(e.deltaX) < 18 && Math.abs(e.deltaY) < 18) return
  wheelLock = true
  go((e.deltaX || e.deltaY) > 0 ? 1 : -1)
  setTimeout(() => { wheelLock = false }, 520)
}

function onKey(e) {
  if (e.key === 'ArrowRight') go(1)
  if (e.key === 'ArrowLeft') go(-1)
  if (e.key === 'Enter') enterRoom()
}

/* ---- entering ------------------------------------------------------------ */

async function enterRoom() {
  if (entering.value) return
  entering.value = true
  $audio.playSound('door_open')
  $store.isTransitioning = true

  // The window we are entering swells to fill the screen before the route
  // changes, so the cut from outside to inside reads as walking through it.
  const el = document.querySelector(`.window[data-index="${current.value}"] .window__glass`)
  if (el) {
    await gsap.to(el, { scale: 14, duration: 1.25, ease: 'power3.inOut' })
  } else {
    await new Promise((r) => setTimeout(r, 400))
  }
  router.push({ name: 'room', params: { id: activeRoom.value.id } })
}

/* ---- loop ---------------------------------------------------------------- */

let stop = null

onMounted(() => {
  targetX.value = -windowOffset(current.value)
  railX.value = targetX.value

  window.addEventListener('keydown', onKey)
  window.addEventListener('wheel', onWheel, { passive: true })

  stop = onTick((delta) => {
    railX.value = damp(railX.value, targetX.value, 0.09, delta)
  }, 1)

  requestAnimationFrame(() => { mounted.value = true })
  $audio.playAmbience('amb_hall')
  $store.currentRoom = null
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('wheel', onWheel)
  stop?.()
})
</script>

<template>
  <div
    class="view view-home"
    :class="{ 'is-mounted': mounted, 'is-entering': entering }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <!-- the street -->
    <div
      class="home__facade"
      :style="{
        transform: `translateX(calc(-50% + ${railX * 0.42}vw + ${parallax.x * -1.2}vw)) scale(1.08)`,
      }"
    />
    <div class="home__sky" />
    <div class="home__pavement" />

    <!-- the windows -->
    <ul
      class="windows"
      :style="{ transform: `translateX(${railX}vw) translateX(${parallax.x * -0.6}vw)` }"
    >
      <li
        v-for="(room, i) in list"
        :key="room.id"
        class="window"
        :class="{ 'is-active': i === current, 'is-past': i < current }"
        :data-index="i"
        :style="{ left: `calc(50% + ${windowOffset(i)}vw)` }"
      >
        <div class="window__caption">
          <span class="window__chapter">{{ $l(`room.${room.id}.chapter`) }}</span>
          <h2 class="window__title">{{ $l(`room.${room.id}.title`) }}</h2>
        </div>

        <button
          class="window__frame"
          :aria-label="$l('global.enter')"
          @click="i === current ? enterRoom() : (current = i)"
        >
          <span class="window__sill" />
          <span class="window__glass">
            <span
              class="window__room"
              :style="{
                backgroundImage: `url(${asset(`images/rooms/${room.id}.jpg`)})`,
                transform: `translate(${parallax.x * -2.5}%, ${parallax.y * -2}%) scale(1.14)`,
              }"
            />
            <span class="window__glow" :style="{ background: room.tint }" />
            <span class="window__sheen" />
            <span class="window__mullion window__mullion--v" />
            <span class="window__mullion window__mullion--h" />
          </span>
          <span v-if="$game.roomCompleted(room.id)" class="window__done">
            <SvgIcon id="check" />
          </span>
        </button>
      </li>
    </ul>

    <!-- chrome -->
    <div class="window-nav" :class="{ visible: mounted && !entering }">
      <ButtonNav
        class="prev"
        direction="prev"
        :disabled="!canPrev"
        :aria-label="$l('aria.prev_room')"
        @click="go(-1)"
      />
      <ButtonNav
        class="next"
        direction="next"
        :disabled="!canNext"
        :aria-label="$l('aria.next_room')"
        @click="go(1)"
      />
    </div>

    <footer class="domsync" :style="{ transform: `translateX(${parallax.x * -0.6}vw)` }">
      <RectButton
        class="window__button"
        :text="$l('global.enter')"
        icon="door"
        @click="enterRoom"
      />
    </footer>

    <p class="home__hint" :class="{ 'is-hidden': entering }">{{ $l('global.tap_explore') }}</p>
  </div>
</template>

<style scoped>
.view-home {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #090c1c;
  cursor: grab;
}
.view-home:active { cursor: grabbing; }

/* ---- street -------------------------------------------------------------- */

.home__facade {
  position: absolute;
  top: -4%;
  left: 50%;
  width: 260vw;
  height: 108%;
  background: url('/images/facade.jpg') center / cover no-repeat;
  will-change: transform;
}
.home__sky {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(12, 15, 96, .25), transparent 60%),
    linear-gradient(180deg, rgba(5, 7, 24, .55) 0%, transparent 28%, transparent 68%, rgba(5, 7, 24, .85) 100%);
  pointer-events: none;
}
.home__pavement {
  position: absolute;
  right: 0; bottom: 0; left: 0;
  height: 18vh;
  background: linear-gradient(180deg, transparent, rgba(4, 5, 16, .9));
  pointer-events: none;
}

/* ---- windows ------------------------------------------------------------- */

.windows {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  will-change: transform;
}

.window {
  position: absolute;
  top: 46%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.4em;
  transform: translate(-50%, -50%);
}

.window__caption {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .7em;
  text-align: center;
  opacity: .35;
  transform: rotate(-.8deg);
  transition: opacity .6s var(--ease-out-quint);
}
.window.is-active .window__caption { opacity: 1; }

.window__chapter {
  font-family: 'SometypeMono', monospace;
  font-size: 1.2em;
  letter-spacing: .28em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .8);
}
.window__title {
  font-size: 3em;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: #fff;
  text-shadow: 0 2px 24px rgba(0, 0, 0, .6);
}

.window__frame {
  position: relative;
  display: block;
  width: 30vw;
  max-width: 420px;
  aspect-ratio: 3 / 4;
  padding: 0;
  background: none;
  border: none;
  filter: brightness(.55) saturate(.7);
  transform: scale(.82);
  transition: filter .7s var(--ease-out-quint), transform .7s var(--ease-out-quint);
}
.window.is-active .window__frame { filter: none; transform: scale(1); }

.window__glass {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 48% 48% 3% 3% / 18% 18% 2% 2%;
  box-shadow:
    inset 0 0 0 .7em #15171f,
    inset 0 0 0 1.1em rgba(255, 255, 255, .07),
    0 2em 6em rgba(0, 0, 0, .6),
    0 0 9em rgba(255, 196, 120, .18);
  transform-origin: center center;
  will-change: transform;
}

.window__room {
  position: absolute;
  inset: -8%;
  background-position: center;
  background-size: cover;
  will-change: transform;
}
.window__glow {
  position: absolute;
  inset: 0;
  mix-blend-mode: soft-light;
  opacity: .55;
}
.window__sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(118deg, rgba(255, 255, 255, .2) 0%, transparent 34%, transparent 62%, rgba(255, 255, 255, .09) 100%);
  pointer-events: none;
}
.window__mullion {
  position: absolute;
  background: #15171f;
  box-shadow: 0 0 6px rgba(0, 0, 0, .6);
}
.window__mullion--v { top: 0; bottom: 0; left: 50%; width: .5em; margin-left: -.25em; }
.window__mullion--h { right: 0; left: 0; top: 46%; height: .45em; }

.window__sill {
  position: absolute;
  right: -1.4em; bottom: -1.1em; left: -1.4em;
  height: 1.1em;
  background: linear-gradient(180deg, #b9b1a2, #6d675c);
  border-radius: .1em;
  box-shadow: 0 .5em 1.4em rgba(0, 0, 0, .55);
}

.window__done {
  position: absolute;
  top: -1.1em; right: -1.1em;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.4em;
  aspect-ratio: 1;
  color: #fff;
  background: var(--ui-color-blue);
  border-radius: 50%;
  box-shadow: 0 .4em 1.4em rgba(0, 0, 0, .45);
  transform: rotate(-8deg);
}
.window__done :deep(svg) { width: 1.8em; }

/* ---- chrome -------------------------------------------------------------- */

.window-nav {
  position: absolute;
  top: 50%;
  left: 0;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  width: 100vw;
  padding: 0 2em;
  opacity: 0;
  transform: translateY(-50%);
  transition: opacity .4s ease;
}
.window-nav.visible { opacity: 1; }

.domsync {
  position: absolute;
  bottom: calc(6vh + env(safe-area-inset-bottom));
  left: 50%;
  z-index: 5;
  margin-left: -7em;
  opacity: 0;
  animation: home-cta-in 1.1s .6s var(--ease-out-expo) forwards;
}
.is-entering .domsync { opacity: 0; transition: opacity .3s ease; animation: none; }

@keyframes home-cta-in {
  from { opacity: 0; transform: translateY(2.4em) rotate(6deg); }
  to   { opacity: 1; transform: translateY(0) rotate(0); }
}

.home__hint {
  position: absolute;
  bottom: calc(2em + env(safe-area-inset-bottom));
  left: 50%;
  font-family: 'SometypeMono', monospace;
  font-size: 1.1em;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .45);
  transform: translateX(-50%);
  transition: opacity .4s ease;
}
.home__hint.is-hidden { opacity: 0; }

/* ---- entry animation ----------------------------------------------------- */

.view-home .window { opacity: 0; transform: translate(-50%, -40%); }
.view-home.is-mounted .window {
  opacity: 1;
  transform: translate(-50%, -50%);
  transition: opacity 1.2s var(--ease-out-expo), transform 1.4s var(--ease-out-expo);
}
.view-home.is-mounted .window:nth-child(2) { transition-delay: .08s; }
.view-home.is-mounted .window:nth-child(3) { transition-delay: .16s; }

.is-entering .window__caption,
.is-entering .window-nav,
.is-entering .home__hint { opacity: 0; transition: opacity .35s ease; }
.is-entering .window:not(.is-active) { opacity: 0; transition: opacity .4s ease; }

/* ---- small screens ------------------------------------------------------- */

@media (max-width: 1023px) {
  .window__frame { width: 62vw; max-width: none; }
  .window__title { font-size: 2.2em; }
  .window-nav { padding: 0 1.2em; }
}
@media (max-aspect-ratio: 3/4) {
  .window { top: 44%; }
  .window__frame { width: 66vw; aspect-ratio: 3 / 4.2; }
}
</style>
