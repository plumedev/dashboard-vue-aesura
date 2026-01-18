<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <NewTransactionView />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          Left
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col h-full min-h-0">
        {{ transactions }}
        <HomeStats :transactions="transactions" />
        <HomeTransactionsTable :transactions="transactions" :is-loading="false" />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { DocumentData } from 'firebase/firestore'
import NewTransactionView from './newTransactions/newTransactionView.vue'
import { useReadFireDoc } from '@/composables/firebase/useReadFireDoc'

const { doRequest: getRecurringTransactions } = useReadFireDoc()

const transactions = ref<DocumentData[]>([])

onMounted(async () => {
  const result = await getRecurringTransactions({ collectionName: 'recurringTransactions' })
  console.log('Result', result)
  if (result && Array.isArray(result)) {
    transactions.value = result
    console.log('Recurring transactions', transactions.value)
  }
})
</script>
