/* ---------------------------------------------------------------------------
   Room + hotspot map.

   `x` / `y` are normalised coordinates on the room panorama (0→1 left→right,
   0→1 top→bottom). The WebGL layer converts them to a point on the cylinder,
   projects that point every frame and hands the screen position back to the
   DOM hotspot, so markers stay glued to the furniture while you look around.
   --------------------------------------------------------------------------- */

export const ROOM_IDS = ['vestibule', 'parlour', 'atelier']

export const rooms = {
  vestibule: {
    id: 'vestibule',
    index: 0,
    next: 'parlour',
    prev: null,
    ambience: 'amb_hall',
    tint: '#2a2f7a',
    points: {
      journal: {
        x: 0.363, y: 0.6042,
        iconID: 'journal',
        mobile: { x: 0.363, y: 0.5941 },
      },
    },
  },

  parlour: {
    id: 'parlour',
    index: 1,
    next: 'atelier',
    prev: 'vestibule',
    ambience: 'amb_indoor',
    tint: '#3a2d55',
    points: {
      viewer: {
        x: 0.505, y: 0.2769,
        mobile: { x: 0.505, y: 0.2984 },
      },
      phone: {
        x: 0.503, y: 0.6425,
        mobile: { x: 0.503, y: 0.6277 },
      },
      bag: {
        x: 0.787, y: 0.6344,
        iconID: 'bag',
        mobile: { x: 0.787, y: 0.621 },
      },
    },
  },

  atelier: {
    id: 'atelier',
    index: 2,
    next: null,
    prev: 'parlour',
    ambience: 'amb_workshop',
    tint: '#4a3524',
    points: {
      quilt: {
        x: 0.568, y: 0.6445,
        mobile: { x: 0.568, y: 0.6344 },
      },
      colors: {
        x: 0.748, y: 0.7164,
        mobile: { x: 0.748, y: 0.7016 },
      },
      bag: {
        x: 0.325, y: 0.5356,
        iconID: 'bag',
        mobile: { x: 0.325, y: 0.5302 },
      },
    },
  },
}

/* Which interaction each hotspot opens, and which journal line it writes. */
export const interactions = {
  journal: { component: 'JournalFind', room: 'vestibule', line: 1 },
  viewer:  { component: 'Stereoscope', room: 'parlour',   line: 2 },
  phone:   { component: 'Telephone',   room: 'parlour',   line: 3 },
  quilt:   { component: 'Quilt',       room: 'atelier',   line: 4 },
  colors:  { component: 'Colours',     room: 'atelier',   line: 5 },
  bag:     { component: 'Product',     room: null,        line: null },
}

/* The five colourways shared by both hero pieces. */
export const colorways = [
  { id: 'ash',      name: 'Ash',      hex: '#8d8378' },
  { id: 'amber',    name: 'Amber',    hex: '#d9801f' },
  { id: 'tideline', name: 'Tideline', hex: '#3a6ea8' },
  { id: 'lacquer',  name: 'Lacquer',  hex: '#b11f22' },
  { id: 'bone',     name: 'Bone',     hex: '#ece4d6' },
]

/* The five collectible journal lines, in the order they can be written. */
export const journalLines = [
  { id: 1, key: 'title_1', source: 'journal', room: 'vestibule', picture: 'journal' },
  { id: 2, key: 'title_2', source: 'viewer',  room: 'parlour',   picture: 'viewer'  },
  { id: 3, key: 'title_3', source: 'phone',   room: 'parlour',   picture: 'phone'   },
  { id: 4, key: 'title_4', source: 'quilt',   room: 'atelier',   picture: 'quilt'   },
  { id: 5, key: 'title_5', source: 'colors',  room: 'atelier',   picture: 'colors'  },
]

export const TOTAL_LINES = journalLines.length
