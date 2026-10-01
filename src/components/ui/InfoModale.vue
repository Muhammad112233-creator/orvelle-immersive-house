<script setup>
import SvgIcon from './SvgIcon.vue'
import RectButton from './RectButton.vue'
import { $audio } from '@/core/audio.js'

/* The little cream card that explains, rewards and nudges.
   Three shapes: plain (icon + text), btnType (text + CTA), rewardType. */
const props = defineProps({
  text: { type: String, default: '' },
  icon: { type: String, default: '' },
  buttonLabel: { type: String, default: '' },
  type: { type: String, default: 'plain' }, // plain | btnType | rewardType
  closable: { type: Boolean, default: false },
  dismissOnOutside: { type: Boolean, default: false },
})

const emit = defineEmits(['action', 'close'])
</script>

<template>
  <div class="infos-modale" :class="props.type">
    <div
      v-if="dismissOnOutside"
      class="infos-modale__outside"
      @click="$audio.playSound('ui_back'); emit('close')"
    />
    <div class="infos-modale__wrapper">
      <button
        v-if="closable"
        class="infos-modale__close"
        aria-label="Close"
        @click="$audio.playSound('ui_back'); emit('close')"
      >
        <SvgIcon id="close" />
      </button>

      <span v-if="icon" class="infos-modale__icon"><SvgIcon :id="icon" /></span>
      <p v-if="text" class="infos-modale__text" v-html="text" />

      <RectButton
        v-if="buttonLabel"
        class="infos-modale__btn"
        small
        :text="buttonLabel"
        @click="emit('action')"
      />
    </div>
  </div>
</template>

<style scoped>
.infos-modale {
  position: fixed;
  bottom: calc(3em + env(safe-area-inset-bottom));
  left: 0;
  z-index: 5;
  display: flex;
  justify-content: center;
  width: 100%;
}
.infos-modale__outside { position: fixed; inset: 0; z-index: -1; pointer-events: auto; }

.infos-modale__wrapper {
  position: relative;
  display: flex;
  gap: 1.2em;
  align-items: center;
  justify-content: center;
  min-width: 24em;
  min-height: 9.3em;
  padding: 1.6em;
  background-color: var(--ui-color-beige);
  border-radius: .4em;
  box-shadow: 0 0 4px rgba(0, 0, 0, .25);
  transform: rotate(-2deg);
}
.btnType .infos-modale__wrapper,
.rewardType .infos-modale__wrapper { flex-direction: column; padding: 1.2em 2.7em; }
.rewardType .infos-modale__wrapper {
  gap: .5em;
  min-width: 30em;
  max-width: 34em;
  transform: rotate(2deg);
}

.infos-modale__close {
  position: absolute;
  top: -1.4em; right: -1.4em;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.8em;
  aspect-ratio: 1;
  pointer-events: auto;
  background-color: #fff;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(0, 0, 0, .25);
}
.infos-modale__close :deep(svg) { width: 1.2em; color: #000; }

.infos-modale__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  width: 6em; height: 6em;
  padding: 0 1em;
  color: #000;
  background-color: #fff;
  border-radius: 50%;
  box-shadow: .7px .7px 1.41px rgba(0, 0, 0, .25);
}
.infos-modale__icon :deep(svg) { width: 100%; height: auto; }

.infos-modale__text {
  font-size: 1.6em;
  line-height: 1.2;
  color: #000;
}
.infos-modale__text :deep(strong) { font-weight: 700; color: var(--ui-color-blue); }
.btnType .infos-modale__text,
.rewardType .infos-modale__text { text-align: center; }

.infos-modale__btn { text-transform: uppercase; pointer-events: auto; }
</style>
