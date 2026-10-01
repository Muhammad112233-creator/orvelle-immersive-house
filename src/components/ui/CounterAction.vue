<script setup>
import { watch, onMounted, computed } from 'vue'
import SvgIcon from './SvgIcon.vue'
import { useOdometer } from '@/composables/useOdometer.js'
import { $game } from '@/core/store.js'
import { TOTAL_LINES } from '@/content/rooms.js'
import { $l } from '@/content/site.js'

/* Notes written / notes total. Turns blue and becomes clickable the moment
   the journal is finished. */
const emit = defineEmits(['click'])

const completed = computed(() => $game.isGameCompleted.value)
const count = computed(() => $game.count.value)

const { digitStyles, reelRefs, setNumber, REPEATS } = useOdometer({ digits: 1, duration: 420 })

onMounted(() => setNumber(count.value))
watch(count, (v) => setNumber(v))
</script>

<template>
  <div class="counter-action" :class="{ completed }">
    <button class="counter-action__button" @click="completed && emit('click')">
      <SvgIcon :id="completed ? 'check' : 'pencil'" class="counter-action__icon" />
      <span class="counter-action__label">{{ $l('journal.counter_label') }}</span>
      <span class="counter-action__texts">
        <span class="counter-action__odometer">
          <span
            v-for="(style, i) in digitStyles"
            :key="i"
            :ref="(el) => { if (el) reelRefs[i] = el }"
            class="counter-action__reel"
            :style="style"
          >
            <span v-for="n in 10 * REPEATS" :key="n">{{ (n - 1) % 10 }}</span>
          </span>
        </span>
        <span>/</span>
        <span>{{ TOTAL_LINES }}</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.counter-action__button {
  display: flex;
  gap: .8em;
  align-items: center;
  height: 4.8em;
  padding: 0 1.1em;
  color: #757575;
  pointer-events: none;
  background-color: #fff;
  border-radius: .2em;
  box-shadow: .5px .5px 1px rgba(0, 0, 0, .25);
  transform: rotate(-2deg);
  transition: color .4s ease, background-color .4s ease;
}
.completed .counter-action__button {
  color: #fff;
  pointer-events: auto;
  cursor: pointer;
  background-color: var(--ui-color-blue);
}
.counter-action__icon {
  width: 1.5em;
  height: auto;
  fill: none;
  stroke: currentColor;
}
.counter-action__label { margin-left: .2em; font-size: 1.6em; }
.counter-action__texts { display: flex; font-size: 1.6em; line-height: 1; }
.counter-action__odometer {
  display: inline-flex;
  align-items: flex-start;
  height: 1em;
  overflow: hidden;
}
.counter-action__reel {
  display: flex;
  flex-direction: column;
  transition: transform .3s ease-out;
}
.counter-action__reel > span {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  height: 1em;
}
</style>
