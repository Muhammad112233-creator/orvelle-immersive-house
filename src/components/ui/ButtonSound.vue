<script setup>
import { computed } from 'vue'
import ButtonUi from './ButtonUi.vue'
import SvgIcon from './SvgIcon.vue'
import { $audio } from '@/core/audio.js'
import { $store } from '@/core/store.js'
import { $l } from '@/content/site.js'

/* Sound toggle. Starts muted because browsers insist, and the preloader
   already told the visitor to turn it on. */
const muted = computed(() => $store.isMuted)
const label = computed(() => (muted.value ? $l('aria.unmute') : $l('aria.mute')))

function toggle() {
  $audio.unlock()
  $audio.toggleMute()
}
</script>

<template>
  <div class="button-sound">
    <ButtonUi :aria-label="label" @click="toggle">
      <SvgIcon :id="muted ? 'mute' : 'sound'" :class="muted ? 'icon-mute' : 'icon-sound'" />
    </ButtonUi>
  </div>
</template>

<style scoped>
.button-sound {
  position: fixed;
  right: 2em;
  bottom: calc(2em + env(safe-area-inset-bottom));
  z-index: 6;
  transform: rotate(-8deg);
}
.button-sound :deep(.icon-sound path),
.button-sound :deep(.icon-mute path) {
  fill: none;
  stroke: #000;
  stroke-width: 1.74px;
}
</style>
