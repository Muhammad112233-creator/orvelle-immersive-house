<script setup>
/* A strip of masking tape. Two variants so no two pieces look identical. */
defineProps({
  rotate: { type: Number, default: -34 },
  variant: { type: String, default: 'a' },
})
</script>

<template>
  <span class="tape" :class="`tape--${variant}`" :style="{ '--rotate': `${rotate}deg` }">
    <span class="tape__fibre" />
  </span>
</template>

<style scoped>
.tape {
  position: absolute;
  z-index: 3;
  display: block;
  width: 9em;
  height: 2.6em;
  background: rgba(238, 226, 183, .78);
  box-shadow: 0 .2em .5em rgba(90, 70, 30, .22);
  transform: rotate(var(--rotate));
  pointer-events: none;
}
/* torn ends */
.tape::before,
.tape::after {
  position: absolute;
  top: 0; bottom: 0;
  width: .9em;
  content: '';
  background: inherit;
}
.tape::before { left: -.85em; clip-path: polygon(100% 0, 0 18%, 100% 34%, 10% 56%, 100% 74%, 20% 100%, 100% 100%); }
.tape::after  { right: -.85em; clip-path: polygon(0 0, 100% 16%, 0 36%, 90% 58%, 0 76%, 80% 100%, 0 100%); }

.tape__fibre {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    90deg,
    rgba(160, 140, 90, .09) 0 1px,
    transparent 1px 4px
  );
  mix-blend-mode: multiply;
}

.tape--b { height: 2.1em; background: rgba(246, 238, 210, .72); }
</style>
