<script setup>
import ButtonUi from './ButtonUi.vue'
import SvgIcon from './SvgIcon.vue'

defineProps({ ariaLabel: { type: String, default: 'Close' }, hidden: { type: Boolean, default: false } })
const emit = defineEmits(['click'])
</script>

<template>
  <div class="close-button" :class="{ 'is-hidden': hidden }">
    <ButtonUi :aria-label="ariaLabel" @click="emit('click')">
      <SvgIcon id="close" />
    </ButtonUi>
  </div>
</template>

<style scoped>
.close-button {
  position: absolute;
  top: calc(var(--header-height) + 2em);
  left: 2em;
  z-index: 8;
  pointer-events: auto;
  opacity: 1;
  transition: opacity .5s var(--ease-out-quint);
}
.close-button.is-hidden { pointer-events: none; opacity: 0; }
</style>
