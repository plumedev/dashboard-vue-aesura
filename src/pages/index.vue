<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UDropdownMenu :items="items">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <!-- NOTE: The `-ms-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
          <HomeDateRangePicker v-model="range" class="-ms-1" />

          <HomePeriodSelect v-model="period" :range="range" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col h-full min-h-0">
        <HomeStats :transactions="transactions" :range="range" />
        <HomeSynthesisTable :period="period" :range="range" :transactions="transactions"
          :is-loading="isLoadingTransactions" />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { onMounted, ref, shallowRef, watch } from 'vue'
import { sub } from 'date-fns'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Period, DateRange } from '../types'
import { useGetTransactionByPeriod } from '@/composables/firebase/dedicated/useGetTransactionByPeriod'
import { DocumentData } from 'firebase/firestore'
import { useSynthesisStore } from '@/stores/synthesisStore'

const synthesisStore = useSynthesisStore()

const { isLoading: isLoadingTransactions } = useGetTransactionByPeriod()

const transactions = ref<DocumentData[]>([])
const items = [[{
  label: 'Nouvelle transaction',
  icon: 'i-lucide-banknote-arrow-up',
  to: '/new-transaction'
}]] satisfies DropdownMenuItem[][]

const range = shallowRef<DateRange>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})
const period = ref<Period>('daily')

watch(() => synthesisStore.isInitialized, (initialized) => {
  if (initialized) {
    transactions.value = synthesisStore.recurringTransactions
  }
}, { immediate: true })

watch(() => synthesisStore.recurringTransactions, (newTransactions) => {
  transactions.value = newTransactions
}, { deep: true })

onMounted(async () => {
  await synthesisStore.getRecurringTransactions()
})
</script>
