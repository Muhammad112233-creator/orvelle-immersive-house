<script setup>
import { computed } from 'vue'
import { $voiceover } from '@/core/voiceover.js'
import { $store } from '@/core/store.js'

/* Yellow, hard-outlined, bottom-centre — legible over any room without a
   backing plate, which would otherwise cover the thing being narrated. */
const visible = computed(() => $voiceover.state.visible && $store.subtitlesEnabled)
const text = computed(() => $voiceover.state.subtitle)
</script>

<template>
  <div class="subtitles" :aria-hidden="!visible" aria-live="polite">
    <Transition name="sub">
      <p v-if="visible" :key="text" class="subtitles__text" v-html="text" />
    </Transition>
  </div>
</template>

<style scoped>
.subtitles {
  position: absolute;
  right: 0;
  bottom: env(safe-area-inset-bottom);
  left: 0;
  z-index: 2;
  width: 100%;
  padding: 0 1em 4em;
  text-align: center;
  pointer-events: none;
  user-select: none;
}
.subtitles[aria-hidden='true'] { visibility: hidden; }

.subtitles__text {
  font-family: 'WorkSans', sans-serif;
  font-size: 1.8em;
  font-weight: 400;
  line-height: 1.2;
  color: var(--ui-color-yellow);
  text-shadow:
     1px  0   0 #000, -1px  0   0 #000,
     0    1px 0 #000,  0   -1px 0 #000,
     1px  1px 0 #000, -1px  1px 0 #000,
    -1px -1px 0 #000,  1px -1px 0 #000;
}

.sub-enter-active { transition: opacity .18s ease, transform .18s ease; }
.sub-leave-active { transition: opacity .12s ease; position: absolute; left: 0; right: 0; }
.sub-enter-from { opacity: 0; transform: translateY(4px); }
.sub-leave-to { opacity: 0; }
</style>
