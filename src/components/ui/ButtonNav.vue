<script setup>
import SvgIcon from './SvgIcon.vue'
import { $audio } from '@/core/audio.js'

defineProps({
  direction: { type: String, default: 'next' },
  disabled: { type: Boolean, default: false },
  ariaLabel: { type: String, default: '' },
})
const emit = defineEmits(['click'])
</script>

<template>
  <button
    class="button-nav"
    :class="direction"
    :disabled="disabled"
    :aria-label="ariaLabel || undefined"
    @click="$audio.playSound('ui_click'); emit('click')"
  >
    <span class="button-nav__icon-wrapper">
      <SvgIcon id="arrow" class="button-nav__icon" />
    </span>
  </button>
</template>

<style scoped>
.button-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.4em;
  height: 4.4em;
  background-color: #fff;
  border-radius: 50%;
  transition: opacity .3s ease;
}
.button-nav:hover .button-nav__icon-wrapper {
  animation: jitter-subtle .4s infinite ease-in-out forwards;
}
.button-nav.prev { transform: rotate(-180deg); }
.button-nav__icon-wrapper { display: inline-block; }
.button-nav :deep(.button-nav__icon) {
  width: 2em;
  fill: none;
  stroke: #000;
  transform: rotate(0deg);
}
.button-nav:disabled { pointer-events: none; outline: 1px solid #fff; opacity: .2; }
.button-nav:disabled :deep(.button-nav__icon) { stroke: rgba(30, 30, 30, .8); }
</style>
