import gsap from 'gsap'
import { site } from '@/content/site.js'

/* ---------------------------------------------------------------------------
   The preloader lives in index.html, outside the Vue tree, so the title
   animation starts on the first paint instead of waiting for the bundle.
   This module takes it over once the app boots.
   --------------------------------------------------------------------------- */

export function initPreloader() {
  const root = document.getElementById('preloader')
  if (!root) return { setProgress() {}, ready: Promise.resolve(), dismiss: () => Promise.resolve() }

  const sound = root.querySelector('.preloader-sound')
  const headlines = root.querySelector('.preloader-headlines')
  const lines = [...root.querySelectorAll('.preloader-main .line')]
  const text = root.querySelector('.preloader-text')
  const btnContainer = root.querySelector('.preloader-btn-container')
  const btn = root.querySelector('.preloader-btn')
  const background = root.querySelector('.preloader-background')

  /* ---- intro ------------------------------------------------------------ */
  // Words arrive letter-spaced and wide, then settle — the same trick the
  // reference uses to make a static title feel like it is being typeset.
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  tl.set(root, { '--base-letter-spacing': '14px' })
    .to(root, { '--base-letter-spacing': '4px', duration: 1.8, ease: 'power4.out' }, 0)
    .fromTo(headlines, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.1 }, 0.15)

  lines.forEach((line, i) => {
    tl.fromTo(
      line,
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 1.0 },
      0.35 + i * 0.16,
    )
  })

  tl.fromTo(text, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9 }, 0.95)
    .fromTo(sound, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.9 }, 1.1)
    .fromTo(btnContainer, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1.2)

  /* ---- progress --------------------------------------------------------- */
  let shownProgress = 0
  let loaded = false

  const api = {
    setProgress(value) {
      shownProgress = Math.max(shownProgress, Math.min(value, 1))
      if (shownProgress >= 1 && !loaded) {
        loaded = true
        root.classList.add('loaded')
      }
    },

    /** Resolves when the visitor presses Enter. */
    ready: new Promise((resolve) => {
      const go = () => {
        if (!root.classList.contains('loaded')) return
        btn.removeEventListener('click', go)
        btn.removeEventListener('keydown', onKey)
        resolve()
      }
      const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') go() }
      btn.addEventListener('click', go)
      btn.addEventListener('keydown', onKey)
    }),

    /** Sweeps the curtain up and hands the stage to the app. */
    dismiss() {
      root.classList.add('is-leaving')
      const out = gsap.timeline({ defaults: { ease: 'power3.inOut' } })
      out.to([headlines, ...lines], { opacity: 0, y: -18, duration: 0.6, stagger: 0.05 }, 0)
        .to([text, btnContainer, sound], { opacity: 0, duration: 0.45 }, 0)
        .to(background, { scaleY: 0, duration: 1.0, ease: 'expo.inOut' }, 0.35)
        .set(root, { display: 'none' })
      return out.then()
    },
  }

  // Keep the sound hint in sync with the copy file.
  const soundText = root.querySelector('.js-sound-text')
  if (soundText) soundText.innerHTML = 'Sound On'
  const label = root.querySelector('.js-preloader-btn')
  if (label) label.textContent = site.global.preloader.button

  return api
}
