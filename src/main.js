import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router/index.js'
import { initDevice } from './core/device.js'
import { $store, $game } from './core/store.js'
import { $audio } from './core/audio.js'
import { $voiceover } from './core/voiceover.js'
import { $webgl } from './core/webgl/index.js'
import { $l, site } from './content/site.js'
import './styles/main.css'

initDevice()

const app = createApp(App)

/* The reference exposes its services as globals on the app instance; keeping
   that shape means a component never has to import six singletons. */
const services = { $store, $game, $audio, $voiceover, $webgl, $l, $site: site }

Object.entries(services).forEach(([key, value]) => {
  app.config.globalProperties[key] = value
  app.provide(key, value)
})

app.use(router)
app.mount('#app')

if (import.meta.env.DEV) {
  app.config.performance = true
}
