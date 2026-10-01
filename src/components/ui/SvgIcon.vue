<script setup>
import { computed } from 'vue'

/* ---------------------------------------------------------------------------
   Inline icon set.

   Everything is drawn with a slightly uneven hand — the strokes do not line
   up to whole pixels and the curves are not symmetrical. That irregularity is
   what lets a vector icon sit next to a handwritten journal without looking
   like it was pasted in from a different project.
   --------------------------------------------------------------------------- */

const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, default: '' },
})

const ICONS = {
  // Soft organic halo behind every hotspot
  blob: {
    box: '0 0 100 100',
    body: `<path d="M50.8 6.2c13.4-1.1 27.9 6.3 36.2 17.2 8.4 10.9 10.6 25.3 6.2 38.4-4.4 13.1-15.4 24.9-28.9 29.8-13.5 4.9-29.5 2.9-41.2-5.1C11.4 78.5 4 64.6 3.2 50.4 2.4 36.2 8.2 21.7 18.6 13.9 29 6.1 37.4 7.3 50.8 6.2Z" fill="currentColor"/>`,
  },

  pencil: {
    box: '0 0 24 24',
    body: `<path d="M4.3 19.9 3.6 20.5l.7-3.2L16.1 5.4a2.1 2.1 0 0 1 3 .1l.1.1c.8.8.8 2.2 0 3L7.5 20.3l-3.2.7Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="m14.8 7 3.1 3.1" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  },

  check: {
    box: '0 0 24 24',
    body: `<path d="M4.6 12.8 9.9 18 19.6 6.2" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>`,
  },

  bag: {
    box: '0 0 24 24',
    body: `<path d="M4.2 8.6h15.5l-1 11.9H5.3L4.2 8.6Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.5 10.3V7.1a3.5 3.5 0 0 1 7 0v3.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  },

  journal: {
    box: '0 0 24 24',
    body: `<path d="M5.1 3.4h11.2l3 3.1v14.2H5.1V3.4Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.3 9.1h7.4M8.3 12.4h7.4M8.3 15.7h4.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  },

  close: {
    box: '0 0 24 24',
    body: `<path d="M5.6 5.3 18.5 18.6M18.4 5.4 5.5 18.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  },

  sound: {
    box: '0 0 66 66',
    body: `<path d="m39.93 26.48.13.22c2.16 3.6 2.11 8.11-.13 11.66m4.8-15.63.27.36c4.32 5.87 4.22 13.23-.27 19.03m-21.3-4.53-4.78-.95c-.8-.16-1.38-.84-1.41-1.65l-.2-5.1c-.03-.84.53-1.58 1.35-1.77l6.26-1.49 7.44-6.33c1.15-.98 2.92-.14 2.89 1.37l-.45 21.91c-.03 1.5-1.8 2.27-2.92 1.28l-8.18-7.26Z" fill="none" stroke="currentColor" stroke-width="1.74"/>`,
  },

  mute: {
    box: '0 0 66 66',
    body: `<path d="m23.43 38.21-4.78-.95c-.8-.16-1.38-.84-1.41-1.65l-.2-5.1c-.03-.84.53-1.58 1.35-1.77l6.26-1.49 7.44-6.33c1.15-.98 2.92-.14 2.89 1.37l-.45 21.91c-.03 1.5-1.8 2.27-2.92 1.28l-8.18-7.26Z" fill="none" stroke="currentColor" stroke-width="1.74"/><path d="m40.2 27.6 10.6 10.9M50.8 27.6 40.2 38.5" fill="none" stroke="currentColor" stroke-width="1.74" stroke-linecap="round"/>`,
  },

  arrow: {
    box: '0 0 24 16',
    body: `<path d="M1 8.1h21M15.2 1.4 22.1 8l-6.9 6.7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  },

  door: {
    box: '0 0 15 20',
    body: `<path d="M3.24 17.49 3.09 2.81l3-.03M7.44 11.2h.89M12.76 17.3l-6.45 1.79L6.12.86l6.48 1.71.15 14.73Z" fill="none" stroke="currentColor" stroke-width="1"/>`,
  },

  play: {
    box: '0 0 24 24',
    body: `<path d="M7.6 4.2 19.3 12 7.6 19.8V4.2Z" fill="currentColor"/>`,
  },

  share: {
    box: '0 0 24 24',
    body: `<circle cx="18" cy="5.4" r="2.9" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="5.8" cy="12.1" r="2.9" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="18" cy="18.8" r="2.9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m8.4 10.7 7.1-3.9M8.4 13.5l7.1 3.9" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  },

  eye: {
    box: '0 0 24 24',
    body: `<path d="M1.6 12S5.9 5.2 12 5.2 22.4 12 22.4 12 18.1 18.8 12 18.8 1.6 12 1.6 12Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  },

  hand: {
    box: '0 0 24 24',
    body: `<path d="M8.4 11.1V4.9a1.6 1.6 0 1 1 3.2 0v5.4m0-.6V3.4a1.6 1.6 0 1 1 3.2 0v6.5m0-.3V5.4a1.6 1.6 0 1 1 3.2 0v8.1c0 4.2-2.5 7.1-6.3 7.1-3.6 0-5.2-2-6.6-4.6l-1.9-3.5a1.6 1.6 0 0 1 2.7-1.7l1.6 2.3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  },

  phone: {
    box: '0 0 24 24',
    body: `<path d="M4.6 8.1C4.6 5.3 7.9 3.3 12 3.3s7.4 2 7.4 4.8l-.3 2.6a1.3 1.3 0 0 1-1.4 1.1l-2.1-.2a1.3 1.3 0 0 1-1.1-1.3V8.9c-.8-.3-1.6-.4-2.5-.4s-1.7.1-2.5.4v1.4a1.3 1.3 0 0 1-1.1 1.3l-2.1.2a1.3 1.3 0 0 1-1.4-1.1l-.3-2.6Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M5.3 20.6h13.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  },

  plus: {
    box: '0 0 24 24',
    body: `<path d="M12 4.8v14.4M4.8 12h14.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  },

  link: {
    box: '0 0 24 24',
    body: `<path d="M10.1 13.9a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1.3 1.3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M13.9 10.1a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.3-1.3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  },
}

const icon = computed(() => ICONS[props.id] || ICONS.plus)
</script>

<template>
  <svg
    class="svg-icon"
    :class="`svg-icon--${id}`"
    :viewBox="icon.box"
    :aria-hidden="title ? undefined : 'true'"
    :role="title ? 'img' : undefined"
    xmlns="http://www.w3.org/2000/svg"
    v-html="(title ? `<title>${title}</title>` : '') + icon.body"
  />
</template>

<style scoped>
.svg-icon {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
</style>
