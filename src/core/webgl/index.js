import { reactive, shallowRef } from 'vue'
import {
  WebGLRenderer, WebGLRenderTarget, Scene, OrthographicCamera, Mesh,
  PlaneGeometry, ShaderMaterial, Vector2, Color, TextureLoader,
  LinearFilter, SRGBColorSpace, RepeatWrapping, CanvasTexture,
} from 'three'
import gsap from 'gsap'
import RoomScene from './RoomScene.js'
import { compositeVertex, compositeFragment } from './shaders.js'
import { onTick, offTick, damp } from '../raf.js'
import { device } from '../device.js'

/* ---------------------------------------------------------------------------
   $webgl — the single renderer the whole app talks to.

   Rooms are built once and kept; navigating between them swings the composite
   pass to black, swaps the active scene and swings back, which is both
   cheaper and smoother than tearing down GL state on every move.
   --------------------------------------------------------------------------- */

const loader = new TextureLoader()

/** A procedural gobo: soft window-pane light, generated rather than fetched. */
function makeGoboTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')

  g.fillStyle = '#000'
  g.fillRect(0, 0, size, size)

  // Two tall panes with a bar between them, blurred into a pool of light.
  g.filter = 'blur(26px)'
  g.fillStyle = '#fff'
  const paneW = size * 0.26
  const paneH = size * 0.52
  const top = size * 0.16
  g.fillRect(size * 0.16, top, paneW, paneH)
  g.fillRect(size * 0.16 + paneW + size * 0.06, top, paneW, paneH)
  g.filter = 'none'

  // Fade the edges so the pool never shows a rectangle boundary.
  const grad = g.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.58)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(1, 'rgba(0,0,0,1)')
  g.globalCompositeOperation = 'destination-out'
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)

  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.minFilter = texture.magFilter = LinearFilter
  return texture
}

class WebGLManager {
  constructor() {
    this.rooms = new Map()
    this.active = shallowRef(null)
    this.domPoints = reactive({})
    this.enabled = false
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    this.dragging = false
    this._tick = this.update.bind(this)
  }

  /* ------------------------------------------------------------------ setup */

  init(canvas) {
    if (this.renderer) return

    this.canvas = canvas
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    })
    this.renderer.setClearColor(0x05060f, 1)
    this.renderer.outputColorSpace = SRGBColorSpace

    this.gobo = makeGoboTexture()

    // Offscreen buffer the composite pass reads from.
    this.target = new WebGLRenderTarget(1, 1, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      depthBuffer: true,
    })

    this.compositeScene = new Scene()
    this.compositeCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.compositeMaterial = new ShaderMaterial({
      vertexShader: compositeVertex,
      fragmentShader: compositeFragment,
      uniforms: {
        uScene: { value: this.target.texture },
        uResolution: { value: new Vector2(1, 1) },
        uTime: { value: 0 },
        uGrain: { value: 0.042 },
        // Barely perceptible: this is a lens fringe at the far corners, not a
        // glitch effect. Anything above ~0.04 reads as broken rather than filmic.
        uAberration: { value: 0.009 },
        uFade: { value: 1 },
        uFadeColor: { value: new Color('#0c0f60') },
        uBlur: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    })
    this.compositeScene.add(new Mesh(new PlaneGeometry(2, 2), this.compositeMaterial))

    this.resize()
    window.addEventListener('resize', () => this.resize(), { passive: true })

    this.bindPointer()
    this.enabled = true
    onTick(this._tick, 10)
  }

  bindPointer() {
    const el = window

    const onMove = (e) => {
      const x = (e.touches ? e.touches[0].clientX : e.clientX) / window.innerWidth
      const y = (e.touches ? e.touches[0].clientY : e.clientY) / window.innerHeight
      this.pointer.tx = x * 2 - 1
      this.pointer.ty = y * 2 - 1

      if (this.dragging && this.last) {
        const dx = (x - this.last.x)
        const dy = (y - this.last.y)
        this.active.value?.addDrag(dx * 1.9, -dy * 0.7)
        this.last = { x, y }
      }
    }

    const onDown = (e) => {
      if (e.target.closest?.('button, a, .no-drag')) return
      this.dragging = true
      const x = (e.touches ? e.touches[0].clientX : e.clientX) / window.innerWidth
      const y = (e.touches ? e.touches[0].clientY : e.clientY) / window.innerHeight
      this.last = { x, y }
      document.documentElement.classList.add('is-dragging')
    }

    const onUp = () => {
      this.dragging = false
      this.last = null
      document.documentElement.classList.remove('is-dragging')
    }

    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerdown', onDown, { passive: true })
    el.addEventListener('pointerup', onUp, { passive: true })
    el.addEventListener('pointercancel', onUp, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: true })
  }

  resize() {
    if (!this.renderer) return
    const w = window.innerWidth
    const h = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, device.isMobile ? 2 : 1.75)

    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(w, h, false)
    this.target.setSize(w * dpr, h * dpr)
    this.compositeMaterial.uniforms.uResolution.value.set(w * dpr, h * dpr)

    this.rooms.forEach((room) => room.resize(w, h))
  }

  /* ------------------------------------------------------------------ rooms */

  async loadRoom(id, { src, tint }) {
    if (this.rooms.has(id)) return this.rooms.get(id)

    const texture = await new Promise((resolve, reject) => {
      loader.load(src, resolve, undefined, reject)
    })
    texture.colorSpace = SRGBColorSpace
    texture.minFilter = texture.magFilter = LinearFilter
    texture.generateMipmaps = false

    const room = new RoomScene({
      texture,
      gobo: this.gobo,
      tint,
      isMobile: device.isMobile,
    })
    room.resize(window.innerWidth, window.innerHeight)
    this.rooms.set(id, room)
    return room
  }

  setActiveRoom(id) {
    const room = this.rooms.get(id)
    if (!room) return
    this.active.value = room
    this.currentRoomId = id
    this.clearPoints()
  }

  /** Fades out, swaps, fades in. Returns a promise for the whole move. */
  async transitionTo(id, { duration = 0.7, colour = '#0c0f60' } = {}) {
    const u = this.compositeMaterial.uniforms
    u.uFadeColor.value.set(colour)

    await gsap.to(u.uFade, { value: 1, duration: duration * 0.45, ease: 'power2.in' })
    gsap.to(u.uBlur, { value: 6, duration: duration * 0.2 })

    this.setActiveRoom(id)
    const room = this.rooms.get(id)
    if (room) {
      room.setReveal(0)
      gsap.fromTo(room.material.uniforms.uReveal, { value: 0 },
        { value: 1.4, duration: 1.8, ease: 'power2.out' })
      gsap.fromTo(room, { zoom: 0.5 }, { zoom: 0, duration: 2.4, ease: 'power3.out' })
    }

    gsap.to(u.uBlur, { value: 0, duration: duration })
    await gsap.to(u.uFade, { value: 0, duration: duration * 0.9, ease: 'power2.out' })
  }

  async reveal({ duration = 1.6 } = {}) {
    const u = this.compositeMaterial.uniforms
    const room = this.active.value
    if (room) {
      gsap.fromTo(room.material.uniforms.uReveal, { value: 0 },
        { value: 1.4, duration: 2.2, ease: 'power2.out' })
      gsap.fromTo(room, { zoom: 0.7 }, { zoom: 0, duration: 3, ease: 'power3.out' })
    }
    await gsap.to(u.uFade, { value: 0, duration, ease: 'power2.inOut' })
  }

  fadeOut({ duration = 0.6, colour = '#0c0f60' } = {}) {
    this.compositeMaterial.uniforms.uFadeColor.value.set(colour)
    return gsap.to(this.compositeMaterial.uniforms.uFade, {
      value: 1, duration, ease: 'power2.inOut',
    })
  }

  /* ----------------------------------------------------------- dom hotspots */

  registerPoints(points) {
    this.points = points || {}
    this.clearPoints()
  }

  clearPoints() {
    Object.keys(this.domPoints).forEach((k) => delete this.domPoints[k])
  }

  /** Pushes focus toward a hotspot — used when an interaction opens. */
  focusPoint(id, strength = 1) {
    const room = this.active.value
    const point = this.points?.[id]
    if (!room || !point) return
    const coords = device.isMobile && point.mobile ? point.mobile : point
    room.targetYaw = -(coords.x - 0.5) * room.arc * strength
    room.targetPitch = (coords.y - 0.5) * room.maxPitch * 2 * strength
    room.setZoom(0.45 * strength)
  }

  releaseFocus() {
    const room = this.active.value
    if (!room) return
    room.setZoom(0)
  }

  /* ----------------------------------------------------------------- render */

  update(delta, elapsed) {
    if (!this.enabled || !this.renderer) return

    this.pointer.x = damp(this.pointer.x, this.pointer.tx, 0.08, delta)
    this.pointer.y = damp(this.pointer.y, this.pointer.ty, 0.08, delta)

    const room = this.active.value
    if (room) {
      if (!device.isTouch) room.setPointer(this.pointer.x, this.pointer.y)
      room.update(delta, elapsed)

      // Project every hotspot once per frame; the DOM markers read these.
      if (this.points) {
        const w = window.innerWidth
        const h = window.innerHeight
        for (const id in this.points) {
          const p = this.points[id]
          const coords = device.isMobile && p.mobile ? p.mobile : p
          const screen = room.project(coords.x, coords.y, w, h)
          const existing = this.domPoints[id]
          if (!existing) this.domPoints[id] = { x: screen.x, y: screen.y, visible: screen.visible }
          else { existing.x = screen.x; existing.y = screen.y; existing.visible = screen.visible }
        }
      }

      this.renderer.setRenderTarget(this.target)
      this.renderer.clear()
      this.renderer.render(room.scene, room.camera)
      this.renderer.setRenderTarget(null)
    } else {
      this.renderer.setRenderTarget(this.target)
      this.renderer.clear()
      this.renderer.setRenderTarget(null)
    }

    this.compositeMaterial.uniforms.uTime.value = elapsed
    this.renderer.render(this.compositeScene, this.compositeCamera)
  }

  destroy() {
    offTick(this._tick)
    this.rooms.forEach((r) => r.dispose())
    this.rooms.clear()
    this.target?.dispose()
    this.renderer?.dispose()
    this.renderer = null
  }
}

export const $webgl = new WebGLManager()
