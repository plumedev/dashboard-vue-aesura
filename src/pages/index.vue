<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar :title="$t('HomePage.title')" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UButton 
              label="Review du mois" 
              icon="i-lucide-list-checks" 
              variant="subtle" 
              @click="reviewModal?.openModal()" 
            />
          </div>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <HomeDateRangePicker v-model="range" class="-ms-1" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col h-full min-h-0">
        <HomeStats :transactions="transactions" :range="range" />
        <HomeSynthesisTable :period="period" :range="range" :transactions="transactions"
          :is-loading="isLoadingTransactions" />
      </div>
      <MonthlyReviewModal ref="reviewModal" />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { onMounted, ref, shallowRef, watch } from 'vue'
import { startOfMonth, endOfMonth } from 'date-fns'
import type { Period, DateRange } from '../types'
import { useGetTransactionByPeriod } from '@/composables/firebase/dedicated/useGetTransactionByPeriod'
import { DocumentData } from 'firebase/firestore'
import { useSynthesisStore } from '@/stores/synthesisStore'
import MonthlyReviewModal from '@/components/home/MonthlyReviewModal.vue'

const synthesisStore = useSynthesisStore()
const reviewModal = ref<InstanceType<typeof MonthlyReviewModal> | null>(null)

const { isLoading: isLoadingTransactions } = useGetTransactionByPeriod()

const transactions = ref<DocumentData[]>([])

const range = shallowRef<DateRange>({
  start: startOfMonth(new Date()),
  end: endOfMonth(new Date())
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
