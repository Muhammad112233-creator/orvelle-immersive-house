<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import ActionWrapper from './ActionWrapper.vue'
import RectButton from '@/components/ui/RectButton.vue'
import Polaroid from './Polaroid.vue'
import { colorways } from '@/content/rooms.js'
import { site, $l } from '@/content/site.js'
import { $audio } from '@/core/audio.js'
import { $voiceover } from '@/core/voiceover.js'
import { device } from '@/core/device.js'
import { asset } from '@/core/asset.js'

/* ---------------------------------------------------------------------------
   Colour.

   Tap the piece and it changes finish, throwing a short burst of pigment
   outward. Each of the five colourways has to be seen once; the last one
   prints a photograph of the result.
   --------------------------------------------------------------------------- */

const emit = defineEmits(['complete', 'close'])

const index = ref(0)
const seen = ref(new Set([0]))
const bursts = ref([])
const finished = ref(false)
const printed = ref(false)

const swatch = computed(() => colorways[index.value])
const remaining = computed(() => colorways.length - seen.value.size)
const hintText = computed(() =>
  device.isTouch ? site.colors.tuto.text_mobile : site.colors.tuto.text)

let burstId = 0
let cancelled = false
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function cycle() {
  if (finished.value) return

  index.value = (index.value + 1) % colorways.length
  seen.value = new Set([...seen.value, index.value])
  $audio.playSound('colour_pop')

  spawnBurst(colorways[index.value].hex)

  if (seen.value.size === colorways.length) complete()
}

function spawnBurst(hex) {
  const id = ++burstId
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    angle: (i / 18) * 360 + Math.random() * 14,
    distance: 26 + Math.random() * 46,
    size: 0.5 + Math.random() * 1.5,
    delay: Math.random() * 0.1,
  }))
  bursts.value = [...bursts.value, { id, hex, particles }]
  setTimeout(() => { bursts.value = bursts.value.filter((b) => b.id !== id) }, 1400)
}

async function complete() {
  finished.value = true
  await wait(700)
  if (cancelled) return
  $audio.playSound('shutter')
  await wait(240)
  printed.value = true
  await wait(500)
  await $voiceover.play('colors_1')
  if (cancelled) return
  $audio.playSound('reward_chime')
}

onMounted(() => { $audio.playSound('paper_turn') })
onBeforeUnmount(() => { cancelled = true })
</script>

<template>
  <ActionWrapper
    class="colours"
    colour="#120f16"
    :dim="0.94"
    :label="swatch.name"
    @close="emit('close')"
  >
    <div class="colours__inner" :class="{ 'is-printed': printed }">

      <div class="colours__stage">
        <span class="colours__wash" :style="{ background: swatch.hex }" />

        <button
          class="colours__bag"
          :class="{ 'is-locked': finished }"
          :aria-label="hintText.replace(/<br>/g, ' ')"
          @click="cycle"
        >
          <span class="colours__tint" :style="{ backgroundColor: swatch.hex, '--mask': `url(${asset('images/products/solene-lum.png')})` }" />
          <img class="colours__lum" :src="asset('images/products/solene-lum.png')" alt="">
          <img class="colours__detail" :src="asset('images/products/solene.png')" alt="" aria-hidden="true">
        </button>

        <span class="colours__shadow" />

        <!-- pigment bursts -->
        <span
          v-for="burst in bursts"
          :key="burst.id"
          class="colours__burst"
        >
          <span
            v-for="p in burst.particles"
            :key="p.id"
            class="colours__particle"
            :style="{
              backgroundColor: burst.hex,
              '--angle': `${p.angle}deg`,
              '--distance': `${p.distance}%`,
              '--size': `${p.size}em`,
              animationDelay: `${p.delay}s`,
            }"
          />
        </span>
      </div>

      <ol class="colours__swatches">
        <li v-for="(c, i) in colorways" :key="c.id">
          <button
            class="colours__swatch"
            :class="{ 'is-active': i === index, 'is-seen': seen.has(i) }"
            :style="{ backgroundColor: c.hex }"
            :aria-label="c.name"
            @click="!finished && (index = i, seen = new Set([...seen, i]), $audio.playSound('colour_pop'), spawnBurst(c.hex), seen.size === colorways.length && complete())"
          />
        </li>
      </ol>

      <Transition name="hint">
        <p v-if="!finished" class="colours__hint">
          <span v-html="hintText" />
          <span class="colours__remaining">{{ remaining }} left</span>
        </p>
      </Transition>

      <!-- the print -->
      <Transition name="print">
        <div v-if="printed" class="colours__print">
          <Polaroid
            :src="asset('images/viewer/slide-2.jpg')"
            :caption="site.colors.polaroid_text"
            :rotate="-4"
            :develop-delay="400"
          />
          <div class="colours__outro">
            <p class="colours__outro-text" v-html="site.colors.tuto_reward" />
            <RectButton :text="$l('journal.reward_button')" icon="arrow" @click="emit('complete', 'colors')" />
          </div>
        </div>
      </Transition>

    </div>
  </ActionWrapper>
</template>

<style scoped>
.colours__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.4em;
  width: 100%;
}

/* ---- stage --------------------------------------------------------------- */

.colours__stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(48em, 74vw);
  aspect-ratio: 1;
  transition: transform .9s var(--ease-out-quint), opacity .6s ease;
}
.is-printed .colours__stage { transform: translateX(-24%) scale(.74); }

.colours__wash {
  position: absolute;
  width: 78%;
  aspect-ratio: 1;
  filter: blur(8em);
  border-radius: 50%;
  opacity: .38;
  transition: background-color .6s var(--ease-out-quint);
}

.colours__bag {
  position: relative;
  display: block;
  width: 74%;
  background: none;
  animation: colours-in 1.1s var(--ease-out-expo) both;
  transition: transform .45s var(--ease-paper);
}
@keyframes colours-in {
  from { opacity: 0; transform: translateY(3em) scale(.94); }
  to   { opacity: 1; }
}
.colours__bag:hover { transform: scale(1.035) rotate(-1.4deg); }
.colours__bag:active { transform: scale(.985); }
.colours__bag.is-locked { pointer-events: none; }

.colours__lum { position: relative; z-index: 2; width: 100%; mix-blend-mode: multiply; }
.colours__tint {
  position: absolute;
  inset: 0;
  z-index: 1;
  -webkit-mask-image: var(--mask);
  mask-image: var(--mask);
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  transition: background-color .5s var(--ease-out-quint);
}
.colours__detail {
  position: absolute;
  inset: 0;
  z-index: 3;
  width: 100%;
  mix-blend-mode: overlay;
  opacity: .42;
  pointer-events: none;
}

.colours__shadow {
  position: absolute;
  bottom: 9%;
  width: 42%;
  height: 3%;
  background: rgba(0, 0, 0, .6);
  filter: blur(1.4em);
  border-radius: 50%;
}

/* ---- pigment ------------------------------------------------------------- */

.colours__burst {
  position: absolute;
  top: 50%; left: 50%;
  pointer-events: none;
}
.colours__particle {
  position: absolute;
  width: var(--size);
  aspect-ratio: 1;
  border-radius: 50%;
  opacity: 0;
  animation: particle-fly 1.1s var(--ease-out-expo) forwards;
}
@keyframes particle-fly {
  0%   { opacity: 0; transform: rotate(var(--angle)) translateY(0) scale(.3); }
  18%  { opacity: 1; }
  100% { opacity: 0; transform: rotate(var(--angle)) translateY(calc(var(--distance) * -1vmin)) scale(1); }
}

/* ---- swatches ------------------------------------------------------------ */

.colours__swatches { display: flex; gap: 1.2em; }
.colours__swatch {
  position: relative;
  width: 3em;
  aspect-ratio: 1;
  border-radius: 50%;
  opacity: .4;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .25);
  transition: opacity .4s ease, transform .35s var(--ease-paper);
}
.colours__swatch.is-seen { opacity: 1; }
.colours__swatch.is-active { transform: scale(1.25); }
.colours__swatch:hover { transform: scale(1.18) rotate(-8deg); }

/* ---- text ---------------------------------------------------------------- */

.colours__hint {
  display: flex;
  flex-direction: column;
  gap: .5em;
  font-size: 1.8em;
  line-height: 1.3;
  text-align: center;
  color: #fff;
  text-shadow: 0 2px 14px rgba(0, 0, 0, .6);
}
.colours__remaining {
  font-family: 'SometypeMono', monospace;
  font-size: .62em;
  letter-spacing: .24em;
  text-transform: uppercase;
  color: var(--ui-color-yellow);
}

.colours__print {
  position: absolute;
  top: 50%; right: 6%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.8em;
  transform: translateY(-50%);
}
.colours__outro { display: flex; flex-direction: column; align-items: center; gap: 1.2em; }
.colours__outro-text {
  font-size: 1.7em;
  line-height: 1.3;
  text-align: center;
  color: #fff;
}
.colours__outro-text :deep(strong) { color: var(--ui-color-yellow); font-weight: 700; }

.hint-enter-active { transition: opacity .6s .3s ease; }
.hint-leave-active { transition: opacity .25s ease; position: absolute; bottom: 6%; }
.hint-enter-from, .hint-leave-to { opacity: 0; }

.print-enter-active { transition: opacity .7s var(--ease-out-quint), transform .9s var(--ease-out-expo); }
.print-enter-from { opacity: 0; transform: translate(2em, -50%); }

@media (max-width: 1023px) {
  .colours__stage { width: 64vw; }
  .is-printed .colours__stage { transform: translateY(-20%) scale(.52); }
  .colours__print {
    top: auto; right: auto; bottom: 4%; left: 50%;
    flex-direction: column;
    gap: 1.2em;
    transform: translateX(-50%) scale(.82);
  }
}
</style>
