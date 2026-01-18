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
      <div class="flex flex-col h-full min-h-0">*{{ transactions }}
        <HomeStats :transactions="transactions" />
        <HomeTransactionsTable :transactions="transactions" :is-loading="isLoadingRecurringTransactions" />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { DocumentData } from 'firebase/firestore'
import NewTransactionView from './newTransactions/newTransactionView.vue'
import { useGetRecurringTransactions } from '@/composables/firebase/dedicated/useGetRecurringTransactions'

const transactions = ref<DocumentData[]>([])

const { isLoading: isLoadingRecurringTransactions, doRequest: getRecurringTransactions } = useGetRecurringTransactions()

onMounted(async () => {
  transactions.value = await getRecurringTransactions()
})
</script>
