<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { $webgl } from '@/core/webgl/index.js'

const canvas = ref(null)
onMounted(() => $webgl.init(canvas.value))
onBeforeUnmount(() => { /* renderer is a singleton: it outlives the view */ })
</script>

<template>
  <div class="webgl-wrapper">
    <canvas ref="canvas" class="webgl-canvas" />
  </div>
</template>

<style scoped>
.webgl-wrapper { position: fixed; inset: 0; z-index: 0; overflow: clip; contain: strict; }
.webgl-canvas { display: block; width: 100%; height: 100%; outline: none; }
</style>
