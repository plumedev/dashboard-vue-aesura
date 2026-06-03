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
import { useReadFireDoc } from '@/composables/firebase/useReadFireDoc'

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
    path: '/onboarding',
    name: RouteName.ONBOARDING,
    component: () => import('../pages/onboarding.vue'),
    meta: {
      title: 'Bienvenue',
      requiresAuth: true,
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
    path: '/financial-habits',
    name: RouteName.FINANCIAL_HABITS,
    component: () => import('../pages/financialHabits.vue'),
    meta: {
      title: 'Habitude financière',
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
  {
    path: '/new-transaction',
    name: RouteName.NEW_TRANSACTION,
    component: () => import('../pages/newTransactions/newTransactionView.vue'),
    meta: {
      title: 'Nouvelle transaction',
      requiresAuth: true,
    },
  },
  {
    path: '/accounts',
    name: RouteName.ACCOUNTS,
    component: () => import('../pages/accounts.vue'),
    meta: {
      title: 'Comptes',
      requiresAuth: true,
      icon: 'i-lucide-wallet',
    },
  },
  {
    path: '/monthly-flows',
    name: RouteName.MONTHLY_FLOWS,
    component: () => import('../pages/monthlyFlows.vue'),
    meta: {
      title: 'Flux mensuels',
      requiresAuth: true,
      icon: 'i-lucide-git-fork',
    },
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

    // Redirection vers l'onboarding si pas de comptes (nouvel utilisateur)
    if (authStore.isAuthenticated && to.name !== RouteName.ONBOARDING) {
      // On pourrait optimiser en utilisant un store, mais ici on va vérifier via Firebase
      const { doRequest: getAccounts } = useReadFireDoc()
      const accounts = await getAccounts({ collectionName: 'accounts' })
      if (!accounts || (Array.isArray(accounts) && accounts.length === 0)) {
        next({ name: RouteName.ONBOARDING })
        return
      }
    }

    next()
  }
)

export default router
