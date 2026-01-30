<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <NewTransactionView 
            ref="transactionModal"
            :transaction="transactionToEdit" 
            @transaction-created="refreshRecurringTransactions"
            @transaction-updated="handleTransactionUpdated"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col h-full min-h-0">
        <HomeStats :transactions="transactions" />
        <HomeTransactionsTable 
          :transactions="transactions" 
          :is-loading="false" 
          @transaction-deleted="refreshRecurringTransactions"
          @edit-transaction="handleEditTransaction"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { useReadFireDoc } from '@/composables/firebase/useReadFireDoc'
import { DocumentData } from 'firebase/firestore'
import { onMounted, ref } from 'vue'
import NewTransactionView from './newTransactions/newTransactionView.vue'
import type { TransactionData } from './newTransactions/newTransactionView.vue'

const { doRequest: getRecurringTransactions } = useReadFireDoc()

const transactions = ref<DocumentData[]>([])
const transactionToEdit = ref<TransactionData | undefined>(undefined)
const transactionModal = ref<InstanceType<typeof NewTransactionView> | null>(null)

const refreshRecurringTransactions = async () => {
  const result = await getRecurringTransactions({ collectionName: 'recurringTransactions' })
  if (result && Array.isArray(result)) {
    transactions.value = result
  }
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
