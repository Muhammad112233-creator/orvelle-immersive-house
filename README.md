<div align="center">

# ORVELLE — _A Room We Never Left_

**An immersive, scored, three-room WebGL house experience.**
Vue 3 · Vite · three.js · GSAP · Howler

[**Live demo**](https://YOUR-USERNAME.github.io/orvelle-immersive-house/) ·

[Preview guide](PREVIEW.md)

</div>

---

Orvelle is a fictional leather house. You arrive at a façade at blue hour, step
inside, and move through three rooms — the Vestibule, the Parlour, the Atelier.
Objects in each room respond to you: a stereoscope you advance with a brass
lever, a rotary telephone that only answers the right number, a quilted panel
you rub to reveal, a bag whose colour you change by touch.

Each one you finish writes a line into **the journal**. Five lines completes it,
and the house tells you what it was about.

It is built to be taken apart. Every piece of copy lives in one file, every
colour in another, and the whole thing deploys itself from a drag-and-drop
upload.

---

## Features

- **Three rooms** rendered to a WebGL canvas with a custom shader — parallax,
  depth-tinting, grain and a slow breathing vignette.
- **Six hand-built interactions**, each lazy-loaded as its own chunk so the
  first paint stays light.
- **A collectible journal** with persistent progress, taped-down entries, and
  blanks that tell you which room is still hiding something.
- **Full voiceover with synchronised subtitles.** Subtitle timing is derived
  from the clip duration and the character count of each cue, so there are no
  `.srt` files to maintain.
- **A synthesised sound engine.** Every click, dial tick, shutter and page turn
  is generated with the Web Audio API at runtime — 25 named effects and three
  ambience beds, and not one audio file to download.
- **Hash routing and relative asset paths**, so the build runs from a domain
  root or a GitHub Pages subfolder with zero configuration.
- **Keyboard and touch parity**, with separate hotspot coordinates for mobile.
- Respects `prefers-reduced-motion`.

---

## Tech stack

|            |                                                             |
| ---------- | ----------------------------------------------------------- |
| Framework  | Vue 3 (`<script setup>`, Composition API)                   |
| Build      | Vite 8                                                      |
| 3D         | three.js                                                    |
| Animation  | GSAP, plus CSS transitions on the house easing tokens       |
| Audio      | Howler for voiceover, Web Audio API for synthesised effects |
| Routing    | vue-router, hash history                                    |
| Deployment | GitHub Actions → GitHub Pages                               |

No CSS framework, no component library, no state-management library. The
styling is plain CSS with custom properties.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script            | Purpose                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| `npm run dev`     | Development server with hot reload                                       |
| `npm run build`   | Production build into `dist/`                                            |
| `npm run preview` | Serve the production build locally                                       |
| `npm run assets`  | Re-run the product cut-out pipeline (needs Python 3 + `pillow`, `numpy`) |

Full instructions, including how to preview on a phone, are in
[PREVIEW.md](PREVIEW.md).

---

## Project structure

```
public/
  audio/vo/            voiceover clips
  fonts/               three subset woff2 faces
  images/
    rooms/             the three room plates
    products/          cut-out bags + luminance plates
    viewer/            stereoscope slides
    polaroids/         telephone prints
    quilt/             construction stages
    journal/           journal cover
    textures/          paper grain
src/
  components/
    end/               the closing page
    interactions/      the six interactions + shared Polaroid
    journal/           the journal and its entries
    room/              hotspots, header, enter/exit, WebGL canvas
    ui/                buttons, modals, subtitles, tutorial
  composables/         odometer counter
  content/
    site.js            ← every string in the experience
    rooms.js           ← rooms, hotspot coordinates, colourways
    voiceover.js       ← clip registry and subtitle cues
  core/
    audio.js           synthesised sound engine
    voiceover.js       clip playback + subtitle scheduling
    store.js           UI state and journal progress
    preloader.js       asset warm-up
    webgl/             shaders and the room scene
  styles/
    _tokens.css        ← colours, type scale, easings, breakpoints
  views/               HomeView (façade), RoomView
tools/
  process_products.py  background-relative matting for the product shots
```

---

## Making it yours

The project is designed so that a full rebrand touches four files.

**1. Copy — `src/content/site.js`**
Every visible string, including the brand name (`BRAND`), the preloader words,
the chapter titles, the voiceover lines and all shop links.

**2. Structure — `src/content/rooms.js`**
Room ids, which interaction sits on which hotspot, and the normalised hotspot
coordinates (`x`/`y` from 0–1, with separate mobile overrides). Change a room
photograph and you will want to nudge these.

**3. Look — `src/styles/_tokens.css`**
Colours, the fluid type scale, the four easing curves and the breakpoints.
Changing `--ui-color-bg-primary` and `--ui-color-yellow` alone shifts the whole
identity.

**4. Assets — `public/images/`**
Drop in replacements with the same filenames. For bags, supply a shot on a
plain sweep and run `npm run assets` to generate the cut-out and the luminance
plate the colourway system needs.

### Adding an interaction

1. Create `src/components/interactions/YourThing.vue`.
2. Accept `source` and `room` props; emit `complete` with your id, and `close`.
3. Register it in `INTERACTION_COMPONENTS` in `src/views/RoomView.vue`.
4. Add a hotspot entry and a journal line in `src/content/rooms.js`.

The wrapper, the reward modal, the counter and the journal all pick it up from
there.

---

## Browser support

Requires **WebGL2** — Chrome, Edge, Firefox, Safari 15+. Browsers without it
get a graceful notice instead of a broken canvas. Audio stays silent until the
first interaction, as browser autoplay policy requires.

---

## Credits and licence

Released under the [MIT Licence](LICENSE).

All imagery, copy, typography choices, sound design and the Orvelle brand
itself are original to this project. Orvelle is a fictional house invented for
the template; the name, the collection and the two bags do not refer to any
real company or product. Replace them with your own before publishing
commercially.
