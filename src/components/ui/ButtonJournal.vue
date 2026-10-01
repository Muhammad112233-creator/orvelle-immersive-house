<script setup>
import { computed } from 'vue'
import ButtonUi from './ButtonUi.vue'
import SvgIcon from './SvgIcon.vue'
import EventBubble from './EventBubble.vue'
import { $store, $game } from '@/core/store.js'
import { $audio } from '@/core/audio.js'
import { $l } from '@/content/site.js'

/* Top-right journal toggle. The red bubble counts notes you have written
   but not yet looked at. */
const props = defineProps({ unread: { type: Number, default: 0 } })

const isActive = computed(() => $store.isJournalOpen)
const label = computed(() => (isActive.value ? $l('aria.close_journal') : $l('aria.open_journal')))

function toggle() {
  $audio.playSound($store.isJournalOpen ? 'journal_close' : 'journal_open')
  $store.isJournalOpen = !$store.isJournalOpen
  $game.state.journalOpen = $store.isJournalOpen
}
</script>

<template>
  <div class="button-manifesto" :class="{ 'is-active': isActive }">
    <ButtonUi :aria-label="label" @click="toggle">
      <SvgIcon id="journal" class="button-manifesto__icon button-manifesto__icon--notebook" />
      <SvgIcon id="close" class="button-manifesto__icon button-manifesto__icon--close" />
    </ButtonUi>
    <Transition name="bubble">
      <EventBubble v-if="props.unread > 0 && !isActive" class="button-manifesto__bubble">
        {{ props.unread }}
      </EventBubble>
    </Transition>
  </div>
</template>

<style scoped>
.button-manifesto {
  position: fixed;
  top: calc(var(--header-height) + 2em);
  right: 2em;
  z-index: 7;
  opacity: 1;
  transform: rotate(-1.6deg);
  transition: opacity .25s cubic-bezier(.55, 0, .1, 1);
}
.button-manifesto.is-hidden { pointer-events: none; opacity: 0; }

.button-manifesto :deep(.button-manifesto__icon) {
  position: absolute;
  inset: 0;
  width: 2em;
  margin: auto;
  transition: opacity .2s cubic-bezier(.075, .82, .165, 1),
              transform .8s cubic-bezier(.075, .82, .165, 1);
}
.is-active :deep(.button-manifesto__icon--notebook) {
  visibility: hidden; opacity: 0; transform: rotate(45deg);
}
:deep(.button-manifesto__icon--close) {
  visibility: hidden; opacity: 0; transform: rotate(-45deg);
}
.is-active :deep(.button-manifesto__icon--close) {
  visibility: visible; opacity: 1; transform: rotate(0);
}

.button-manifesto__bubble {
  position: absolute;
  top: -.6em;
  left: -.6em;
  z-index: 2;
}
.bubble-enter-from { transform: scale(0); }
.bubble-enter-active { transition: transform .3s cubic-bezier(.34, 1.56, .64, 1); }
.bubble-leave-active { transition: opacity .2s ease; }
.bubble-leave-to { opacity: 0; }
</style>
