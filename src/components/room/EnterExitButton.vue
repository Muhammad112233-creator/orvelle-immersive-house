<script setup>
import RectButton from '@/components/ui/RectButton.vue'

defineProps({
  text: { type: String, default: '' },
  icon: { type: String, default: 'door' },
  roomCompleted: { type: Boolean, default: false },
})
const emit = defineEmits(['click'])
</script>

<template>
  <div class="enter-exit-button" :class="{ 'enter-exit-button--completed': roomCompleted }">
    <RectButton :text="text" :icon="icon" @click="emit('click')" />
  </div>
</template>

<style scoped>
.enter-exit-button {
  position: fixed;
  bottom: calc(6vh + env(safe-area-inset-bottom));
  left: 0;
  z-index: 5;
  display: flex;
  justify-content: center;
  width: 100%;
}
/* Once a room is finished the button starts fidgeting, which is all the
   prompting most people need to move on. */
.enter-exit-button--completed :deep(.rect-button__cta) {
  animation: wiggle 3s ease-in-out infinite;
}
@keyframes wiggle {
  0%, 100% { transform: rotate(-.59deg); }
  5%  { transform: rotate(-5deg); }
  10% { transform: rotate(5deg); }
  15% { transform: rotate(-5deg); }
  20% { transform: rotate(-.59deg); }
}
</style>
