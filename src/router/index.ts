import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type NavigationGuardNext,
  type RouteLocationNormalized,
} from 'vue-router'
import { watch } from 'vue'
import RouteName from './RouteName'
import { useAuthStore } from '@/stores/authStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: RouteName.LOGIN,
    component: () => import('../pages/login/LoginView.vue'),
    meta: {
      title: 'Connexion',
    },
  },
  {
    path: '/',
    name: RouteName.HOME,
    component: () => import('../pages/index.vue'),
    meta: {
      title: 'Home',
      requiresAuth: true,
      icon: 'i-lucide-home',
    },
  },
  {
    path: '/inbox',
    name: RouteName.INBOX,
    component: () => import('../pages/inbox.vue'),
    meta: {
      title: 'Inbox',
      requiresAuth: true,
      icon: 'i-lucide-inbox',
    },
  },
  {
    path: '/customers',
    name: RouteName.CUSTOMERS,
    component: () => import('../pages/customers.vue'),
    meta: {
      title: 'Customers',
      requiresAuth: true,
      icon: 'i-lucide-users',
    },
  },
  {
    path: '/settings',
    name: RouteName.SETTINGS,
    component: () => import('../pages/settings.vue'),
    meta: {
      title: 'Settings',
      requiresAuth: true,
      icon: 'i-lucide-settings',
    },
    children: [
      {
        path: '',
        name: RouteName.SETTINGS_INDEX,
        component: () => import('../pages/settings/index.vue'),
        meta: {
          title: 'Settings',
          requiresAuth: true,
        },
      },
      {
        path: 'members',
        name: RouteName.SETTINGS_MEMBERS,
        component: () => import('../pages/settings/members.vue'),
        meta: {
          title: 'Members',
          requiresAuth: true,
        },
      },
      {
        path: 'notifications',
        name: RouteName.SETTINGS_NOTIFICATIONS,
        component: () => import('../pages/settings/notifications.vue'),
        meta: {
          title: 'Notifications',
          requiresAuth: true,
        },
      },
      {
        path: 'security',
        name: RouteName.SETTINGS_SECURITY,
        component: () => import('../pages/settings/security.vue'),
        meta: {
          title: 'Security',
          requiresAuth: true,
        },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(
  async (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    // Mise à jour du titre de la page
    if (to.meta.title) {
      document.title = `${to.meta.title} - Aesura`
    }

    const authStore = useAuthStore()

    // Attendre le chargement de l'authentification
    if (authStore.isLoading) {
      await new Promise<void>(resolve => {
        const stopWatcher = watch(
          () => authStore.isLoading,
          isLoading => {
            if (!isLoading) {
              stopWatcher()
              resolve()
            }
          },
          { immediate: true }
        )

        // Timeout de sécurité (max 3 secondes)
        setTimeout(() => {
          stopWatcher()
          resolve()
        }, 3000)
      })
    }

    // Protection des routes authentifiées
    if (to.meta.requiresAuth) {
      if (!authStore.isAuthenticated) {
        next({ name: RouteName.LOGIN, query: { redirect: to.fullPath } })
        return
      }
    }

    // Redirection depuis la page de login si déjà connecté
    if (to.name === RouteName.LOGIN && authStore.isAuthenticated) {
      next({ path: '/' })
      return
    }

    next()
  }
)

export default router
