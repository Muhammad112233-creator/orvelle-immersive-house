<script setup>
import { ref, onMounted } from 'vue'

/* ---------------------------------------------------------------------------
   An instant print.

   Ejects, then develops: the image starts as a flat grey-green chemical wash
   and the picture resolves over a couple of seconds by lifting contrast and
   saturation at the same time, the way a real one does.
   --------------------------------------------------------------------------- */

const props = defineProps({
  src: { type: String, required: true },
  caption: { type: String, default: '' },
  rotate: { type: Number, default: 0 },
  index: { type: Number, default: 0 },
  tag: { type: String, default: 'figure' },
  developDelay: { type: Number, default: 550 },
})

const developed = ref(false)
onMounted(() => { setTimeout(() => { developed.value = true }, props.developDelay) })
</script>

<template>
  <component
    :is="tag"
    class="polaroid"
    :class="{ 'is-developed': developed }"
    :style="{ '--rotate': `${rotate}deg`, '--i': index }"
  >
    <span class="polaroid__window">
      <img class="polaroid__image" :src="src" alt="">
      <span class="polaroid__chem" />
      <span class="polaroid__sheen" />
    </span>
    <span v-if="caption" class="polaroid__caption" v-html="caption" />
  </component>
</template>

<style scoped>
.polaroid {
  display: block;
  width: 17em;
  padding: .9em .9em 4.4em;
  margin: 0;
  background: linear-gradient(170deg, #fffdf7, #e9e3d4);
  box-shadow: 0 1.6em 3.4em rgba(0, 0, 0, .55);
  animation: polaroid-eject .85s var(--ease-out-expo) both;
  animation-delay: calc(var(--i) * .08s);
}
@keyframes polaroid-eject {
  from { opacity: 0; transform: translateY(-5em) rotate(0deg) scale(.94); }
  to   { opacity: 1; transform: translateY(0) rotate(var(--rotate)) scale(1); }
}

.polaroid__window {
  position: relative;
  display: block;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #11140f;
}

.polaroid__image {
  width: 100%; height: 100%;
  object-fit: cover;
  filter: contrast(.35) saturate(.1) brightness(.72);
  transform: scale(1.04);
  transition: filter 2.6s var(--ease-out-quint);
}
.is-developed .polaroid__image { filter: contrast(1.04) saturate(1.02) brightness(1); }

/* the undeveloped chemical layer burning off */
.polaroid__chem {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #5c6350, #3d4538 60%, #2a2f26);
  opacity: 1;
  transition: opacity 2.4s var(--ease-out-quint);
}
.is-developed .polaroid__chem { opacity: 0; }

.polaroid__sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(118deg, rgba(255, 255, 255, .16), transparent 36%);
  pointer-events: none;
}

.polaroid__caption {
  display: block;
  padding-top: .9em;
  font-family: 'Marginalia', cursive;
  font-size: 2em;
  line-height: 1.05;
  text-align: center;
  color: #2a3270;
}
</style>
