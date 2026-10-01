<script setup>
import CounterAction from '@/components/ui/CounterAction.vue'
import { $l } from '@/content/site.js'

defineProps({ room: { type: Object, required: true } })
const emit = defineEmits(['counter'])
</script>

<template>
  <div class="room-header">
    <div class="room-header__title">
      <span class="room-header__chapter">{{ $l(`room.${room.id}.chapter`) }}</span>
      <h1 class="room-header__name">{{ $l(`room.${room.id}.title`) }}</h1>
    </div>
    <CounterAction class="room-header__counter" @click="emit('counter')" />
  </div>
</template>

<style scoped>
.room-header {
  position: fixed;
  top: 0; left: 0;
  z-index: 5;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100vw;
  padding: calc(var(--header-height) + 2em) 2em 0;
  pointer-events: none;
}
.room-header__counter { pointer-events: auto; }

.room-header__title {
  display: flex;
  flex-direction: column;
  gap: .5em;
  transform: rotate(-1.2deg);
}
.room-header__chapter {
  font-family: 'SometypeMono', monospace;
  font-size: 1.2em;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .72);
}
.room-header__name {
  font-size: 2.6em;
  font-weight: 700;
  letter-spacing: .02em;
  text-transform: uppercase;
  color: #fff;
  text-shadow: 0 2px 18px rgba(0, 0, 0, .45);
}

/* The journal button lives top-right, so on narrow screens the counter
   steps aside rather than fighting it for the corner. */
@media (max-width: 767px) {
  .room-header { padding: calc(var(--header-height) + 1.4em) 1.4em 0; }
  .room-header__name { font-size: 2em; }
  .room-header__counter { margin-right: 5.6em; }
}
</style>
