/* ---------------------------------------------------------------------------
   Every string in the experience lives here.

   Keeping the copy in one object means the build can be re-skinned for a new
   campaign without touching a component, and it keeps `v-html` payloads
   (the <strong> / <br> in the journal rewards) in a single reviewable place.
   --------------------------------------------------------------------------- */

export const BRAND = 'Orvelle'

export const site = {
  meta: {
    title: 'Orvelle — A Room We Never Left',
    description: 'Step inside the house and uncover the story written in its margins.',
  },

  global: {
    preloader: {
      headlines: 'presents',
      text: 'Step inside the house and uncover the story written in its margins',
      button: 'Enter',
      sound: 'For an optimal experience<br>please turn on your sound',
    },
    complete: { text: 'You wrote a new line in the <strong>journal</strong>' },
    label_bag_url: 'Discover *bagname*',
    explore: 'Change room',
    enter: 'Enter the room',
    tap_explore: 'Drag to explore',
    loading: 'Loading',
  },

  /* -- the three chapters -------------------------------------------------- */
  room: {
    vestibule:  { title: 'The Vestibule',    chapter: 'Chapter I'   },
    parlour:    { title: 'The Parlour',      chapter: 'Chapter II'  },
    atelier:    { title: 'The Atelier',      chapter: 'Chapter III' },
  },

  /* -- opening sequence, triggered by the journal -------------------------- */
  tuto: {
    btn: { journal: 'Read it', lines: 'Next', reward: 'Next' },
    text: {
      start: 'Pick up the journal<br>and get started',
      journal: 'You wrote a <strong>new<br>line</strong> in the <strong>journal</strong>',
      lines: 'You wrote the <strong>first<br>line</strong> in the <strong>journal</strong>',
      reward: 'Explore the rooms to uncover the other <strong>*number* hidden notes</strong> and complete <strong>the journal</strong>.',
    },
    vo_1_1: 'Begin where the light falls.',
    vo_1_2: 'Every house keeps a secret.',
    vo_1_3: 'Ours is written in the margins.',
    vo_1_4: 'Nothing here is accidental.',
    vo_1_5: 'Look closer.',
    vo_1_6: 'Perfection is a kind of silence.',
  },

  /* -- interaction: the stereoscope (parlour) ------------------------------ */
  viewer: {
    tuto: {
      text: 'Click to discover more',
      text_mobile: 'Tap<br>to discover more',
    },
    rotating: { text1: BRAND, text2: 'Autumn Collection' },
    tuto_reward: 'You wrote a <strong>new<br>line</strong> in the <strong>journal</strong>',
    vo_1: 'Solène begins as a question.',
    vo_2: 'A name borrowed from the sun,<br>softened by the shade.',
    vo_3: 'Structure that yields, never surrenders.',
    vo_4_1: 'Quietly.',
    vo_4_2: 'Completely.',
    vo_5: 'Touch before you understand.',
  },

  /* -- interaction: the rotary telephone (parlour) ------------------------- */
  phone: {
    tuto: { text: 'Dial the number\r<br>on the card and\r<br>hear the message' },
    number: '04 17',
    card_label: 'If the house answers,\nlisten.',
    tuto_reward: 'You wrote a <strong>new<br>line</strong> in the <strong>journal</strong>',
    vo_success_1: "You came back. I knew you would.",
    vo_missing_1_1: 'Hello?',
    vo_missing_1_2: 'Hello?',
    vo_missing_1_3: "That number belongs to no one here.",
    vo_polaroid_1: 'A shape that follows the day.',
    vo_polaroid_2_1: 'Your appetite for ruin?',
    vo_polaroid_2_2: 'Intact.',
    vo_polaroid_3_1: 'Your patience for rules?',
    vo_polaroid_3_2: 'Thinner.',
    vo_polaroid_4: 'Carry it the way you mean it.',
  },

  /* -- interaction: the journal (vestibule) -------------------------------- */
  vestibule: {
    journal: { title: 'The Journal', subtitle: 'You found' },
  },

  /* -- the two hero pieces ------------------------------------------------- */
  parlour: {
    bag: {
      url: 'https://example.com/orvelle/nocturne',
      name: 'Nocturne',
      description:
        'Introduced in the house’s eighth year, Nocturne folds a sixties hobo line into something softer. Unstructured on the shoulder, exacting in the seam — it reads differently every time you set it down.',
    },
  },

  atelier: {
    bag: {
      url: 'https://example.com/orvelle/solene',
      name: 'Solène',
      description:
        'Solène takes its name from an old word for sunlight. Built on the bauletto, its clean frame is wrapped in quilted nappa so the geometry stays honest while the surface gives.',
    },
  },

  /* -- the collectible journal -------------------------------------------- */
  journal: {
    title: 'Journal',
    description:
      'Explore the house and interact with the objects to complete <strong>the journal</strong>',
    counter_label: 'Notes',
    lines: {
      title_1: 'Perfection is a kind of silence',
      description_1: '',

      title_2: 'Touch before you understand',
      description_2: '',
      'shop-title_2': 'Discover Solène',
      'shop-url_2': 'https://example.com/orvelle/solene',

      title_3: 'A shape that follows the day',
      description_3:
        'Offered in five finishes — Ash, Amber, Tideline, Lacquer and Bone — Nocturne and Solène take presence from colour alone.<br><br>From the quietest neutral to the loudest red, each tone redraws the silhouette while the signature line holds.',
      'shop-title_3': 'Discover Nocturne',
      'shop-url_3': 'https://example.com/orvelle/nocturne',

      title_4: 'Softness holds the hardest structure',
      description_4:
        'Behind the ease of the quilt sits a strict construction. Panels of nappa are laid over wadding and an elastic ground, then stitched and pressed until the folds fall in rhythm.<br>A surface that looks relaxed and behaves like architecture — the contradiction the house was built on.',

      title_5: 'Colour is a form of memory',
      description_5: '',
    },
    reward_4: 'You wrote another line.<br><strong>4</strong> left to <strong>complete the journal</strong>.',
    reward_3: 'You wrote another line.<br><strong>3</strong> left to <strong>complete the journal</strong>.',
    reward_2: 'The journal is almost complete. Only <strong>two</strong> lines left to write.',
    reward_1: 'Just <strong>one</strong> line left<br>to <strong>complete the journal</strong>.',
    reward_0: 'You’ve completed <strong>the journal</strong>.<br>Discover the new <strong>collection</strong>.<br>',
    reward_button: 'Continue',
    redirect_btn: 'Go to the *room*',
    reward_journal: 'Open the journal',
  },

  notebook: { title: 'You found', subtitle: 'The journal' },

  /* -- interaction: the quilt (atelier) ------------------------------------ */
  quilt: {
    tuto: {
      text: 'Touch the texture,<br>let the craft unfold',
      text_mobile: 'Touch the texture,<br>let the craft unfold',
    },
    tuto_reward: 'You wrote a <strong>new<br>line</strong> in the <strong>journal</strong>',
    vo_1: 'The quilt is a signature.',
    vo_2: 'Nappa, wadding and elastic cloth,<br>stitched as one',
    vo_3: 'give the piece its weightless look.',
    vo_4: 'Its unmistakable finish.',
    vo_5: 'Softness holds<br>the hardest structure.',
  },

  /* -- interaction: colour (atelier) --------------------------------------- */
  colors: {
    tuto: { text: 'Click the piece,<br>unveil its colours', text_mobile: 'Tap the piece,<br>unveil its colours' },
    tuto_reward: 'You wrote a <strong>new<br>line</strong> in the <strong>journal</strong>',
    vo_1: 'Colour is a form of memory.',
    polaroid_text: 'Colour<br>is a form<br>of memory.',
  },

  /* -- the closing page ---------------------------------------------------- */
  end: {
    title: 'A room we never left',
    subtitle:
      'The fragments of a single afternoon settle into place. Through gesture, surface and space, the collection shows how a quiet kind of elegance moves through an ordinary day, and leaves the room changed.',
    discover: { label: 'Discover the collection', link: 'https://example.com/orvelle' },
    share: {
      label: 'Share the experience',
      copy: 'Link copied',
      title: 'Orvelle — A Room We Never Left',
      text: 'Step inside the house and uncover the story written in its margins.',
    },
  },

  aria: {
    open_journal: 'Open the journal',
    close_journal: 'Close the journal',
    mute: 'Mute the sound',
    unmute: 'Enable the sound',
    hotspot_interaction: 'Open the interaction',
    close_interaction: 'Close the interaction',
    close_productview: 'Close the product view',
    open_productview: 'Open the product view',
    play_video: 'Play video',
    close_video: 'Close video',
    close_end: 'Close end page',
    next_room: 'Go to the next room',
    prev_room: 'Go to the previous room',
  },
}

/* ---------------------------------------------------------------------------
   Tiny translation helper, same call signature as the reference ($l).
   Supports dot paths and *token* replacement.
   --------------------------------------------------------------------------- */
export function $l(path, replacements = null) {
  const value = path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), site)
  if (value == null) return path
  if (!replacements) return value
  return Object.entries(replacements).reduce(
    (str, [key, val]) => str.replaceAll(`*${key}*`, val),
    String(value),
  )
}
