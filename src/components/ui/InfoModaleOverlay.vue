<template><div class="infos-modale-overlay" /></template>

<style scoped>
.infos-modale-overlay {
  position: fixed;
  top: 0; left: 0;
  z-index: 3;
  width: 100vw;
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100);
  pointer-events: none;
  background: linear-gradient(180deg, transparent, #000);
  opacity: .5;
}
</style>
