<script setup>
import { computed } from 'vue'
import JournalTape from './JournalTape.vue'
import RectButton from '@/components/ui/RectButton.vue'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import { site } from '@/content/site.js'
import { asset } from '@/core/asset.js'

/* ---------------------------------------------------------------------------
   One entry in the journal.

   Written entries show the photograph and the handwritten line. Unwritten
   ones keep their slot — taped-down blank paper with the room it belongs to
   pencilled on it — so the shape of what is missing is visible from the
   start. That is what makes the last one worth going back for.
   --------------------------------------------------------------------------- */

const props = defineProps({
  line: { type: Object, required: true },
  written: { type: Boolean, default: false },
  index: { type: Number, default: 0 },
})

const emit = defineEmits(['goto'])

const title = computed(() => site.journal.lines[`title_${props.line.id}`])
const description = computed(() => site.journal.lines[`description_${props.line.id}`])
const shopTitle = computed(() => site.journal.lines[`shop-title_${props.line.id}`])
const shopUrl = computed(() => site.journal.lines[`shop-url_${props.line.id}`])
const roomTitle = computed(() => site.room[props.line.room]?.title ?? '')

const PICTURES = {
  journal: 'images/journal/cover-cut.png',
  viewer: 'images/viewer/slide-1.jpg',
  phone: 'images/polaroids/polaroid-1.jpg',
  quilt: 'images/quilt/stage-4.jpg',
  colors: 'images/viewer/slide-2.jpg',
}
const picture = computed(() => asset(PICTURES[props.line.picture]))

/* Deterministic but irregular: every entry sits at its own angle, and the
   same entry always sits at the same angle. */
const tilt = computed(() => [-2.4, 1.8, -1.2, 2.6, -1.9][props.index % 5])
const pictureTilt = computed(() => [3.1, -2.2, 1.6, -3.4, 2.1][props.index % 5])
</script>

<template>
  <article class="item-manifesto" :class="{ 'is-locked': !written }" :style="{ '--tilt': `${tilt}deg` }">

    <figure class="item-picture" :style="{ '--p-tilt': `${pictureTilt}deg` }">
      <JournalTape :rotate="-32" :variant="index % 2 ? 'b' : 'a'" class="item-picture__tape item-picture__tape--tl" />
      <JournalTape :rotate="-28" :variant="index % 2 ? 'a' : 'b'" class="item-picture__tape item-picture__tape--br" />

      <div class="item-picture__frame">
        <img v-if="written" :src="picture" :alt="title">
        <div v-else class="item-picture__blank">
          <SvgIcon id="pencil" class="item-picture__icon" />
          <span>{{ roomTitle }}</span>
        </div>
      </div>
    </figure>

    <div class="item-body">
      <span class="item-title__number">{{ String(line.id).padStart(2, '0') }}</span>

      <h3 class="item-title">
        <span v-if="written" class="item-title__text">{{ title }}</span>
        <span v-else class="item-title__rules">
          <span v-for="n in 2" :key="n" class="item-title__rule" />
        </span>
      </h3>

      <p v-if="written && description" class="item-description" v-html="description" />

      <RectButton
        v-if="written && shopTitle"
        class="item-shop"
        small
        icon="bag"
        :text="shopTitle"
        :href="shopUrl"
        target="_blank"
      />

      <button v-if="!written" class="item-goto" @click="emit('goto', line.room)">
        <SvgIcon id="arrow" />
        <span>Find it in {{ roomTitle }}</span>
      </button>
    </div>
  </article>
</template>

<style scoped>
.item-manifesto {
  display: grid;
  grid-template-columns: 22em 1fr;
  gap: 3.4em;
  align-items: center;
  padding: 3em 0;
  transform: rotate(var(--tilt));
}
.item-manifesto:nth-child(even) { grid-template-columns: 1fr 22em; }
.item-manifesto:nth-child(even) .item-picture { order: 2; }

/* ---- picture ------------------------------------------------------------- */

.item-picture {
  position: relative;
  margin: 0;
  transform: rotate(var(--p-tilt));
}
.item-picture__tape--tl { top: -1.2em; left: -2em; }
.item-picture__tape--br { right: -2em; bottom: -1em; }

.item-picture__frame {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  padding: .8em .8em 3.2em;
  background: linear-gradient(170deg, #fffdf7, #ece5d4);
  box-shadow: 0 1.4em 3em rgba(60, 40, 10, .3);
}
.item-picture__frame img {
  width: 100%; height: 100%;
  object-fit: cover;
  filter: saturate(.94) contrast(1.02);
}

.item-picture__blank {
  display: flex;
  flex-direction: column;
  gap: .8em;
  align-items: center;
  justify-content: center;
  width: 100%; height: 100%;
  font-family: 'SometypeMono', monospace;
  font-size: 1.2em;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: rgba(90, 70, 40, .45);
  background: repeating-linear-gradient(
    -45deg,
    rgba(150, 125, 80, .07) 0 8px,
    transparent 8px 18px
  );
}
.item-picture__icon { width: 2.4em; opacity: .5; }

/* ---- body ---------------------------------------------------------------- */

.item-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.2em;
}

.item-title__number {
  font-family: 'SometypeMono', monospace;
  font-size: 1.3em;
  letter-spacing: .3em;
  color: rgba(90, 70, 40, .55);
}

.item-title {
  font-family: 'Marginalia', cursive;
  font-size: 4.6em;
  font-weight: 600;
  line-height: .98;
  color: #22317a;
}
.is-locked .item-title { width: 100%; }

.item-title__rules { display: flex; flex-direction: column; gap: .32em; width: 100%; padding: .3em 0; }
.item-title__rule { display: block; height: 2px; background: rgba(120, 90, 50, .26); }
.item-title__rule:last-child { width: 62%; }

.item-description {
  max-width: 34em;
  font-size: 1.55em;
  line-height: 1.6;
  color: rgba(50, 38, 22, .85);
}

.item-goto {
  display: flex;
  gap: .7em;
  align-items: center;
  font-family: 'SometypeMono', monospace;
  font-size: 1.2em;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--ui-color-blue);
  background: none;
}
.item-goto :deep(svg) { width: 1.8em; stroke: currentColor; }
.item-goto:hover :deep(svg) { animation: jitter-subtle .4s infinite ease-in-out; }

@media (max-width: 1023px) {
  .item-manifesto,
  .item-manifesto:nth-child(even) {
    grid-template-columns: 1fr;
    gap: 1.8em;
    padding: 2em 0;
  }
  .item-manifesto:nth-child(even) .item-picture { order: 0; }
  .item-picture { width: 17em; }
  .item-title { font-size: 3.4em; }
}
</style>
