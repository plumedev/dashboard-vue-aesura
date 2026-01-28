<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <NewTransactionView @transactionCreated="refreshRecurringTransactions" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col h-full min-h-0">
        <HomeStats :transactions="transactions" />
        <HomeTransactionsTable :transactions="transactions" :is-loading="false" />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { useReadFireDoc } from '@/composables/firebase/useReadFireDoc'
import { DocumentData } from 'firebase/firestore'
import { onMounted, ref } from 'vue'
import NewTransactionView from './newTransactions/newTransactionView.vue'

const { doRequest: getRecurringTransactions } = useReadFireDoc()

const transactions = ref<DocumentData[]>([])

const refreshRecurringTransactions = async () => {
  const result = await getRecurringTransactions({ collectionName: 'recurringTransactions' })
  if (result && Array.isArray(result)) {
    transactions.value = result
  }
}

onMounted(async () => {
  await refreshRecurringTransactions()
})
</script>
