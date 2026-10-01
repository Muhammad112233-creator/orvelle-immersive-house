<script setup>
/* Square chrome button: close, sound, journal all sit on this base. */
import { $audio } from '@/core/audio.js'

defineProps({ ariaLabel: { type: String, default: '' } })
const emit = defineEmits(['click'])

function onClick(e) {
  $audio.playSound('ui_click', { volume: 0.5 })
  emit('click', e)
}
</script>

<template>
  <button class="btn-ui" :aria-label="ariaLabel || undefined" @click="onClick">
    <slot />
    <span class="btn-ui__flap" />
  </button>
</template>

<style scoped>
.btn-ui {
  position: relative;
  min-width: 4.4em;
  height: 4.4em;
  background-color: #fff;
  border-radius: .4em;
  box-shadow: .5px .5px 1px rgba(0, 0, 0, .25);
  clip-path: polygon(0 0, 100% 0, 100% 0, 100% 100%, 0 100%);
  transform: rotate(4deg);
  transition: transform .4s var(--ease-paper), clip-path .4s var(--ease-paper);
}

@media (hover: hover) {
  .btn-ui:hover {
    clip-path: polygon(0 0, calc(100% - 1.2em) 0, 100% 1.2em, 100% 100%, 0 100%);
    transform: rotate(-2deg);
  }
  .btn-ui:hover .btn-ui__flap { transform: scale(1); }
  .btn-ui:hover :deep(svg) { animation: jitter-subtle .4s infinite ease-in-out; }
}

.btn-ui :deep(svg) {
  position: relative;
  width: 2em;
  height: auto;
  margin: 0 auto;
  color: #000;
}

.btn-ui__flap {
  position: absolute;
  top: 0; right: 0;
  width: 1.2em; height: 1.2em;
  pointer-events: none;
  background: linear-gradient(225deg, #ffffffea 49%, #f0f0f0 51%, #dedede);
  border-bottom-left-radius: .6em;
  border-top-right-radius: .4em;
  transform: scale(0);
  transform-origin: top right;
  transition: transform .4s var(--ease-paper);
}
</style>
