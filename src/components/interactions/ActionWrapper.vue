<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import CloseButton from '@/components/ui/CloseButton.vue'
import { $l } from '@/content/site.js'
import { $store } from '@/core/store.js'

/* ---------------------------------------------------------------------------
   Shell shared by every interaction.

   Handles the backdrop, the close affordance and the "settling in" beat —
   each panel fades up from the room rather than cutting, so the room you
   came from stays present behind the thing you are looking at.
   --------------------------------------------------------------------------- */

const props = defineProps({
  background: { type: String, default: '' },
  colour: { type: String, default: '#0c0f60' },
  closable: { type: Boolean, default: true },
  label: { type: String, default: '' },
  dim: { type: Number, default: 0.82 },
  padded: { type: Boolean, default: true },
})

const emit = defineEmits(['close'])
const entered = ref(false)

onMounted(() => {
  requestAnimationFrame(() => { entered.value = true })
  $store.uiHidden = false
})

onBeforeUnmount(() => { $store.uiHidden = false })
</script>

<template>
  <section
    class="action-wrapper"
    :class="{ 'is-entered': entered, 'is-padded': padded }"
    :style="{ '--action-colour': colour }"
  >
    <div class="action-wrapper__backdrop" :style="{ opacity: dim }" />
    <div
      v-if="background"
      class="action-wrapper__photo"
      :style="{ backgroundImage: `url(${background})` }"
    />
    <div class="action-wrapper__grain" />

    <CloseButton
      v-if="closable"
      :aria-label="$l('aria.close_interaction')"
      @click="emit('close')"
    />

    <p v-if="label" class="action-wrapper__label">{{ label }}</p>

    <div class="action-wrapper__content">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.action-wrapper {
  position: fixed;
  inset: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.action-wrapper__backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 100% at 50% 40%, rgba(0, 0, 0, .25), rgba(0, 0, 0, .9)),
    var(--action-colour);
  transition: opacity 1s var(--ease-out-quint);
}

.action-wrapper__photo {
  position: absolute;
  inset: -3%;
  background-position: center;
  background-size: cover;
  opacity: 0;
  transform: scale(1.08);
  transition: opacity 1.3s var(--ease-out-quint), transform 2.4s var(--ease-out-quint);
}
.is-entered .action-wrapper__photo { opacity: .5; transform: scale(1); }

/* A fixed noise field over the whole panel ties the photographic and the
   drawn elements into one surface. */
.action-wrapper__grain {
  position: absolute;
  inset: -50%;
  pointer-events: none;
  opacity: .22;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.5'/></svg>");
  animation: grain-shift 1.6s steps(5) infinite;
}

.action-wrapper__label {
  position: absolute;
  top: calc(var(--header-height) + 2.6em);
  left: 50%;
  font-family: 'SometypeMono', monospace;
  font-size: 1.2em;
  letter-spacing: .26em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .62);
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity .9s .4s ease;
}
.is-entered .action-wrapper__label { opacity: 1; }

.action-wrapper__content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.is-padded .action-wrapper__content { padding: 9em 2em 11em; }

@media (max-width: 767px) {
  .is-padded .action-wrapper__content { padding: 8em 1.2em 12em; }
}
</style>
