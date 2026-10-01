<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import ActionWrapper from './ActionWrapper.vue'
import RectButton from '@/components/ui/RectButton.vue'
import Polaroid from './Polaroid.vue'
import { site, $l } from '@/content/site.js'
import { $audio } from '@/core/audio.js'
import { $voiceover } from '@/core/voiceover.js'
import { asset } from '@/core/asset.js'

/* ---------------------------------------------------------------------------
   The telephone.

   A working rotary dial: choosing a digit swings the finger plate round to
   the stop, then lets it wind back under its own weight, ticking once per
   number on the way. Dial the four figures printed on the card and the house
   answers; dial anything else and you get the wrong number, which is its own
   small reward.
   --------------------------------------------------------------------------- */

const emit = defineEmits(['complete', 'close'])

const NUMBER = site.phone.number.replace(/\s+/g, '')   // '0417'
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]

const STATE = { IDLE: 'idle', DIALLING: 'dialling', RINGING: 'ringing', WRONG: 'wrong', ANSWERED: 'answered', DONE: 'done' }

const state = ref(STATE.IDLE)
const dialled = ref('')
const rotation = ref(0)
const handsetUp = ref(false)
const polaroids = ref([])
const finished = ref(false)

let busy = false
let cancelled = false
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/* Angle from the finger stop to each hole, going anticlockwise round the dial. */
function holeAngle(i) { return -(i * 30) - 60 }
function pullAngle(i) { return (i + 1) * 30 + 25 }

const display = computed(() => {
  const chars = dialled.value.padEnd(NUMBER.length, '·').split('')
  return [chars.slice(0, 2).join(''), chars.slice(2).join('')].join(' ')
})

async function dial(digit, i) {
  if (busy || cancelled || state.value === STATE.ANSWERED || state.value === STATE.DONE) return
  busy = true
  state.value = STATE.DIALLING

  const angle = pullAngle(i)

  // wind round to the finger stop
  rotation.value = angle
  $audio.playSound('dial_tick')
  await wait(240 + i * 18)
  if (cancelled) return

  // and spring back, ticking once per hole passed
  const steps = i + 1
  $audio.playSound('dial_return', { volume: 0.9 })
  rotation.value = 0
  await wait(140 + steps * 55)
  if (cancelled) return

  dialled.value += String(digit)
  busy = false

  if (dialled.value.length >= NUMBER.length) await evaluate()
}

async function evaluate() {
  busy = true
  await wait(420)
  if (cancelled) return

  if (dialled.value === NUMBER) {
    state.value = STATE.RINGING
    $audio.playSound('phone_ring')
    await wait(1900)
    if (cancelled) return

    handsetUp.value = true
    $audio.playSound('phone_pickup')
    state.value = STATE.ANSWERED
    await wait(500)

    await $voiceover.play('phone_success')
    if (cancelled) return
    await revealPolaroids()
  } else {
    state.value = STATE.WRONG
    $audio.playSound('error_buzz')
    handsetUp.value = true
    $audio.playSound('phone_pickup', { delay: 0.4 })
    await $voiceover.play('phone_missing')
    if (cancelled) return

    $audio.playSound('phone_hangup')
    handsetUp.value = false
    dialled.value = ''
    state.value = STATE.IDLE
  }
  busy = false
}

const POLAROIDS = [
  { src: 'images/polaroids/polaroid-1.jpg', vo: 'phone_polaroid_1', rotate: -5.5 },
  { src: 'images/polaroids/polaroid-2.jpg', vo: 'phone_polaroid_2', rotate: 3.2 },
  { src: 'images/polaroids/polaroid-3.jpg', vo: 'phone_polaroid_3', rotate: -2.1 },
]

async function revealPolaroids() {
  for (const p of POLAROIDS) {
    if (cancelled) return
    $audio.playSound('polaroid_eject')
    polaroids.value = [...polaroids.value, p]
    await wait(700)
    await $voiceover.play(p.vo)
    await wait(250)
  }
  if (cancelled) return
  await $voiceover.play('phone_polaroid_4')
  if (cancelled) return
  state.value = STATE.DONE
  finished.value = true
  $audio.playSound('reward_chime')
}

onMounted(() => { $audio.playSound('paper_turn') })
onBeforeUnmount(() => { cancelled = true })
</script>

<template>
  <ActionWrapper
    class="phone"
    colour="#1a1410"
    :dim="0.93"
    :closable="state !== 'ringing'"
    @close="emit('close')"
  >
    <div class="phone__inner" :class="[`is-${state}`, { 'has-polaroids': polaroids.length }]">

      <!-- the card by the telephone, with the number on it -->
      <aside class="phone__card">
        <p class="phone__card-text">{{ site.phone.card_label }}</p>
        <p class="phone__card-number">{{ site.phone.number }}</p>
        <span class="phone__card-tape phone__card-tape--a" />
        <span class="phone__card-tape phone__card-tape--b" />
      </aside>

      <!-- the telephone -->
      <div class="phone__device">
        <div class="phone__cradle">
          <span class="phone__foot phone__foot--l" />
          <span class="phone__foot phone__foot--r" />

          <div class="phone__dial">
            <div class="phone__finger-plate" :style="{ transform: `rotate(${rotation}deg)` }">
              <button
                v-for="(d, i) in DIGITS"
                :key="d"
                class="phone__hole"
                :style="{ transform: `rotate(${holeAngle(i)}deg) translateY(-7.1em) rotate(${-holeAngle(i)}deg)` }"
                :aria-label="`Dial ${d}`"
                @click="dial(d, i)"
              >
                <span class="phone__hole-ring" />
              </button>
            </div>

            <div class="phone__dial-face">
              <span
                v-for="(d, i) in DIGITS"
                :key="`n${d}`"
                class="phone__numeral"
                :style="{ transform: `rotate(${holeAngle(i)}deg) translateY(-7.1em) rotate(${-holeAngle(i)}deg)` }"
              >{{ d }}</span>
              <span class="phone__dial-hub" />
            </div>

            <span class="phone__finger-stop" />
          </div>

          <p class="phone__readout" :class="{ 'is-error': state === 'wrong' }">{{ display }}</p>
        </div>

        <div class="phone__handset" :class="{ 'is-up': handsetUp }">
          <span class="phone__earpiece" />
          <span class="phone__bar" />
          <span class="phone__mouthpiece" />
        </div>

        <svg class="phone__cord" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden="true">
          <path
            :d="handsetUp
              ? 'M18 18 C 40 96, 70 36, 96 92 S 158 44, 188 100'
              : 'M18 26 C 44 86, 72 44, 100 86 S 160 50, 186 92'"
            fill="none" stroke="#2b2622" stroke-width="7" stroke-linecap="round"
          />
        </svg>
      </div>

      <!-- developed photographs -->
      <ul class="phone__polaroids">
        <Polaroid
          v-for="(p, i) in polaroids"
          :key="p.src"
          :src="asset(p.src)"
          :rotate="p.rotate"
          :index="i"
          tag="li"
          class="phone__polaroid"
        />
      </ul>

      <Transition name="hint">
        <p v-if="state === 'idle' && !dialled" class="phone__hint" v-html="site.phone.tuto.text" />
      </Transition>

      <Transition name="hint">
        <div v-if="finished" class="phone__outro">
          <p class="phone__outro-text" v-html="site.phone.tuto_reward" />
          <RectButton :text="$l('journal.reward_button')" icon="arrow" @click="emit('complete', 'phone')" />
        </div>
      </Transition>

    </div>
  </ActionWrapper>
</template>

<style scoped>
.phone__inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* ---- note card ----------------------------------------------------------- */

.phone__card {
  position: absolute;
  top: 12%; left: 6%;
  width: 20em;
  padding: 2.2em 1.8em 1.8em;
  background: var(--ui-color-beige);
  box-shadow: 0 1.4em 3em rgba(0, 0, 0, .5);
  transform: rotate(-6deg);
  animation: card-in 1s .3s var(--ease-out-expo) both;
}
@keyframes card-in {
  from { opacity: 0; transform: rotate(-16deg) translateY(-3em); }
  to   { opacity: 1; transform: rotate(-6deg) translateY(0); }
}
.phone__card-text {
  font-family: 'Marginalia', cursive;
  font-size: 2em;
  line-height: 1.15;
  color: #2a3270;
  white-space: pre-line;
}
.phone__card-number {
  margin-top: .4em;
  font-family: 'Marginalia', cursive;
  font-size: 3.6em;
  font-weight: 700;
  letter-spacing: .06em;
  color: var(--ui-color-red);
  transform: rotate(-2deg);
}
.phone__card-tape {
  position: absolute;
  width: 6em; height: 1.9em;
  background: rgba(238, 226, 183, .72);
  box-shadow: inset 0 0 1.4em rgba(170, 150, 90, .35);
}
.phone__card-tape--a { top: -.9em; left: -1.4em; transform: rotate(-38deg); }
.phone__card-tape--b { right: -1.6em; bottom: -.7em; transform: rotate(-36deg); }

/* ---- device -------------------------------------------------------------- */

.phone__device {
  position: relative;
  width: min(44em, 80vw);
  filter: drop-shadow(0 4em 6em rgba(0, 0, 0, .7));
  animation: phone-in 1.1s var(--ease-out-expo) both;
}
@keyframes phone-in {
  from { opacity: 0; transform: translateY(4em) scale(.95); }
  to   { opacity: 1; }
}
.has-polaroids .phone__device {
  transform: translateX(-16%) scale(.86);
  transition: transform 1s var(--ease-out-quint);
}

.phone__cradle {
  position: relative;
  padding: 7em 3em 3em;
  background:
    radial-gradient(130% 100% at 50% 0%, #efe4cf, var(--ui-color-phone-beige) 58%, #a8977c 100%);
  border-radius: 46% 46% 14% 14% / 34% 34% 10% 10%;
  box-shadow:
    inset 0 .6em 1.4em rgba(255, 255, 255, .5),
    inset 0 -1.2em 2.4em rgba(0, 0, 0, .25);
}
.phone__foot {
  position: absolute;
  bottom: -.7em;
  width: 4.4em; height: 1.4em;
  background: #3a332c;
  border-radius: .4em;
}
.phone__foot--l { left: 12%; }
.phone__foot--r { right: 12%; }

/* ---- dial ---------------------------------------------------------------- */

.phone__dial {
  position: relative;
  width: 19em; height: 19em;
  margin: 0 auto;
}

.phone__dial-face {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 42% 34%, #3d3831, #1d1a16 72%);
  border-radius: 50%;
  box-shadow: inset 0 0 2em rgba(0, 0, 0, .8);
}
.phone__numeral {
  position: absolute;
  top: 50%; left: 50%;
  margin: -.62em 0 0 -.5em;
  font-family: 'SometypeMono', monospace;
  font-size: 1.7em;
  color: #efe6d2;
  pointer-events: none;
}
.phone__dial-hub {
  position: absolute;
  top: 50%; left: 50%;
  width: 6.4em; aspect-ratio: 1;
  background: radial-gradient(circle at 38% 32%, #efe4cf, #b9a98c);
  border-radius: 50%;
  box-shadow: 0 .2em .6em rgba(0, 0, 0, .4);
  transform: translate(-50%, -50%);
}

.phone__finger-plate {
  position: absolute;
  inset: 0;
  z-index: 3;
  border-radius: 50%;
  transition: transform .42s var(--ease-out-quint);
}
.phone__hole {
  position: absolute;
  top: 50%; left: 50%;
  width: 3.5em; aspect-ratio: 1;
  margin: -1.75em 0 0 -1.75em;
  background: none;
  border-radius: 50%;
}
.phone__hole-ring {
  position: absolute;
  inset: 0;
  border: .3em solid rgba(240, 235, 220, .9);
  border-radius: 50%;
  box-shadow: 0 .1em .3em rgba(0, 0, 0, .5);
  transition: background-color .2s ease, transform .2s var(--ease-paper);
}
.phone__hole:hover .phone__hole-ring {
  background: rgba(255, 255, 255, .18);
  transform: scale(1.1);
}

.phone__finger-stop {
  position: absolute;
  top: 50%; right: -1.1em;
  width: 2.6em; height: 1.3em;
  background: linear-gradient(180deg, #d9cfb6, #8d8169);
  border-radius: .3em;
  transform: translateY(-50%) rotate(-30deg);
  transform-origin: left center;
}

/* ---- readout ------------------------------------------------------------- */

.phone__readout {
  margin-top: 1.4em;
  font-family: 'SometypeMono', monospace;
  font-size: 2.2em;
  letter-spacing: .4em;
  text-align: center;
  color: #4a4033;
  text-indent: .4em;
  transition: color .3s ease;
}
.phone__readout.is-error { color: var(--ui-color-red); animation: shake1 .5s both; }

/* ---- handset ------------------------------------------------------------- */

.phone__handset {
  position: absolute;
  top: -2.6em; left: 50%;
  z-index: 4;
  display: flex;
  align-items: flex-end;
  width: 70%;
  translate: -50% 0;
  transition: transform .6s var(--ease-out-expo), opacity .4s ease;
  filter: drop-shadow(0 1em 1.6em rgba(0, 0, 0, .45));
}
.phone__handset.is-up { transform: translate(28%, -42%) rotate(-24deg); }

.phone__earpiece,
.phone__mouthpiece {
  width: 22%;
  aspect-ratio: 1 / .78;
  background: radial-gradient(circle at 40% 32%, #efe4cf, #9c8c71);
  border-radius: 46% 46% 40% 40% / 50% 50% 46% 46%;
}
.phone__bar {
  flex: 1;
  height: 1.9em;
  margin: 0 -1px .6em;
  background: linear-gradient(180deg, #e7dcc6, #a8977c);
  border-radius: .8em;
}

.phone__cord {
  position: absolute;
  bottom: -2.4em; left: 8%;
  width: 84%; height: 7em;
  overflow: visible;
  opacity: .85;
}
.phone__cord path { transition: d .6s var(--ease-out-expo); }

/* ---- polaroids ----------------------------------------------------------- */

.phone__polaroids {
  position: absolute;
  top: 50%; right: 4%;
  display: flex;
  gap: 1.4em;
  transform: translateY(-50%);
}

/* ---- text ---------------------------------------------------------------- */

.phone__hint,
.phone__outro-text {
  font-size: 1.8em;
  line-height: 1.3;
  text-align: center;
  color: #fff;
  text-shadow: 0 2px 14px rgba(0, 0, 0, .6);
}
.phone__hint {
  position: absolute;
  bottom: 6%; left: 50%;
  transform: translateX(-50%);
}
.phone__outro {
  position: absolute;
  bottom: 4%; left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2em;
  transform: translateX(-50%);
}
.phone__outro-text :deep(strong) { color: var(--ui-color-yellow); font-weight: 700; }

.hint-enter-active { transition: opacity .6s .3s ease, transform .7s .3s var(--ease-out-expo); }
.hint-leave-active { transition: opacity .25s ease; }
.hint-enter-from { opacity: 0; transform: translate(-50%, 1.4em); }
.hint-leave-to { opacity: 0; }

@media (max-width: 1023px) {
  .phone__card { top: 4%; left: 2%; width: 15em; transform: rotate(-8deg) scale(.86); }
  .phone__device { width: 74vw; }
  .has-polaroids .phone__device { transform: translateY(-14%) scale(.68); }
  .phone__polaroids {
    top: auto; right: auto; bottom: 16%; left: 50%;
    gap: .6em;
    transform: translateX(-50%) scale(.72);
  }
}
</style>
