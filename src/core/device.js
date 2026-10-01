import { reactive, readonly } from 'vue'

/* ---------------------------------------------------------------------------
   One resize listener for the whole app. Components read `device.*` instead
   of each wiring up their own matchMedia, which keeps layout thrash down and
   guarantees every consumer agrees on what "mobile" means in a given frame.
   --------------------------------------------------------------------------- */

const BREAKPOINTS = {
  xs: 400,
  s: 640,
  sm: 768,
  md: 1024,
  lg: 1200,
  xl: 1600,
  xxl: 1920,
}

const state = reactive({
  width: 0,
  height: 0,
  dpr: 1,
  isMobile: false,
  isTablet: false,
  isTouch: false,
  isLandscape: true,
  isSmallHeight: false,
  reducedMotion: false,
})

function measure() {
  state.width = window.innerWidth
  state.height = window.innerHeight
  state.dpr = Math.min(window.devicePixelRatio || 1, 2)
  state.isMobile = window.innerWidth < BREAKPOINTS.md
  state.isTablet = window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg
  state.isLandscape = window.innerWidth > window.innerHeight
  state.isSmallHeight = window.innerHeight < 700

  // `--vh` keeps full-height panels honest on mobile browsers whose chrome
  // slides away and makes 100vh lie.
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
}

let initialised = false

export function initDevice() {
  if (initialised) return
  initialised = true

  state.isTouch = window.matchMedia('(hover: none)').matches || 'ontouchstart' in window
  state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  measure()
  window.addEventListener('resize', measure, { passive: true })
  window.addEventListener('orientationchange', () => setTimeout(measure, 150), { passive: true })

  document.documentElement.classList.toggle('is-touch', state.isTouch)
  document.documentElement.classList.toggle('is-mouse', !state.isTouch)
}

export const device = readonly(state)
export { BREAKPOINTS }
