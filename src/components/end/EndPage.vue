<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import RectButton from '@/components/ui/RectButton.vue'
import CloseButton from '@/components/ui/CloseButton.vue'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import { journalLines } from '@/content/rooms.js'
import { site, $l, BRAND } from '@/content/site.js'
import { $store } from '@/core/store.js'
import { $audio } from '@/core/audio.js'
import { asset } from '@/core/asset.js'

/* ---------------------------------------------------------------------------
   The closing page.

   Everything you wrote, laid out as a single scroll. The five lines come back
   as a stacked list that unmasks line by line as it enters the viewport, the
   photographs drift at different rates, and the two CTAs sit at the bottom.
   Sharing uses the native sheet where there is one and falls back to copying
   the link, with a confirmation that fades itself out.
   --------------------------------------------------------------------------- */

const emit = defineEmits(['close'])

const router = useRouter()
const scroller = ref(null)
const scrolled = ref(0)
const mounted = ref(false)
const copied = ref(false)
const visibleLines = ref(new Set())

const PICTURES = [
  { src: 'images/viewer/slide-3.jpg', rotate: -3.4, depth: 0.12 },
  { src: 'images/viewer/slide-5.jpg', rotate: 2.8, depth: 0.22 },
  { src: 'images/viewer/slide-2.jpg', rotate: -1.6, depth: 0.17 },
]

let observer = null
let copyTimer = null

function onScroll(e) { scrolled.value = e.target.scrollTop }

function close() {
  $audio.playSound('ui_back')
  $store.isEndPageOpen = false
  emit('close')
}

async function share() {
  const url = window.location.origin + window.location.pathname
  const payload = {
    title: site.end.share.title,
    text: site.end.share.text,
    url,
  }
  $audio.playSound('ui_click')

  if (navigator.share) {
    try { await navigator.share(payload); return } catch { /* dismissed */ }
  }
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2400)
  } catch { /* clipboard blocked — nothing useful to say */ }
}

function onKey(e) { if (e.key === 'Escape') close() }

onMounted(() => {
  requestAnimationFrame(() => { mounted.value = true })
  window.addEventListener('keydown', onKey)

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        visibleLines.value = new Set([...visibleLines.value, entry.target.dataset.line])
      }
    })
  }, { threshold: 0.6, root: scroller.value })

  requestAnimationFrame(() => {
    document.querySelectorAll('.end-page__line').forEach((el) => observer.observe(el))
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  clearTimeout(copyTimer)
  observer?.disconnect()
})
</script>

<template>
  <section class="end-page" :class="{ 'is-mounted': mounted }">

    <div class="end-page__background">
      <div class="end-page__background-color" />
      <div class="end-page__background-paper" :style="{ transform: `translateY(${scrolled * -0.05}px)` }" />
      <div class="end-page__background-text end-page__background-text--top"
           :style="{ transform: `translate(-50%, ${scrolled * -0.22}px)` }">{{ BRAND }}</div>
      <div class="end-page__background-text end-page__background-text--bottom"
           :style="{ transform: `translate(-50%, ${scrolled * -0.34}px)` }">{{ BRAND }}</div>
    </div>

    <CloseButton :aria-label="$l('aria.close_end')" @click="close" />

    <div ref="scroller" class="end-page__scroll" @scroll="onScroll">
      <div class="end-page__container">

        <header class="end-page-introduction">
          <div class="end-page-introduction__content">
            <span class="end-page__index">{{ BRAND }} — Autumn</span>
            <h2 class="end-page__title">{{ site.end.title }}</h2>
            <p class="end-page__subtitle">{{ site.end.subtitle }}</p>
          </div>

          <div class="end-page-introduction__pictures">
            <figure
              v-for="(pic, i) in PICTURES"
              :key="pic.src"
              class="end-page-picture"
              :style="{
                '--rotate': `${pic.rotate}deg`,
                '--i': i,
                transform: `translateY(${scrolled * -pic.depth}px) rotate(${pic.rotate}deg)`,
              }"
            >
              <img :src="asset(pic.src)" alt="">
              <span class="end-page-picture__tape" />
            </figure>
          </div>
        </header>

        <ol class="end-page-introduction__lines">
          <li
            v-for="(line, i) in journalLines"
            :key="line.id"
            class="end-page__line"
            :class="{ 'is-visible': visibleLines.has(String(line.id)) }"
            :data-line="line.id"
            :style="{ '--i': i }"
          >
            <span class="end-page__line-index">{{ String(line.id).padStart(2, '0') }}</span>
            <span class="end-page__line-text">
              <span class="end-page__line-front">{{ site.journal.lines[`title_${line.id}`] }}</span>
            </span>
          </li>
        </ol>

        <footer class="end-page__actions">
          <RectButton
            class="discover-button"
            icon="bag"
            :text="site.end.discover.label"
            :href="site.end.discover.link"
            target="_blank"
          />

          <button class="share-button" @click="share">
            <SvgIcon id="share" />
            <span>{{ copied ? site.end.share.copy : site.end.share.label }}</span>
          </button>
        </footer>

        <p class="end-page__colophon">
          {{ BRAND }} — {{ site.end.share.title }}
        </p>

      </div>
    </div>
  </section>
</template>

<style scoped>
.end-page {
  position: fixed;
  inset: 0;
  z-index: 10;
  color: #2b2113;
}

/* ---- background ---------------------------------------------------------- */

.end-page__background { position: absolute; inset: 0; overflow: hidden; }
.end-page__background-color { position: absolute; inset: 0; background: var(--ui-color-beige); }
.end-page__background-paper {
  position: absolute;
  inset: -8%;
  background: url('/images/textures/paper.jpg') center / cover no-repeat;
  mix-blend-mode: multiply;
  opacity: .5;
}
.end-page__background-text {
  position: absolute;
  left: 50%;
  font-size: 26vw;
  font-weight: 700;
  letter-spacing: -.03em;
  text-transform: uppercase;
  color: rgba(120, 92, 48, .08);
  white-space: nowrap;
  pointer-events: none;
}
.end-page__background-text--top { top: 0; }
.end-page__background-text--bottom { bottom: 0; }

/* ---- scroller ------------------------------------------------------------ */

.end-page__scroll {
  position: relative;
  z-index: 2;
  width: 100%; height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.end-page__container {
  width: min(112em, 90vw);
  padding: 16em 0 12em;
  margin: 0 auto;
}

/* ---- introduction -------------------------------------------------------- */

.end-page-introduction {
  display: grid;
  grid-template-columns: 1.05fr .95fr;
  gap: 6em;
  align-items: center;
}

.end-page-introduction__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.4em;
  opacity: 0;
  transform: translateY(2.4em);
  transition: opacity 1s .1s var(--ease-out-quint), transform 1.2s .1s var(--ease-out-expo);
}
.is-mounted .end-page-introduction__content { opacity: 1; transform: none; }

.end-page__index {
  font-family: 'SometypeMono', monospace;
  font-size: 1.2em;
  letter-spacing: .3em;
  text-transform: uppercase;
  color: rgba(90, 70, 40, .62);
}
.end-page__title {
  font-size: 7.4em;
  font-weight: 700;
  line-height: .92;
  letter-spacing: -.02em;
  text-transform: uppercase;
  color: var(--ui-color-bg-primary);
}
.end-page__subtitle {
  max-width: 30em;
  font-size: 1.7em;
  line-height: 1.6;
  color: rgba(50, 38, 22, .82);
}

/* ---- pictures ------------------------------------------------------------ */

.end-page-introduction__pictures {
  position: relative;
  aspect-ratio: 1 / 1.05;
}
.end-page-picture {
  position: absolute;
  width: 54%;
  padding: .9em .9em 3.4em;
  margin: 0;
  background: linear-gradient(170deg, #fffdf7, #ece5d4);
  box-shadow: 0 2em 4em rgba(60, 40, 10, .32);
  opacity: 0;
  animation: picture-in 1s var(--ease-out-expo) forwards;
  animation-delay: calc(.3s + var(--i) * .14s);
  will-change: transform;
}
.end-page-picture:nth-child(1) { top: 2%; left: 0; }
.end-page-picture:nth-child(2) { top: 26%; right: 0; }
.end-page-picture:nth-child(3) { bottom: 0; left: 18%; }
.end-page-picture img { aspect-ratio: 1; width: 100%; object-fit: cover; }

.end-page-picture__tape {
  position: absolute;
  top: -1.1em; left: 50%;
  width: 8em; height: 2.4em;
  background: rgba(238, 226, 183, .78);
  box-shadow: 0 .2em .5em rgba(90, 70, 30, .22);
  transform: translateX(-50%) rotate(-4deg);
}

@keyframes picture-in {
  from { opacity: 0; transform: translateY(3em) rotate(0deg) scale(.95); }
  to   { opacity: 1; }
}

/* ---- the five lines ------------------------------------------------------ */

.end-page-introduction__lines {
  display: flex;
  flex-direction: column;
  margin-top: 10em;
  border-top: 1px solid rgba(120, 92, 48, .28);
}
.end-page__line {
  display: flex;
  gap: 2.4em;
  align-items: baseline;
  padding: 1.1em 0;
  border-bottom: 1px solid rgba(120, 92, 48, .28);
}
.end-page__line-index {
  flex-shrink: 0;
  font-family: 'SometypeMono', monospace;
  font-size: 1.3em;
  color: rgba(90, 70, 40, .55);
}
.end-page__line-text { display: block; overflow: hidden; }
.end-page__line-front {
  display: block;
  font-size: 4.4em;
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -.01em;
  text-transform: uppercase;
  color: var(--ui-color-bg-primary);
  transform: translateY(110%);
  transition: transform 1s var(--ease-out-expo);
  transition-delay: calc(var(--i) * .06s);
}
.end-page__line.is-visible .end-page__line-front { transform: translateY(0); }

/* ---- actions ------------------------------------------------------------- */

.end-page__actions {
  display: flex;
  gap: 2.4em;
  align-items: center;
  justify-content: center;
  margin-top: 8em;
}

.share-button {
  display: flex;
  gap: .9em;
  align-items: center;
  padding: 1.4em 2em;
  font-size: 1.4em;
  letter-spacing: .04em;
  color: var(--ui-color-bg-primary);
  background: none;
  border: 1px solid rgba(12, 15, 96, .4);
  transform: rotate(.7deg);
  transition: background-color .35s ease, color .35s ease, transform .35s var(--ease-paper);
}
.share-button :deep(svg) { width: 1.5em; }
.share-button:hover {
  color: var(--ui-color-beige);
  background: var(--ui-color-bg-primary);
  transform: rotate(-1.6deg);
}

.end-page__colophon {
  margin-top: 6em;
  font-family: 'SometypeMono', monospace;
  font-size: 1.1em;
  letter-spacing: .22em;
  text-align: center;
  text-transform: uppercase;
  color: rgba(90, 70, 40, .45);
}

/* ---- responsive ---------------------------------------------------------- */

@media (max-width: 1023px) {
  .end-page__container { width: 88vw; padding: 13em 0 9em; }
  .end-page-introduction { grid-template-columns: 1fr; gap: 4em; }
  .end-page__title { font-size: 4.6em; }
  .end-page-introduction__pictures { aspect-ratio: 1 / .9; }
  .end-page-picture { width: 46%; }
  .end-page__line-front { font-size: 2.6em; }
  .end-page-introduction__lines { margin-top: 6em; }
  .end-page__actions { flex-direction: column; gap: 1.6em; margin-top: 5em; }
}
</style>
