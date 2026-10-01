/* ---------------------------------------------------------------------------
   GLSL used by the room renderer.
   --------------------------------------------------------------------------- */

export const panoVertex = /* glsl */`
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

/* The room itself: base photograph, a warm/cool grade, a slow moving window
   gobo and a soft edge falloff so the panorama never shows a hard seam. */
export const panoFragment = /* glsl */`
  precision highp float;

  uniform sampler2D uMap;
  uniform sampler2D uGobo;
  uniform vec3  uTint;
  uniform float uTime;
  uniform float uExposure;
  uniform float uGoboStrength;
  uniform float uReveal;        // 0 → 1 wipe used when entering a room
  uniform float uVignette;
  uniform float uDesaturate;

  varying vec2 vUv;

  float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

  void main() {
    vec2 uv = vUv;

    // Light drifting across the room, as if from a window just out of frame.
    vec2 goboUv = uv * vec2(1.6, 1.0);
    goboUv.x += sin(uTime * 0.035) * 0.06 + uTime * 0.004;
    goboUv.y += cos(uTime * 0.028) * 0.025;
    float gobo = texture2D(uGobo, fract(goboUv)).r;

    vec3 base = texture2D(uMap, uv).rgb;

    // Grade: push the midtones toward the room's own colour temperature.
    vec3 graded = mix(base, base * uTint * 1.35, 0.28);
    graded = mix(vec3(luma(graded)), graded, 1.0 - uDesaturate);
    graded *= uExposure;

    // Warm pool of light, strongest where the gobo is bright.
    graded += gobo * uGoboStrength * vec3(1.0, 0.92, 0.76) * (0.25 + 0.75 * luma(base));

    // Edge falloff keeps attention in the middle of the arc.
    vec2 c = uv - 0.5;
    float vig = smoothstep(0.85, 0.18, length(c * vec2(1.0, 1.25)));
    graded *= mix(1.0, vig, uVignette);

    // Entry wipe: the room resolves from the centre outwards.
    // A pixel becomes visible once the expanding radius uReveal passes its
    // own distance from centre, with a soft 0.35 band trailing the edge.
    // (Compare against d, not 1.0 - d: the far corner sits at d ~= 0.94, so
    // uReveal only has to travel a little past 1.0 to clear the frame.)
    float d = length(c * vec2(1.0, 1.6));
    float reveal = 1.0 - smoothstep(uReveal - 0.35, uReveal + 0.05, d);
    graded *= reveal;

    gl_FragColor = vec4(graded, 1.0);
    #include <colorspace_fragment>
  }
`

/* Fullscreen composite: film grain, chromatic fringe, exposure, fade-to-ink. */
export const compositeVertex = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const compositeFragment = /* glsl */`
  precision highp float;

  uniform sampler2D uScene;
  uniform vec2  uResolution;
  uniform float uTime;
  uniform float uGrain;
  uniform float uAberration;
  uniform float uFade;          // 1 → fully faded to uFadeColor
  uniform vec3  uFadeColor;
  uniform float uBlur;          // used during room transitions

  varying vec2 vUv;

  // Cheap hash noise — plenty for 35mm-ish grain at 60fps.
  float hash(vec2 p) {
    p = fract(p * vec2(443.897, 441.423));
    p += dot(p, p.yx + 19.19);
    return fract((p.x + p.y) * p.x);
  }

  void main() {
    vec2 uv = vUv;
    vec2 centred = uv - 0.5;

    // Lens fringe grows toward the edges, never in the middle.
    float r = dot(centred, centred);
    vec2 offset = centred * r * uAberration;

    vec3 colour;
    colour.r = texture2D(uScene, uv - offset).r;
    colour.g = texture2D(uScene, uv).g;
    colour.b = texture2D(uScene, uv + offset).b;

    if (uBlur > 0.001) {
      vec3 sum = vec3(0.0);
      float total = 0.0;
      for (int i = -4; i <= 4; i++) {
        float fi = float(i);
        float w = exp(-fi * fi / 8.0);
        vec2 d = vec2(fi) * uBlur / uResolution;
        sum += texture2D(uScene, uv + d * vec2(1.0, 0.6)).rgb * w;
        total += w;
      }
      colour = mix(colour, sum / total, clamp(uBlur / 6.0, 0.0, 1.0));
    }

    float grain = hash(uv * uResolution * 0.5 + fract(uTime) * 91.37) - 0.5;
    colour += grain * uGrain;

    colour = mix(colour, uFadeColor, uFade);

    gl_FragColor = vec4(colour, 1.0);
  }
`

/* Dust motes drifting in the light shaft. */
export const dustVertex = /* glsl */`
  attribute float aScale;
  attribute float aSeed;

  uniform float uTime;
  uniform float uPixelRatio;

  varying float vAlpha;

  void main() {
    vec3 pos = position;

    float t = uTime * 0.08 + aSeed * 6.2831;
    pos.x += sin(t * 1.3) * 0.45;
    pos.y += sin(t * 0.7 + aSeed) * 0.35 + mod(uTime * 0.045 + aSeed, 1.0) * 0.6 - 0.3;
    pos.z += cos(t * 1.1) * 0.35;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    // Motes are specks caught in the light, a few pixels across at most.
    gl_PointSize = aScale * uPixelRatio * (22.0 / -mv.z);

    // Motes closest to camera glow; the far ones all but disappear.
    vAlpha = smoothstep(0.0, 1.0, 0.25 + 0.75 * sin(t * 2.0) * 0.5 + 0.5) * 0.2;
  }
`

export const dustFragment = /* glsl */`
  precision mediump float;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(1.0, 0.96, 0.88, a);
  }
`
