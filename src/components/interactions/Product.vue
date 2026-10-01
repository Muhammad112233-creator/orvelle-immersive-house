<script setup>
import { ref, computed, onMounted } from 'vue'
import ActionWrapper from './ActionWrapper.vue'
import RectButton from '@/components/ui/RectButton.vue'
import { colorways } from '@/content/rooms.js'
import { site, $l } from '@/content/site.js'
import { $audio } from '@/core/audio.js'
import { asset } from '@/core/asset.js'

/* ---------------------------------------------------------------------------
   Product view.

   One photograph, five colourways. Rather than ship five shots of the same
   bag, the swatch tints a luminance pass of the original: a flat colour sits
   underneath and the greyscale leather multiplies over it, so folds,
   highlights and stitching survive the recolour. The full-colour pass is
   layered back on top at low opacity to restore the warmth of real leather
   and keep the metal hardware gold.
   --------------------------------------------------------------------------- */

const props = defineProps({
  room: { type: String, required: true },
  source: { type: String, default: 'bag' },
})
const emit = defineEmits(['close'])

const PRODUCTS = {
  parlour: { key: 'nocturne', data: site.parlour.bag },
  atelier: { key: 'solene', data: site.atelier.bag },
}

const product = computed(() => PRODUCTS[props.room] || PRODUCTS.parlour)
const active = ref(0)
const swatch = computed(() => colorways[active.value])
const entered = ref(false)

function pick(i) {
  if (i === active.value) return
  active.value = i
  $audio.playSound('colour_pop')
}

onMounted(() => {
  $audio.playSound('paper_turn')
  requestAnimationFrame(() => { entered.value = true })
})
</script>

<template>
  <ActionWrapper
    class="product"
    colour="#15121b"
    :dim="0.92"
    :label="$l('aria.open_productview')"
    @close="emit('close')"
  >
    <div class="product-wrapper" :class="{ 'is-entered': entered }">

      <figure class="product-wrapper__stage">
        <span class="product-wrapper__halo" :style="{ background: swatch.hex }" />

        <span class="product-wrapper__bag" :key="product.key">
          <!-- flat colour → luminance multiply → colour detail overlay -->
          <span
            class="product-wrapper__tint"
            :style="{
              backgroundColor: swatch.hex,
              '--mask': `url(${asset(`images/products/${product.key}-lum.png`)})`,
            }"
          />
          <img
            class="product-wrapper__lum"
            :src="asset(`images/products/${product.key}-lum.png`)"
            :alt="product.data.name"
          >
          <img
            class="product-wrapper__detail"
            :src="asset(`images/products/${product.key}.png`)"
            alt=""
            aria-hidden="true"
          >
        </span>

        <span class="product-wrapper__shadow" />
      </figure>

      <div class="product-wrapper__info">
        <span class="product-wrapper__eyebrow">{{ swatch.name }}</span>
        <h2 class="product-wrapper__name">{{ product.data.name }}</h2>
        <p class="product-wrapper__description">{{ product.data.description }}</p>

        <ul class="product-wrapper__swatches">
          <li v-for="(c, i) in colorways" :key="c.id">
            <button
              class="product-wrapper__swatch"
              :class="{ 'is-active': i === active }"
              :style="{ backgroundColor: c.hex }"
              :aria-label="c.name"
              :aria-pressed="i === active"
              @click="pick(i)"
            />
          </li>
        </ul>

        <RectButton
          class="product-wrapper__link"
          icon="bag"
          :text="$l('global.label_bag_url', { bagname: product.data.name })"
          :href="product.data.url"
          target="_blank"
        />
      </div>

    </div>
  </ActionWrapper>
</template>

<style scoped>
.product-wrapper {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 5em;
  align-items: center;
  width: 100%;
  max-width: 110em;
}

/* ---- stage --------------------------------------------------------------- */

.product-wrapper__stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  margin: 0;
}

.product-wrapper__halo {
  position: absolute;
  width: 74%;
  aspect-ratio: 1;
  filter: blur(7em);
  border-radius: 50%;
  opacity: .32;
  transition: background-color .7s var(--ease-out-quint);
}

.product-wrapper__bag {
  position: relative;
  display: block;
  width: 76%;
  opacity: 0;
  transform: translateY(3em) scale(.94);
  transition: opacity 1.1s var(--ease-out-expo), transform 1.4s var(--ease-out-expo);
}
.is-entered .product-wrapper__bag { opacity: 1; transform: none; }

.product-wrapper__lum {
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  mix-blend-mode: multiply;
}

.product-wrapper__tint {
  position: absolute;
  inset: 0;
  z-index: 1;
  /* the mask keeps the flat colour inside the silhouette */
  -webkit-mask-image: var(--mask);
  mask-image: var(--mask);
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  /* the luminance plate is centred in its box, so the mask must be too —
     without this the flat colour sits off the silhouette on wide viewports */
  -webkit-mask-position: center;
  mask-position: center;
  transition: background-color .7s var(--ease-out-quint);
}

.product-wrapper__detail {
  position: absolute;
  inset: 0;
  z-index: 3;
  width: 100%;
  mix-blend-mode: overlay;
  opacity: .42;
  pointer-events: none;
}

.product-wrapper__shadow {
  position: absolute;
  bottom: 6%;
  width: 46%;
  height: 3.5%;
  background: rgba(0, 0, 0, .55);
  filter: blur(1.4em);
  border-radius: 50%;
}

/* ---- info ---------------------------------------------------------------- */

.product-wrapper__info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.4em;
  opacity: 0;
  transform: translateY(2em);
  transition: opacity 1s .25s var(--ease-out-expo), transform 1.2s .25s var(--ease-out-expo);
}
.is-entered .product-wrapper__info { opacity: 1; transform: none; }

.product-wrapper__eyebrow {
  font-family: 'SometypeMono', monospace;
  font-size: 1.2em;
  letter-spacing: .26em;
  text-transform: uppercase;
  color: var(--ui-color-yellow);
}

.product-wrapper__name {
  font-size: 5.2em;
  font-weight: 700;
  line-height: .95;
  letter-spacing: -.01em;
  color: #fff;
}

.product-wrapper__description {
  max-width: 26em;
  font-size: 1.6em;
  line-height: 1.55;
  color: rgba(255, 255, 255, .74);
}

.product-wrapper__swatches {
  display: flex;
  gap: 1em;
  margin-top: .4em;
}
.product-wrapper__swatch {
  position: relative;
  width: 3.2em;
  aspect-ratio: 1;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .25), 0 .3em .8em rgba(0, 0, 0, .4);
  transition: transform .35s var(--ease-paper);
}
.product-wrapper__swatch::after {
  position: absolute;
  inset: -.55em;
  content: '';
  border: 1px solid rgba(255, 255, 255, .85);
  border-radius: 50%;
  opacity: 0;
  transform: scale(.8);
  transition: opacity .3s ease, transform .35s var(--ease-paper);
}
.product-wrapper__swatch:hover { transform: scale(1.12) rotate(-6deg); }
.product-wrapper__swatch.is-active::after { opacity: 1; transform: scale(1); }

.product-wrapper__link { margin-top: 1em; }

/* ---- responsive ---------------------------------------------------------- */

@media (max-width: 1023px) {
  .product-wrapper {
    grid-template-columns: 1fr;
    gap: 1em;
    max-width: 46em;
    text-align: center;
  }
  .product-wrapper__stage { aspect-ratio: 1 / .78; }
  .product-wrapper__bag { width: 58%; }
  .product-wrapper__info { align-items: center; }
  .product-wrapper__name { font-size: 3.6em; }
  .product-wrapper__description { font-size: 1.5em; }
}
</style>
