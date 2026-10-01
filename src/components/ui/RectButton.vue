<script setup>
/* -----------------------------------------------------------------------
   The house CTA.

   Sits a fraction of a degree off-square at rest; on hover it tilts further
   and the top-right corner folds back like a turned page, with a paper
   highlight underneath. Everything is a clip-path so there is no extra
   element flashing in or out.
   ----------------------------------------------------------------------- */
import SvgIcon from './SvgIcon.vue'
import { $audio } from '@/core/audio.js'

const props = defineProps({
  text: { type: String, default: '' },
  href: { type: String, default: '' },
  target: { type: String, default: '' },
  icon: { type: String, default: '' },
  small: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

function onClick(e) {
  if (props.disabled) return
  $audio.playSound('ui_click')
  emit('click', e)
}

function onEnter() {
  if (!props.disabled) $audio.playSound('ui_hover', { volume: 0.5 })
}
</script>

<template>
  <div class="rect-button">
    <component
      :is="href ? 'a' : 'button'"
      class="rect-button__cta"
      :class="{ small, 'is-disabled': disabled }"
      :href="href || undefined"
      :target="target || undefined"
      :rel="target === '_blank' ? 'noopener noreferrer' : undefined"
      :disabled="href ? undefined : disabled"
      @click="onClick"
      @mouseenter="onEnter"
    >
      <SvgIcon v-if="icon" :id="icon" class="rect-button__icon" />
      <slot>
        <span class="rect-button__text">{{ text }}</span>
      </slot>
      <span class="rect-button__flap" />
    </component>
  </div>
</template>

<style scoped>
.rect-button { color: #000; }

.rect-button .rect-button__cta {
  position: relative;
  z-index: 5;
  display: flex;
  gap: 1.15em;
  align-items: center;
  height: 4.8em;
  padding: 0 1.8em;
  cursor: pointer;
  background-color: #fff;
  clip-path: polygon(0 0, 100% 0, 100% 0, 100% 100%, 0 100%);
  transform: rotate(-0.59deg);
  transition: transform .4s var(--ease-paper), clip-path .4s var(--ease-paper);
}

@media (hover: hover) {
  .rect-button .rect-button__cta:hover {
    clip-path: polygon(0 0, calc(100% - 1.6em) 0, 100% 1.6em, 100% 100%, 0 100%);
    transform: rotate(-2deg);
  }
  .rect-button .rect-button__cta:hover svg { animation: jitter-subtle .4s infinite ease-in-out; }
  .rect-button .rect-button__cta:hover .rect-button__flap { transform: scale(1); }
}

.rect-button .rect-button__cta.small { height: 4em; }
.rect-button .rect-button__cta.is-disabled { pointer-events: none; opacity: .45; }
.rect-button .rect-button__cta :deep(svg) { width: auto; height: 1.5em; }

.rect-button__flap {
  position: absolute;
  top: 0; right: 0;
  width: 1.6em; height: 1.6em;
  pointer-events: none;
  background: linear-gradient(225deg, #ffffffea 49%, #f0f0f0 51%, #dedede);
  border-bottom-left-radius: .8em;
  transform: scale(0);
  transform-origin: top right;
  transition: transform .4s var(--ease-paper);
}

.rect-button__text {
  font-size: 1.4em;
  white-space: nowrap;
}
</style>
