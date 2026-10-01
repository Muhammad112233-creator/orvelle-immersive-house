/* ---------------------------------------------------------------------------
   A single requestAnimationFrame loop.

   Every animated system (WebGL, hotspot projection, cursor, odometers) hangs
   off this one ticker. Priorities let the renderer run after the things that
   feed it, and the loop parks itself when the tab is hidden.
   --------------------------------------------------------------------------- */

const listeners = []
let rafId = null
let last = 0
let running = false

function loop(now) {
  rafId = requestAnimationFrame(loop)

  // Clamped so a backgrounded tab resuming doesn't fire a 4-second delta
  // through every easing function at once.
  const delta = Math.min((now - last) / 1000, 1 / 20)
  last = now

  for (let i = 0; i < listeners.length; i++) {
    listeners[i].fn(delta, now / 1000)
  }
}

function start() {
  if (running) return
  running = true
  last = performance.now()
  rafId = requestAnimationFrame(loop)
}

function stop() {
  if (!running) return
  running = false
  cancelAnimationFrame(rafId)
}

export function onTick(fn, priority = 0) {
  const entry = { fn, priority }
  listeners.push(entry)
  listeners.sort((a, b) => a.priority - b.priority)
  if (!running) start()
  return () => offTick(fn)
}

export function offTick(fn) {
  const i = listeners.findIndex((l) => l.fn === fn)
  if (i > -1) listeners.splice(i, 1)
  if (!listeners.length) stop()
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop()
    else if (listeners.length) start()
  })
}

/* Framerate-independent lerp. `l` is the fraction travelled per 60fps frame. */
export function damp(current, target, l, delta) {
  return current + (target - current) * (1 - Math.pow(1 - l, delta * 60))
}

export function lerp(a, b, t) { return a + (b - a) * t }
export function clamp(v, min, max) { return Math.min(Math.max(v, min), max) }
export function map(v, a, b, c, d) { return c + ((v - a) / (b - a)) * (d - c) }
