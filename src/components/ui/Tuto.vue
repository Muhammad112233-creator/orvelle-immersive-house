<script setup>
/* Full-bleed instruction layer: a darkening gradient plus a line of copy
   that sits near whatever you are supposed to touch. */
defineProps({
  text: { type: String, default: '' },
  front: { type: Boolean, default: false },
  hideOverlay: { type: Boolean, default: false },
  position: { type: Object, default: null }, // { x, y } in px
})
</script>

<template>
  <div class="tuto" :class="{ 'is-front': front, 'hide-overlay': hideOverlay }">
    <p
      v-if="text"
      class="tuto__text"
      :style="position ? { left: position.x + 'px', top: position.y + 'px', transform: 'translate(-50%, -50%)' } : null"
      :class="{ 'tuto__text--anchored': !!position }"
      v-html="text"
    />
    <slot />
  </div>
</template>

<style scoped>
.tuto {
  position: fixed;
  top: 0; left: 0;
  z-index: 1;
  width: 100%;
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100);
  pointer-events: none;
}
.tuto.is-front { z-index: 3; }

.tuto::after {
  position: absolute;
  top: 0; left: 0;
  z-index: -1;
  width: 100vw;
  height: 100%;
  content: '';
  background: linear-gradient(180deg, transparent, #000);
  opacity: .5;
}
.tuto.hide-overlay::after { opacity: 0; transition: opacity 0ms; }

.tuto__text {
  position: absolute;
  bottom: 16vh;
  left: 0;
  width: 100%;
  font-family: 'WorkSans', sans-serif;
  font-size: 1.9em;
  line-height: 1.25;
  color: #fff;
  text-align: center;
  text-shadow: 0 1px 12px rgba(0, 0, 0, .55);
  animation: tuto-in 1.4s var(--ease-out-expo) both;
}
.tuto__text--anchored {
  bottom: auto;
  width: auto;
  max-width: 16em;
  text-align: center;
}

@keyframes tuto-in {
  from { opacity: 0; transform: translateY(1.2em); }
  to   { opacity: 1; transform: translateY(0); }
}
.tuto__text--anchored {
  animation: tuto-in-anchored 1.4s var(--ease-out-expo) both;
}
@keyframes tuto-in-anchored {
  from { opacity: 0; }
  to   { opacity: 1; }
}
</style>
