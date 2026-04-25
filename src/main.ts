import 'vue-owldate/style.css'
import './assets/css/main.css'

import ui from '@nuxt/ui/vue-plugin'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import VueOwldate, { type OwldateConfig } from 'vue-owldate'

import App from './App.vue'
import { initFirebase } from './config/firebase'
import router from './router'
import { useAuthStore } from './stores/authStore'

import { i18n } from './plugins/i18n'

// Initialize Firebase
initFirebase()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

app.use(i18n)

const owldateConfig: Partial<OwldateConfig> = {
  headerPosition: 'left',
  theme: {
    primary: '#10b981', // Primary color (e.g., validation button)
    background: '#18181b', // Calendar background
    text: '#ffffff', // Text color
    radius: '0.5rem', // Corner radius
    surface: '#1f1f22', // Calendar surface
    textMuted: '#ffffff', // Muted text
    border: '#ffffff00', // Border
    tooltipBg: '#2a2627', // Tooltip background
    tooltipText: '#ffffff', // Tooltip text 232e2c
    rangeBackground: 'rgba(35, 46, 44, 0.5)',
    rangeBorder: '#42b883',
    rangeBorderThickness: '1px'
  },
}
app.use(VueOwldate, owldateConfig)
// Initialize authentication before using the router
const authStore = useAuthStore()
authStore.initAuth()

app.use(router)
app.use(ui)

app.mount('#app')
