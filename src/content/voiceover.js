import { site } from './site.js'

/* ---------------------------------------------------------------------------
   Voiceover registry.

   One entry per recording. `cues` are the subtitle lines inside that
   recording; when a clip holds several lines the player splits the clip's
   duration between them by character count, which tracks a steady reading
   pace closely enough that nobody notices the difference.

   `<br>` inside a cue is a deliberate line break in the subtitle, not markup
   to be read aloud.
   --------------------------------------------------------------------------- */

export const voiceovers = {
  intro: {
    file: 'intro.mp3',
    cues: [
      site.tuto.vo_1_1,
      site.tuto.vo_1_2,
      site.tuto.vo_1_3,
      site.tuto.vo_1_4,
      site.tuto.vo_1_5,
      site.tuto.vo_1_6,
    ],
  },

  viewer_1: { file: 'viewer-1.mp3', cues: [site.viewer.vo_1] },
  viewer_2: { file: 'viewer-2.mp3', cues: [site.viewer.vo_2] },
  viewer_3: { file: 'viewer-3.mp3', cues: [site.viewer.vo_3] },
  viewer_4: { file: 'viewer-4.mp3', cues: [site.viewer.vo_4_1, site.viewer.vo_4_2] },
  viewer_5: { file: 'viewer-5.mp3', cues: [site.viewer.vo_5] },

  phone_success: { file: 'phone-success.mp3', cues: [site.phone.vo_success_1] },
  phone_missing: {
    file: 'phone-missing.mp3',
    cues: [site.phone.vo_missing_1_1, site.phone.vo_missing_1_2, site.phone.vo_missing_1_3],
  },
  phone_polaroid_1: { file: 'phone-polaroid-1.mp3', cues: [site.phone.vo_polaroid_1] },
  phone_polaroid_2: {
    file: 'phone-polaroid-2.mp3',
    cues: [site.phone.vo_polaroid_2_1, site.phone.vo_polaroid_2_2],
  },
  phone_polaroid_3: {
    file: 'phone-polaroid-3.mp3',
    cues: [site.phone.vo_polaroid_3_1, site.phone.vo_polaroid_3_2],
  },
  phone_polaroid_4: { file: 'phone-polaroid-4.mp3', cues: [site.phone.vo_polaroid_4] },

  quilt_1: { file: 'quilt-1.mp3', cues: [site.quilt.vo_1] },
  quilt_2: { file: 'quilt-2.mp3', cues: [site.quilt.vo_2] },
  quilt_3: { file: 'quilt-3.mp3', cues: [site.quilt.vo_3] },
  quilt_4: { file: 'quilt-4.mp3', cues: [site.quilt.vo_4] },
  quilt_5: { file: 'quilt-5.mp3', cues: [site.quilt.vo_5] },

  colors_1: { file: 'colors-1.mp3', cues: [site.colors.vo_1] },
}

export const VO_BASE = 'audio/vo/'
