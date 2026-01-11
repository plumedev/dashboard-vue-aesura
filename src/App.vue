<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStorage } from '@vueuse/core'
import type { NavigationMenuItem } from '@nuxt/ui'
import RouteName from '@/router/RouteName'

const toast = useToast()
const route = useRoute()

const isLoginPage = computed(() => route.name === RouteName.LOGIN)

const open = ref(false)

const links = [[{
  label: 'Synthèse',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Mon mois',
  icon: 'i-lucide-calendar',
  to: '/my-month',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Réglages',
  to: '/settings',
  icon: 'i-lucide-settings',
  defaultOpen: true,
  type: 'trigger',
  children: [{
    label: 'Général',
    icon: 'i-lucide-user',
    to: '/settings',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Notifications',
    icon: 'i-lucide-bell',
    to: '/settings/notifications',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Security',
    icon: 'i-lucide-shield',
    to: '/settings/security',
    onSelect: () => {
      open.value = false
    }
  }]
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'simple-icons:github',
    to: `https://github.com/nuxt-ui-templates/dashboard-vue/blob/main/src/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])

const cookie = useStorage('cookie-consent', 'pending')
if (cookie.value !== 'accepted') {
  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
}
</script>

<template>
  <Suspense>
    <UApp>
      <template v-if="isLoginPage">
        <RouterView />
      </template>
      <template v-else>
        <UDashboardGroup unit="rem" storage="local">
          <UDashboardSidebar
            id="default"
            v-model:open="open"
            collapsible
            resizable
            class="bg-elevated/25"
            :ui="{ footer: 'lg:border-t lg:border-default' }"
          >
            <template #header="{ collapsed }">
              <AppLogo :collapsed="collapsed" />
            </template>

            <template #default="{ collapsed }">
              <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

              <UNavigationMenu
                :collapsed="collapsed"
                :items="links[0]"
                orientation="vertical"
                tooltip
                popover
              />

              <UNavigationMenu
                :collapsed="collapsed"
                :items="links[1]"
                orientation="vertical"
                tooltip
                class="mt-auto"
              />
            </template>

            <template #footer="{ collapsed }">
              <UserMenu :collapsed="collapsed" />
            </template>
          </UDashboardSidebar>

          <UDashboardSearch :groups="groups" />

          <RouterView />

          <NotificationsSlideover />
        </UDashboardGroup>
      </template>
    </UApp>
  </Suspense>
</template>
