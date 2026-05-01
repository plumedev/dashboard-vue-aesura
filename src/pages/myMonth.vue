<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar :title="$t('MyMonthPage.title')" :ui="{ right: 'gap-3' }">
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
            <NewTransactionView 
              ref="transactionModal"
              :transaction="transactionToEdit" 
              @transaction-created="refreshRecurringTransactions"
              @transaction-updated="handleTransactionUpdated"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col h-full min-h-0">
        <HomeStats :transactions="transactions" :range="range" />
        <HomeTransactionsTable 
          :transactions="transactions" 
          :is-loading="false" 
          @transaction-deleted="refreshRecurringTransactions"
          @edit-transaction="handleEditTransaction"
        />
      </div>
      <MonthlyReviewModal ref="reviewModal" />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { useReadFireDoc } from '@/composables/firebase/useReadFireDoc'
import { onMounted, ref, computed, shallowRef } from 'vue'
import { startOfMonth, endOfMonth } from 'date-fns'
import NewTransactionView from './newTransactions/newTransactionView.vue'
import type { TransactionData } from './newTransactions/newTransactionView.vue'
import { useSynthesisStore } from '@/stores/synthesisStore'
import MonthlyReviewModal from '@/components/home/MonthlyReviewModal.vue'
import type { DateRange } from '@/types'

const synthesisStore = useSynthesisStore()

const range = shallowRef<DateRange>({
  start: startOfMonth(new Date()),
  end: endOfMonth(new Date())
})

const transactions = computed(() => synthesisStore.recurringTransactions)
const transactionToEdit = ref<TransactionData | undefined>(undefined)
const transactionModal = ref<InstanceType<typeof NewTransactionView> | null>(null)
const reviewModal = ref<InstanceType<typeof MonthlyReviewModal> | null>(null)

const refreshRecurringTransactions = async () => {
  await synthesisStore.getRecurringTransactions()
}

const handleEditTransaction = (transaction: DocumentData) => {
  transactionToEdit.value = transaction as TransactionData
  transactionModal.value?.openModal()
}

const handleTransactionUpdated = async () => {
  transactionToEdit.value = undefined
  await refreshRecurringTransactions()
}

onMounted(async () => {
  await refreshRecurringTransactions()
})
</script>
