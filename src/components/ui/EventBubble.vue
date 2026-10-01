<template>
  <span class="event-bubble"><span class="event-bubble__inner"><slot /></span></span>
</template>

<style scoped>
.event-bubble {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.8em;
  aspect-ratio: 1;
  font-size: 1.3em;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  background-color: #9a0900;
  border-radius: 50%;
}
.event-bubble__inner { transform: rotate(10deg); }
</style>
