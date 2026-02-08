import './assets/css/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin'

import App from './App.vue'
import router from './router'
import { initFirebase } from './config/firebase'
import { useAuthStore } from './stores/authStore'

import { i18n } from './plugins/i18n'

// Initialiser Firebase
initFirebase()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)

// Initialiser l'authentification avant d'utiliser le router
const authStore = useAuthStore()
authStore.initAuth()

app.use(router)
app.use(ui)

app.mount('#app')
