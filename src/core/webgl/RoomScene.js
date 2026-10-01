import {
  Scene, PerspectiveCamera, Mesh, Points, BufferGeometry, BufferAttribute,
  ShaderMaterial, PlaneGeometry, Vector3, Color, AdditiveBlending, MathUtils,
} from 'three'
import { panoVertex, panoFragment, dustVertex, dustFragment } from './shaders.js'
import { damp, clamp } from '../raf.js'

/* ---------------------------------------------------------------------------
   A room.

   The photograph is bent onto a cylindrical arc and the camera sits at its
   centre, so moving the pointer swings your view through the space the way a
   head turn would. Everything in the room — hotspots included — is positioned
   by the same uv→world function, which is what keeps a marker welded to the
   object it belongs to no matter where the camera is looking.
   --------------------------------------------------------------------------- */

const ARC_DESKTOP = MathUtils.degToRad(110)
const ARC_MOBILE = MathUtils.degToRad(140)
const RADIUS = 10

export default class RoomScene {
  constructor({ texture, gobo, tint = '#ffffff', isMobile = false }) {
    this.isMobile = isMobile
    this.arc = isMobile ? ARC_MOBILE : ARC_DESKTOP
    this.radius = RADIUS

    const image = texture.image
    const aspect = (image?.width || 3000) / (image?.height || 1280)
    this.height = (this.radius * this.arc) / aspect

    this.scene = new Scene()
    this.camera = new PerspectiveCamera(58, 1, 0.1, 100)
    this.camera.position.set(0, 0, 0)

    this.yaw = 0
    this.pitch = 0
    this.targetYaw = 0
    this.targetPitch = 0
    // Deliberately restrained: this is a head turn, not a pan. The look
    // allowance is also what the cover-fit below has to budget for, so
    // widening it zooms the camera in to compensate.
    this.maxYaw = this.arc * 0.13
    this.maxPitch = 0.045
    this.zoom = 0
    this.targetZoom = 0

    this.buildPanorama(texture, gobo, tint)
    this.buildDust()

    this._v = new Vector3()
  }

  buildPanorama(texture, gobo, tint) {
    const segments = this.isMobile ? 48 : 96
    const geometry = new PlaneGeometry(1, 1, segments, 24)
    const position = geometry.attributes.position
    const uv = geometry.attributes.uv

    // Bend the flat plane onto the arc, driven by its own uvs so the mapping
    // matches `uvToWorld` exactly.
    for (let i = 0; i < position.count; i++) {
      const u = uv.getX(i)
      const v = uv.getY(i)
      const p = this.uvToWorld(u, 1 - v)
      position.setXYZ(i, p.x, p.y, p.z)
    }
    position.needsUpdate = true
    geometry.computeVertexNormals()

    this.material = new ShaderMaterial({
      vertexShader: panoVertex,
      fragmentShader: panoFragment,
      uniforms: {
        uMap: { value: texture },
        uGobo: { value: gobo },
        uTint: { value: new Color(tint) },
        uTime: { value: 0 },
        uExposure: { value: 1.0 },
        uGoboStrength: { value: 0.22 },
        uReveal: { value: 0 },
        uVignette: { value: 0.55 },
        uDesaturate: { value: 0.06 },
      },
      depthWrite: false,
    })

    this.mesh = new Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
    this.scene.add(this.mesh)
  }

  buildDust() {
    const count = this.isMobile ? 70 : 180
    const positions = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    const seeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const theta = (Math.random() - 0.5) * this.arc
      const r = this.radius * (0.28 + Math.random() * 0.55)
      positions[i * 3 + 0] = Math.sin(theta) * r
      positions[i * 3 + 1] = (Math.random() - 0.5) * this.height * 0.8
      positions[i * 3 + 2] = -Math.cos(theta) * r
      scales[i] = 0.5 + Math.random() * 1.15
      seeds[i] = Math.random()
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('aScale', new BufferAttribute(scales, 1))
    geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1))

    this.dustMaterial = new ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })

    this.dust = new Points(geometry, this.dustMaterial)
    this.dust.frustumCulled = false
    this.scene.add(this.dust)
  }

  /** Normalised panorama coordinate → world point on the arc. */
  uvToWorld(u, v, target = new Vector3()) {
    const theta = (u - 0.5) * this.arc
    return target.set(
      Math.sin(theta) * this.radius,
      (0.5 - v) * this.height,
      -Math.cos(theta) * this.radius,
    )
  }

  /** Pointer in -1..1 space. */
  setPointer(nx, ny) {
    this.targetYaw = -nx * this.maxYaw
    this.targetPitch = ny * this.maxPitch
  }

  /** Extra yaw added by dragging, in radians. */
  addDrag(deltaYaw, deltaPitch) {
    this.dragYaw = clamp((this.dragYaw || 0) + deltaYaw, -this.maxYaw, this.maxYaw)
    this.dragPitch = clamp((this.dragPitch || 0) + deltaPitch, -this.maxPitch, this.maxPitch)
  }

  setZoom(amount) { this.targetZoom = amount }
  setReveal(value) { this.material.uniforms.uReveal.value = value }
  setExposure(value) { this.material.uniforms.uExposure.value = value }

  /**
   * Fit the lens to the arc rather than the other way round.
   *
   * The photograph covers a fixed angular window: `arc` wide and
   * `2 * atan(height / 2 / radius)` tall. Pick any field of view larger than
   * that and the edge of the plane swings into frame as a black band. So the
   * field of view is derived from the geometry, minus the look allowance, and
   * the narrower of the two constraints wins — the same "cover" rule as CSS
   * background-size, in angular space.
   *
   * Doing it this way means dropping in a room photograph of any aspect ratio
   * still fills the screen, which matters for a template.
   */
  resize(width, height) {
    const aspect = width / height
    this.camera.aspect = aspect

    // Vertical: half the arc's angular height, less the pitch we allow.
    const halfHeight = Math.atan((this.height * 0.5) / this.radius)
    const fovFromHeight = 2 * (halfHeight - this.maxPitch)

    // Horizontal: convert the remaining half-arc into a vertical fov.
    const halfWidth = this.arc * 0.5 - this.maxYaw
    const fovFromWidth = 2 * Math.atan(Math.tan(halfWidth) / aspect)

    const fov = Math.min(fovFromHeight, fovFromWidth)
    this.camera.fov = clamp(MathUtils.radToDeg(fov), 30, 72)
    this.camera.updateProjectionMatrix()

    this.dustMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2)
  }

  update(delta, elapsed) {
    this.material.uniforms.uTime.value = elapsed
    this.dustMaterial.uniforms.uTime.value = elapsed

    const targetYaw = this.targetYaw + (this.dragYaw || 0)
    const targetPitch = this.targetPitch + (this.dragPitch || 0)

    this.yaw = damp(this.yaw, targetYaw, 0.055, delta)
    this.pitch = damp(this.pitch, targetPitch, 0.055, delta)
    this.zoom = damp(this.zoom, this.targetZoom, 0.06, delta)

    // A very slow idle drift so a motionless visitor still feels present.
    const breathe = Math.sin(elapsed * 0.17) * 0.006
    const bob = Math.cos(elapsed * 0.21) * 0.004

    this.camera.rotation.set(this.pitch + bob, this.yaw + breathe, 0, 'YXZ')
    this.camera.position.z = this.zoom * -1.6
  }

  /** Screen-space position (CSS px) of a normalised panorama coordinate. */
  project(u, v, width, height) {
    this.uvToWorld(u, v, this._v)
    this._v.project(this.camera)
    return {
      x: (this._v.x * 0.5 + 0.5) * width,
      y: (-this._v.y * 0.5 + 0.5) * height,
      visible: this._v.z < 1,
    }
  }

  dispose() {
    this.mesh.geometry.dispose()
    this.material.dispose()
    this.dust.geometry.dispose()
    this.dustMaterial.dispose()
    this.scene.clear()
  }
}
