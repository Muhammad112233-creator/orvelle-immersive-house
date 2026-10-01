import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { ROOM_IDS } from '@/content/rooms.js'

/* ---------------------------------------------------------------------------
   Hash history on purpose.

   The built site is meant to be dropped onto GitHub Pages — or any static
   host — with no server rules. Hash routing means /#/room/atelier can be
   deep-linked and refreshed without a single redirect configured.
   --------------------------------------------------------------------------- */

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/room/:id',
    name: 'room',
    // Loaded on demand: the rooms pull in the whole interaction layer.
    component: () => import('@/views/RoomView.vue'),
    beforeEnter(to) {
      if (!ROOM_IDS.includes(to.params.id)) return { name: 'home' }
      return true
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    redirect: { name: 'home' },
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
